/**
 * TechTrends Dashboard - Procesador de Datos
 *
 * Guía rápida:
 * - Limpia datos de texto (espacios, saltos, comillas) y normaliza vacíos
 * - Valida campos obligatorios y coherencia (categoría/país/método válidos, cantidad×precio≈total)
 * - Convierte tipos (fecha/números) y agrega campos derivados (Mes, Año, formatos)
 *
 * Entrada: filas crudas del CSV (objetos con strings).
 * Salida: filas listas para métricas y gráficos (tipadas y formateadas).
 *
 * Glosario:
 * • Validación: verificar que los datos cumplan reglas (ej: fechas válidas, números positivos)
 * • Canonicalización: convertir variaciones ("MÉXICO", "mexico") a una forma estándar ("México")
 * • Tipo (type): naturaleza del dato (string, number, Date); JS acepta todo como texto en CSV
 * • Campo derivado: valor calculado a partir de otros (ej: Mes extraído de Fecha)
 * • Tolerancia: margen de error aceptable en comparaciones numéricas (ej: ±2 centavos)
 */

class DataProcessor {
    constructor() {
        this.processedData = [];
        this.validationErrors = [];
        this.errorSummary = {
            idTransaccion: 0,
            fecha: 0,
            idProducto: 0,
            nombreProducto: 0,
            categoria: 0,
            cantidad: 0,
            precioUnitario: 0,
            totalVenta: 0,
            pais: 0,
            metodoPago: 0,
            totalConsistencia: 0
        };
        this.cleaningStats = {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            cleanedFields: 0,
            convertedDates: 0,
            convertedNumbers: 0
        };
    }

    /**
     * Procesa los datos raw del CSV
     * @param {Array<Object>} rawData - Datos raw del CSV
     * @returns {Array<Object>} - Datos procesados y validados
     */
    processData(rawData) {
        this.resetStats();
        
        if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('No hay datos para procesar');
        }

        this.cleaningStats.totalRows = rawData.length;
        
        console.log(`Procesando ${rawData.length} filas de datos...`);

        // Procesar cada fila
        this.processedData = rawData.map((row, index) => {
            try {
                return this.processRow(row, index);
            } catch (error) {
                console.warn(`Error procesando fila ${index + 1}:`, error);
                this.cleaningStats.invalidRows++;
                this.validationErrors.push({
                    row: index + 1,
                    error: error.message,
                    data: row
                });
                return null;
            }
        }).filter(row => row !== null);

        this.cleaningStats.validRows = this.processedData.length;
        this.cleaningStats.invalidRows = this.cleaningStats.totalRows - this.cleaningStats.validRows;

        console.log('Procesamiento completado:', this.cleaningStats);
        
