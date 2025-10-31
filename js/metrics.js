/**
 * TechTrends Dashboard - Calculadora de Métricas
 *
 * Guía rápida:
 * - Recibe datos ya limpios/validados y calcula KPIs y agregados
 * - Devuelve colecciones preparadas para gráficos y tarjetas (KPIs)
 *
 * Principales salidas:
 * - kpis (ventas totales, transacciones, ticket promedio, etc.)
 * - salesByMonth, salesByCountry, productsByCategory, paymentMethods
 * - topProducts / topProductsByRevenue, métricas por categoría y tendencias
 *
 * Glosario:
 * • KPI: Key Performance Indicator, métrica clave (ej: ventas totales, ticket promedio)
 * • Agregado: resumen de datos (ej: sumar ventas por mes o por país)
 * • Ticket promedio: venta total ÷ número de transacciones
 * • Tendencia: cambio porcentual entre períodos (crecimiento o caída)
 * • Top N: los N elementos con mayor valor (ej: top 5 productos más vendidos)
 */

class MetricsCalculator {
    constructor() {
        this.data = [];
        this.metrics = {};
    }

    /**
     * Calcula todas las métricas para los datos proporcionados
     * @param {Array<Object>} data - Datos procesados
     * @returns {Object} - Objeto con todas las métricas calculadas
     */
    calculateAllMetrics(data) {
        this.data = data;
        this.metrics = {};

        if (!Array.isArray(data) || data.length === 0) {
            console.warn('No hay datos para calcular métricas');
            return this.getEmptyMetrics();
        }

        console.log(`Calculando métricas para ${data.length} registros...`);

        try {
            // Métricas básicas
            this.metrics.kpis = this.getKPIs();
            this.metrics.salesByMonth = this.getVentasMensuales();
            this.metrics.productsByCategory = this.getProductosPorCategoria();
            this.metrics.revenueByProduct = this.getIngresosPorProducto();
            this.metrics.salesByCountry = this.getVentasPorPais();
            this.metrics.paymentMethods = this.getMetodosPago();
            this.metrics.topProducts = this.getTopProductos(10);
            this.metrics.topProductsByRevenue = this.getTopProductosPorIngresos(10);
            this.metrics.salesByCategory = this.getVentasPorCategoria();
            this.metrics.monthlyTrends = this.getTendenciasMensuales();
            this.metrics.countryPerformance = this.getRendimientoPorPais();
            this.metrics.paymentMethodTrends = this.getTendenciasMetodosPago();

            console.log('Métricas calculadas exitosamente');
            return this.metrics;

        } catch (error) {
            console.error('Error calculando métricas:', error);
            throw new Error(`Error al calcular métricas: ${error.message}`);
        }
    }

    /**
     * Calcula los KPIs principales
     * @returns {Object} - KPIs principales
     */
    getKPIs() {
        const totalSales = this.data.reduce((sum, row) => sum + row.Total_Venta, 0);
        const totalTransactions = this.data.length;
        const totalProducts = this.data.reduce((sum, row) => sum + row.Cantidad, 0);
        const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Calcular crecimiento mensual
        const monthlySales = this.getVentasMensuales();
        const growthRate = this.calculateGrowthRate(monthlySales);

        // Calcular productos únicos
        const uniqueProducts = new Set(this.data.map(row => row.ID_Producto)).size;

        // Calcular países únicos
        const uniqueCountries = new Set(this.data.map(row => row.Pais)).size;

        return {
            totalSales: {
                value: totalSales,
                formatted: UTILS.formatCurrency(totalSales),
                growth: growthRate
            },
            totalTransactions: {
                value: totalTransactions,
                formatted: UTILS.formatNumber(totalTransactions)
            },
            totalProducts: {
                value: totalProducts,
                formatted: UTILS.formatNumber(totalProducts)
            },
            averageTicket: {
                value: averageTicket,
                formatted: UTILS.formatCurrency(averageTicket)
            },
            uniqueProducts: {
                value: uniqueProducts,
                formatted: UTILS.formatNumber(uniqueProducts)
            },
            uniqueCountries: {
                value: uniqueCountries,
                formatted: UTILS.formatNumber(uniqueCountries)
            }
        };
    }

