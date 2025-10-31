/**
 * TechTrends Dashboard - Cargador de Datos (CSV)
 *
 * Guía rápida:
 * - Lee el archivo CSV desde el input o por drag & drop
 * - Valida tamaño y extensión
 * - Detecta encoding (UTF-8 y fallback a Windows‑1252)
 * - Convierte el texto CSV en filas (objetos JS)
 * - Notifica progreso/errores a la UI mediante callbacks
 *
 * Por qué separar esta clase:
 * - Aísla toda la responsabilidad de "traer datos" en un lugar
 * - El resto del sistema solo recibe un array de objetos limpio
 *
 * Glosario:
 * • CSV: Comma-Separated Values, formato de texto simple para tablas
 * • Encoding: cómo se representan caracteres (UTF-8, Windows-1252); si está mal, tildes se ven como "�"
 * • Callback: función que pasas para que se llame cuando ocurra algo (éxito/error)
 * • FileReader: API del navegador para leer archivos locales sin subirlos a un servidor
 * • Promise: objeto que representa una operación asíncrona (ej: leer archivo toma tiempo)
 * • Drag & drop: arrastrar y soltar archivos en la ventana del navegador
 * • BOM: Byte Order Mark, marca invisible al inicio de algunos archivos UTF-8
 */

class DataLoader {
    constructor() {
        // Referencia al elemento <input type="file"> del HTML
        this.fileInput = null;
        
        // Callbacks (funciones que se ejecutan cuando pasa algo)
        // POR QUÉ CALLBACKS: Permite que otras partes de la app reaccionen
        // a eventos sin que DataLoader necesite conocer los detalles
        this.onDataLoaded = null;  // Se ejecuta cuando el CSV se carga OK
        this.onError = null;        // Se ejecuta si algo sale mal
        this.onProgress = null;     // Se ejecuta para mostrar mensajes de progreso

        // Mantener el último CSV en texto
        this.lastCSVText = null;
    }

    /**
     * Inicializa el cargador de datos
     * @param {string} fileInputId - ID del input de archivo (ej: 'csvFile')
     * @param {Function} onDataLoaded - Se llama cuando el CSV se parsea bien
     * @param {Function} onError - Se llama si ocurre un error visible para el usuario
     * @param {Function} onProgress - Mensajes breves de estado (cargando, procesando)
     */
    initialize(fileInputId, onDataLoaded, onError, onProgress) {
        // Buscar el elemento <input type="file"> en el HTML
        this.fileInput = document.getElementById(fileInputId);
        
        // Guardar los callbacks para usarlos después
        this.onDataLoaded = onDataLoaded;
        this.onError = onError;
        this.onProgress = onProgress;

        // VALIDACIÓN TEMPRANA: Si no existe el input, fallar inmediatamente
        // POR QUÉ: Es mejor fallar rápido y claro que tener errores raros después
        if (!this.fileInput) {
            throw new Error(`No se encontró el elemento con ID: ${fileInputId}`);
        }

        // Configurar los eventos (click, drag & drop, etc.)
        this.setupEventListeners();
    }

    /**
     * Conecta eventos del input y habilita drag & drop (UX)
     */
    setupEventListeners() {
        // EVENTO 1: Cuando el usuario selecciona un archivo con el botón
        this.fileInput.addEventListener('change', (event) => {
            this.handleFileSelection(event);
        });

        // EVENTO 2: Drag and drop (arrastrar y soltar archivo)
        // POR QUÉ ESTO ES ÚTIL: Mejor experiencia de usuario, más moderno
        const uploadCard = document.querySelector('.upload-card');
        if (uploadCard) {
            // Cuando el archivo está siendo arrastrado sobre la zona
            uploadCard.addEventListener('dragover', (event) => {
                event.preventDefault(); // IMPORTANTE: Sin esto, el navegador abre el archivo en vez de dejarnos manejarlo
                uploadCard.classList.add('drag-over'); // Feedback visual (cambio de color/estilo)
            });

            // Cuando el archivo sale de la zona (se cancela el drag)
            uploadCard.addEventListener('dragleave', (event) => {
                event.preventDefault();
                uploadCard.classList.remove('drag-over'); // Quitar el feedback visual
            });

            // Cuando el usuario SUELTA el archivo en la zona
            uploadCard.addEventListener('drop', (event) => {
                event.preventDefault(); // CRÍTICO: Evita que el navegador abra el archivo
                uploadCard.classList.remove('drag-over');
                
                // Obtener los archivos que se soltaron
                const files = event.dataTransfer.files;
                
                if (files.length > 0) {
                    // TRUCO: Asignar el archivo al input file para que el resto del código
                    // funcione igual, sin importar si vino de click o drag & drop
                    this.fileInput.files = files;
                    this.handleFileSelection({ target: { files: files } });
                }
            });
        }
    }