        return this.processedData;
    }

    /**
     * Procesa una fila individual
     * @param {Object} row - Fila de datos
     * @param {number} index - Índice de la fila
     * @returns {Object} - Fila procesada
     */
    processRow(row, index) {
        if (!row || typeof row !== 'object') {
            throw new Error('Fila inválida: no es un objeto');
        }

        // Limpiar datos
        const cleanedRow = this.cleanData(row);
        
        // Validar datos
        this.validateRow(cleanedRow, index);
        
        // Convertir tipos de datos
        const convertedRow = this.convertTypes(cleanedRow);
        
        return convertedRow;
    }

    /**
     * Limpia los datos de una fila
     * @param {Object} row - Fila de datos
     * @returns {Object} - Fila limpia
     */
    cleanData(row) {
        const cleanedRow = {};
        
        for (const [key, value] of Object.entries(row)) {
            if (value === null || value === undefined) {
                cleanedRow[key] = '';
                this.cleaningStats.cleanedFields++;
                continue;
            }

            // Convertir a string y limpiar
            let cleanedValue = value.toString().trim();
            
            // Remover caracteres especiales problemáticos
            cleanedValue = cleanedValue.replace(/[\r\n\t]/g, ' ');
            
            // Normalizar espacios múltiples
            cleanedValue = cleanedValue.replace(/\s+/g, ' ');
            
            // Limpiar comillas extra
            cleanedValue = cleanedValue.replace(/^["']|["']$/g, '');
            
            cleanedRow[key] = cleanedValue;
            
            if (cleanedValue !== value.toString()) {
                this.cleaningStats.cleanedFields++;
            }
        }

        return cleanedRow;
    }

    /**
     * Valida una fila de datos
     * 
     * POR QUÉ VALIDAR:
     * Los datos CSV pueden venir con errores:
     * - Campos vacíos
     * - Fechas en formato incorrecto
     * - Categorías mal escritas ("Periferico" vs "Periférico")
     * - Cálculos incorrectos (cantidad × precio ≠ total)
     * 
     * MEJOR FALLAR TEMPRANO:
     * Es mejor rechazar datos malos AHORA que tener errores raros después
     * en los gráficos o cálculos.
     * 
     * CANONICALIZACIÓN:
     * "Canonicalizar" = convertir variaciones a UNA forma estándar
     * Ejemplos:
     * - "MÉXICO", "México", "mexico" → todos se aceptan como "México"
     * - "Periferico" (sin tilde) → se acepta como "Periférico"
     * 
     * POR QUÉ ESTO ES IMPORTANTE:
     * Los usuarios pueden escribir mal (mayúsculas, sin tildes, etc.)
     * pero sabemos lo que quisieron decir. Ser flexible aquí = mejor UX.
     * 
     * @param {Object} row - Fila a validar (objeto con ID_Transaccion, Fecha, etc.)
     * @param {number} index - Número de fila (para mensajes de error)
     * @throws {Error} - Si la validación falla, lanza un error con detalles
     */
    validateRow(row, index) {
        // Arrays para acumular errores
        const errors = [];  // Mensajes legibles para humanos
        const codes = [];   // Códigos para rastrear tipos de error (para estadísticas)

        // PASO 1: CANONICALIZACIÓN
        // Intentar encontrar la versión "correcta" de cada valor categórico
        // POR QUÉ ANTES DE VALIDAR: Si "Mexico" (sin tilde) puede convertirse
        // a "México", entonces NO es un error, es solo una variación.
        const catCanonical = UTILS.findCanonical(CONFIG.VALIDATION.VALID_CATEGORIES, row.Categoria);
        const countryCanonical = UTILS.findCanonical(CONFIG.VALIDATION.VALID_COUNTRIES, row.Pais);
        const payCanonical = UTILS.findCanonical(CONFIG.VALIDATION.VALID_PAYMENT_METHODS, row.Metodo_Pago);

        // PASO 2: VALIDACIONES INDIVIDUALES
        // Cada validación sigue el patrón:
        // 1. Verificar si el valor es inválido
        // 2. Si es inválido, agregar mensaje de error y código
        // 3. Si es válido pero necesita canonicalización, aplicarla
        
        // Validar ID de transacción
        // POR QUÉ: Cada transacción necesita un ID único para rastrearla
        if (!row.ID_Transaccion || row.ID_Transaccion.length < CONFIG.VALIDATION.MIN_TRANSACTION_ID_LENGTH) {
            errors.push('ID de transacción inválido');
            codes.push('idTransaccion'); // Para estadísticas: ¿cuántos errores son de ID?
            codes.push('idTransaccion');
        }

        // Validar fecha (cadena válida)
        if (!row.Fecha || !this.isValidDateString(row.Fecha)) {
            errors.push('Fecha inválida');
            codes.push('fecha');
        }

        // Validar ID de producto
        if (!row.ID_Producto || row.ID_Producto.length < 1) {
            errors.push('ID de producto inválido');
            codes.push('idProducto');
        }

        // Validar nombre de producto
        if (!row.Nombre_Producto || row.Nombre_Producto.length < CONFIG.VALIDATION.MIN_PRODUCT_NAME_LENGTH) {
            errors.push('Nombre de producto inválido');
            codes.push('nombreProducto');
        }

        // Validar y aplicar categoría canónica
        if (!row.Categoria || !catCanonical) {
            errors.push('Categoría inválida');
            codes.push('categoria');
        } else {
            row.Categoria = catCanonical;
        }

        // Validar cantidad y precio
        const quantity = parseFloat(row.Cantidad);
        if (isNaN(quantity) || quantity < CONFIG.VALIDATION.MIN_QUANTITY) {
            errors.push('Cantidad inválida');
            codes.push('cantidad');
        }

        const unitPrice = parseFloat(row.Precio_Unitario);
        if (isNaN(unitPrice) || unitPrice < CONFIG.VALIDATION.MIN_PRICE || unitPrice > CONFIG.VALIDATION.MAX_PRICE) {
            errors.push('Precio unitario inválido');
            codes.push('precioUnitario');
        }

        const totalSale = parseFloat(row.Total_Venta);
        if (isNaN(totalSale) || totalSale < CONFIG.VALIDATION.MIN_PRICE) {
            errors.push('Total de venta inválido');
            codes.push('totalVenta');
        }

        // Validar y aplicar país canónico
        if (!row.Pais || !countryCanonical) {
            errors.push('País inválido');
            codes.push('pais');
        } else {
            row.Pais = countryCanonical;
        }

        // Validar y aplicar método de pago canónico
        if (!row.Metodo_Pago || !payCanonical) {
            errors.push('Método de pago inválido');
            codes.push('metodoPago');
        } else {
            row.Metodo_Pago = payCanonical;
        }

        // Verificar consistencia de cálculos (si todos numéricos válidos)
        if (!isNaN(quantity) && !isNaN(unitPrice) && !isNaN(totalSale)) {
            const expectedTotal = quantity * unitPrice;
            const absTol = 0.02; // 2 centavos
            const relTol = Math.abs(expectedTotal) * 0.005; // 0.5%
            const tolerance = Math.max(absTol, relTol);
            if (Math.abs(totalSale - expectedTotal) > tolerance) {
                errors.push('Inconsistencia en cálculos: cantidad × precio ≠ total');
                codes.push('totalConsistencia');
            }
        }

        if (errors.length > 0) {
            // actualizar resumen por tipo de error
            codes.forEach(c => {
                if (this.errorSummary[c] !== undefined) {
                    this.errorSummary[c] += 1;
                }
            });
            // lanzar con detalle (incluye códigos para diagnóstico)
            throw new Error(`Fila ${index + 1}: ${errors.join(', ')} | codes: ${codes.join('|')}`);
        }
    }

    /**
     * Convierte tipos de una fila ya validada y agrega campos derivados
     * @param {Object} row - Fila con datos limpios
     * @returns {Object} - Fila con tipos convertidos
     */
    convertTypes(row) {
        const convertedRow = { ...row };
        try {
            // Convertir fecha
            convertedRow.Fecha = this.convertToDate(row.Fecha);
            this.cleaningStats.convertedDates++;

            // Convertir números
            convertedRow.Cantidad = this.convertToNumber(row.Cantidad);
            convertedRow.Precio_Unitario = this.convertToNumber(row.Precio_Unitario);
            convertedRow.Total_Venta = this.convertToNumber(row.Total_Venta);
            this.cleaningStats.convertedNumbers += 3;

            // Agregar campos calculados
            convertedRow.Ano = convertedRow.Fecha.getFullYear();
            convertedRow.Mes = convertedRow.Fecha.getMonth() + 1;
            convertedRow.MesAno = `${convertedRow.Ano}-${String(convertedRow.Mes).padStart(2, '0')}`;
            convertedRow.NombreMes = UTILS.getMonthName(convertedRow.Fecha.getMonth());

            // Agregar campos de formato
            convertedRow.FechaFormateada = UTILS.formatDate(convertedRow.Fecha);
            convertedRow.PrecioFormateado = UTILS.formatCurrency(convertedRow.Precio_Unitario);
            convertedRow.TotalFormateado = UTILS.formatCurrency(convertedRow.Total_Venta);

            return convertedRow;
        } catch (error) {
            console.error('Error converting types:', error);
            throw new Error(`Error en conversión de tipos: ${error.message}`);
        }
    }

    /**
     * Convierte una cadena a fecha
     * @param {string} dateString - Cadena de fecha
     * @returns {Date} - Objeto Date
     */
    convertToDate(dateString) {
        if (!dateString) {
            throw new Error('Fecha vacía');
        }

        // Intentar diferentes formatos de fecha (YYYY-MM-DD como formato principal)
        const formats = [
            'YYYY-MM-DD',
            'DD/MM/YYYY',
            'DD-MM-YYYY',
            'MM/DD/YYYY',
            'MM-DD-YYYY'
        ];

        for (const format of formats) {
            try {
                const date = this.parseDateWithFormat(dateString, format);
                if (date && UTILS.isValidDate(date)) {
                    return date;
                }
            } catch (error) {
                // Continuar con el siguiente formato
            }
        }

        // Intentar parseo automático
        const autoDate = new Date(dateString);
        if (UTILS.isValidDate(autoDate)) {
            return autoDate;
        }

        throw new Error(`No se pudo convertir la fecha: ${dateString}`);
    }

    /**
     * Parsea una fecha con formato específico
     * @param {string} dateString - Cadena de fecha
     * @param {string} format - Formato esperado
     * @returns {Date} - Objeto Date
     */
    parseDateWithFormat(dateString, format) {
        const parts = dateString.split(/[-\/]/);
        
        if (parts.length !== 3) {
            return null;
        }

        let year, month, day;

        switch (format) {
            case 'YYYY-MM-DD':
                [year, month, day] = parts;
                break;
            case 'DD/MM/YYYY':
            case 'DD-MM-YYYY':
                [day, month, year] = parts;
                break;
            case 'MM/DD/YYYY':
            case 'MM-DD-YYYY':
                [month, day, year] = parts;
                break;
            default:
                return null;
        }

        // Convertir a números
        year = parseInt(year, 10);
        month = parseInt(month, 10) - 1; // Los meses en Date van de 0-11
        day = parseInt(day, 10);

        // Validar rangos
        if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
            return null;
        }

        const date = new Date(year, month, day);
        
        // Verificar que la fecha sea válida
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    /**
     * Convierte una cadena a número
     * @param {string} numberString - Cadena numérica
     * @returns {number} - Número convertido
     */
    convertToNumber(numberString) {
        if (!numberString) {
            throw new Error('Valor numérico vacío');
        }

        // Limpiar el string de caracteres no numéricos excepto punto y coma
        let cleaned = numberString.toString().replace(/[^\d.,\-]/g, '');
        
        // Manejar diferentes separadores decimales
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // Si tiene ambos, asumir que la coma es separador de miles
            cleaned = cleaned.replace(/,/g, '');
        } else if (cleaned.includes(',')) {
            // Si solo tiene coma, verificar si es decimal o separador de miles
            const parts = cleaned.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                // Probablemente es decimal
                cleaned = cleaned.replace(',', '.');
            } else {
                // Probablemente es separador de miles
                cleaned = cleaned.replace(/,/g, '');
            }
        }

        const number = parseFloat(cleaned);
        
        if (isNaN(number)) {
            throw new Error(`No se pudo convertir a número: ${numberString}`);
        }

        return number;
    }

    /**
     * Valida si una cadena es una fecha válida
     * @param {string} dateString - Cadena de fecha
     * @returns {boolean} - True si es válida
     */
    isValidDateString(dateString) {
        if (!dateString) return false;
        
        try {
            const date = new Date(dateString);
            return UTILS.isValidDate(date);
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtiene estadísticas de limpieza
     * @returns {Object} - Estadísticas de limpieza
     */
    getCleaningStats() {
        return { ...this.cleaningStats };
    }

    /**
     * Obtiene errores de validación
     * @returns {Array<Object>} - Lista de errores
     */
    getValidationErrors() {
        return [...this.validationErrors];
    }

    /**
     * Resumen agregado de causas de validación
     * @returns {Object}
     */
    getValidationSummary() {
        return { ...this.errorSummary };
    }

    /**
     * Resetea las estadísticas
     */
    resetStats() {
        this.validationErrors = [];
        this.cleaningStats = {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            cleanedFields: 0,
            convertedDates: 0,
            convertedNumbers: 0
        };
        this.errorSummary = {
            idTransaccion: 0,
            fecha: 0,
            idProducto: 0,
            nombreProducto: 0,
            categoria: 0,
            cantidad: 0,
            precioUnitario: 0,
            totalVenta: 0,
            pais: 0,
            metodoPago: 0,
            totalConsistencia: 0
        };
    }

    /**
     * Filtra datos por criterios específicos
     * @param {Array<Object>} data - Datos a filtrar
     * @param {Object} filters - Criterios de filtrado
     * @returns {Array<Object>} - Datos filtrados
     */
    filterData(data, filters) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        return data.filter(row => {
            // Filtro por rango de fechas
            if (filters.startDate && filters.endDate) {
                const rowDate = new Date(row.Fecha);
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                
                if (rowDate < startDate || rowDate > endDate) {
                    return false;
                }
            }

            // Filtro por producto
            if (filters.product && filters.product !== '') {
                if (row.ID_Producto !== filters.product && row.Nombre_Producto !== filters.product) {
                    return false;
                }
            }

            // Filtro por país
            if (filters.country && filters.country !== '') {
                if (row.Pais !== filters.country) {
                    return false;
                }
            }

            // Filtro por categoría
            if (filters.category && filters.category !== '') {
                if (row.Categoria !== filters.category) {
                    return false;
                }
            }

            // Filtro por método de pago
            if (filters.paymentMethod && filters.paymentMethod !== '') {
                if (row.Metodo_Pago !== filters.paymentMethod) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Obtiene valores únicos de una columna
     * @param {Array<Object>} data - Datos
     * @param {string} column - Nombre de la columna
     * @returns {Array<string>} - Valores únicos ordenados
     */
    getUniqueValues(data, column) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const uniqueValues = new Set();
        
        data.forEach(row => {
            if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
                uniqueValues.add(row[column]);
            }
        });

        return Array.from(uniqueValues).sort();
    }
}

// Crear instancia global del procesador
const dataProcessor = new DataProcessor();
