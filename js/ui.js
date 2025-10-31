/**
 * TechTrends Dashboard - Interfaz de Usuario (UI Manager)
 *
 * Guía rápida:
 * - Esta clase se encarga SOLO de pintar cosas en pantalla (HTML/CSS)
 * - No calcula métricas ni filtra datos; eso lo hacen otros módulos
 * - Aquí leemos elementos del DOM, les ponemos texto y creamos filas/botones
 *
 * Glosario:
 * • UI Manager: módulo que maneja la interfaz de usuario (actualiza lo que ves)
 * • DOM: Document Object Model, el árbol de elementos HTML que forma la página
 * • KPI: Key Performance Indicator, métrica principal (ej: ventas totales)
 * • Callback: función que pasas a otra para que la llame cuando termine algo
 * • Fragment: contenedor temporal para crear muchos elementos sin redibujar la página cada vez
 */

class UIManager {
    constructor() {
        // Guardamos la última “foto” de datos que la UI está mostrando
        this.currentData = [];
        // Últimas métricas calculadas (para las tarjetas y gráficos)
        this.currentMetrics = null;
        // Estado de la tabla (paginación)
        this.currentPage = 1;
        this.rowsPerPage = CONFIG.PAGINATION.DEFAULT_ROWS_PER_PAGE;
        // Bandera para saber si ya conectamos los eventos del DOM
        this.isInitialized = false;
    }

    /**
     * Inicializa el gestor de interfaz
     */
    initialize() {
        // Vincular eventos (selects, botones, etc.)
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('UI Manager inicializado');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Cambio de filas por página
        const rowsPerPageSelect = document.getElementById('rowsPerPage');
        if (rowsPerPageSelect) {
            // Cuando el usuario cambia “10, 25, 50…” volvemos a dibujar la tabla
            rowsPerPageSelect.addEventListener('change', (event) => {
                this.rowsPerPage = parseInt(event.target.value);
                this.currentPage = 1;
                this.updateDataTable();
            });
        }
    }

    /**
     * Actualiza el dashboard completo
     * @param {Array<Object>} data - Datos filtrados
     * @param {Object} metrics - Métricas calculadas
     */
    updateDashboard(data, metrics) {
    this.currentData = data;     // lo que se va a ver en la tabla
    this.currentMetrics = metrics; // números que van en KPIs/gráficos

        // Actualizar KPIs
        this.updateKPIs(metrics.kpis);

        // Actualizar gráficos
        chartsManager.updateChartsWithFilters(metrics);

    // Actualizar tabla de datos (paginada)
        this.updateDataTable();

        console.log('Dashboard actualizado');
    }

    /**
     * Actualiza las tarjetas de KPIs
     * @param {Object} kpis - KPIs calculados
     */
    updateKPIs(kpis) {
        if (!kpis) return;

        // Actualizar ventas totales
        this.updateKPICard('totalSales', kpis.totalSales.formatted);

        // Actualizar transacciones totales
        this.updateKPICard('totalTransactions', kpis.totalTransactions.formatted);

        // Actualizar ticket promedio
        this.updateKPICard('averageTicket', kpis.averageTicket.formatted);

        // Actualizar productos vendidos
        this.updateKPICard('totalProducts', kpis.totalProducts.formatted);
    }

    /**
     * Actualiza una tarjeta de KPI específica
     * @param {string} elementId - ID del elemento
     * @param {string} value - Valor a mostrar
     */
    updateKPICard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            
            // Agregar animación
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    /**
     * Actualiza la tabla de datos
     */
    updateDataTable() {
        if (!Array.isArray(this.currentData) || this.currentData.length === 0) {
            this.clearDataTable();
            return;
        }

    // Calcular paginación (qué parte del array mostramos)
        const totalPages = Math.ceil(this.currentData.length / this.rowsPerPage);
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = Math.min(startIndex + this.rowsPerPage, this.currentData.length);
        const pageData = this.currentData.slice(startIndex, endIndex);

        // Actualizar contenido de la tabla
        this.populateDataTable(pageData);

        // Actualizar paginación
        this.updatePagination(totalPages);

        // Actualizar información de resultados
        this.updateTableInfo(startIndex, endIndex, this.currentData.length);
    }

    /**
     * Pobla la tabla con datos
     * @param {Array<Object>} data - Datos a mostrar
     */
    populateDataTable(data) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        // Limpiar contenido existente
        tbody.innerHTML = '';