    /**
     * Calcula las ventas mensuales
     * @returns {Array<Object>} - Ventas por mes
     */
    getVentasMensuales() {
        const monthlySales = {};

        this.data.forEach(row => {
            const monthKey = row.MesAno;
            const monthName = row.NombreMes;
            const year = row.Ano;
            const month = row.Mes;

            if (!monthlySales[monthKey]) {
                monthlySales[monthKey] = {
                    monthKey,
                    monthName,
                    year,
                    month,
                    totalSales: 0,
                    totalTransactions: 0,
                    totalProducts: 0,
                    averageTicket: 0
                };
            }

            monthlySales[monthKey].totalSales += row.Total_Venta;
            monthlySales[monthKey].totalTransactions += 1;
            monthlySales[monthKey].totalProducts += row.Cantidad;
        });

        // Calcular ticket promedio por mes
        Object.values(monthlySales).forEach(month => {
            month.averageTicket = month.totalTransactions > 0 
                ? month.totalSales / month.totalTransactions 
                : 0;
        });

        return Object.values(monthlySales).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
    }

    /**
     * Calcula productos por categoría
     * @returns {Array<Object>} - Productos vendidos por categoría
     */
    getProductosPorCategoria() {
        const categoryData = {};

        this.data.forEach(row => {
            const category = row.Categoria;
            
            if (!categoryData[category]) {
                categoryData[category] = {
                    category,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    totalTransactions: 0,
                    averagePrice: 0
                };
            }

            categoryData[category].totalQuantity += row.Cantidad;
            categoryData[category].totalRevenue += row.Total_Venta;
            categoryData[category].totalTransactions += 1;
        });

        // Calcular precio promedio por categoría
        Object.values(categoryData).forEach(category => {
            category.averagePrice = category.totalQuantity > 0 
                ? category.totalRevenue / category.totalQuantity 
                : 0;
        });

        return Object.values(categoryData).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    /**
     * Calcula ingresos por producto
     * @returns {Array<Object>} - Ingresos por producto
     */
    getIngresosPorProducto() {
        const productData = {};

        this.data.forEach(row => {
            const productId = row.ID_Producto;
            const productName = row.Nombre_Producto;
            
            if (!productData[productId]) {
                productData[productId] = {
                    productId,
                    productName,
                    category: row.Categoria,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    totalTransactions: 0,
                    averagePrice: 0,
                    averageQuantity: 0
                };
            }

            productData[productId].totalQuantity += row.Cantidad;
            productData[productId].totalRevenue += row.Total_Venta;
            productData[productId].totalTransactions += 1;
        });

        // Calcular promedios
        Object.values(productData).forEach(product => {
            product.averagePrice = product.totalQuantity > 0 
                ? product.totalRevenue / product.totalQuantity 
                : 0;
            product.averageQuantity = product.totalTransactions > 0 
                ? product.totalQuantity / product.totalTransactions 
                : 0;
        });

        return Object.values(productData).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    /**
     * Calcula ventas por país
     * @returns {Array<Object>} - Ventas por país
     */
    getVentasPorPais() {
        const countryData = {};

        this.data.forEach(row => {
            const country = row.Pais;
            
            if (!countryData[country]) {
                countryData[country] = {
                    country,
                    totalSales: 0,
                    totalTransactions: 0,
                    totalProducts: 0,
                    averageTicket: 0,
                    uniqueProducts: new Set()
                };
            }

            countryData[country].totalSales += row.Total_Venta;
            countryData[country].totalTransactions += 1;
            countryData[country].totalProducts += row.Cantidad;
            countryData[country].uniqueProducts.add(row.ID_Producto);
        });

        // Calcular métricas finales
        Object.values(countryData).forEach(country => {
            country.averageTicket = country.totalTransactions > 0 
                ? country.totalSales / country.totalTransactions 
                : 0;
            country.uniqueProductsCount = country.uniqueProducts.size;
            delete country.uniqueProducts; // Limpiar Set
        });

        return Object.values(countryData).sort((a, b) => b.totalSales - a.totalSales);
    }

    /**
     * Calcula métodos de pago
     * @returns {Array<Object>} - Distribución de métodos de pago
     */
    getMetodosPago() {
        const paymentData = {};

        this.data.forEach(row => {
            const method = row.Metodo_Pago;
            
            if (!paymentData[method]) {
                paymentData[method] = {
                    method,
                    totalSales: 0,
                    totalTransactions: 0,
                    averageTicket: 0,
                    percentage: 0
                };
            }

            paymentData[method].totalSales += row.Total_Venta;
            paymentData[method].totalTransactions += 1;
        });

        const totalSales = this.data.reduce((sum, row) => sum + row.Total_Venta, 0);
        const totalTransactions = this.data.length;

        // Calcular porcentajes y promedios
        Object.values(paymentData).forEach(method => {
            method.averageTicket = method.totalTransactions > 0 
                ? method.totalSales / method.totalTransactions 
                : 0;
            method.percentage = totalSales > 0 
                ? UTILS.calculatePercentage(method.totalSales, totalSales) 
                : 0;
        });

        return Object.values(paymentData).sort((a, b) => b.totalSales - a.totalSales);
    }

    /**
     * Obtiene los top N productos más vendidos por cantidad
     * @param {number} n - Número de productos a retornar
     * @returns {Array<Object>} - Top productos por cantidad
     */
    getTopProductos(n = 5) {
        const productData = {};

        this.data.forEach(row => {
            const productId = row.ID_Producto;
            const productName = row.Nombre_Producto;
            
            if (!productData[productId]) {
                productData[productId] = {
                    productId,
                    productName,
                    category: row.Categoria,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }

            productData[productId].totalQuantity += row.Cantidad;
            productData[productId].totalRevenue += row.Total_Venta;
        });

        return Object.values(productData)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, n);
    }

    /**
     * Obtiene los top N productos por ingresos
     * @param {number} n - Número de productos a retornar
     * @returns {Array<Object>} - Top productos por ingresos
     */
    getTopProductosPorIngresos(n = 5) {
        const productData = {};

        this.data.forEach(row => {
            const productId = row.ID_Producto;
            const productName = row.Nombre_Producto;
            
            if (!productData[productId]) {
                productData[productId] = {
                    productId,
                    productName,
                    category: row.Categoria,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }

            productData[productId].totalQuantity += row.Cantidad;
            productData[productId].totalRevenue += row.Total_Venta;
        });

        return Object.values(productData)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, n);
    }

    /**
     * Calcula ventas por categoría
     * @returns {Array<Object>} - Ventas por categoría
     */
    getVentasPorCategoria() {
        const categoryData = {};

        this.data.forEach(row => {
            const category = row.Categoria;
            
            if (!categoryData[category]) {
                categoryData[category] = {
                    category,
                    totalSales: 0,
                    totalQuantity: 0,
                    totalTransactions: 0,
                    averageTicket: 0,
                    uniqueProducts: new Set()
                };
            }

            categoryData[category].totalSales += row.Total_Venta;
            categoryData[category].totalQuantity += row.Cantidad;
            categoryData[category].totalTransactions += 1;
            categoryData[category].uniqueProducts.add(row.ID_Producto);
        });

        // Calcular métricas finales
        Object.values(categoryData).forEach(category => {
            category.averageTicket = category.totalTransactions > 0 
                ? category.totalSales / category.totalTransactions 
                : 0;
            category.uniqueProductsCount = category.uniqueProducts.size;
            delete category.uniqueProducts; // Limpiar Set
        });

        return Object.values(categoryData).sort((a, b) => b.totalSales - a.totalSales);
    }

    /**
     * Calcula tendencias mensuales
     * @returns {Object} - Tendencias mensuales
     */
    getTendenciasMensuales() {
        const monthlyData = this.getVentasMensuales();
        
        if (monthlyData.length < 2) {
            return {
                salesGrowth: 0,
                transactionGrowth: 0,
                trend: 'stable'
            };
        }

        const latestMonth = monthlyData[monthlyData.length - 1];
        const previousMonth = monthlyData[monthlyData.length - 2];

        const salesGrowth = this.calculateGrowthRate([previousMonth, latestMonth]);
        const transactionGrowth = previousMonth.totalTransactions > 0 
            ? UTILS.calculatePercentage(
                latestMonth.totalTransactions - previousMonth.totalTransactions,
                previousMonth.totalTransactions
              )
            : 0;

        let trend = 'stable';
        if (salesGrowth > 5) trend = 'growing';
        else if (salesGrowth < -5) trend = 'declining';

        return {
            salesGrowth,
            transactionGrowth,
            trend,
            latestMonth: latestMonth.monthName,
            previousMonth: previousMonth.monthName
        };
    }

    /**
     * Calcula rendimiento por país
     * @returns {Array<Object>} - Rendimiento por país
     */
    getRendimientoPorPais() {
        const countryData = this.getVentasPorPais();
        const totalSales = this.data.reduce((sum, row) => sum + row.Total_Venta, 0);

        return countryData.map(country => ({
            ...country,
            percentage: UTILS.calculatePercentage(country.totalSales, totalSales),
            performance: country.averageTicket > this.metrics.kpis.averageTicket.value ? 'above' : 'below'
        }));
    }

    /**
     * Calcula tendencias de métodos de pago
     * @returns {Object} - Tendencias de métodos de pago
     */
    getTendenciasMetodosPago() {
        const paymentData = this.getMetodosPago();
        const totalTransactions = this.data.length;

        return paymentData.map(method => ({
            ...method,
            transactionPercentage: UTILS.calculatePercentage(method.totalTransactions, totalTransactions)
        }));
    }

    /**
     * Calcula la tasa de crecimiento
     * @param {Array<Object>} monthlyData - Datos mensuales
     * @returns {number} - Tasa de crecimiento
     */
    calculateGrowthRate(monthlyData) {
        if (monthlyData.length < 2) return 0;

        const latest = monthlyData[monthlyData.length - 1];
        const previous = monthlyData[monthlyData.length - 2];

        if (previous.totalSales === 0) return 0;

        return UTILS.calculatePercentage(
            latest.totalSales - previous.totalSales,
            previous.totalSales
        );
    }

    /**
     * Obtiene métricas vacías para casos sin datos
     * @returns {Object} - Métricas vacías
     */
    getEmptyMetrics() {
        return {
            kpis: {
                totalSales: { value: 0, formatted: '$0.00', growth: 0 },
                totalTransactions: { value: 0, formatted: '0' },
                totalProducts: { value: 0, formatted: '0' },
                averageTicket: { value: 0, formatted: '$0.00' },
                uniqueProducts: { value: 0, formatted: '0' },
                uniqueCountries: { value: 0, formatted: '0' }
            },
            salesByMonth: [],
            productsByCategory: [],
            revenueByProduct: [],
            salesByCountry: [],
            paymentMethods: [],
            topProducts: [],
            topProductsByRevenue: [],
            salesByCategory: [],
            monthlyTrends: { salesGrowth: 0, transactionGrowth: 0, trend: 'stable' },
            countryPerformance: [],
            paymentMethodTrends: []
        };
    }

    /**
     * Obtiene todas las métricas calculadas
     * @returns {Object} - Todas las métricas
     */
    getAllMetrics() {
        return this.metrics;
    }

    /**
     * Obtiene métricas específicas
     * @param {string} metricName - Nombre de la métrica
     * @returns {*} - Métrica específica
     */
    getMetric(metricName) {
        return this.metrics[metricName];
    }

    /**
     * Filtra métricas por criterios específicos
     * @param {Object} filters - Criterios de filtrado
     * @returns {Object} - Métricas filtradas
     */
    getFilteredMetrics(filters) {
        const filteredData = dataProcessor.filterData(this.data, filters);
        const filteredCalculator = new MetricsCalculator();
        return filteredCalculator.calculateAllMetrics(filteredData);
    }
}

// Crear instancia global del calculador de métricas
const metricsCalculator = new MetricsCalculator();
