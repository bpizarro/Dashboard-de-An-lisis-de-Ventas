/**
 * TechTrends Dashboard - Configuración Global
 *
 * Contiene constantes, configuraciones y utilidades globales.
 *
 * Glosario:
 * • CONFIG: objeto con toda la configuración de la app (columnas requeridas, colores, límites)
 * • UTILS: funciones auxiliares reutilizables (formatear moneda, fechas, validar, etc.)
 * • Constante: valor que no cambia durante la ejecución (ej: colores, límites de tamaño)
 * • Intl: API del navegador para formatear números/fechas según el idioma/región
 * • Normalizar: convertir texto a una forma estándar (quitar tildes, minúsculas) para comparar
 */

// Configuración global del dashboard
const CONFIG = {
    // Configuración de la aplicación
    APP: {
        NAME: 'TechTrends Dashboard',
        VERSION: '1.0.0',
        DESCRIPTION: 'Dashboard de Análisis de Ventas para TechTrends'
    },

    // Configuración de archivos CSV
    CSV: {
        REQUIRED_COLUMNS: [
            'ID_Transaccion',
            'Fecha',
            'ID_Producto',
            'Nombre_Producto',
            'Categoria',
            'Cantidad',
            'Precio_Unitario',
            'Total_Venta',
            'Pais',
            'Metodo_Pago'
        ],
        DELIMITER: ',',
        ENCODING: 'utf-8',
        MAX_FILE_SIZE: 30 * 1024 * 1024, // 30MB
        SUPPORTED_FORMATS: ['.csv']
    },

    // Configuración de gráficos
    CHARTS: {
        DEFAULT_COLORS: [
            '#2563eb', // Primary Blue
            '#10b981', // Success Green
            '#f59e0b', // Warning Orange
            '#ef4444', // Error Red
            '#8b5cf6', // Purple
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#f97316', // Orange
            '#ec4899', // Pink
            '#6366f1'  // Indigo
        ],
        GRADIENT_COLORS: [
            'rgba(37, 99, 235, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(132, 204, 22, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(99, 102, 241, 0.8)'
        ],
        DEFAULT_OPTIONS: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    intersect: false,
                    mode: 'index'
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif',
                            size: 11
                        },
                        color: '#6b7280'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif',
                            size: 11
                        },
                        color: '#6b7280'
                    }
                }
            }
        }
    },

    // Configuración de paginación
    PAGINATION: {
        DEFAULT_ROWS_PER_PAGE: 25,
        ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
        MAX_VISIBLE_PAGES: 5
    },

    // Configuración de filtros
    FILTERS: {
        DATE_FORMAT: 'YYYY-MM-DD',
        DEFAULT_DATE_RANGE: {
            START: null,
            END: null
        }
    },

    // Configuración de animaciones
    ANIMATIONS: {
        DURATION: {
            FAST: 150,
            NORMAL: 250,
            SLOW: 350
        },
        EASING: 'ease-in-out'
    },

    // Configuración de validación
    VALIDATION: {
        MIN_TRANSACTION_ID_LENGTH: 1,
        MIN_PRODUCT_NAME_LENGTH: 2,
        MIN_QUANTITY: 1,
        MIN_PRICE: 0.01,
        MAX_PRICE: 10000,
        VALID_COUNTRIES: ['México', 'Chile', 'Colombia', 'Perú', 'Argentina'],
        VALID_CATEGORIES: ['Audio', 'Periférico', 'Wearable', 'Accesorio'],
        VALID_PAYMENT_METHODS: ['Tarjeta', 'PayPal', 'Transferencia']
    },

    // Configuración de mensajes
    MESSAGES: {
        LOADING: {
            PROCESSING: 'Procesando datos...',
            LOADING_FILE: 'Cargando archivo...',
            CALCULATING_METRICS: 'Calculando métricas...',
            GENERATING_CHARTS: 'Generando gráficos...'
        },
        SUCCESS: {
            FILE_LOADED: 'Archivo cargado exitosamente',
            DATA_PROCESSED: 'Datos procesados correctamente',
            CHARTS_GENERATED: 'Gráficos generados exitosamente'
        },
        ERRORS: {
            FILE_NOT_SELECTED: 'Por favor selecciona un archivo CSV',
            INVALID_FILE_TYPE: 'El archivo debe ser un CSV válido',
            FILE_TOO_LARGE: 'El archivo es demasiado grande (máximo 30MB)',
            INVALID_CSV_FORMAT: 'El formato del archivo no es válido o faltan encabezados',
            MISSING_COLUMNS: 'Faltan columnas requeridas en el archivo',
            INVALID_DATA: 'Los datos contienen valores inválidos',
            PROCESSING_ERROR: 'Error al procesar los datos',
            CHART_ERROR: 'Error al generar los gráficos',
            NETWORK_ERROR: 'Error de conexión'
        }
    }
};

