import json
import random
from datetime import datetime, timedelta

# --- Helper Data & Functions ---
NOMBRES_MASCULINOS = ["Juan", "Carlos", "Miguel", "Luis", "José", "David", "Pedro", "Manuel", "Francisco", "Javier", "Hector", "Rafael", "Adrian", "Diego", "Sergio"]
NOMBRES_FEMENINOS = ["María", "Ana", "Laura", "Carmen", "Isabel", "Sofía", "Lucía", "Elena", "Clara", "Patricia", "Victoria", "Zaira", "Yaiza", "Raquel", "Belén", "Roberta"]
NOMBRES_NO_BINARIOS = ["Alex", "Dani", "Cris", "Sam", "Andrea", "Ariel", "Taylor", "Jordan", "Kai", "Zaida"]
APELLIDOS = ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Mur", "Manzano", "Miralles", "Casado"]

DEPARTAMENTOS_PRIORITARIOS = ["Ventas", "Producción", "Almacén", "Distribución"]
DEPARTAMENTOS_SECUNDARIOS = ["Marketing", "Finanzas", "Recursos Humanos", "TI", "Operaciones Generales"]
DEPARTAMENTOS_TODOS = DEPARTAMENTOS_PRIORITARIOS + DEPARTAMENTOS_SECUNDARIOS

CARGOS_ALTA_DIR = ["Director General", "Director de Departamento"]
CARGOS_GERENCIA = ["Gerente de Área", "Jefe de Sección"]
CARGOS_COORDINACION = ["Coordinador de Proyectos", "Supervisor"]
CARGOS_ESPECIALISTA = ["Especialista Senior", "Analista Principal", "Técnico Especializado"]
CARGOS_ANALISTA_ASISTENTE = ["Analista", "Asistente Administrativo", "Operario Calificado", "Representante de Ventas"]
CARGOS_TODOS = CARGOS_ALTA_DIR + CARGOS_GERENCIA + CARGOS_COORDINACION + CARGOS_ESPECIALISTA + CARGOS_ANALISTA_ASISTENTE

NIVELES_EDUCATIVOS = ["Secundaria Completa", "Formación Profesional Grado Medio", "Formación Profesional Grado Superior", "Grado Universitario", "Máster", "Doctorado", "Sin Titulación Superior"]
TIPOS_CONTRATO = ["Indefinido", "Temporal (Obra y Servicio)", "Temporal (Eventual)", "Prácticas", "Formación y Aprendizaje"]
UBICACIONES_TRABAJO = ["Oficina Central", "Planta Producción Norte", "Planta Producción Sur", "Almacén Central", "Centro Distribución Regional", "Tienda Principal", "Remoto", "Híbrido"]

ESTADOS_ACTUALES_SALIDA = ["Renuncia", "Despido", "Jubilación", "Fin de Contrato"]
TIPOS_SALIDA = {"Renuncia": "Voluntaria", "Jubilación": "Voluntaria", "Fin de Contrato": "No Aplicable", "Despido": "Involuntaria"}
MOTIVOS_RENUNCIA = ["Mejora salarial en otra empresa", "Búsqueda de mayor desarrollo profesional", "Reubicación geográfica personal", "Descontento con el ambiente laboral", "Problemas con el supervisor directo", "Falta de oportunidades de crecimiento", "Inicio de proyecto personal"]
MOTIVOS_DESPIDO = ["Bajo desempeño recurrente", "Incumplimiento grave de políticas", "Reestructuración departamental", "Reducción de plantilla por causas económicas", "Faltas de asistencia injustificadas"]
MOTIVOS_JUBILACION = ["Edad legal de jubilación alcanzada"]
MOTIVOS_FIN_CONTRATO = ["Finalización del proyecto asignado", "Vencimiento del plazo contractual"]

# --- Configuration ---
NUM_EMPLEADOS = 180
PROBABILIDAD_SALIDA = 0.30 # 30% de los empleados habrán salido
FECHA_INICIO_PERIODO = datetime(2021, 1, 1)
FECHA_FIN_PERIODO = datetime(2025, 4, 30) # Fecha "actual" o de corte del dataset

