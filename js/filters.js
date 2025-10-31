/**
 * TechTrends Dashboard - Sistema de Filtros
 *
 * Guía rápida:
 * - Mantiene el estado de filtros (fechas, producto, país, categoría, método)
 * - Escucha cambios en inputs/selects y recalcula los datos filtrados
 * - Notifica a la App para que actualice KPIs, gráficos y tabla
 *
 * Entrada: datos originales + eventos del DOM.
 * Salida: datos filtrados y estadísticas de filtros.
 *
 * Glosario:
 * • Filtro: criterio para mostrar solo un subconjunto de datos (ej: solo ventas de México)
 * • Event listener: código que "escucha" cuando el usuario cambia un input o hace clic
 * • Debounce: retrasar la ejecución para no procesar cada tecla (espera a que dejes de escribir)
 * • Select: lista desplegable (<select> en HTML) con opciones únicas del CSV
 */

class FiltersManager {
    constructor() {
        this.filters = {
            startDate: null,
            endDate: null,
            product: '',
            country: '',
            category: '',
            paymentMethod: ''
        };
        
        this.originalData = [];
        this.filteredData = [];
        this.onFiltersChanged = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa el sistema de filtros
     * @param {Array<Object>} data - Datos originales
     * @param {Function} onFiltersChanged - Callback cuando cambian los filtros
     */
    initialize(data, onFiltersChanged) {
        this.originalData = data;
        this.filteredData = [...data];
        this.onFiltersChanged = onFiltersChanged;
        
        this.setupEventListeners();
        this.populateFilterOptions();
        this.setDefaultDateRange();
        
        this.isInitialized = true;
        console.log('Sistema de filtros inicializado');
    }

    /**
     * Configura los event listeners para los filtros
     */
    setupEventListeners() {
        // Filtros de fecha
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom) {
            dateFrom.addEventListener('change', (event) => {
                this.filters.startDate = event.target.value;
                this.applyFilters();
            });
        }
        
        if (dateTo) {
            dateTo.addEventListener('change', (event) => {
                this.filters.endDate = event.target.value;
                this.applyFilters();
            });
        }

        // Filtro de producto
        const productFilter = document.getElementById('productFilter');
        if (productFilter) {
            productFilter.addEventListener('change', (event) => {
                this.filters.product = event.target.value;
                this.applyFilters();
            });
        }

        // Filtro de país
        const countryFilter = document.getElementById('countryFilter');
        if (countryFilter) {
            countryFilter.addEventListener('change', (event) => {
                this.filters.country = event.target.value;
                this.applyFilters();
            });
        }

        // Filtro de categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (event) => {
                this.filters.category = event.target.value;
                this.applyFilters();
            });
        }

        // Botón de reset
        const resetButton = document.getElementById('resetFilters');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Debounce para búsqueda en tabla
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = UTILS.debounce((event) => {
                this.handleSearch(event.target.value);
            }, 300);
            
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Cambio de filas por página
        const rowsPerPage = document.getElementById('rowsPerPage');
        if (rowsPerPage) {
            rowsPerPage.addEventListener('change', (event) => {
                this.handleRowsPerPageChange(parseInt(event.target.value));
            });
        }
    }

    /**
     * Pobla las opciones de los filtros con datos únicos
     */
    populateFilterOptions() {
        if (!Array.isArray(this.originalData) || this.originalData.length === 0) {
            return;
        }

        // Obtener valores únicos
        const uniqueProducts = dataProcessor.getUniqueValues(this.originalData, 'Nombre_Producto');
        const uniqueCountries = dataProcessor.getUniqueValues(this.originalData, 'Pais');
        const uniqueCategories = dataProcessor.getUniqueValues(this.originalData, 'Categoria');
        const uniquePaymentMethods = dataProcessor.getUniqueValues(this.originalData, 'Metodo_Pago');

        // Poblar filtro de productos
        this.populateSelect('productFilter', uniqueProducts);
        
        // Poblar filtro de países
        this.populateSelect('countryFilter', uniqueCountries);
        
        // Poblar filtro de categorías
        this.populateSelect('categoryFilter', uniqueCategories);
    }

    /**
     * Pobla un elemento select con opciones
     * @param {string} selectId - ID del select
     * @param {Array<string>} options - Opciones a agregar
     */
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Agregar nuevas opciones
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    /**
     * Establece el rango de fechas por defecto
     */
    setDefaultDateRange() {
        if (!Array.isArray(this.originalData) || this.originalData.length === 0) {
            return;
        }

        // Encontrar fechas mínima y máxima
        const dates = this.originalData.map(row => new Date(row.Fecha));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Establecer valores por defecto
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom) {
            dateFrom.min = UTILS.formatDateForInput(minDate);
            dateFrom.max = UTILS.formatDateForInput(maxDate);
        }
        
        if (dateTo) {
            dateTo.min = UTILS.formatDateForInput(minDate);
            dateTo.max = UTILS.formatDateForInput(maxDate);
        }
    }

    /**
     * Aplica todos los filtros activos
     */
    applyFilters() {
        if (!this.isInitialized) return;

        console.log('Aplicando filtros:', this.filters);

        // Filtrar datos
        this.filteredData = dataProcessor.filterData(this.originalData, this.filters);

        // Notificar cambio de filtros
        if (this.onFiltersChanged) {
            this.onFiltersChanged(this.filteredData, this.filters);
        }

        // Actualizar contador de resultados
        this.updateResultsCount();
    }

    /**
     * Filtra datos por rango de fechas
     * @param {Array<Object>} data - Datos a filtrar
     * @param {string} startDate - Fecha de inicio
     * @param {string} endDate - Fecha de fin
     * @returns {Array<Object>} - Datos filtrados
     */
    filterByDateRange(data, startDate, endDate) {
        if (!startDate && !endDate) return data;

        return data.filter(row => {
            const rowDate = new Date(row.Fecha);
            
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return rowDate >= start && rowDate <= end;
            } else if (startDate) {
                const start = new Date(startDate);
                return rowDate >= start;
            } else if (endDate) {
                const end = new Date(endDate);
                return rowDate <= end;
            }
            
            return true;
        });
    }

    /**
     * Filtra datos por producto
     * @param {Array<Object>} data - Datos a filtrar
     * @param {string} product - Producto a filtrar
     * @returns {Array<Object>} - Datos filtrados
     */
    filterByProduct(data, product) {
        if (!product) return data;
        
        return data.filter(row => 
            row.Nombre_Producto === product || row.ID_Producto === product
        );
    }

    /**
     * Filtra datos por país
     * @param {Array<Object>} data - Datos a filtrar
     * @param {string} country - País a filtrar
     * @returns {Array<Object>} - Datos filtrados
     */
    filterByCountry(data, country) {
        if (!country) return data;
        
        return data.filter(row => row.Pais === country);
    }

    /**
     * Filtra datos por categoría
     * @param {Array<Object>} data - Datos a filtrar
     * @param {string} category - Categoría a filtrar
     * @returns {Array<Object>} - Datos filtrados
     */
    filterByCategory(data, category) {
        if (!category) return data;
        
        return data.filter(row => row.Categoria === category);
    }

    /**
     * Filtra datos por método de pago
     * @param {Array<Object>} data - Datos a filtrar
     * @param {string} paymentMethod - Método de pago a filtrar
     * @returns {Array<Object>} - Datos filtrados
     */
    filterByPaymentMethod(data, paymentMethod) {
        if (!paymentMethod) return data;
        
        return data.filter(row => row.Metodo_Pago === paymentMethod);
    }

    /**
     * Resetea todos los filtros
     */
    resetFilters() {
        console.log('Reseteando filtros...');

        // Limpiar valores de filtros
        this.filters = {
            startDate: null,
            endDate: null,
            product: '',
            country: '',
            category: '',
            paymentMethod: ''
        };

        // Limpiar inputs
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const productFilter = document.getElementById('productFilter');
        const countryFilter = document.getElementById('countryFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (productFilter) productFilter.value = '';
        if (countryFilter) countryFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';

        // Limpiar búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        // Restaurar datos originales
        this.filteredData = [...this.originalData];

        // Aplicar filtros (que ahora están vacíos)
        this.applyFilters();
    }

    /**
     * Obtiene los filtros activos
     * @returns {Object} - Filtros activos
     */
    getActiveFilters() {
        return { ...this.filters };
    }

    /**
     * Obtiene los datos filtrados
     * @returns {Array<Object>} - Datos filtrados
     */
    getFilteredData() {
        return [...this.filteredData];
    }

    /**
     * Obtiene los datos originales
     * @returns {Array<Object>} - Datos originales
     */
    getOriginalData() {
        return [...this.originalData];
    }

    /**
     * Actualiza los datos originales
     * @param {Array<Object>} newData - Nuevos datos
     */
    updateOriginalData(newData) {
        this.originalData = newData;
        this.filteredData = [...newData];
        this.populateFilterOptions();
        this.setDefaultDateRange();
        this.applyFilters();
    }

    /**
     * Maneja la búsqueda en la tabla
     * @param {string} searchTerm - Término de búsqueda
     */
    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.applyFilters();
            return;
        }

        const filteredBySearch = this.filteredData.filter(row => {
            const searchLower = searchTerm.toLowerCase();
            return (
                row.ID_Transaccion.toLowerCase().includes(searchLower) ||
                row.Nombre_Producto.toLowerCase().includes(searchLower) ||
                row.Categoria.toLowerCase().includes(searchLower) ||
                row.Pais.toLowerCase().includes(searchLower) ||
                row.Metodo_Pago.toLowerCase().includes(searchLower)
            );
        });

        // Notificar cambio con datos filtrados por búsqueda
        if (this.onFiltersChanged) {
            this.onFiltersChanged(filteredBySearch, this.filters);
        }
    }

    /**
     * Maneja el cambio de filas por página
     * @param {number} rowsPerPage - Número de filas por página
     */
    handleRowsPerPageChange(rowsPerPage) {
        // Esta funcionalidad se manejará en el UI manager
        console.log(`Cambiando a ${rowsPerPage} filas por página`);
    }

    /**
     * Actualiza el contador de resultados
     */
    updateResultsCount() {
        const totalResults = this.originalData.length;
        const filteredResults = this.filteredData.length;
        
        // Crear o actualizar elemento de contador
        let counterElement = document.getElementById('resultsCounter');
        if (!counterElement) {
            counterElement = document.createElement('div');
            counterElement.id = 'resultsCounter';
            counterElement.className = 'results-counter';
            
            // Insertar después del título de la sección de filtros
            const filtersSection = document.querySelector('.filters-section');
            if (filtersSection) {
                const sectionTitle = filtersSection.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.insertAdjacentElement('afterend', counterElement);
                }
            }
        }

        if (filteredResults === totalResults) {
            counterElement.textContent = `Mostrando ${UTILS.formatNumber(totalResults)} resultados`;
        } else {
            counterElement.textContent = `Mostrando ${UTILS.formatNumber(filteredResults)} de ${UTILS.formatNumber(totalResults)} resultados`;
        }
    }

    /**
     * Obtiene estadísticas de filtros
     * @returns {Object} - Estadísticas de filtros
     */
    getFilterStats() {
        const activeFilters = Object.values(this.filters).filter(value => 
            value !== null && value !== '' && value !== undefined
        ).length;

        return {
            totalFilters: Object.keys(this.filters).length,
            activeFilters,
            originalDataCount: this.originalData.length,
            filteredDataCount: this.filteredData.length,
            reductionPercentage: this.originalData.length > 0 
                ? UTILS.calculatePercentage(
                    this.originalData.length - this.filteredData.length,
                    this.originalData.length
                  )
                : 0
        };
    }

    /**
     * Exporta los filtros actuales
     * @returns {Object} - Configuración de filtros
     */
    exportFilters() {
        return {
            filters: { ...this.filters },
            stats: this.getFilterStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Importa una configuración de filtros
     * @param {Object} filterConfig - Configuración de filtros
     */
    importFilters(filterConfig) {
        if (!filterConfig || !filterConfig.filters) {
            console.error('Configuración de filtros inválida');
            return;
        }

        this.filters = { ...filterConfig.filters };
        
        // Aplicar filtros a los inputs
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const productFilter = document.getElementById('productFilter');
        const countryFilter = document.getElementById('countryFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (dateFrom) dateFrom.value = this.filters.startDate || '';
        if (dateTo) dateTo.value = this.filters.endDate || '';
        if (productFilter) productFilter.value = this.filters.product || '';
        if (countryFilter) countryFilter.value = this.filters.country || '';
        if (categoryFilter) categoryFilter.value = this.filters.category || '';

        this.applyFilters();
    }

    /**
     * Verifica si hay filtros activos
     * @returns {boolean} - True si hay filtros activos
     */
    hasActiveFilters() {
        return Object.values(this.filters).some(value => 
            value !== null && value !== '' && value !== undefined
        );
    }

    /**
     * Obtiene el estado de inicialización
     * @returns {boolean} - True si está inicializado
     */
    isFiltersInitialized() {
        return this.isInitialized;
    }
}

// Crear instancia global del gestor de filtros
const filtersManager = new FiltersManager();
