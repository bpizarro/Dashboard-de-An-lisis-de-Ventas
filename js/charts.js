/**
 * TechTrends Dashboard - Sistema de Gráficos
 *
 * Notas rápidas:
 * - Aquí solo configuramos objetos de Chart.js (tipos, datasets, colores, ejes)
 * - Los datos ya vienen calculados por MetricsCalculator
 * - Si ves muchas opciones, no te asustes: casi todo es estilo/UX del gráfico
 *
 * Glosario:
 * • Chart.js: librería para crear gráficos interactivos (líneas, barras, donas)
 * • Dataset: conjunto de datos que se dibuja en el gráfico (ej: ventas por mes)
 * • Canvas: elemento HTML donde se dibuja el gráfico
 * • Eje Y / Y1: ejes verticales (izquierdo y derecho) con escalas distintas
 * • Tooltip: cuadro flotante que aparece al pasar el mouse sobre el gráfico
 * • Legend: leyenda que identifica qué color/línea es cada dataset
 */

class ChartsManager {
    constructor() {
        this.charts = {};
        this.isInitialized = false;
    }

    /**
     * Inicializa todos los gráficos
     * @param {Object} metrics - Métricas calculadas
     */
    initializeCharts(metrics) {
        try {
            console.log('Inicializando gráficos...');

            // Crear gráfico de ventas mensuales
            this.createSalesLineChart(metrics.salesByMonth, 'salesChart');
            
            // Crear gráfico de top productos
            this.createTopProductsBarChart(metrics.topProducts.slice(0, 5), 'productsChart');
            
            // Crear gráfico de métodos de pago
            this.createPaymentMethodsPieChart(metrics.paymentMethods, 'paymentChart');
            
            // Crear gráfico de ventas por país
            this.createCountryChart(metrics.salesByCountry, 'countryChart');

            this.isInitialized = true;
            console.log('Gráficos inicializados exitosamente');

        } catch (error) {
            console.error('Error inicializando gráficos:', error);
            throw new Error(`Error al inicializar gráficos: ${error.message}`);
        }
    }

    /**
     * Crea el gráfico de líneas para ventas mensuales
     * @param {Array<Object>} data - Datos de ventas mensuales
     * @param {string} canvasId - ID del canvas
     */
    createSalesLineChart(data, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return;
        }

        // Destruir gráfico existente
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = data.map(item => item.monthName);
        const salesData = data.map(item => item.totalSales);
        const transactionsData = data.map(item => item.totalTransactions);