def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def generar_empleados():
    empleados_data = []
    ids_disponibles_para_reportar = []

    for i in range(1, NUM_EMPLEADOS + 1):
        id_empleado = i

        # Género y Nombre
        tipo_nombre = random.choice(["masculino", "femenino", "no_binario"])
        if tipo_nombre == "masculino":
            nombre = random.choice(NOMBRES_MASCULINOS)
            genero = "Masculino"
        elif tipo_nombre == "femenino":
            nombre = random.choice(NOMBRES_FEMENINOS)
            genero = "Femenino"
        else:
            nombre = random.choice(NOMBRES_NO_BINARIOS)
            genero = random.choice(["No Binario", "Prefiero no decirlo"])
        apellido = random.choice(APELLIDOS)

        # Fechas y Edad
        fecha_ingreso = random_date(FECHA_INICIO_PERIODO, FECHA_FIN_PERIODO - timedelta(days=90 if random.random() > PROBABILIDAD_SALIDA else 0))
        
        edad_ingreso = random.randint(20, 55)
        fecha_nacimiento = fecha_ingreso - timedelta(days=edad_ingreso * 365 + random.randint(0,364))
        
        edad_actual = (FECHA_FIN_PERIODO.year - fecha_nacimiento.year) - \
                      ((FECHA_FIN_PERIODO.month, FECHA_FIN_PERIODO.day) < (fecha_nacimiento.month, fecha_nacimiento.day))


        # Departamento (priorizando los clave)
        if random.random() < 0.75: 
            departamento = random.choice(DEPARTAMENTOS_PRIORITARIOS)
        else:
            departamento = random.choice(DEPARTAMENTOS_SECUNDARIOS)

        cargo = random.choice(CARGOS_TODOS)
        
        if cargo in CARGOS_ALTA_DIR:
            salario_base_mensual = random.randint(4500, 8000)
        elif cargo in CARGOS_GERENCIA:
            salario_base_mensual = random.randint(3000, 5500)
        elif cargo in CARGOS_COORDINACION:
            salario_base_mensual = random.randint(2200, 3800)
        elif cargo in CARGOS_ESPECIALISTA:
            salario_base_mensual = random.randint(1800, 3200)
        else: 
            salario_base_mensual = random.randint(1200, 2200)
        
        componente_variable_anual = 0
        if random.random() < 0.5: 
            componente_variable_anual = round(salario_base_mensual * 12 * random.uniform(0.05, 0.20), 2) 

        fecha_ultimo_aumento = None
        porcentaje_ultimo_aumento = None
        if (FECHA_FIN_PERIODO - fecha_ingreso).days > 365 and random.random() < 0.7: 
            fecha_ultimo_aumento = random_date(fecha_ingreso + timedelta(days=180), FECHA_FIN_PERIODO - timedelta(days=30))
            porcentaje_ultimo_aumento = round(random.uniform(2.0, 8.0), 2)


        # Estado y Rotación
        estado_actual = "Activo"
        fecha_salida = None
        tipo_salida = None
        motivo_salida_principal = None
        detalle_motivo_salida = ""

        if random.random() < PROBABILIDAD_SALIDA:
            estado_actual = random.choice(ESTADOS_ACTUALES_SALIDA)
            # Ensure fecha_salida is after fecha_ingreso and within the period
            min_salida_offset = 90 # Minimum 90 days of employment before leaving
            max_salida_date = FECHA_FIN_PERIODO
            
            # Ensure there's enough time between ingreso and fin_periodo for a valid salida
            if (max_salida_date - (fecha_ingreso + timedelta(days=min_salida_offset))).days > 0:
                 fecha_salida = random_date(fecha_ingreso + timedelta(days=min_salida_offset), max_salida_date)
            else: # Not enough time, force salida at the end of the period or shortly after ingreso if period is too short
                if (max_salida_date - fecha_ingreso).days > min_salida_offset:
                    fecha_salida = max_salida_date
                else: # Very short employment, set salida to a few days after ingreso if possible
                    fecha_salida = fecha_ingreso + timedelta(days=random.randint(min_salida_offset // 2, min_salida_offset))
                    if fecha_salida > max_salida_date: # Cap at period end
                        fecha_salida = max_salida_date
            
            tipo_salida = TIPOS_SALIDA[estado_actual]
            if estado_actual == "Renuncia":
                motivo_salida_principal = random.choice(MOTIVOS_RENUNCIA)
            elif estado_actual == "Despido":
                motivo_salida_principal = random.choice(MOTIVOS_DESPIDO)
            elif estado_actual == "Jubilación":
                motivo_salida_principal = random.choice(MOTIVOS_JUBILACION)
            elif estado_actual == "Fin de Contrato":
                motivo_salida_principal = random.choice(MOTIVOS_FIN_CONTRATO)
            if random.random() < 0.3:
                detalle_motivo_salida = "Información adicional confidencial."
        
        desempeno_general_actual = round(random.uniform(1.0, 5.0), 2)
        evaluaciones_historicas = []
        num_evaluaciones = random.randint(1, 4) 
        
        eval_start_date_obj = fecha_ingreso
        eval_end_date_obj = fecha_salida if fecha_salida else FECHA_FIN_PERIODO

        active_duration_for_eval = eval_end_date_obj - eval_start_date_obj
        
        if active_duration_for_eval.days > 180 : 
            current_eval_date_start = eval_start_date_obj
            for eval_count in range(num_evaluaciones):
                # Ensure eval_date is within active employment
                if (eval_end_date_obj - current_eval_date_start).days < 30 : break 

                # Distribute evaluation dates somewhat evenly
                time_per_eval_approx = (eval_end_date_obj - current_eval_date_start).days // (num_evaluaciones - eval_count if num_evaluaciones > eval_count else 1)
                
                eval_date_obj = random_date(current_eval_date_start + timedelta(days=random.randint(30, max(31, time_per_eval_approx // 2))),
                                         current_eval_date_start + timedelta(days=max(60, time_per_eval_approx)))

                if eval_date_obj > eval_end_date_obj: eval_date_obj = eval_end_date_obj # Cap at end date
                if eval_date_obj < current_eval_date_start + timedelta(days=30) : eval_date_obj = current_eval_date_start + timedelta(days=30) # Ensure min interval

                eval_score = round(random.uniform(max(1.0, desempeno_general_actual - 1.0), min(5.0, desempeno_general_actual + 1.0)), 2)
                
                evaluador_id = None
                if ids_disponibles_para_reportar: 
                    possible_evaluators = [eid for eid in ids_disponibles_para_reportar if eid != id_empleado]
                    if possible_evaluators:
                         evaluador_id = random.choice(possible_evaluators)

                evaluaciones_historicas.append({
                    "fecha_evaluacion": eval_date_obj.strftime("%Y-%m-%d"),
                    "puntuacion_evaluacion": eval_score,
                    "comentarios_evaluador": random.choice(["Buen progreso.", "Necesita mejorar en X.", "Cumple expectativas.", "Supera expectativas en Y."]),
                    "evaluador_id": evaluador_id
                })
                current_eval_date_start = eval_date_obj + timedelta(days=1) 

        dias_ausencia_justificada = 0
        dias_ausencia_no_justificada = 0
        
        last_active_year = (fecha_salida or FECHA_FIN_PERIODO).year
        is_active_in_current_period_year = fecha_ingreso.year <= last_active_year

        if is_active_in_current_period_year:
            dias_ausencia_justificada = random.randint(0, 10)
            dias_ausencia_no_justificada = random.randint(0, 3)
            if estado_actual != "Activo" and fecha_salida and fecha_salida.year == last_active_year: 
                fraction_of_year = (fecha_salida - datetime(last_active_year, 1, 1)).days / 365.25
                dias_ausencia_justificada = int(dias_ausencia_justificada * fraction_of_year)
                dias_ausencia_no_justificada = int(dias_ausencia_no_justificada * fraction_of_year)

        # Reporta_a
        reporta_a = None
        if ids_disponibles_para_reportar and random.random() < 0.85: 
            potential_supervisors = [
                eid for eid in ids_disponibles_para_reportar 
                if eid != id_empleado and 
                datetime.strptime(empleados_data[eid-1]["fecha_ingreso"], "%Y-%m-%d") < fecha_ingreso # *** CORRECCIÓN AQUÍ ***
            ] 
            if potential_supervisors:
                reporta_a = random.choice(potential_supervisors)
            elif ids_disponibles_para_reportar: 
                 reporta_a = random.choice([eid for eid in ids_disponibles_para_reportar if eid != id_empleado])


        empleado = {
            "id": id_empleado,
            "nombre": nombre,
            "apellido": apellido,
            "fecha_nacimiento": fecha_nacimiento.strftime("%Y-%m-%d"),
            "edad_a_fecha_corte": edad_actual, 
            "genero": genero,
            "nivel_educativo": random.choice(NIVELES_EDUCATIVOS),
            "contacto_email": f"{nombre.lower().split(' ')[0]}.{apellido.lower()}@empresa-ejemplo.com",
            "contacto_telefono": f"6{random.randint(10,99)}{random.randint(100,999)}{random.randint(100,999)}",
            
            "fecha_ingreso": fecha_ingreso.strftime("%Y-%m-%d"),
            "departamento": departamento,
            "cargo": cargo,
            "tipo_contrato": random.choice(TIPOS_CONTRATO),
            "ubicacion_trabajo": random.choice(UBICACIONES_TRABAJO),
            "reporta_a_id": reporta_a,
            
            "salario_base_mensual": salario_base_mensual,
            "componente_variable_anual": componente_variable_anual,
            "fecha_ultimo_aumento": fecha_ultimo_aumento.strftime("%Y-%m-%d") if fecha_ultimo_aumento else None,
            "porcentaje_ultimo_aumento": porcentaje_ultimo_aumento,
            
            "desempeno_general_actual": desempeno_general_actual if estado_actual == "Activo" else round(random.uniform(1.0,4.0),2), 
            "evaluaciones_historicas": sorted(evaluaciones_historicas, key=lambda x: x['fecha_evaluacion']),
            
            "dias_ausencia_justificada_año_reporte": dias_ausencia_justificada,
            "dias_ausencia_no_justificada_año_reporte": dias_ausencia_no_justificada,
            
            "estado_actual": estado_actual,
            "fecha_salida": fecha_salida.strftime("%Y-%m-%d") if fecha_salida else None,
            "tipo_salida": tipo_salida,
            "motivo_salida_principal": motivo_salida_principal,
            "detalle_motivo_salida": detalle_motivo_salida
        }
        empleados_data.append(empleado)
        if estado_actual == "Activo": 
            ids_disponibles_para_reportar.append(id_empleado)
            
    active_employee_ids = {emp["id"] for emp in empleados_data if emp["estado_actual"] == "Activo"}
    for emp in empleados_data:
        if emp["reporta_a_id"] and emp["reporta_a_id"] not in active_employee_ids:
            new_supervisor = None
            if active_employee_ids - {emp["id"]}: # Check if set is not empty
                 new_supervisor = random.choice(list(active_employee_ids - {emp["id"]}))
            emp["reporta_a_id"] = new_supervisor

        for eval_hist in emp["evaluaciones_historicas"]:
            if eval_hist["evaluador_id"] and eval_hist["evaluador_id"] not in active_employee_ids:
                new_evaluator = None
                if active_employee_ids - {emp["id"]}: # Check if set is not empty
                    new_evaluator = random.choice(list(active_employee_ids - {emp["id"]}))
                eval_hist["evaluador_id"] = new_evaluator

    return empleados_data

# --- Generar y Guardar ---
if __name__ == "__main__":
    empleados_final = generar_empleados()
    
    counts = {}
    for emp in empleados_final:
        counts[emp['departamento']] = counts.get(emp['departamento'], 0) + 1
    print("Distribución de empleados por departamento:")
    for dept, count in sorted(counts.items(), key=lambda item: item[1], reverse=True):
        print(f"- {dept}: {count}")

    print(f"\nTotal de empleados generados: {len(empleados_final)}")
    activos = sum(1 for emp in empleados_final if emp['estado_actual'] == 'Activo')
    salidas = len(empleados_final) - activos
    print(f"Empleados activos: {activos}")
    print(f"Empleados que han salido: {salidas} ({(salidas/len(empleados_final)*100):.2f}%)")

    with open("rrhh_empleados_mejorado.json", "w", encoding="utf-8") as f:
        json.dump(empleados_final, f, indent=4, ensure_ascii=False)
    
    print("\nArchivo 'rrhh_empleados_mejorado.json' generado con éxito.")