        // Crear filas (usamos un DocumentFragment para performance)
        const fragment = document.createDocumentFragment();
        data.forEach((row) => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            tdId.textContent = row.ID_Transaccion ?? '';
            tr.appendChild(tdId);

            const tdFecha = document.createElement('td');
            tdFecha.textContent = row.FechaFormateada ?? '';
            tr.appendChild(tdFecha);

            const tdProducto = document.createElement('td');
            tdProducto.textContent = row.Nombre_Producto ?? '';
            tr.appendChild(tdProducto);

            const tdCategoria = document.createElement('td');
            // Pequeña “etiqueta” visual para categoría
            const catBadge = document.createElement('span');
            catBadge.className = 'badge primary';
            catBadge.textContent = row.Categoria ?? '';
            tdCategoria.appendChild(catBadge);
            tr.appendChild(tdCategoria);

            const tdCantidad = document.createElement('td');
            tdCantidad.textContent = UTILS.formatNumber(row.Cantidad ?? 0);
            tr.appendChild(tdCantidad);

            const tdPrecio = document.createElement('td');
            tdPrecio.textContent = row.PrecioFormateado ?? '';
            tr.appendChild(tdPrecio);

            const tdTotal = document.createElement('td');
            tdTotal.textContent = row.TotalFormateado ?? '';
            tr.appendChild(tdTotal);

            const tdPais = document.createElement('td');
            tdPais.textContent = row.Pais ?? '';
            tr.appendChild(tdPais);

            const tdMetodo = document.createElement('td');
            // Y otra etiqueta para método de pago
            const payBadge = document.createElement('span');
            payBadge.className = 'badge secondary';
            payBadge.textContent = row.Metodo_Pago ?? '';
            tdMetodo.appendChild(payBadge);
            tr.appendChild(tdMetodo);

            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
    }

    /**
     * Limpia la tabla de datos
     */
    clearDataTable() {
        const tbody = document.getElementById('tableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay datos para mostrar</td></tr>';
        }

        // Limpiar paginación
        const pagination = document.getElementById('tablePagination');
        if (pagination) {
            pagination.innerHTML = '';
        }
    }

    /**
     * Actualiza la paginación
     * @param {number} totalPages - Total de páginas
     */
    updatePagination(totalPages) {
        const pagination = document.getElementById('tablePagination');
        if (!pagination) return;

        // Limpiar paginación existente
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Botón “Anterior”
        const prevButton = this.createPaginationButton(
            'Anterior',
            this.currentPage > 1,
            () => this.goToPage(this.currentPage - 1)
        );
        pagination.appendChild(prevButton);

        // Números de página
        const startPage = Math.max(1, this.currentPage - Math.floor(CONFIG.PAGINATION.MAX_VISIBLE_PAGES / 2));
        const endPage = Math.min(totalPages, startPage + CONFIG.PAGINATION.MAX_VISIBLE_PAGES - 1);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = this.createPaginationButton(
                i.toString(),
                true,
                () => this.goToPage(i),
                i === this.currentPage
            );
            pagination.appendChild(pageButton);
        }