        const chartConfig = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventas ($)',
                        data: salesData,
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS[0],
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS[0],
                        borderWidth: 3,
                        fill: true, // Línea con relleno debajo (área)
                        tension: 0.4,
                        pointBackgroundColor: CONFIG.CHARTS.DEFAULT_COLORS[0],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        yAxisID: 'y' // primer eje Y (izquierda)
                    },
                    {
                        label: 'Transacciones',
                        data: transactionsData,
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS[1],
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS[1],
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: CONFIG.CHARTS.DEFAULT_COLORS[1],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        yAxisID: 'y1' // segundo eje Y (derecha)
                    }
                ]
            },
            options: {
                ...CONFIG.CHARTS.DEFAULT_OPTIONS,
                scales: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales,
                    y: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y,
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Ventas ($)',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[0]
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatCurrency(value); // mostrar como $
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Transacciones',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[1]
                        },
                        grid: {
                            drawOnChartArea: false, // no dibujar líneas de este eje en el centro
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatNumber(value); // formato con miles
                            }
                        }
                    }
                },
                plugins: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Ventas: ${UTILS.formatCurrency(context.parsed.y)}`;
                                } else {
                                    return `Transacciones: ${UTILS.formatNumber(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(canvas, chartConfig);
    }

    /**
     * Crea el gráfico de barras para top productos
     * @param {Array<Object>} data - Datos de top productos
     * @param {string} canvasId - ID del canvas
     */
    createTopProductsBarChart(data, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return;
        }

        // Destruir gráfico existente
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = data.map(item => item.productName);
        const quantities = data.map(item => item.totalQuantity);
        const revenues = data.map(item => item.totalRevenue);

        const chartConfig = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cantidad Vendida',
                        data: quantities,
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS.slice(0, data.length),
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false, // bordes redondeados arriba
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ingresos ($)',
                        data: revenues,
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS.slice(0, data.length).map(color => 
                            color.replace('0.8', '0.3')
                        ),
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...CONFIG.CHARTS.DEFAULT_OPTIONS,
                scales: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales,
                    y: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y,
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cantidad',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[0]
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatNumber(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Ingresos ($)',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[1]
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Cantidad: ${UTILS.formatNumber(context.parsed.y)}`;
                                } else {
                                    return `Ingresos: ${UTILS.formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(canvas, chartConfig);
    }

    /**
     * Crea el gráfico de pastel para métodos de pago
     * @param {Array<Object>} data - Datos de métodos de pago
     * @param {string} canvasId - ID del canvas
     */
    createPaymentMethodsPieChart(data, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return;
        }

        // Destruir gráfico existente
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = data.map(item => item.method);
        const values = data.map(item => item.totalSales);
        const percentages = data.map(item => item.percentage);

        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: CONFIG.CHARTS.DEFAULT_COLORS.slice(0, data.length),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 5, // más grueso al pasar el mouse
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                ...CONFIG.CHARTS.DEFAULT_OPTIONS,
                cutout: '60%', // tamaño del agujero del donut
                plugins: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins,
                    legend: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.legend,
                        position: 'bottom',
                        labels: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.legend.labels,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const percentage = percentages[i];
                                        return {
                                            text: `${label}: ${percentage.toFixed(1)}%`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].borderColor,
                                            lineWidth: data.datasets[0].borderWidth,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${UTILS.formatCurrency(value)} (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(canvas, chartConfig);
    }

    /**
     * Crea el gráfico de ventas por país
     * @param {Array<Object>} data - Datos de ventas por país
     * @param {string} canvasId - ID del canvas
     */
    createCountryChart(data, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return;
        }

        // Destruir gráfico existente
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = data.map(item => item.country);
        const salesData = data.map(item => item.totalSales);
        const transactionsData = data.map(item => item.totalTransactions);

        const chartConfig = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventas ($)',
                        data: salesData,
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS.slice(0, data.length),
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Transacciones',
                        data: transactionsData,
                        backgroundColor: CONFIG.CHARTS.GRADIENT_COLORS.slice(0, data.length).map(color => 
                            color.replace('0.8', '0.4')
                        ),
                        borderColor: CONFIG.CHARTS.DEFAULT_COLORS.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...CONFIG.CHARTS.DEFAULT_OPTIONS,
                scales: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales,
                    y: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y,
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Ventas ($)',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[0]
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatCurrency(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Transacciones',
                            color: CONFIG.CHARTS.DEFAULT_COLORS[1]
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            ...CONFIG.CHARTS.DEFAULT_OPTIONS.scales.y.ticks,
                            callback: function(value) {
                                return UTILS.formatNumber(value);
                            }
                        }
                    }
                },
                plugins: {
                    ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        ...CONFIG.CHARTS.DEFAULT_OPTIONS.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Ventas: ${UTILS.formatCurrency(context.parsed.y)}`;
                                } else {
                                    return `Transacciones: ${UTILS.formatNumber(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            }
        };

        this.charts[canvasId] = new Chart(canvas, chartConfig);
    }

    /**
     * Actualiza todos los gráficos con nuevos datos
     * @param {Object} metrics - Nuevas métricas
     */
    updateChartsWithFilters(metrics) {
        try {
            console.log('Actualizando gráficos con filtros...');

            // Actualizar gráfico de ventas mensuales
            if (this.charts.salesChart && metrics.salesByMonth) {
                this.updateSalesLineChart(metrics.salesByMonth);
            }

            // Actualizar gráfico de top productos
            if (this.charts.productsChart && metrics.topProducts) {
                this.updateTopProductsBarChart(metrics.topProducts.slice(0, 5));
            }

            // Actualizar gráfico de métodos de pago
            if (this.charts.paymentChart && metrics.paymentMethods) {
                this.updatePaymentMethodsPieChart(metrics.paymentMethods);
            }

            // Actualizar gráfico de países
            if (this.charts.countryChart && metrics.salesByCountry) {
                this.updateCountryChart(metrics.salesByCountry);
            }

            console.log('Gráficos actualizados exitosamente');

        } catch (error) {
            console.error('Error actualizando gráficos:', error);
        }
    }

    /**
     * Actualiza el gráfico de ventas mensuales
     * @param {Array<Object>} data - Nuevos datos
     */
    updateSalesLineChart(data) {
        const chart = this.charts.salesChart;
        if (!chart) return;

        chart.data.labels = data.map(item => item.monthName);
        chart.data.datasets[0].data = data.map(item => item.totalSales);
        chart.data.datasets[1].data = data.map(item => item.totalTransactions);
        chart.update('active');
    }

    /**
     * Actualiza el gráfico de top productos
     * @param {Array<Object>} data - Nuevos datos
     */
    updateTopProductsBarChart(data) {
        const chart = this.charts.productsChart;
        if (!chart) return;

        chart.data.labels = data.map(item => item.productName);
        chart.data.datasets[0].data = data.map(item => item.totalQuantity);
        chart.data.datasets[1].data = data.map(item => item.totalRevenue);
        chart.update('active');
    }

    /**
     * Actualiza el gráfico de métodos de pago
     * @param {Array<Object>} data - Nuevos datos
     */
    updatePaymentMethodsPieChart(data) {
        const chart = this.charts.paymentChart;
        if (!chart) return;

        chart.data.labels = data.map(item => item.method);
        chart.data.datasets[0].data = data.map(item => item.totalSales);
        chart.update('active');
    }

    /**
     * Actualiza el gráfico de países
     * @param {Array<Object>} data - Nuevos datos
     */
    updateCountryChart(data) {
        const chart = this.charts.countryChart;
        if (!chart) return;

        chart.data.labels = data.map(item => item.country);
        chart.data.datasets[0].data = data.map(item => item.totalSales);
        chart.data.datasets[1].data = data.map(item => item.totalTransactions);
        chart.update('active');
    }

    /**
     * Destruye todos los gráficos
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        this.isInitialized = false;
    }

    /**
     * Destruye un gráfico específico
     * @param {string} chartId - ID del gráfico
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * Obtiene el estado de inicialización
     * @returns {boolean} - True si está inicializado
     */
    isChartsInitialized() {
        return this.isInitialized;
    }

    /**
     * Obtiene todos los gráficos
     * @returns {Object} - Objeto con todos los gráficos
     */
    getAllCharts() {
        return this.charts;
    }

    /**
     * Obtiene un gráfico específico
     * @param {string} chartId - ID del gráfico
     * @returns {Chart} - Instancia del gráfico
     */
    getChart(chartId) {
        return this.charts[chartId];
    }
}

// Crear instancia global del gestor de gráficos
const chartsManager = new ChartsManager();