    /**
     * Maneja la selección de archivo
     * @param {Event} event - Evento de cambio de archivo
     */
    async handleFileSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.onError(CONFIG.MESSAGES.ERRORS.FILE_NOT_SELECTED);
            return;
        }

        // Validar tipo de archivo (extensión permitida)
        if (!this.validateFileType(file)) {
            this.onError(CONFIG.MESSAGES.ERRORS.INVALID_FILE_TYPE);
            return;
        }

        // Validar tamaño de archivo
        if (!this.validateFileSize(file)) {
            this.onError(CONFIG.MESSAGES.ERRORS.FILE_TOO_LARGE);
            return;
        }

        try {
            this.onProgress(CONFIG.MESSAGES.LOADING.LOADING_FILE);
            
            // Mostrar información del archivo
            this.displayFileInfo(file);
            
            // Leer y procesar exclusivamente CSV
            const csvText = await this.readFile(file);
            this.lastCSVText = csvText;
            const rawData = this.parseCSV(csvText);
            
            // Validar estructura del archivo
            if (!this.validateCSVStructure(rawData)) {
                const missing = this.getMissingColumns(rawData);
                const detail = missing.length ? ` Faltan columnas: ${missing.join(', ')}` : '';
                let preview = '';
                try {
                    const hdr = this.previewHeadersFromCSV(this.lastCSVText || '');
                    if (hdr && Array.isArray(hdr.headers) && hdr.headers.length) {
                        preview = ` Cabecera detectada: [${hdr.headers.join(' | ')}]`;
                    }
                } catch {}
                this.onError(`${CONFIG.MESSAGES.ERRORS.INVALID_CSV_FORMAT}.${detail}${preview}`.trim());
                return;
            }

            this.onProgress(CONFIG.MESSAGES.LOADING.PROCESSING);
            
            // Procesar los datos
            const processedData = this.processRawData(rawData);
            
            this.onDataLoaded(processedData);
            
        } catch (error) {
            console.error('Error loading file:', error);
            const message = (error && error.message) ? error.message : CONFIG.MESSAGES.ERRORS.PROCESSING_ERROR;
            this.onError(message);
        }
    }

    /**
     * Valida el tipo de archivo
     * @param {File} file - Archivo a validar
     * @returns {boolean} - True si es válido
     */
    validateFileType(file) {
        const validExtensions = CONFIG.CSV.SUPPORTED_FORMATS;
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(fileExtension);
    }

    /**
     * Valida el tamaño del archivo
     * @param {File} file - Archivo a validar
     * @returns {boolean} - True si es válido
     */
    validateFileSize(file) {
        return file.size <= CONFIG.CSV.MAX_FILE_SIZE;
    }

    /**
     * Muestra información del archivo seleccionado
     * @param {File} file - Archivo seleccionado
     */
    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.style.display = 'flex';
        }
    }

    /**
     * Formatea el tamaño del archivo
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} - Tamaño formateado
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Lee el contenido del archivo con detección automática de encoding
     * - Primer intento: UTF‑8
     * - Si aparecen "�" → reintenta decodificando como Windows‑1252
     * @param {File} file
     * @returns {Promise<string>}
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                let text = event.target.result;
                
                // DETECCIÓN DE ENCODING INCORRECTO:
                // El caracter � (U+FFFD) es el "replacement character"
                // que aparece cuando un encoding no puede representar un caracter.
                // Si lo vemos, sabemos que el encoding está mal.
                if (text.includes('�') || text.includes('\ufffd')) {
                    console.warn('Encoding incorrecto detectado, reintentando con Windows-1252...');
                    
                    // SEGUNDO INTENTO: Leer como ArrayBuffer y decodificar manualmente
                    // POR QUÉ ArrayBuffer: Nos da los bytes crudos sin interpretar,
                    // luego nosotros decidimos cómo interpretarlos
                    const readerRetry = new FileReader();
                    readerRetry.onload = (e) => {
                        try {
                            // Intentar decodificar como Windows-1252
                            const decoder = new TextDecoder('windows-1252');
                            const arrayBuffer = e.target.result;
                            text = decoder.decode(arrayBuffer);
                            resolve(text);
                        } catch (decodeError) {
                            console.error('Error decodificando con Windows-1252:', decodeError);
                            // Si falla, usar el texto original
                            resolve(text);
                        }
                    };
                    readerRetry.onerror = reject;
                    readerRetry.readAsArrayBuffer(file);
                } else {
                    resolve(text);
                }
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            // Intentar primero con UTF-8
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * Parsea el texto CSV en un array de objetos
     * Mejora: autodetección de delimitador ("," o ";"),
     * tolerancia a filas/columnas vacías al inicio (caso Excel con datos en B2)
     * @param {string} csvText - Texto CSV
     * @returns {Array<Object>} - Array de objetos con los datos
     */
    parseCSV(csvText) {
        try {
            // 1) Normalizar saltos de línea a \n y eliminar BOM si viene presente
            let text = csvText.replace(/\r\n?|\r/g, '\n');
            if (text.charCodeAt(0) === 0xFEFF) {
                text = text.slice(1);
            }

            // 2) Separar en líneas pero SIN descartar aún líneas raras; las necesitaremos para detectar delimitador
            const rawLines = text.split('\n');

            // 3) Detectar delimitador (coma o punto y coma) mirando las primeras líneas no vacías
            const delimiter = this.detectDelimiter(rawLines) || CONFIG.CSV.DELIMITER || ',';

            // 4) Parsear todas las líneas a celdas respetando comillas y el delimitador elegido
            const rows = rawLines
                .map(line => this.parseCSVLine(line, delimiter))
                // eliminar filas completamente vacías (todas las celdas vacías)
                .filter(cells => cells.some(cell => (cell ?? '').toString().trim() !== ''));

            if (rows.length < 2) {
                throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
            }

            // 5) Si hay columnas en blanco al principio (caso datos arrancan en B2), quitarlas
            //    Criterio: si la PRIMERA columna está vacía en >= 90% de las filas, la eliminamos para todas
            const leadingEmptyCols = this.countLeadingEmptyColumns(rows);
            if (leadingEmptyCols > 0) {
                for (let r = 0; r < rows.length; r++) {
                    rows[r].splice(0, leadingEmptyCols);
                }
            }

            // 6) Encontrar la fila de encabezados (mapeo flexible) con fallback por mejor coincidencia
            const headerInfo = this.findHeaderRowFlexible(rows);
            if (!headerInfo || headerInfo.index === -1 || !headerInfo.headers) {
                throw new Error('Los encabezados del archivo no coinciden con el formato esperado');
            }
            const headerIndex = headerInfo.index;
            // Forzar mapeo suave a canónicos aunque no haya match perfecto
            const headers = this.softMapHeaders(headerInfo.headers);

            // 7) Construir objetos a partir de las filas siguientes a la cabecera
            const data = [];
            for (let i = headerIndex + 1; i < rows.length; i++) {
                const values = rows[i];
                if (!values || values.length === 0) continue;
                const row = {};

                // Alinear longitud (si la fila tiene menos celdas, llenar con "")
                const maxLen = Math.max(headers.length, values.length);
                for (let c = 0; c < maxLen; c++) {
                    const key = headers[c] ?? '';
                    const val = values[c] ?? '';
                    if (key) { // solo guardar si hay nombre de columna
                        row[key] = typeof val === 'string' ? val.trim() : val;
                    }
                }

                // Asegurar que todas las columnas canónicas existan
                for (const req of CONFIG.CSV.REQUIRED_COLUMNS) {
                    if (!(req in row)) row[req] = '';
                }

                // Guardar fila si contiene al menos una columna requerida no vacía
                const hasData = CONFIG.CSV.REQUIRED_COLUMNS.some(k => (row[k] ?? '').toString().trim() !== '');
                if (hasData) data.push(row);
            }

            return data;

        } catch (error) {
            console.error('Error parsing CSV:', error);
            throw new Error('Error al parsear el archivo CSV: ' + error.message);
        }
    }

    /**
     * Parsea una línea CSV individual
     * @param {string} line - Línea CSV
     * @returns {Array<string>} - Array de valores
     */
    parseCSVLine(line, delimiter = CONFIG.CSV.DELIMITER) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === delimiter && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field
        result.push(current.trim());

        return result;
    }

    /**
     * Normaliza un texto de encabezado: quita tildes, espacios, guiones y underscores, y lo pasa a minúsculas
     * @param {string} s
     * @returns {string}
     */
    normalizeHeaderKey(s) {
        if (typeof s !== 'string') return '';
        try {
            const base = (UTILS && UTILS.normalizeText) ? UTILS.normalizeText(s) : s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            // quitar TODO lo que no sea letra o número (espacios, guiones, barras, paréntesis, signos, etc.)
            return base.replace(/[^a-z0-9]/g, '');
        } catch {
            return s.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
    }

    /**
     * Mapea una lista de encabezados a los nombres canónicos requeridos,
     * tolerando variaciones (tildes, espacios, sinónimos)
     * @param {string[]} headers
     * @returns {string[]|null}
     */
    mapHeadersToCanonical(headers) {
        if (!Array.isArray(headers)) return null;
        const required = CONFIG.CSV.REQUIRED_COLUMNS;

        // Construir alias conocidos
        const alias = new Map();
        const add = (canonical, variants) => {
            for (const v of variants) alias.set(this.normalizeHeaderKey(v), canonical);
        };
    add('ID_Transaccion', ['ID_Transaccion','ID Transaccion','ID Transacción','Transaccion ID','ID','Venta ID','Identificador de Transaccion','Identificador Transaccion','ID Venta','No. Transaccion','No Transaccion']);
    add('Fecha', ['Fecha','Date','Fecha Venta','Fecha de Venta','Fecha de la Venta','Fecha Transacción','Fecha Transaccion','Fecha Operación','Fecha de Operación','F. Venta']);
    add('ID_Producto', ['ID_Producto','ID Producto','SKU','Producto ID','Codigo Producto','Código Producto','Codigo','Código','Código SKU','Código de Producto']);
    add('Nombre_Producto', ['Nombre_Producto','Producto','Nombre','Nombre Producto','Nombre del Producto','Descripción Producto','Descripcion Producto','Nombre de Producto','Producto Nombre','Descripción del Producto']);
    add('Categoria', ['Categoria','Categoría','Rubro','Categoria Producto','Categoría de Producto','Tipo de Producto','Familia','Línea']);
        add('Cantidad', ['Cantidad','Qty','Unidades','Cantidad Vendida']);
    add('Precio_Unitario', ['Precio_Unitario','Precio Unitario','Precio','Unit Price','Precio Unidad','Precio por Unidad','Precio Unitario ($)','Precio Unitario MXN']);
    add('Total_Venta', ['Total_Venta','Total','Importe','Monto','Venta Total','Total de la Venta','Total ($)','Total MXN']);
    add('Pais', ['Pais','País','Country','Nación','Nacion','País de Venta','Pais de Venta','País/Región','Region','Country/Region']);
    add('Metodo_Pago', ['Metodo_Pago','Método de Pago','Metodo de Pago','Forma de Pago','Payment Method','Metodo Pago','Método Pago','Forma Pago','Metodo de cobro','Canal de Pago','Canal']);

        // Intentar mapear cada encabezado a canónico
        // Preparar índices vistos para evitar duplicados
        const used = new Set();
        const mapped = headers.map(h => {
            const key = this.normalizeHeaderKey(h);
            // 1) Si ya es canónico literal
            if (required.includes(h) && !used.has(h)) { used.add(h); return h; }
            // 2) Alias directo
            const viaAlias = alias.get(key);
            if (viaAlias && !used.has(viaAlias)) { used.add(viaAlias); return viaAlias; }
            // 3) Coincidencia "borrosa":
            //    comparar contra cada requerido normalizado; aceptar si uno contiene al otro
            for (const req of required) {
                if (used.has(req)) continue;
                const normReq = this.normalizeHeaderKey(req);
                if (key && (key.includes(normReq) || normReq.includes(key))) {
                    used.add(req);
                    return req;
                }
            }
            // 4) Sin mapeo: dejar el original (no canónico)
            return h;
        });

        // Verificar que todos los requeridos estén presentes tras el mapeo
        const set = new Set(mapped);
        for (const req of required) {
            if (!set.has(req)) return null;
        }
        return mapped;
    }

    /**
     * Busca la mejor fila de encabezados: primero una coincidencia completa; si no hay, la de más aciertos.
     * Devuelve { index, headers, score }
     * @param {string[][]} rows
     */
    findHeaderRowFlexible(rows) {
        const required = CONFIG.CSV.REQUIRED_COLUMNS;

        // Helpers para evaluar "parecido a cabecera"
        const keywords = [
            'id','transaccion','fecha','producto','nombre','categoria',
            'cantidad','precio','unitario','total','venta','pais','metodo','pago','sku','codigo','codigo_producto'
        ];
        const hasLetters = (s) => /[a-zA-Z]/.test((s ?? '').toString());
        const isNumericLike = (s) => {
            const v = (s ?? '').toString().trim();
            if (!v) return true; // celda vacía no ayuda a cabecera
            const num = v.replace(/[$%,]/g, '');
            if (/^\d+(?:[\.,]\d+)?$/.test(num)) return true; // número
            if (/^(?:\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})$/.test(v)) return true; // fecha
            if (/^[A-Za-z]?\d{3,}$/.test(v)) return true; // códigos tipo T1001 / P201
            return false;
        };
        const norm = (s) => this.normalizeHeaderKey((s ?? '').toString());
        const scoreHeaderRow = (row) => {
            if (!Array.isArray(row) || row.length === 0) return -999;
            const matchCount = this.countHeaderMatches(row); // fuerte indicador
            let keywordHits = 0, alpha = 0, numericish = 0;
            for (const cell of row) {
                const n = norm(cell);
                if (hasLetters(cell)) alpha++;
                if (isNumericLike(cell)) numericish++;
                if (n && keywords.some(k => n.includes(k))) keywordHits++;
            }
            let score = matchCount * 10 + keywordHits * 2 + (alpha - numericish);
            // Penalizar fuertemente filas que parecen datos (mucho número/fecha)
            if (numericish / Math.max(row.length, 1) > 0.6) score -= 20;
            return score;
        };

        let best = { index: -1, headers: null, score: -999 };

        const limit = Math.min(rows.length, 100); // evaluar primeras 100 filas como máximo
        for (let i = 0; i < limit; i++) {
            const current = rows[i] || [];

            // 1) Coincidencia completa inmediata
            const mapped = this.mapHeadersToCanonical(current);
            if (mapped) {
                return { index: i, headers: mapped, score: required.length * 10 };
            }

            // 2) Cabecera en dos filas: concatenar i + (i+1)
            if (i + 1 < limit) {
                const a = current;
                const b = rows[i + 1] || [];
                const combined = [];
                const maxLen = Math.max(a.length, b.length);
                for (let c = 0; c < maxLen; c++) {
                    const partA = (a[c] ?? '').toString().trim();
                    const partB = (b[c] ?? '').toString().trim();
                    combined.push([partA, partB].filter(Boolean).join(' '));
                }
                const mappedCombined = this.mapHeadersToCanonical(combined);
                if (mappedCombined) {
                    return { index: i + 1, headers: mappedCombined, score: required.length * 10 };
                }
                const combScore = scoreHeaderRow(combined);
                if (combScore > best.score) best = { index: i + 1, headers: combined, score: combScore };
            }

            // 3) Puntuar la fila actual como posible cabecera
            const s = scoreHeaderRow(current);
            if (s > best.score) best = { index: i, headers: current, score: s };
        }

        // Filtro final: evitar elegir una fila que no se parezca a cabecera en absoluto
        if (best.index >= 0) {
            const matchCount = this.countHeaderMatches(best.headers || []);
            const appearsHeaderish = matchCount >= 2 || best.score >= 3;
            if (appearsHeaderish) {
                return { index: best.index, headers: best.headers, score: best.score };
            }
        }

        return { index: -1, headers: null, score: -1 };
    }

    /**
     * Cuenta cuántas columnas de una fila podrían corresponder a los requeridos (por alias)
     * @param {string[]} row
     */
    countHeaderMatches(row) {
        if (!Array.isArray(row)) return 0;
        const required = new Set(CONFIG.CSV.REQUIRED_COLUMNS);
        // Construir el mismo mapa de alias que en mapHeadersToCanonical
        const alias = new Map();
        const add = (canonical, variants) => { for (const v of variants) alias.set(this.normalizeHeaderKey(v), canonical); };
    add('ID_Transaccion', ['ID_Transaccion','ID Transaccion','ID Transacción','Transaccion ID','ID','Venta ID','Identificador de Transaccion','Identificador Transaccion','ID Venta','No. Transaccion','No Transaccion']);
    add('Fecha', ['Fecha','Date','Fecha Venta','Fecha de Venta','Fecha de la Venta','Fecha Transacción','Fecha Transaccion','Fecha Operación','Fecha de Operación','F. Venta']);
    add('ID_Producto', ['ID_Producto','ID Producto','SKU','Producto ID','Codigo Producto','Código Producto','Codigo','Código','Código SKU','Código de Producto']);
    add('Nombre_Producto', ['Nombre_Producto','Producto','Nombre','Nombre Producto','Nombre del Producto','Descripción Producto','Descripcion Producto','Nombre de Producto','Producto Nombre','Descripción del Producto']);
    add('Categoria', ['Categoria','Categoría','Rubro','Categoria Producto','Categoría de Producto','Tipo de Producto','Familia','Línea']);
        add('Cantidad', ['Cantidad','Qty','Unidades','Cantidad Vendida']);
    add('Precio_Unitario', ['Precio_Unitario','Precio Unitario','Precio','Unit Price','Precio Unidad','Precio por Unidad','Precio Unitario ($)','Precio Unitario MXN']);
    add('Total_Venta', ['Total_Venta','Total','Importe','Monto','Venta Total','Total de la Venta','Total ($)','Total MXN']);
    add('Pais', ['Pais','País','Country','Nación','Nacion','País de Venta','Pais de Venta','País/Región','Region','Country/Region']);
    add('Metodo_Pago', ['Metodo_Pago','Método de Pago','Metodo de Pago','Forma de Pago','Payment Method','Metodo Pago','Método Pago','Forma Pago','Metodo de cobro','Canal de Pago','Canal']);

        const seen = new Set();
        let count = 0;
        for (const h of row) {
            const key = this.normalizeHeaderKey(h);
            // Alias directo
            const canon = alias.get(key);
            if (canon && !seen.has(canon)) { seen.add(canon); count++; continue; }
            // Igual literal canónico
            if (required.has(h) && !seen.has(h)) { seen.add(h); count++; continue; }
            // Coincidencia borrosa
            for (const req of required) {
                if (seen.has(req)) continue;
                const normReq = this.normalizeHeaderKey(req);
                if (key && (key.includes(normReq) || normReq.includes(key))) {
                    seen.add(req);
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    /**
     * Mapea headers hacia los canónicos cuando sea posible SIN exigir match completo.
     * Aplica alias, normalización y coincidencia parcial. Mantiene encabezados originales si no hay mapeo.
     * @param {string[]} headers
     * @returns {string[]}
     */
    softMapHeaders(headers) {
        if (!Array.isArray(headers)) return [];
        const required = CONFIG.CSV.REQUIRED_COLUMNS;
        const alias = new Map();
        const add = (canonical, variants) => { for (const v of variants) alias.set(this.normalizeHeaderKey(v), canonical); };
        add('ID_Transaccion', ['ID_Transaccion','ID Transaccion','ID Transacción','Transaccion ID','ID','Venta ID','Identificador de Transaccion','Identificador Transaccion','ID Venta','No. Transaccion','No Transaccion']);
        add('Fecha', ['Fecha','Date','Fecha Venta','Fecha de Venta','Fecha de la Venta','Fecha Transacción','Fecha Transaccion','Fecha Operación','Fecha de Operación','F. Venta']);
        add('ID_Producto', ['ID_Producto','ID Producto','SKU','Producto ID','Codigo Producto','Código Producto','Codigo','Código','Código SKU','Código de Producto']);
        add('Nombre_Producto', ['Nombre_Producto','Producto','Nombre','Nombre Producto','Nombre del Producto','Descripción Producto','Descripcion Producto','Nombre de Producto','Producto Nombre','Descripción del Producto']);
        add('Categoria', ['Categoria','Categoría','Rubro','Categoria Producto','Categoría de Producto','Tipo de Producto','Familia','Línea']);
        add('Cantidad', ['Cantidad','Qty','Unidades','Cantidad Vendida']);
        add('Precio_Unitario', ['Precio_Unitario','Precio Unitario','Precio','Unit Price','Precio Unidad','Precio por Unidad','Precio Unitario ($)','Precio Unitario MXN']);
        add('Total_Venta', ['Total_Venta','Total','Importe','Monto','Venta Total','Total de la Venta','Total ($)','Total MXN']);
        add('Pais', ['Pais','País','Country','Nación','Nacion','País de Venta','Pais de Venta','País/Región','Region','Country/Region']);
        add('Metodo_Pago', ['Metodo_Pago','Método de Pago','Metodo de Pago','Forma de Pago','Payment Method','Metodo Pago','Método Pago','Forma Pago','Metodo de cobro','Canal de Pago','Canal']);

        const used = new Set();
        return headers.map(h => {
            const key = this.normalizeHeaderKey(h);
            // 1) Exacto canónico
            if (required.includes(h) && !used.has(h)) { used.add(h); return h; }
            // 2) Alias
            const viaAlias = alias.get(key);
            if (viaAlias && !used.has(viaAlias)) { used.add(viaAlias); return viaAlias; }
            // 3) Parcial
            for (const req of required) {
                if (used.has(req)) continue;
                const normReq = this.normalizeHeaderKey(req);
                if (key && (key.includes(normReq) || normReq.includes(key))) {
                    used.add(req);
                    return req;
                }
            }
            // 4) Sin mapeo
            return h;
        });
    }

    /**
     * Detecta el delimitador más probable ("," o ";") analizando las primeras líneas con contenido
     * Ignora comas/puntos y coma dentro de comillas
     * @param {string[]} lines
     * @returns {string|undefined}
     */
    detectDelimiter(lines) {
        const sample = [];
        for (const l of lines) {
            const s = (l || '').trim();
            if (s.length === 0) continue;
            sample.push(s);
            if (sample.length >= 10) break;
        }
        if (sample.length === 0) return undefined;

        const countSep = (line, sep) => {
            let count = 0, inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                const next = line[i + 1];
                if (ch === '"') {
                    if (inQ && next === '"') { i++; continue; }
                    inQ = !inQ;
                } else if (!inQ && ch === sep) {
                    count++;
                }
            }
            return count;
        };

        // Sumar ocurrencias por línea para cada separador
        const sumComma = sample.map(s => countSep(s, ',')).reduce((a, b) => a + b, 0);
        const sumSemi  = sample.map(s => countSep(s, ';')).reduce((a, b) => a + b, 0);

        if (sumSemi === 0 && sumComma === 0) return undefined;
        return sumSemi > sumComma ? ';' : ',';
    }

    /**
     * Intenta extraer la fila de encabezados principal desde un CSV en texto para diagnóstico
     * @param {string} csvText
     * @returns {{headers:string[], index:number, delimiter:string}|null}
     */
    previewHeadersFromCSV(csvText) {
        if (!csvText || typeof csvText !== 'string') return null;
        let text = csvText.replace(/\r\n?|\r/g, '\n');
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const rawLines = text.split('\n');
        const delimiter = this.detectDelimiter(rawLines) || ',';
        let rows = rawLines
            .map(line => this.parseCSVLine(line, delimiter))
            .filter(cells => cells.some(cell => (cell ?? '').toString().trim() !== ''));
        if (!rows.length) return null;
        const leading = this.countLeadingEmptyColumns(rows);
        if (leading > 0) { rows = rows.map(r => (r.splice(0, leading), r)); }
        const info = this.findHeaderRowFlexible(rows);
        if (info && info.index >= 0) {
            // Devolver la fila original para que el usuario vea los nombres tal cual están en el archivo
            const original = rows[info.index] || [];
            return { headers: original, index: info.index, delimiter };
        }
        // Fallback: primera fila con contenido
        return { headers: rows[0] || [], index: 0, delimiter };
    }

    /**
     * Cuenta cuántas columnas vacías hay al inicio (repetidas) y que afectan a la mayoría de filas
     * Devuelve cuántas columnas iniciales eliminar
     * @param {string[][]} rows
     * @returns {number}
     */
    countLeadingEmptyColumns(rows) {
        if (!rows || rows.length === 0) return 0;
        // Limitar análisis a las primeras N filas para performance
        const N = Math.min(rows.length, 100);
        let leading = 0;
        // Intentar eliminar hasta 20 columnas vacías consecutivas como máximo (archivos muy desplazados)
        for (let col = 0; col < 20; col++) {
            let emptyCount = 0;
            for (let r = 0; r < N; r++) {
                const cell = (rows[r][col] ?? '').toString().trim();
                if (cell === '') emptyCount++;
            }
            const ratio = emptyCount / N;
            if (ratio >= 0.9) {
                leading++;
            } else {
                break;
            }
        }
        return leading;
    }

    /**
     * Valida los encabezados del CSV
     * @param {Array<string>} headers - Encabezados encontrados
     * @returns {boolean} - True si son válidos
     */
    validateHeaders(headers) {
        const requiredHeaders = CONFIG.CSV.REQUIRED_COLUMNS;
        
        // Verificar que todos los encabezados requeridos estén presentes
        for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
                console.error(`Missing required header: ${required}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Valida la estructura del CSV
     * @param {Array<Object>} data - Datos parseados
     * @returns {boolean} - True si la estructura es válida
     */
    validateCSVStructure(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return false;
        }

        // Verificar que al menos una fila tenga datos
        const firstRow = data[0];
        if (!firstRow || typeof firstRow !== 'object') {
            return false;
        }

        // Verificar que tenga las columnas requeridas
        const requiredColumns = CONFIG.CSV.REQUIRED_COLUMNS;
        for (const column of requiredColumns) {
            if (!(column in firstRow)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Devuelve columnas requeridas faltantes en base a la primera fila de datos
     * @param {Array<Object>} data
     * @returns {string[]}
     */
    getMissingColumns(data) {
        try {
            if (!Array.isArray(data) || data.length === 0) return CONFIG.CSV.REQUIRED_COLUMNS.slice();
            const firstRow = data[0] || {};
            const present = new Set(Object.keys(firstRow));
            const missing = [];
            for (const col of CONFIG.CSV.REQUIRED_COLUMNS) {
                if (!present.has(col)) missing.push(col);
            }
            return missing;
        } catch {
            return CONFIG.CSV.REQUIRED_COLUMNS.slice();
        }
    }

    /**
     * Procesa los datos raw del CSV
     * @param {Array<Object>} rawData - Datos raw del CSV
     * @returns {Array<Object>} - Datos procesados
     */
    processRawData(rawData) {
        const processedData = rawData.map((row, index) => {
            try {
                return {
                    id: index + 1,
                    raw: row,
                    // Mantener datos originales para referencia
                    ID_Transaccion: row.ID_Transaccion?.toString().trim(),
                    Fecha: row.Fecha?.toString().trim(),
                    ID_Producto: row.ID_Producto?.toString().trim(),
                    Nombre_Producto: row.Nombre_Producto?.toString().trim(),
                    Categoria: row.Categoria?.toString().trim(),
                    Cantidad: row.Cantidad?.toString().trim(),
                    Precio_Unitario: row.Precio_Unitario?.toString().trim(),
                    Total_Venta: row.Total_Venta?.toString().trim(),
                    Pais: row.Pais?.toString().trim(),
                    Metodo_Pago: row.Metodo_Pago?.toString().trim()
                };
            } catch (error) {
                console.warn(`Error processing row ${index + 1}:`, error);
                return null;
            }
        }).filter(row => row !== null);

        return processedData;
    }

    /**
     * Limpia la información del archivo
     */
    clearFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }

        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }

    /**
     * Obtiene estadísticas del archivo cargado
     * @param {Array<Object>} data - Datos cargados
     * @returns {Object} - Estadísticas del archivo
     */
    getFileStats(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                columns: 0
            };
        }

        const totalRows = data.length;
        const validRows = data.filter(row => row && typeof row === 'object').length;
        const invalidRows = totalRows - validRows;
        const columns = CONFIG.CSV.REQUIRED_COLUMNS.length;

        return {
            totalRows,
            validRows,
            invalidRows,
            columns,
            fileSize: this.fileInput?.files[0]?.size || 0,
            fileName: this.fileInput?.files[0]?.name || 'Unknown'
        };
    }
}

// Crear instancia global del cargador
const dataLoader = new DataLoader();
