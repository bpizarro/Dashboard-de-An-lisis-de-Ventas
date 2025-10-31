/**
 * TechTrends Dashboard - Aplicación Principal
 *
 * Guía rápida:
 * - Esta clase es el "director de orquesta". No dibuja ni calcula, coordina.
 * - Llama a UI, DataLoader, DataProcessor, Filters y Charts en el orden correcto.
 * - También maneja errores globales y atajos de teclado.
 *
 * Glosario:
 * • Orquestador: módulo que coordina llamadas a otros módulos en el orden correcto
 * • async/await: forma moderna de escribir código asíncrono (que espera sin bloquear)
 * • Callback: función que se pasa a otra para que la ejecute cuando termine
 * • bind(this): asegura que "this" dentro del callback siga apuntando a esta clase
 */

class TechTrendsApp {
    constructor() {
        this.isInitialized = false;
        this.currentData = [];
        this.currentMetrics = null;
        this.isProcessing = false;
    }

    /**
     * Inicializa la aplicación
     */
    async initialize() {
        try {
            console.log('Inicializando TechTrends Dashboard...');

            // Inicializar UI Manager
            uiManager.initialize();
            uiManager.setupErrorCloseListener();

            // Configurar cargador de datos (conectamos el <input type="file">)
            dataLoader.initialize('csvFile', this.onDataLoaded.bind(this), this.onError.bind(this), this.onProgress.bind(this));

            // Configurar filtros (al principio no hay datos, se llenarán al cargar)
            filtersManager.initialize([], this.onFiltersChanged.bind(this));

            // Configurar eventos globales (errores, recarga, atajos)
            this.setupGlobalEventListeners();

            // Actualizar título de la página
            uiManager.updatePageTitle('Dashboard de Ventas');

            this.isInitialized = true;
            console.log('TechTrends Dashboard inicializado exitosamente');

        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.onError('Error al inicializar la aplicación');
        }
    }

