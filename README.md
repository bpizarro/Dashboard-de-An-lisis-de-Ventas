# TechTrends Dashboard - Análisis de Ventas

Un dashboard interactivo y moderno para el análisis de ventas de TechTrends, una tienda e-commerce de gadgets tecnológicos.

## Descripción

Este proyecto es un dashboard web completo que permite visualizar y analizar el rendimiento de ventas después de un año de operaciones. Está diseñado para equipos de marketing y gestión sin conocimientos técnicos avanzados.

## Características Principales

### Visualizaciones Interactivas
- **Gráfico de líneas**: Ventas mensuales con tendencias
- **Gráfico de barras**: Top 5 productos más vendidos
- **Gráfico de pastel**: Distribución de métodos de pago
- **Gráfico de países**: Ventas por región geográfica

### Métricas y KPIs
- Ventas totales con crecimiento mensual
- Número total de transacciones
- Ticket promedio por transacción
- Productos vendidos (cantidad total)
- Productos únicos en catálogo
- Países únicos con ventas

### Sistema de Filtros
- Filtro por rango de fechas
- Filtro por producto específico
- Filtro por país/región
- Filtro por categoría de producto
- Filtro por método de pago
- Búsqueda en tiempo real

### Tabla de Datos
- Visualización completa de transacciones
- Paginación inteligente
- Búsqueda y filtrado
- Exportación a CSV/JSON
- Información detallada por transacción

##  Arquitectura del Proyecto

```
dashboard-ventas/
│
├── index.html              # Estructura principal del dashboard
├── css/
│   ├── styles.css         # Estilos generales y layout
│   └── components.css     # Estilos de componentes específicos
│
├── js/
│   ├── config.js          # Configuraciones globales
│   ├── dataLoader.js      # Carga y parseo del CSV
│   ├── dataProcessor.js   # Limpieza y validación de datos
│   ├── metrics.js         # Cálculo de métricas agregadas
│   ├── charts.js          # Configuración de gráficos Chart.js
│   ├── filters.js         # Lógica de filtros interactivos
│   ├── ui.js              # Actualización de la interfaz
│   └── app.js             # Orquestador principal
│
└── README.md              # Este archivo
```

## Estructura de Datos CSV

El dashboard espera un archivo CSV con la siguiente estructura:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| ID_Transaccion | String | Identificador único de la transacción |
| Fecha | Date | Fecha de la venta (YYYY-MM-DD) |
| ID_Producto | String | Identificador del producto |
| Nombre_Producto | String | Nombre del producto |
| Categoria | String | Categoría del producto |
| Cantidad | Number | Cantidad vendida |
| Precio_Unitario | Number | Precio por unidad |
| Total_Venta | Number | Total de la venta |
| Pais | String | País donde se realizó la venta |
| Metodo_Pago | String | Método de pago utilizado |

### Productos Soportados
- Audífonos Bluetooth
- Mouse Inalámbrico
- Teclado Mecánico
- Smartwatch
- Webcam HD
- Cargador Rápido

### Categorías
- Audio
- Periférico
- Wearable
- Accesorio

### Países
- México
- Chile
- Colombia
- Perú
- Argentina

### Métodos de Pago
- Tarjeta
- PayPal
- Transferencia


Diseño

### Paleta de Colores
- **Primario**: Azul (#2563eb)
- **Secundario**: Gris (#64748b)
- **Acento**: Cian (#06b6d4)
- **Éxito**: Verde (#10b981)
- **Advertencia**: Naranja (#f59e0b)
- **Error**: Rojo (#ef4444)

### Tipografía
- **Fuente Principal**: Inter (Google Fonts)
- **Tamaños**: Escala tipográfica consistente
- **Pesos**: 300, 400, 500, 600, 700

### Responsive Design
- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: 480px, 768px, 1024px, 1200px
- **Grid System**: CSS Grid y Flexbox
- **Adaptable**: Se adapta a cualquier tamaño de pantalla

## Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con variables CSS
- **JavaScript ES6+**: Funcionalidades interactivas
- **Chart.js**: Gráficos interactivos
- **Font Awesome**: Iconografía

### Librerías Externas (CDN)
- Chart.js v4.x
- Font Awesome v6.x
- Google Fonts (Inter)

## Funcionalidades Técnicas

### Procesamiento de Datos
- **Parser CSV robusto**: Maneja comillas, delimitadores y caracteres especiales
- **Validación de datos**: Verifica tipos, rangos y consistencia
- **Limpieza automática**: Normaliza espacios, caracteres y formatos
- **Conversión de tipos**: Fechas, números y strings automáticamente

### Sistema de Filtros
- **Filtros en tiempo real**: Actualización instantánea de visualizaciones
- **Combinación de filtros**: Múltiples criterios simultáneos
- **Persistencia**: Mantiene filtros durante la sesión
- **Reset inteligente**: Limpia todos los filtros con un clic

### Optimización de Rendimiento
- **Debounce**: Optimiza eventos de búsqueda
- **Throttle**: Limita eventos de redimensionamiento
- **Lazy Loading**: Carga gráficos solo cuando es necesario
- **Memory Management**: Limpia recursos correctamente

## Preguntas que Responde el Dashboard

1. **¿Cuáles son los productos más vendidos en cantidad y en ingresos?**
   - Gráfico de barras con top 5 productos
   - Métricas de cantidad y ingresos por producto

2. **¿Cómo varían las ventas totales a lo largo del tiempo?**
   - Gráfico de líneas con tendencias mensuales
   - Análisis de crecimiento y estacionalidad

3. **¿Qué métodos de pago son los más utilizados?**
   - Gráfico de pastel con distribución porcentual
   - Análisis de preferencias de pago

4. **¿Cómo se distribuyen las ventas por región/país?**
   - Gráfico de barras por país
   - Análisis geográfico de rendimiento


##  Métricas Calculadas

### KPIs Principales
- **Ventas Totales**: Suma de todos los ingresos
- **Transacciones**: Número total de ventas
- **Ticket Promedio**: Promedio de venta por transacción
- **Productos Vendidos**: Cantidad total de unidades

### Métricas Avanzadas
- **Crecimiento Mensual**: Tasa de crecimiento de ventas
- **Productos Únicos**: Número de productos diferentes vendidos
- **Países Únicos**: Número de países con ventas
- **Rendimiento por Categoría**: Análisis por tipo de producto