        // Botón “Siguiente”
        const nextButton = this.createPaginationButton(
            'Siguiente',
            this.currentPage < totalPages,
            () => this.goToPage(this.currentPage + 1)
        );
        pagination.appendChild(nextButton);
    }

    /**
     * Crea un botón de paginación
     * @param {string} text - Texto del botón
     * @param {boolean} enabled - Si está habilitado
     * @param {Function} onClick - Función de click
     * @param {boolean} active - Si está activo
     * @returns {HTMLElement} - Elemento del botón
     */
    createPaginationButton(text, enabled, onClick, active = false) {
        const button = document.createElement('button');
        button.className = `pagination-button ${active ? 'active' : ''}`;
        button.textContent = text;
        button.disabled = !enabled;
        
        if (enabled) {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    /**
     * Va a una página específica
     * @param {number} page - Número de página
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.currentData.length / this.rowsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDataTable();
            
            // Scroll suave a la tabla
            const tableSection = document.querySelector('.table-section');
            if (tableSection) {
                tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /**
     * Actualiza la información de la tabla
     * @param {number} startIndex - Índice de inicio
     * @param {number} endIndex - Índice de fin
     * @param {number} totalItems - Total de elementos
     */
    updateTableInfo(startIndex, endIndex, totalItems) {
        // Crear o actualizar elemento de información
        let infoElement = document.getElementById('tableInfo');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'tableInfo';
            infoElement.className = 'table-info';
            
            // Insertar antes de la tabla
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.insertAdjacentElement('beforebegin', infoElement);
            }
        }

        infoElement.textContent = `Mostrando ${UTILS.formatNumber(startIndex + 1)}-${UTILS.formatNumber(endIndex)} de ${UTILS.formatNumber(totalItems)} resultados`;
    }

    /**
     * Muestra el estado de carga
     */
    showLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }

        // Ocultar dashboard
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.style.display = 'none';
        }
    }

    /**
     * Oculta el estado de carga
     */
    hideLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }

        // Mostrar dashboard
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.style.display = 'block';
        }
    }

    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message ?? '';
            errorContainer.style.display = 'block';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    /**
     * Oculta el mensaje de error
     */
    hideError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    /**
     * Configura el event listener para cerrar errores
     */
    setupErrorCloseListener() {
        const errorClose = document.getElementById('errorClose');
        if (errorClose) {
            errorClose.addEventListener('click', () => {
                this.hideError();
            });
        }
    }

    /**
     * Exporta los datos de la tabla actual
     * @param {string} format - Formato de exportación ('csv', 'json')
     */
    exportTableData(format = 'csv') {
        if (!Array.isArray(this.currentData) || this.currentData.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }

        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `techtrends_data_${timestamp}`;

            if (format === 'csv') {
                this.exportToCSV(this.currentData, filename);
            } else if (format === 'json') {
                this.exportToJSON(this.currentData, filename);
            }
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.showError('Error al exportar los datos');
        }
    }

    /**
     * Exporta datos a CSV
     * @param {Array<Object>} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    exportToCSV(data, filename) {
        const headers = [
            'ID_Transaccion',
            'Fecha',
            'Nombre_Producto',
            'Categoria',
            'Cantidad',
            'Precio_Unitario',
            'Total_Venta',
            'Pais',
            'Metodo_Pago'
        ];

        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Escapar comillas y envolver en comillas si contiene comas
                    return value.toString().includes(',') ? `"${value.toString().replace(/"/g, '""')}"` : value;
                }).join(',')
            )
        ].join('\n');

        UTILS.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    /**
     * Exporta datos a JSON
     * @param {Array<Object>} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        UTILS.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    /**
     * Actualiza el título de la página
     * @param {string} title - Nuevo título
     */
    updatePageTitle(title) {
        document.title = `${title} - ${CONFIG.APP.NAME}`;
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación ('success', 'error', 'info', 'warning')
     */
    showToast(message, type = 'info') {
    // Crear elemento base del toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const content = document.createElement('div');
        content.className = 'toast-content';

    // Icono a la izquierda del texto
    const icon = document.createElement('i');
        icon.className = `fas fa-${this.getToastIcon(type)}`;

        const text = document.createElement('span');
        text.textContent = message ?? '';

    // Botón para cerrar manualmente
    const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeBtn.appendChild(closeIcon);

        content.appendChild(icon);
        content.appendChild(text);
        content.appendChild(closeBtn);
        toast.appendChild(content);

        // Agregar estilos inline sencillos (podrían ir en CSS)
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--white);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            padding: var(--spacing-4);
            z-index: 1000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform var(--transition-normal);
        `;

        // Agregar al DOM
        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Configurar cierre
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Auto-ocultar después de 3 segundos (para que no estorbe)
        setTimeout(() => {
            this.hideToast(toast);
        }, 3000);
    }

    /**
     * Oculta una notificación toast
     * @param {HTMLElement} toast - Elemento toast
     */
    hideToast(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Obtiene el icono para el tipo de toast
     * @param {string} type - Tipo de toast
     * @returns {string} - Nombre del icono
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Obtiene el estado de inicialización
     * @returns {boolean} - True si está inicializado
     */
    isUIInitialized() {
        return this.isInitialized;
    }

    /**
     * Obtiene los datos actuales
     * @returns {Array<Object>} - Datos actuales
     */
    getCurrentData() {
        return [...this.currentData];
    }

    /**
     * Obtiene las métricas actuales
     * @returns {Object} - Métricas actuales
     */
    getCurrentMetrics() {
        return this.currentMetrics ? { ...this.currentMetrics } : null;
    }
}

// Crear instancia global del gestor de UI
const uiManager = new UIManager();
