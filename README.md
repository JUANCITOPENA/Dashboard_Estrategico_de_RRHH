# 📊 Dashboard Estratégico de Recursos Humanos 🚀

## 📝 Descripción General

Este proyecto presenta un dashboard interactivo y visualmente atractivo diseñado para analizar y visualizar indicadores clave (KPIs) del área de Recursos Humanos. A partir de un conjunto de datos de empleados (simulado o real), la aplicación genera un resumen ejecutivo, gráficos detallados y una tabla interactiva para facilitar la toma de decisiones estratégicas. ✨

El dashboard ofrece una vista consolidada del estado de la plantilla, rotación, compensación, desempeño, demografía y otros aspectos cruciales para la gestión del talento.

---

## ✨ Características Principales

*   📄 **Resumen Ejecutivo Narrativo:** En lugar de simples tarjetas KPI, se presenta un párrafo dinámico que resume los indicadores más importantes, utilizando formato condicional (colores y emojis ✅⚠️) para resaltar puntos clave como la tasa de rotación, desempeño promedio, máximo y mínimo.
*   📊 **Visualización de Datos Avanzada:** Utiliza **Chart.js (v4)** para mostrar una variedad de gráficos:
    *   Doughnut/Pie: Distribución de género, tipos de salida, tipos de contrato.
    *   Barras (Verticales y Horizontales): Empleados por departamento, motivos de salida, distribuciones (salario, desempeño, antigüedad), salario promedio por nivel de desempeño.
    *   Línea: Evolución de la tasa de rotación mensual.
*   📋 **Tabla de Empleados Interactiva:**
    *   Muestra detalles relevantes de cada empleado.
    *   Permite **búsqueda** por nombre/apellido.
    *   Incluye **filtros** por departamento y estado actual.
    *   Implementa **paginación** para manejar eficientemente grandes conjuntos de datos.
    *   Resalta visualmente a empleados inactivos.
*   💡 **Cálculo de KPIs Relevantes:**
    *   Plantilla total y activa.
    *   Total de bajas en el periodo.
    *   Tasa de rotación anualizada.
    *   Salario base mensual promedio (activos).
    *   Edad y antigüedad promedio (activos).
    *   Desempeño promedio, máximo y mínimo (activos).
    *   Promedio de días de ausencia.
    *   Conteo de renuncias y despidos.
    *   Identificación del departamento con más empleados activos.
*   🌓 **Modo Claro y Oscuro:** Permite al usuario cambiar entre temas visuales para adaptarse a sus preferencias o condiciones de iluminación. La preferencia se guarda en `localStorage`.
*   📄<0xF0><0x9F><0xAA><0x99> **Descarga PDF:** Funcionalidad para generar un archivo PDF del estado actual del dashboard (resumen, gráficos y tabla completa) utilizando `jsPDF` y `html2canvas`. Captura el tema visual activo (claro/oscuro) y organiza el contenido por secciones.
*   📱 **Diseño Responsivo:** La interfaz se adapta a diferentes tamaños de pantalla (escritorio, tableta, móvil).

---

## 💻 Tecnologías Utilizadas

*   **Frontend:**
    *   HTML5
    *   CSS3 (Variables CSS, Flexbox, Grid)
    *   JavaScript (ES6+)
*   **Librerías JavaScript:**
    *   📊 **Chart.js (v4.x):** Para la creación de gráficos interactivos.
    *   📅 **Luxon.js:** Para el manejo robusto de fechas y horas (cálculo de antigüedad, formato).
    *   📄<0xF0><0x9F><0xAA><0x99> **jsPDF:** Para la generación de archivos PDF del lado del cliente.
    *   🖼️ **html2canvas:** Para capturar elementos HTML (secciones del dashboard) como imágenes para el PDF.
*   **Iconos:**
    *   <0xF0><0x9F><0x9A><0xA9>️ **Font Awesome:** Para iconos visuales en toda la interfaz.
*   **Fuente de Datos:**
    *   📄 **JSON:** Archivo (`rrhh_empleados_mejorado.json`) que contiene los datos de los empleados.

---

## 🚀 Cómo Ejecutar el Proyecto

1.  **Clonar o Descargar:** Obtén los archivos del proyecto (`index.html`, `style.css`, `script.js`).
2.  **Crear Carpeta de Datos:** Crea una carpeta llamada `base de datos` en el mismo directorio donde están los archivos anteriores.
3.  **Colocar el JSON:** Mueve tu archivo `rrhh_empleados_mejorado.json` dentro de la carpeta `base de datos`.
4.  **Servidor Local (¡Importante!):** Debido a las restricciones de seguridad de los navegadores (CORS) al usar `fetch` para cargar archivos locales (el JSON), necesitas ejecutar el proyecto a través de un servidor web local. No funcionará simplemente abriendo `index.html` directamente desde el explorador de archivos.
    *   **Opción A (Python):** Si tienes Python instalado, abre una terminal o línea de comandos en la carpeta raíz del proyecto y ejecuta:
        ```bash
        # Para Python 3
        python -m http.server
        # O si tienes Python 2 (menos común ahora)
        # python -m SimpleHTTPServer
        ```
        Luego, abre tu navegador y ve a `http://localhost:8000` (o el puerto que indique la terminal).
    *   **Opción B (VS Code Live Server):** Si usas Visual Studio Code, instala la extensión "Live Server". Haz clic derecho en `index.html` y selecciona "Open with Live Server".
    *   **Otras Opciones:** Cualquier otro servidor web local (Node.js `http-server`, XAMPP, MAMP, etc.) funcionará.
5.  **Navegar:** Abre la URL proporcionada por tu servidor local (generalmente `http://localhost:[PUERTO]`) en tu navegador web. ¡El dashboard debería cargarse! 🎉

---

## 📁 Estructura de Archivos
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