    /**
     * Configura event listeners globales
     */
    setupGlobalEventListeners() {
        // Prevenir recarga accidental de la página
        window.addEventListener('beforeunload', (event) => {
            if (this.isProcessing) {
                event.preventDefault();
                event.returnValue = '¿Estás seguro de que quieres salir? Los datos se perderán.';
            }
        });

        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
            this.onError('Ha ocurrido un error inesperado');
        });

        // Manejar errores de promesas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada:', event.reason);
            this.onError('Error al procesar datos');
        });

        // Atajos de teclado (calidad de vida para power-users)
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Redimensionamiento de ventana
        window.addEventListener('resize', UTILS.debounce(() => {
            this.handleWindowResize();
        }, 250));
    }

    /**
     * Maneja atajos de teclado
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + R para resetear filtros
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            filtersManager.resetFilters();
            uiManager.showToast('Filtros reseteados', 'success');
        }

        // Ctrl/Cmd + E para exportar datos
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            uiManager.exportTableData('csv');
            uiManager.showToast('Datos exportados', 'success');
        }

        // Escape para cerrar errores
        if (event.key === 'Escape') {
            uiManager.hideError();
        }
    }

    /**
     * Maneja el redimensionamiento de la ventana
     */
    handleWindowResize() {
        // Redimensionar gráficos si están inicializados
        if (chartsManager.isChartsInitialized()) {
            Object.values(chartsManager.getAllCharts()).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }
    }

    /**
     * Callback cuando los datos se cargan exitosamente
     * @param {Array<Object>} rawData - Datos raw del CSV
     */
    async onDataLoaded(rawData) {
        try {
            this.isProcessing = true;
            console.log(`Datos cargados: ${rawData.length} registros`);

            // 1) Procesar datos (limpiar, validar y convertir tipos)
            this.onProgress(CONFIG.MESSAGES.LOADING.PROCESSING);
            const processedData = dataProcessor.processData(rawData);

            if (processedData.length === 0) {
                throw new Error('No se pudieron procesar los datos');
            }

            // 2) Calcular métricas (sumas, promedios, top N, etc.)
            this.onProgress(CONFIG.MESSAGES.LOADING.CALCULATING_METRICS);
            const metrics = metricsCalculator.calculateAllMetrics(processedData);

            // Actualizar datos globales
            this.currentData = processedData;
            this.currentMetrics = metrics;

            // 3) Actualizar filtros (para que los selects se llenen con valores únicos)
            filtersManager.updateOriginalData(processedData);

            // 4) Generar gráficos iniciales
            this.onProgress(CONFIG.MESSAGES.LOADING.GENERATING_CHARTS);
            chartsManager.initializeCharts(metrics);

            // 5) Actualizar dashboard (KPIs + tabla)
            uiManager.updateDashboard(processedData, metrics);

            // Ocultar loading
            uiManager.hideLoading();

            // Mostrar mensaje de éxito
            uiManager.showToast(CONFIG.MESSAGES.SUCCESS.DATA_PROCESSED, 'success');

            // Tip útil para el usuario: estadísticas de limpieza/validación
            this.showProcessingStats(rawData.length, processedData.length);

            console.log('Datos procesados exitosamente');

        } catch (error) {
            console.error('Error procesando datos:', error);
            this.onError(`Error al procesar los datos: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Callback cuando ocurre un error
     * @param {string} message - Mensaje de error
     */
    onError(message) {
        console.error('Error:', message);
        
        // Ocultar loading
        uiManager.hideLoading();
        
        // Mostrar error
        uiManager.showError(message);
        
        // Mostrar toast de error
        uiManager.showToast(message, 'error');
        
        // Limpiar datos
        this.clearData();
    }

    /**
     * Callback para mostrar progreso
     * @param {string} message - Mensaje de progreso
     */
    onProgress(message) {
        console.log('Progreso:', message);
        uiManager.showLoading();
    }

    /**
     * Callback cuando cambian los filtros
     * @param {Array<Object>} filteredData - Datos filtrados
     * @param {Object} filters - Filtros aplicados
     */
    onFiltersChanged(filteredData, filters) {
        try {
            console.log(`Filtros aplicados: ${filteredData.length} registros`);

            // Calcular métricas para datos filtrados
            const filteredMetrics = metricsCalculator.calculateAllMetrics(filteredData);

            // Actualizar dashboard
            uiManager.updateDashboard(filteredData, filteredMetrics);

            // Actualizar gráficos
            chartsManager.updateChartsWithFilters(filteredMetrics);

            // Mostrar información de filtros activos
            if (filtersManager.hasActiveFilters()) {
                const stats = filtersManager.getFilterStats();
                uiManager.showToast(
                    `Filtros aplicados: ${stats.filteredDataCount} de ${stats.originalDataCount} registros`,
                    'info'
                );
            }

        } catch (error) {
            console.error('Error aplicando filtros:', error);
            uiManager.showToast('Error al aplicar filtros', 'error');
        }
    }

    /**
     * Muestra estadísticas de procesamiento
     * @param {number} originalCount - Cantidad original
     * @param {number} processedCount - Cantidad procesada
     */
    showProcessingStats(originalCount, processedCount) {
        const stats = dataProcessor.getCleaningStats();
        const errors = dataProcessor.getValidationErrors();

        let message = `Procesados ${UTILS.formatNumber(processedCount)} de ${UTILS.formatNumber(originalCount)} registros`;
        
        if (stats.invalidRows > 0) {
            message += ` (${stats.invalidRows} registros omitidos)`;
        }

        if (stats.cleanedFields > 0) {
            message += ` - ${stats.cleanedFields} campos limpiados`;
        }

        uiManager.showToast(message, 'info');

        // Mostrar errores de validación si los hay
        if (errors.length > 0) {
            console.warn('Errores de validación encontrados:', errors);
            setTimeout(() => {
                uiManager.showToast(
                    `${errors.length} registros con errores de validación`,
                    'warning'
                );
            }, 2000);
        }
    }

    /**
     * Limpia todos los datos
     */
    clearData() {
        this.currentData = [];
        this.currentMetrics = null;
        
        // Limpiar filtros
        filtersManager.resetFilters();
        
        // Destruir gráficos
        chartsManager.destroyAllCharts();
        
        // Limpiar UI
        uiManager.clearDataTable();
        uiManager.updateKPIs({
            totalSales: { formatted: '$0.00' },
            totalTransactions: { formatted: '0' },
            averageTicket: { formatted: '$0.00' },
            totalProducts: { formatted: '0' }
        });
        
        // Limpiar información de archivo
        dataLoader.clearFileInfo();
    }

    /**
     * Exporta datos actuales
     * @param {string} format - Formato de exportación
     */
    exportData(format = 'csv') {
        if (!Array.isArray(this.currentData) || this.currentData.length === 0) {
            uiManager.showToast('No hay datos para exportar', 'warning');
            return;
        }

        try {
            uiManager.exportTableData(format);
        } catch (error) {
            console.error('Error exportando datos:', error);
            uiManager.showToast('Error al exportar datos', 'error');
        }
    }

    /**
     * Obtiene estadísticas de la aplicación
     * @returns {Object} - Estadísticas de la aplicación
     */
    getAppStats() {
        return {
            isInitialized: this.isInitialized,
            isProcessing: this.isProcessing,
            dataCount: this.currentData.length,
            hasMetrics: this.currentMetrics !== null,
            hasCharts: chartsManager.isChartsInitialized(),
            hasFilters: filtersManager.isFiltersInitialized(),
            hasUI: uiManager.isUIInitialized(),
            filterStats: filtersManager.getFilterStats(),
            cleaningStats: dataProcessor.getCleaningStats()
        };
    }

    /**
     * Reinicia la aplicación
     */
    reset() {
        console.log('Reiniciando aplicación...');
        
        // Limpiar datos
        this.clearData();
        
        // Resetear estado
        this.isProcessing = false;
        
        // Mostrar mensaje
        uiManager.showToast('Aplicación reiniciada', 'info');
    }

    /**
     * Obtiene información de la aplicación
     * @returns {Object} - Información de la aplicación
     */
    getAppInfo() {
        return {
            name: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            description: CONFIG.APP.DESCRIPTION,
            initialized: this.isInitialized,
            stats: this.getAppStats()
        };
    }

    /**
     * Maneja la recarga de datos
     */
    reloadData() {
        if (this.isProcessing) {
            uiManager.showToast('Ya se están procesando datos', 'warning');
            return;
        }

        // Limpiar datos actuales
        this.clearData();
        
        // Mostrar mensaje
        uiManager.showToast('Datos limpiados. Carga un nuevo archivo CSV.', 'info');
    }

    /**
     * Verifica el estado de la aplicación
     * @returns {boolean} - True si la aplicación está funcionando correctamente
     */
    isHealthy() {
        try {
            return (
                this.isInitialized &&
                uiManager.isUIInitialized() &&
                filtersManager.isFiltersInitialized() &&
                !this.isProcessing
            );
        } catch (error) {
            console.error('Error verificando salud de la aplicación:', error);
            return false;
        }
    }
}

// Crear instancia global de la aplicación
const app = new TechTrendsApp();

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(error => {
        console.error('Error crítico al inicializar la aplicación:', error);
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f8fafc;
                font-family: Inter, sans-serif;
            ">
                <div style="
                    text-align: center;
                    padding: 2rem;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                ">
                    <h1 style="color: #ef4444; margin-bottom: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error Crítico
                    </h1>
                    <p style="color: #6b7280; margin-bottom: 1rem;">
                        No se pudo inicializar la aplicación. Por favor, recarga la página.
                    </p>
                    <button onclick="location.reload()" style="
                        background: #2563eb;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 0.375rem;
                        cursor: pointer;
                    ">
                        Recargar Página
                    </button>
                </div>
            </div>
        `;
    });
});

// Exponer la aplicación globalmente para debugging
window.TechTrendsApp = app;