// Utilidades globales
const UTILS = {
    /**
     * Formatea un número como moneda
     * @param {number} amount - Cantidad a formatear
     * @param {string} currency - Código de moneda (default: 'USD')
     * @param {string} locale - Locale para formateo (default: 'es-MX')
     * @returns {string} - Cantidad formateada
     */
    formatCurrency: (amount, currency = 'USD', locale = 'es-MX') => {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '$0.00';
        }
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Formatea un número con separadores de miles
     * @param {number} number - Número a formatear
     * @param {string} locale - Locale para formateo (default: 'es-MX')
     * @returns {string} - Número formateado
     */
    formatNumber: (number, locale = 'es-MX') => {
        if (typeof number !== 'number' || isNaN(number)) {
            return '0';
        }
        
        return new Intl.NumberFormat(locale).format(number);
    },

    /**
     * Formatea una fecha
     * @param {Date|string} date - Fecha a formatear
     * @param {string} locale - Locale para formateo (default: 'es-MX')
     * @param {object} options - Opciones de formateo
     * @returns {string} - Fecha formateada
     */
    formatDate: (date, locale = 'es-MX', options = {}) => {
        if (!date) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    },

    /**
     * Formatea una fecha para input de tipo date
     * @param {Date|string} date - Fecha a formatear
     * @returns {string} - Fecha en formato YYYY-MM-DD
     */
    formatDateForInput: (date) => {
        if (!date) return '';
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    },

    /**
     * Calcula el porcentaje de un valor respecto a un total
     * @param {number} value - Valor
     * @param {number} total - Total
     * @param {number} decimals - Número de decimales (default: 1)
     * @returns {number} - Porcentaje calculado
     */
    calculatePercentage: (value, total, decimals = 1) => {
        if (total === 0) return 0;
        return Number(((value / total) * 100).toFixed(decimals));
    },

    /**
     * Genera un color aleatorio de la paleta
     * @param {number} index - Índice para seleccionar color
     * @returns {string} - Color hexadecimal
     */
    getColor: (index = 0) => {
        const colors = CONFIG.CHARTS.DEFAULT_COLORS;
        return colors[index % colors.length];
    },

    /**
     * Genera un gradiente de color
     * @param {number} index - Índice para seleccionar color
     * @returns {string} - Color con transparencia
     */
    getGradientColor: (index = 0) => {
        const colors = CONFIG.CHARTS.GRADIENT_COLORS;
        return colors[index % colors.length];
    },

    /**
     * Debounce function para optimizar eventos
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función con debounce
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function para optimizar eventos
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function} - Función con throttle
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Valida si un email es válido
     * @param {string} email - Email a validar
     * @returns {boolean} - True si es válido
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Valida si una fecha es válida
     * @param {Date|string} date - Fecha a validar
     * @returns {boolean} - True si es válida
     */
    isValidDate: (date) => {
        if (!date) return false;
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj instanceof Date && !isNaN(dateObj.getTime());
        } catch (error) {
            return false;
        }
    },

    /**
     * Obtiene el nombre del mes en español
     * @param {number} monthIndex - Índice del mes (0-11)
     * @returns {string} - Nombre del mes
     */
    getMonthName: (monthIndex) => {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[monthIndex] || '';
    },

    /**
     * Obtiene el nombre abreviado del mes en español
     * @param {number} monthIndex - Índice del mes (0-11)
     * @returns {string} - Nombre abreviado del mes
     */
    getShortMonthName: (monthIndex) => {
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        return months[monthIndex] || '';
    },

    /**
     * Genera un ID único
     * @param {string} prefix - Prefijo para el ID
     * @returns {string} - ID único generado
     */
    generateId: (prefix = 'id') => {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>} - True si se copió exitosamente
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    },

    /**
     * Normaliza texto para comparaciones (remueve acentos y baja a minúsculas)
     * 
     * PROBLEMA QUE RESUELVE:
     * Queremos que "México", "MÉXICO", "mexico", "Mexico" se consideren iguales.
     * Pero JavaScript por defecto los ve como diferentes ('M' ≠ 'm', 'é' ≠ 'e').
     * 
     * SOLUCIÓN:
     * 1. Convertir todo a minúsculas: "MÉXICO" → "méxico"
     * 2. Remover acentos/tildes usando Unicode NFD: "méxico" → "mexico"
     * 
     * UNICODE NFD (Normalization Form Decomposed):
     * Separa los caracteres acentuados en:
     * - Letra base: 'e'
     * - Marca diacrítica (acento): '́'
     * Luego podemos filtrar solo las marcas diacríticas (U+0300 a U+036F).
     * 
     * EJEMPLO PASO A PASO:
     * "México" → lowercase → "méxico" 
     *          → NFD → "me\u0301xico" (nota la 'e' + marca de acento separadas)
     *          → remove diacritics → "mexico"
     * 
     * POR QUÉ TRY-CATCH:
     * En navegadores muy viejos, normalize() puede no existir.
     * El fallback solo baja a minúsculas (mejor que nada).
     * 
     * @param {string} text - Texto a normalizar
     * @returns {string} - Texto sin acentos y en minúsculas
     */
    normalizeText: (text) => {
        if (text === null || text === undefined) return '';
        try {
            // Convertir a string, quitar espacios de inicio/fin, bajar a minúsculas
            const lowered = text.toString().trim().toLowerCase();
            
            // Descomponer caracteres Unicode (separar letras de acentos)
            const nfd = lowered.normalize('NFD');
            
            // Remover todos los diacríticos (acentos, tildes, diéresis, etc.)
            // [\u0300-\u036f] = rango Unicode de "Combining Diacritical Marks"
            return nfd.replace(/[\u0300-\u036f]/g, '');
        } catch (e) {
            // Fallback para navegadores antiguos
            return (text + '').toLowerCase();
        }
    },

    /**
     * Busca el valor canónico dentro de una lista permitida de forma insensible a acentos/caso
     * 
     * QUÉ ES "CANÓNICO":
     * La versión "oficial" o "estándar" de un valor.
     * Ejemplo: En nuestra lista tenemos "México" (con tilde).
     * Esa es la versión canónica.
     * 
     * PROBLEMA:
     * El usuario puede escribir: "mexico", "MÉXICO", "Mexico"
     * Todos deberían aceptarse, pero queremos guardar la versión oficial: "México"
     * 
     * CÓMO FUNCIONA:
     * 1. Normalizamos el valor que nos dieron: "MÉXICO" → "mexico"
     * 2. Normalizamos cada elemento de la lista válida: "México" → "mexico"
     * 3. Comparamos las versiones normalizadas
     * 4. Si coinciden, devolvemos el valor ORIGINAL de la lista (no el normalizado)
     * 
     * EJEMPLO:
     * validList = ['México', 'Chile', 'Perú']
     * value = "mexico" (usuario escribió sin tilde)
     * 
     * Proceso:
     * - normalizeText("mexico") → "mexico"
     * - normalizeText("México") → "mexico" ← ¡Coinciden!
     * - Devolver "México" (la versión canónica con tilde)
     * 
     * POR QUÉ DEVOLVER null SI NO COINCIDE:
     * null indica claramente "no encontrado", lo que permite distinguir entre:
     * - Encontrado: "México"
     * - No encontrado: null
     * - NO usar "" o undefined que pueden causar confusión
     * 
     * @param {Array<string>} validList - Lista de valores permitidos (versiones canónicas)
     * @param {string} value - Valor a buscar (puede tener variaciones de mayúsculas/tildes)
     * @returns {string|null} - Valor canónico si coincide, null si no se encuentra
     */
    findCanonical: (validList, value) => {
        // VALIDACIÓN TEMPRANA: Si no hay lista o no hay valor, no podemos buscar
        if (!Array.isArray(validList) || !value) return null;
        
        // Normalizar el valor que buscamos UNA SOLA VEZ
        // (optimización: no normalizar dentro del loop)
        const target = UTILS.normalizeText(value);
        
        // Buscar en la lista
        for (const v of validList) {
            // Comparar la versión normalizada del valor de la lista
            // con la versión normalizada de lo que buscamos
            if (UTILS.normalizeText(v) === target) {
                // ¡Encontrado! Devolver el valor ORIGINAL de la lista (canónico)
                return v;
            }
        }
        
        // No se encontró ninguna coincidencia
        return null;
    },

    /**
     * Descarga un archivo
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} mimeType - Tipo MIME del archivo
     */
    downloadFile: (content, filename, mimeType = 'text/plain') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Exportar configuración para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UTILS };
}
