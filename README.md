
---

## 💡 Notas del Código

*   **`fetchData()`:** Carga el JSON, realiza un pre-procesamiento esencial (parseo de fechas con Luxon, cálculo inicial de antigüedad, conversión robusta a números) y prepara los datos.
*   **`updateKPIs()`:** Calcula todos los indicadores clave basados en el conjunto de datos completo. No actualiza el DOM directamente, sino que almacena los resultados en `calculatedKPIs`.
*   **`updateExecutiveSummary()`:** Toma los `calculatedKPIs`, aplica formato condicional (`formatMetric`) y genera la narrativa HTML que se muestra en el dashboard.
*   **`renderAllCharts()`:** Responsable de generar y/o actualizar todos los gráficos utilizando Chart.js y los datos pre-procesados. Incluye lógica para mostrar mensajes si no hay datos para un gráfico específico.
*   **`renderTable()`:** Genera las filas de la tabla de empleados basada en los datos filtrados y la página actual.
*   **`generatePdf()`:** Orquesta la captura de las secciones principales usando `html2canvas` y las ensambla en un PDF multi-página usando `jsPDF`.

---

## 💾 Fuente de Datos

El archivo `base de datos/rrhh_empleados_mejorado.json` es la fuente de información. Contiene un array de objetos, donde cada objeto representa un empleado con campos detallados, incluyendo:

*   Datos personales (ID, nombre, fecha nacimiento, género, etc.)
*   Información laboral (fecha ingreso, departamento, cargo, tipo contrato, etc.)
*   Compensación (salario base, variable, último aumento)
*   Desempeño (puntuación actual, historial de evaluaciones)
*   Ausentismo (días justificados/no justificados)
*   **Estado y Rotación (Crucial):** `estado_actual`, `fecha_salida`, `tipo_salida`, `motivo_salida_principal`.

*Nota: Los datos actuales en el archivo proporcionado son simulados y generados para cubrir el periodo 2021 a Abril 2025, con énfasis en ciertos departamentos.*

---

## 🔮 Mejoras Futuras (Opcional)

*   Implementar filtros por rango de fechas.
*   Añadir gráficos de evolución histórica de KPIs (ej. salario promedio por año).
*   Mejorar la exportación PDF (manejo avanzado de saltos de página, texto seleccionable si es posible).
*   Añadir análisis predictivos básicos (ej. predicción de rotación).
*   Integración con una base de datos real o API en lugar de un JSON estático.
*   Optimización avanzada del rendimiento para datasets extremadamente grandes.

---

👨‍💻 **Autor:** Juancito Pena (¡Añade tu información de contacto si quieres!)
