document.addEventListener('DOMContentLoaded', () => {
    const { DateTime, Duration } = luxon;

    let employeesData = [];
    let filteredEmployees = [];
    let chartInstances = {};
    let dataPeriodStart = null;
    let dataPeriodEnd = null;
    let calculatedKPIs = {}; // Objeto para guardar los KPIs calculados

    let currentPage = 1;
    const rowsPerPage = 10;

    const dom = {
        executiveSummaryContent: document.getElementById('executiveSummaryContent'), // Referencia al div del resumen
        dataPeriodStartSpan: document.getElementById('dataPeriodStart'),
        dataPeriodEndSpan: document.getElementById('dataPeriodEnd'),
        employeeTableBody: document.getElementById('employeeTableBody'),
        searchInput: document.getElementById('searchInput'),
        filterDepartamento: document.getElementById('filterDepartamento'),
        filterEstadoActual: document.getElementById('filterEstadoActual'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageInfo: document.getElementById('pageInfo'),
        toggleModeBtn: document.getElementById('toggleModeBtn'),
        currentYearSpan: document.getElementById('currentYear'),
    };

    async function fetchData() {
        try {
            dom.employeeTableBody.innerHTML = `<tr><td colspan="13" style="text-align:center;">Cargando datos...</td></tr>`;
            dom.executiveSummaryContent.innerHTML = `<p>Cargando datos...</p>`;

            const response = await fetch('base de datos/rrhh_empleados.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            const rawData = await response.json();
            
            employeesData = rawData.map(emp => {
                const fechaIngreso = DateTime.fromISO(emp.fecha_ingreso);
                const fechaSalida = emp.fecha_salida ? DateTime.fromISO(emp.fecha_salida) : null;
                const fechaNacimiento = DateTime.fromISO(emp.fecha_nacimiento);
                const fechaCorteDataset = DateTime.fromISO('2025-04-30'); 

                const endAntiguedadDate = fechaSalida || fechaCorteDataset;
                const antiguedadDur = endAntiguedadDate.diff(fechaIngreso, ['years', 'months']).toObject();
                
                const edadReferencia = fechaSalida ? fechaSalida.diff(fechaNacimiento, 'years').years : emp.edad_a_fecha_corte;

                const parseNumeric = (value, defaultValue = 0) => {
                    const num = Number(value);
                    return isNaN(num) ? defaultValue : num;
                };

                return {
                    ...emp, 
                    nombreCompleto: `${emp.nombre} ${emp.apellido}`,
                    fechaIngresoObj: fechaIngreso,
                    fechaSalidaObj: fechaSalida,
                    fechaNacimientoObj: fechaNacimiento,
                    antiguedadAnios: parseNumeric(parseFloat(`${antiguedadDur.years || 0}.${Math.round((antiguedadDur.months || 0) / 12 * 10)}`)),
                    edad_a_fecha_corte: parseNumeric(emp.edad_a_fecha_corte), 
                    edad_calculada_al_corte_o_salida: parseNumeric(edadReferencia),
                    totalAusenciasAñoReporte: parseNumeric(emp.dias_ausencia_justificada_año_reporte) + parseNumeric(emp.dias_ausencia_no_justificada_año_reporte),
                    salario_base_mensual: parseNumeric(emp.salario_base_mensual),
                    desempeno_general_actual: parseNumeric(emp.desempeno_general_actual),
                };
            });

            const allDates = employeesData.flatMap(e => [e.fechaIngresoObj, e.fechaSalidaObj].filter(Boolean));
            if (allDates.length > 0) {
                dataPeriodStart = DateTime.min(...allDates);
                const maxFechaSalidaOrIngreso = DateTime.max(...allDates);
                const fechaCorteGeneral = DateTime.fromISO('2025-04-30');
                dataPeriodEnd = DateTime.max(maxFechaSalidaOrIngreso, fechaCorteGeneral);

                dom.dataPeriodStartSpan.textContent = dataPeriodStart.toFormat('dd/MM/yyyy');
                dom.dataPeriodEndSpan.textContent = dataPeriodEnd.toFormat('dd/MM/yyyy');
            } else { 
                dataPeriodStart = DateTime.fromISO('2021-01-01');
                dataPeriodEnd = DateTime.fromISO('2025-04-30');
                dom.dataPeriodStartSpan.textContent = 'N/A';
                dom.dataPeriodEndSpan.textContent = 'N/A';
            }

            filteredEmployees = [...employeesData];
            initializeApp();

        } catch (error) {
            console.error("Error fetching or processing data:", error);
            dom.employeeTableBody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:var(--danger-color-light);">Error al cargar los datos: ${error.message}</td></tr>`;
            dom.executiveSummaryContent.innerHTML = `<p style="color:var(--danger-color-light);">Error al cargar los datos para el resumen.</p>`;
        }
    }

    function initializeApp() {
        populateFilters();
        updateDashboard(); 
        setupEventListeners();
        dom.currentYearSpan.textContent = new Date().getFullYear();
        
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedTheme = localStorage.getItem('darkMode');

        if (storedTheme === 'enabled' || (storedTheme === null && prefersDark)) {
            document.body.classList.add('dark-mode');
            dom.toggleModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            dom.toggleModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function setupEventListeners() {
        dom.searchInput.addEventListener('input', debounce(handleFiltersChange, 300));
        dom.filterDepartamento.addEventListener('change', handleFiltersChange);
        dom.filterEstadoActual.addEventListener('change', handleFiltersChange);
        dom.prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        dom.nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
            if (currentPage < totalPages) { currentPage++; renderTable(); }
        });
        dom.toggleModeBtn.addEventListener('click', toggleDarkMode);
    }
    
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        dom.toggleModeBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {}; 
        updateExecutiveSummary(calculatedKPIs); 
        renderAllCharts(); 
    }

     function populateFilters() {
        const departments = [...new Set(employeesData.map(emp => emp.departamento))].sort();
        dom.filterDepartamento.innerHTML = '<option value="">Todos los Departamentos</option>'; 
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            dom.filterDepartamento.appendChild(option);
        });

        const estados = [...new Set(employeesData.map(emp => emp.estado_actual))].sort();
        dom.filterEstadoActual.innerHTML = '<option value="">Todos los Estados</option>'; 
        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado;
            option.textContent = estado.replace(/_/g, ' '); 
            dom.filterEstadoActual.appendChild(option);
        });
    }

    function handleFiltersChange() {
        currentPage = 1;
        applyFilters();
        updateKPIs(employeesData); 
        updateExecutiveSummary(calculatedKPIs); 
        renderTable(); 
    }

     function applyFilters() {
        const searchTerm = dom.searchInput.value.toLowerCase().trim();
        const selectedDepartment = dom.filterDepartamento.value;
        const selectedStatus = dom.filterEstadoActual.value;

        filteredEmployees = employeesData.filter(emp => {
            const nameMatch = emp.nombreCompleto.toLowerCase().includes(searchTerm);
            const departmentMatch = selectedDepartment ? emp.departamento === selectedDepartment : true;
            const statusMatch = selectedStatus ? emp.estado_actual === selectedStatus : true;
            return nameMatch && departmentMatch && statusMatch;
        });
    }
    
    function updateKPIs(dataSet) { 
        calculatedKPIs = {};

        if (!dataSet || dataSet.length === 0) {
             console.warn("No hay datos para calcular KPIs.");
             calculatedKPIs = { /* valores por defecto o vacíos */ };
             return calculatedKPIs;
        }

        const activos = dataSet.filter(e => e.estado_actual === 'Activo');
        const bajasPeriodo = dataSet.filter(e => e.estado_actual !== 'Activo' && e.fechaSalidaObj && e.fechaSalidaObj >= dataPeriodStart && e.fechaSalidaObj <= dataPeriodEnd);

        calculatedKPIs.totalEmpleados = dataSet.length;
        calculatedKPIs.empleadosActivos = activos.length;
        calculatedKPIs.totalBajas = bajasPeriodo.length;
        
        const inicioPeriodoAnterior = dataPeriodEnd.minus({ years: 1 }).startOf('day');
        const activosInicioPeriodoAnterior = dataSet.filter(e => 
            e.fechaIngresoObj <= inicioPeriodoAnterior &&
            (e.estado_actual === 'Activo' || (e.fechaSalidaObj && e.fechaSalidaObj > inicioPeriodoAnterior))
        ).length;
        
        const avgEmployeesLastYear = (activos.length + activosInicioPeriodoAnterior) / 2;
        const bajasLastYear = dataSet.filter(e => 
            e.estado_actual !== 'Activo' && 
            e.fechaSalidaObj && 
            e.fechaSalidaObj > inicioPeriodoAnterior && 
            e.fechaSalidaObj <= dataPeriodEnd
        ).length;

        calculatedKPIs.tasaRotacionAnual = (avgEmployeesLastYear > 0) 
            ? (bajasLastYear / avgEmployeesLastYear) * 100 : 0;

        if (activos.length > 0) {
            calculatedKPIs.salarioPromedio = activos.reduce((sum, e) => sum + e.salario_base_mensual, 0) / activos.length;
            calculatedKPIs.edadPromedio = activos.reduce((sum, e) => sum + e.edad_a_fecha_corte, 0) / activos.length;
            calculatedKPIs.antiguedadPromedio = activos.reduce((sum, e) => sum + e.antiguedadAnios, 0) / activos.length;
            calculatedKPIs.desempenoPromedio = activos.reduce((sum, e) => sum + e.desempeno_general_actual, 0) / activos.length;
            calculatedKPIs.ausenciasPromedio = activos.reduce((sum, e) => sum + e.totalAusenciasAñoReporte, 0) / activos.length;

            const deptCountsActivos = countByProperty(activos, 'departamento');
            const [topDeptActivos = '-', count = 0] = Object.entries(deptCountsActivos).sort((a, b) => b[1] - a[1])[0] || [];
            calculatedKPIs.deptoMasActivos = topDeptActivos;
            calculatedKPIs.countDeptoMasActivos = count; 

            const desempeñosValidos = activos
                .map(e => e.desempeno_general_actual)
                .filter(d => typeof d === 'number' && d > 0); 

            if (desempeñosValidos.length > 0) {
                 calculatedKPIs.desempenoMaximo = Math.max(...desempeñosValidos);
                 calculatedKPIs.desempenoMinimo = Math.min(...desempeñosValidos);
            } else {
                calculatedKPIs.desempenoMaximo = null; // Usar null para indicar N/A
                calculatedKPIs.desempenoMinimo = null; 
            }
        } else {
             calculatedKPIs.salarioPromedio = 0;
             calculatedKPIs.edadPromedio = 0;
             calculatedKPIs.antiguedadPromedio = 0;
             calculatedKPIs.desempenoPromedio = 0; 
             calculatedKPIs.ausenciasPromedio = 0;
             calculatedKPIs.deptoMasActivos = '-';
             calculatedKPIs.countDeptoMasActivos = 0;
             calculatedKPIs.desempenoMaximo = null;
             calculatedKPIs.desempenoMinimo = null;
        }

        calculatedKPIs.totalRenuncias = bajasPeriodo.filter(e => e.tipo_salida === 'Voluntaria' && e.estado_actual === 'Renuncia').length;
        calculatedKPIs.totalDespidos = bajasPeriodo.filter(e => e.tipo_salida === 'Involuntaria' && e.estado_actual === 'Despido').length;
        calculatedKPIs.otrasBajas = calculatedKPIs.totalBajas - calculatedKPIs.totalRenuncias - calculatedKPIs.totalDespidos; 
        
        return calculatedKPIs; 
    }

    function updateExecutiveSummary(kpis) {
        if (!dom.executiveSummaryContent || !kpis || Object.keys(kpis).length === 0) {
            if(dom.executiveSummaryContent) dom.executiveSummaryContent.innerHTML = '<p>No hay datos suficientes para generar el resumen.</p>';
            return;
        }

        const formatMetric = (value, unit = '', decimals = 0, thresholds = null, higherIsBetter = true) => {
             if (value === undefined || value === null || isNaN(value)) {
                return `<span class="metric metric-neutral">N/A</span>`; 
            }
            
            let className = 'metric-neutral';
            let emoji = '';

            if (thresholds) { 
                if (higherIsBetter) {
                    if (value >= thresholds[0]) { className = 'metric-good'; emoji = '✅ '; } 
                    else if (value < thresholds[1]) { className = 'metric-bad'; emoji = '⚠️ '; }
                } else { 
                    if (value <= thresholds[0]) { className = 'metric-good'; emoji = '✅ '; } 
                    else if (value > thresholds[1]) { className = 'metric-bad'; emoji = '⚠️ '; }
                }
            }
            
            const formattedValue = value.toLocaleString('es-ES', { 
                minimumFractionDigits: decimals, 
                maximumFractionDigits: decimals 
            });

            return `<span class="metric ${className}">${emoji}${formattedValue}${unit}</span>`;
        };

        const maxPerfThresholds = [4.5, 0]; // bueno >= 4.5
        const minPerfThresholds = [2.0, 0]; // malo < 2.0 (aquí lowerIsBetter es false, así que usamos la lógica inversa de formatMetric)
        const turnoverThresholds = [15, 25]; // lower is better
        const performanceThresholds = [4.0, 3.0]; // higher is better
        const absenceThresholds = [5, 10]; // lower is better

        let summaryHTML = `
            <p>
                La organización cuenta con un histórico de <strong>${kpis.totalEmpleados?.toLocaleString('es-ES') || 'N/A'}</strong> empleados registrados en el periodo. 
                Actualmente, la plantilla activa es de ${formatMetric(kpis.empleadosActivos, '', 0)}.
            </p>
            <p>
                Durante el periodo analizado, se registraron <strong>${kpis.totalBajas?.toLocaleString('es-ES') || 'N/A'}</strong> bajas, 
                resultando en una tasa de rotación anualizada estimada del ${formatMetric(kpis.tasaRotacionAnual, '%', 1, turnoverThresholds, false)}. 
                De estas bajas, ${formatMetric(kpis.totalRenuncias, '', 0)} fueron renuncias, ${formatMetric(kpis.totalDespidos, '', 0)} despidos${kpis.otrasBajas > 0 ? `, y ${kpis.otrasBajas} por otras causas (ej. jubilación, fin de contrato)` : ''}.
            </p>
            <p>
                El perfil del empleado activo muestra una edad promedio de ${formatMetric(kpis.edadPromedio, ' años', 0)}, 
                con una antigüedad media de ${formatMetric(kpis.antiguedadPromedio, ' años', 1)}. 
                El salario base mensual promedio se sitúa en ${formatMetric(kpis.salarioPromedio, '$', 0)} 
                
            </p>
            <p>
                El desempeño promedio actual de los activos es de ${formatMetric(kpis.desempenoPromedio, '', 1, performanceThresholds, true)} (escala 1-5). 
                Las puntuaciones individuales varían, alcanzando un máximo de ${formatMetric(kpis.desempenoMaximo, '', 1, maxPerfThresholds, true)} ${kpis.desempenoMaximo >= 4.5 ? '👍' : ''} y un mínimo de ${formatMetric(kpis.desempenoMinimo, '', 1, minPerfThresholds, true)} ${kpis.desempenoMinimo < 2.0 && kpis.desempenoMinimo !== null ? '👎' : ''}.
                En cuanto al ausentismo, el promedio de días de ausencia reportados en el último año fue de ${formatMetric(kpis.ausenciasPromedio, ' días', 1, absenceThresholds, false)}.
            </p>
             <p>
                Actualmente, el departamento con mayor número de empleados activos es <strong>${kpis.deptoMasActivos || '-'}</strong>
                ${kpis.countDeptoMasActivos ? ` con ${kpis.countDeptoMasActivos} personas.` : '.'}
            </p>
        `;

        dom.executiveSummaryContent.innerHTML = summaryHTML;
    }
    
    function renderTable() { // Sin cambios
        dom.employeeTableBody.innerHTML = ''; 
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedEmployees = filteredEmployees.slice(start, end);

        if (paginatedEmployees.length === 0) {
            dom.employeeTableBody.innerHTML = `<tr><td colspan="13" style="text-align:center;">No se encontraron empleados.</td></tr>`;
        } else {
            const fragment = document.createDocumentFragment();
            paginatedEmployees.forEach(emp => {
                const row = document.createElement('tr');
                row.classList.toggle('inactive-row', emp.estado_actual !== 'Activo');
                row.innerHTML = `
                    <td>${emp.id}</td>
                    <td>${emp.nombreCompleto}</td>
                    <td>${emp.edad_a_fecha_corte}</td> 
                    <td>${emp.departamento}</td>
                    <td>${emp.cargo}</td>
                    <td>${emp.tipo_contrato || '-'}</td>
                    <td>${emp.fechaIngresoObj.toFormat('dd/MM/yy')}</td>
                    <td>${emp.antiguedadAnios.toFixed(1)}</td>
                    <td>$${emp.salario_base_mensual.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</td>
                    <td>${emp.desempeno_general_actual.toFixed(1)}</td>
                    <td class="status-${emp.estado_actual.toLowerCase().replace(/\s+/g, '_')}">${emp.estado_actual.replace(/_/g, ' ')}</td>
                    <td>${emp.fechaSalidaObj ? emp.fechaSalidaObj.toFormat('dd/MM/yy') : '-'}</td>
                    <td>${emp.motivo_salida_principal || '-'}</td>
                `;
                fragment.appendChild(row);
            });
            dom.employeeTableBody.appendChild(fragment);
        }
        updatePaginationControls();
    }

    function updatePaginationControls() { // Sin cambios
        const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
        dom.pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
        dom.prevPageBtn.disabled = currentPage === 1;
        dom.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function renderAllCharts() { // Sin cambios respecto a la versión anterior con el gráfico de barras por desempeño
        const activos = employeesData.filter(e => e.estado_actual === 'Activo');
        const bajasPeriodo = employeesData.filter(e => e.estado_actual !== 'Activo' && e.fechaSalidaObj && e.fechaSalidaObj >= dataPeriodStart && e.fechaSalidaObj <= dataPeriodEnd);
        
        if (!dataPeriodStart || !dataPeriodEnd || employeesData.length === 0) { 
            console.warn("Sin datos o periodo no definido, saltando renderizado de gráficos.");
            Object.keys(chartInstances).forEach(key => {
                 renderChartMessage(key, 'No hay datos para mostrar.');
            });
            return;
        }
        
        const commonOptions = getCommonChartOptions();
        const palette = getChartPalette();

         // Género (Activos)
        const genderData = countByProperty(activos, 'genero');
        if (Object.keys(genderData).length > 0) {
            renderChart('chartGenero', 'doughnut', {
                labels: Object.keys(genderData),
                datasets: [{ data: Object.values(genderData), backgroundColor: palette.slice(0, Object.keys(genderData).length) }]
            }, commonOptions);
        } else {
             renderChartMessage('chartGenero', 'No hay datos de género.');
        }

        // Empleados Activos por Departamento
        const departmentData = countByProperty(activos, 'departamento');
         if (Object.keys(departmentData).length > 0) {
            renderChart('chartDepartamento', 'bar', {
                labels: Object.keys(departmentData),
                datasets: [{ label: 'Nº Empleados Activos', data: Object.values(departmentData), backgroundColor: palette[0] }]
            }, { ...commonOptions, indexAxis: 'y', scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, ticks: { autoSkip: false } } } });
        } else {
             renderChartMessage('chartDepartamento', 'No hay datos de departamento.');
        }

        // Tipos de Salida (Periodo)
        const tiposSalidaData = countByProperty(bajasPeriodo, 'tipo_salida');
         if (Object.keys(tiposSalidaData).length > 0) {
            renderChart('chartTiposSalida', 'pie', {
                labels: Object.keys(tiposSalidaData),
                datasets: [{ data: Object.values(tiposSalidaData), backgroundColor: [palette[1], palette[2], palette[3]].slice(0,Object.keys(tiposSalidaData).length) }]
            }, commonOptions);
        } else {
            renderChartMessage('chartTiposSalida', 'No hay datos de tipos de salida.');
        }

        // Motivos de Salida Principales (Top 5 + Otros)
        const motivosSalida = countByProperty(bajasPeriodo, 'motivo_salida_principal');
        const topMotivos = Object.entries(motivosSalida).sort((a,b) => b[1] - a[1]);
        const displayMotivos = topMotivos.slice(0, 5);
        if (topMotivos.length > 5) {
            const otrosCount = topMotivos.slice(5).reduce((sum, [,count]) => sum + count, 0);
            if (otrosCount > 0) displayMotivos.push(['Otros motivos', otrosCount]);
        }
         if (displayMotivos.length > 0) {
            renderChart('chartMotivosSalida', 'bar', {
                labels: displayMotivos.map(m => m[0]),
                datasets: [{ label: 'Cantidad', data: displayMotivos.map(m => m[1]), backgroundColor: palette[4] }]
            }, commonOptions);
        } else {
            renderChartMessage('chartMotivosSalida', 'No hay datos de motivos de salida.');
        }

        // Distribución Salarios (Activos)
        const salariosActivos = activos.map(e => e.salario_base_mensual); 
        const salarioBins = createHistogramBins(salariosActivos, 10000); 
         if (salarioBins.length > 0 && salarioBins.some(b => b.count > 0)) {
            renderChart('chartSalariosDist', 'bar', {
                labels: salarioBins.map(b => `$${b.label}`),
                datasets: [{ label: 'Nº Empleados', data: salarioBins.map(b => b.count), backgroundColor: palette[5]}]
            }, commonOptions);
        } else {
             renderChartMessage('chartSalariosDist', 'No hay datos de salarios.');
        }

        // Distribución Desempeño (Activos)
        const desempenoActivos = activos.map(e => e.desempeno_general_actual); 
        const desempenoBins = createHistogramBins(desempenoActivos, 1, 0, 5); 
         if (desempenoBins.length > 0 && desempenoBins.some(b => b.count > 0)) {
            renderChart('chartDesempenoDist', 'bar', {
                labels: desempenoBins.map(b => `${b.label}`),
                datasets: [{ label: 'Nº Empleados', data: desempenoBins.map(b => b.count), backgroundColor: palette[6]}]
            }, commonOptions);
        } else {
            renderChartMessage('chartDesempenoDist', 'No hay datos de desempeño.');
        }

        // Distribución Antigüedad (Activos)
        const antiguedadActivos = activos.map(e => e.antiguedadAnios); 
        const antiguedadBins = createHistogramBins(antiguedadActivos, 2); 
         if (antiguedadBins.length > 0 && antiguedadBins.some(b => b.count > 0)) {
            renderChart('chartAntiguedad', 'bar', {
                labels: antiguedadBins.map(b => `${b.label} años`),
                datasets: [{ label: 'Nº Empleados', data: antiguedadBins.map(b => b.count), backgroundColor: palette[7]}]
            }, commonOptions);
        } else {
            renderChartMessage('chartAntiguedad', 'No hay datos de antigüedad.');
        }

        // Tipos de Contrato (Activos)
        const tipoContratoData = countByProperty(activos, 'tipo_contrato');
         if (Object.keys(tipoContratoData).length > 0) {
            renderChart('chartTipoContrato', 'doughnut', {
                labels: Object.keys(tipoContratoData),
                datasets: [{ data: Object.values(tipoContratoData), backgroundColor: palette.slice(0, Object.keys(tipoContratoData).length) }]
            }, commonOptions);
        } else {
            renderChartMessage('chartTipoContrato', 'No hay datos de tipos de contrato.');
        }

        // Tasa de Rotación Mensual (Periodo)
        const monthlyTurnover = calculateMonthlyTurnover(employeesData, dataPeriodStart, dataPeriodEnd);
         if (monthlyTurnover.length > 0) {
            renderChart('chartRotacionMensual', 'line', {
                labels: monthlyTurnover.map(m => m.monthYear),
                datasets: [{ 
                    label: 'Tasa de Rotación (%)', 
                    data: monthlyTurnover.map(m => m.rate * 100), 
                    borderColor: palette[8], 
                    backgroundColor: `${palette[8]}33`, 
                    fill: true,
                    tension: 0.1 
                }]
            }, commonOptions);
        } else {
            renderChartMessage('chartRotacionMensual', 'No hay datos para calcular rotación mensual.');
        }
        
        // NUEVO GRÁFICO: Salario Promedio por Nivel de Desempeño
        const performanceCategories = {
            'Bajo (1-2.4)': { sum: 0, count: 0 },
            'Medio (2.5-3.9)': { sum: 0, count: 0 },
            'Alto (4-5)': { sum: 0, count: 0 },
            'No evaluado': { sum: 0, count: 0} 
        };

        activos.forEach(emp => {
            const perf = emp.desempeno_general_actual;
            const salary = emp.salario_base_mensual;
            if (perf >= 4 && perf <= 5) { 
                performanceCategories['Alto (4-5)'].sum += salary;
                performanceCategories['Alto (4-5)'].count++;
            } else if (perf >= 2.5 && perf < 4) {
                performanceCategories['Medio (2.5-3.9)'].sum += salary;
                performanceCategories['Medio (2.5-3.9)'].count++;
            } else if (perf >= 1 && perf < 2.5) {
                performanceCategories['Bajo (1-2.4)'].sum += salary;
                performanceCategories['Bajo (1-2.4)'].count++;
            } else { 
                 performanceCategories['No evaluado'].sum += salary;
                 performanceCategories['No evaluado'].count++;
            }
        });

        const avgSalaryByPerfData = Object.entries(performanceCategories)
            .filter(([, data]) => data.count > 0) 
            .map(([category, data]) => ({
                category: category,
                avgSalary: data.sum / data.count,
                count: data.count 
            }));
        
        const categoryOrder = ['Bajo (1-2.4)', 'Medio (2.5-3.9)', 'Alto (4-5)', 'No evaluado'];
        avgSalaryByPerfData.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

        if (avgSalaryByPerfData.length > 0) {
            renderChart('chartAvgSalarioPorNivelDesempeno', 'bar', {
                labels: avgSalaryByPerfData.map(item => item.category),
                datasets: [{
                    label: 'Salario Base Mensual Promedio ($)',
                    data: avgSalaryByPerfData.map(item => item.avgSalary),
                    backgroundColor: [palette[4], palette[0], palette[1], palette[5]], 
                }]
            }, { 
                ...commonOptions,
                scales: { ...commonOptions.scales, 
                     y: { ...commonOptions.scales.y, title: { display: true, text: 'Salario Promedio ($)', color: getTickColor(), font: { size: 12, weight: '600', family: "'Roboto', sans-serif" } } },
                     x: { ...commonOptions.scales.x, title: { display: true, text: 'Nivel de Desempeño', color: getTickColor(), font: { size: 12, weight: '600', family: "'Roboto', sans-serif" } } }
                },
                plugins: { ...commonOptions.plugins,
                    tooltip: { ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                if (dataIndex >= 0 && dataIndex < avgSalaryByPerfData.length) {
                                    const categoryData = avgSalaryByPerfData[dataIndex];
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    label += `$${context.parsed.y.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
                                    label += ` (N=${categoryData.count})`; 
                                    return label;
                                }
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('es-ES'); 
                            }
                        }
                    }
                }
            });
        } else {
             renderChartMessage('chartAvgSalarioPorNivelDesempeno', 'No hay datos de desempeño y salario.');
        }
    }

     function getCommonChartOptions() { // Sin cambios
        const isDarkMode = document.body.classList.contains('dark-mode');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
        const tickColor = getTickColor();
        const legendColor = tickColor;
    
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        color: legendColor, 
                        font: { size: 11, family: "'Open Sans', sans-serif" },
                        padding: 15,
                        usePointStyle: true,
                        boxWidth: 8,
                    } 
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#2a2f3b' : '#ffffff',
                    titleColor: isDarkMode ? '#e0e0e0' : '#333333',
                    bodyColor: isDarkMode ? '#c9d1d9' : '#555555',
                    borderColor: isDarkMode ? '#444c56' : '#dddddd',
                    borderWidth: 1,
                    cornerRadius: 4,
                    padding: 10,
                    titleFont: { weight: 'bold', family: "'Roboto', sans-serif" },
                    bodyFont: { family: "'Open Sans', sans-serif" },
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) { 
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            let value = null;
                            if (context.parsed?.y !== undefined) value = context.parsed.y;
                            else if (context.parsed !== undefined && typeof context.parsed !== 'object') value = context.parsed; 
                            else if (context.raw !== undefined && typeof context.raw === 'number') value = context.raw; 

                            if (value !== null) {
                                label += typeof value === 'number' ? value.toLocaleString('es-ES') : value;
                            } else if (context.formattedValue) {
                                label += context.formattedValue;
                            }
                            return label;
                        }
                    }
                },
                title: { 
                    display: false, 
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: tickColor, font: { size: 10, family: "'Open Sans', sans-serif" }, autoSkip: true, maxRotation: 45, minRotation: 0 },
                },
                y: {
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: tickColor, font: { size: 10, family: "'Open Sans', sans-serif" } },
                    beginAtZero: true
                }
            }
        };
    }
    
    function getChartPalette() { // Sin cambios
        const isDarkMode = document.body.classList.contains('dark-mode');
        return isDarkMode ? 
            ['#579DFF', '#36B37E', '#FFAB00', '#79E2F2', '#F9748F', '#A6B1C2', '#C39BFF', '#FFC879', '#8BDB81', '#FF8F66'] :
            ['#0052CC', '#00875A', '#FFAB00', '#00B8D9', '#DE350B', '#5E6C7F', '#6554C0', '#FF8B00', '#3AA87A', '#BF2600'];
    }

    function getTickColor() { // Sin cambios
        return document.body.classList.contains('dark-mode') ? '#A6B1C2' : '#5E6C7F';
    }

    function renderChart(canvasId, type, data, options) { // Sin cambios
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) {
            return;
        }
        
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }
        const finalOptions = { 
             ...options, 
             plugins: { 
                 ...options.plugins, 
                 title: { display: false } 
             } 
        };
        chartInstances[canvasId] = new Chart(ctx, { type, data, options: finalOptions });
    }

    function renderChartMessage(canvasId, message) { // Sin cambios
         const ctx = document.getElementById(canvasId)?.getContext('2d');
         if (ctx) {
            if (chartInstances[canvasId]) {
                chartInstances[canvasId].destroy();
                delete chartInstances[canvasId];
            }
             ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
             ctx.font = "14px 'Open Sans', sans-serif";
             ctx.fillStyle = getTickColor();
             ctx.textAlign = 'center';
             ctx.fillText(message || 'No hay datos para mostrar.', ctx.canvas.width / 2, ctx.canvas.height / 2);
         }
         // console.warn(`${message} (${canvasId})`); // Opcional
    }
    
    function debounce(func, delay) { // Sin cambios
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function countByProperty(arr, prop) { // Sin cambios
        return arr.reduce((acc, item) => {
            const key = item[prop] || 'No Especificado';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    function createHistogramBins(data, binSize, minValOverride, maxValOverride) { // Sin cambios
        if (!data || data.length === 0) return [];
    
        const values = data.filter(v => typeof v === 'number' && !isNaN(v));
        if (values.length === 0) return [];
    
        const minVal = minValOverride !== undefined ? minValOverride : Math.min(...values);
        const maxVal = maxValOverride !== undefined ? maxValOverride : Math.max(...values);
    
        if (minVal === maxVal) {
             const labelEnd = minVal + binSize -1;
             return [{ label: `${minVal}${binSize > 1 && labelEnd >= minVal ? '-' + labelEnd : ''}`, count: values.length, startNum: minVal }];
        }

        const bins = {};
        const firstBinStart = Math.floor(minVal / binSize) * binSize;
            
        for (let val of values) {
            const binStart = Math.floor(val / binSize) * binSize;
            bins[binStart] = (bins[binStart] || 0) + 1;
        }
            
        return Object.entries(bins)
            .map(([start, count]) => {
                const startNum = parseInt(start);
                const endNum = startNum + binSize - 1;
                return {
                    label: `${startNum}${binSize > 1 && endNum >= startNum ? '-' + endNum : ''}`,
                    count,
                    startNum 
                };
            })
            .sort((a, b) => a.startNum - b.startNum);
    }

    function calculateMonthlyTurnover(allEmployees, periodStart, periodEnd) { // Sin cambios
        const turnoverData = [];
        if (!periodStart || !periodEnd || !allEmployees || allEmployees.length === 0) return turnoverData;

        let currentMonthStart = periodStart.startOf('month');

        while (currentMonthStart <= periodEnd.endOf('month')) {
            const currentMonthEnd = currentMonthStart.endOf('month');
            
            const employeesAtStartOfMonth = allEmployees.filter(e => 
                e.fechaIngresoObj <= currentMonthStart && 
                (e.estado_actual === 'Activo' || (e.fechaSalidaObj && e.fechaSalidaObj > currentMonthStart))
            ).length;

            const employeesAtEndOfMonth = allEmployees.filter(e => 
                e.fechaIngresoObj <= currentMonthEnd &&
                (e.estado_actual === 'Activo' || (e.fechaSalidaObj && e.fechaSalidaObj > currentMonthEnd))
            ).length;
            
            const averageEmployeesThisMonth = (employeesAtStartOfMonth + employeesAtEndOfMonth) / 2;
            
            const separationsThisMonth = allEmployees.filter(e =>
                e.fechaSalidaObj &&
                e.fechaSalidaObj >= currentMonthStart &&
                e.fechaSalidaObj <= currentMonthEnd
            ).length;

            const rate = averageEmployeesThisMonth > 0 ? separationsThisMonth / averageEmployeesThisMonth : 0;
            
            turnoverData.push({
                monthYear: currentMonthStart.toFormat('MMM yyyy'),
                rate: rate,
            });
            currentMonthStart = currentMonthStart.plus({ months: 1 });
        }
        return turnoverData;
    }
    
    function updateDashboard() { // Sin cambios
        if (employeesData.length === 0) { 
            console.warn("No hay datos de empleados para mostrar.");
             if(dom.executiveSummaryContent) dom.executiveSummaryContent.innerHTML = '<p>No hay datos disponibles.</p>';
             calculatedKPIs = {}; 
             renderTable(); 
             renderAllCharts(); 
            return;
        }
        applyFilters();
        calculatedKPIs = updateKPIs(employeesData); 
        updateExecutiveSummary(calculatedKPIs); 
        renderTable();
        renderAllCharts();
    }

    fetchData();
});
