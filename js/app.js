// ======================================================
// SIS-OPERACIONES GCM 12
// Frontend conectado a Google Sheets mediante Apps Script.
// ======================================================

// Sin usuarios locales de producción.
// Los usuarios reales se cargan desde Google Sheets.
const usuariosDemo = [];

const STORAGE_USUARIOS = "gcm12_usuarios";

let usuariosSistema = cargarUsuariosSistema();

const STORAGE_OPERACIONES = "gcm12_operaciones";
const STORAGE_RESULTADOS = "gcm12_resultados";
const STORAGE_AUDITORIA = "gcm12_auditoria";
const STORAGE_SESSION_TOKEN = "gcm12_session_token";
let sessionToken = localStorage.getItem(STORAGE_SESSION_TOKEN) || "";

const STORAGE_OPERACION_PENDIENTE_ID = "gcm12_operacion_pendiente_id";
let guardandoOperacion = false;

const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 30 minutos
let temporizadorInactividad = null;
let ultimaActividadUsuario = Date.now();

const EVENTOS_ACTIVIDAD_USUARIO = [
    "click",
    "keydown",
    "touchstart",
    "input",
    "change",
    "scroll"
];

const API_URL = "https://script.google.com/macros/s/AKfycbx9X5R_bV3iShqXY7zFcfmEJRCMcrrOPfBbQiXQte1NAf9Z9_HUnIAopSLsRuKaL_gM/exec";
const USAR_GOOGLE_SHEETS = true;

let operacionesSistema = cargarOperacionesSistema();
let resultadosSistema = cargarResultadosSistema();
let auditoriaSistema = cargarAuditoriaSistema();
let operacionEditandoId = null;
let reporteDetallado = false;

let contadorLoaderGlobal = 0;

const PAGE_SIZE_OPERACIONES = 50;

let paginacionOperacionesAdmin = {
    page: 1,
    pageSize: PAGE_SIZE_OPERACIONES,
    total: 0,
    totalPages: 1
};

let paginacionMisOperaciones = {
    page: 1,
    pageSize: PAGE_SIZE_OPERACIONES,
    total: 0,
    totalPages: 1
};

function mostrarLoaderGlobal(texto = "Procesando información...") {
    const loader = document.getElementById("globalLoader");
    const loaderText = document.getElementById("globalLoaderText");

    if (!loader) return;

    contadorLoaderGlobal++;

    if (loaderText) {
        loaderText.textContent = texto;
    }

    loader.classList.remove("hidden");
}

function ocultarLoaderGlobal() {
    const loader = document.getElementById("globalLoader");

    if (!loader) return;

    contadorLoaderGlobal = Math.max(0, contadorLoaderGlobal - 1);

    if (contadorLoaderGlobal === 0) {
        loader.classList.add("hidden");
    }
}

function resetearLoaderGlobal() {
    const loader = document.getElementById("globalLoader");

    contadorLoaderGlobal = 0;

    if (loader) {
        loader.classList.add("hidden");
    }
}

function cargarOperacionesSistema() {
    const data = localStorage.getItem(STORAGE_OPERACIONES);

    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al leer operaciones:", error);
        }
    }

    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify([]));
    return [];
}

function cargarResultadosSistema() {
    const data = localStorage.getItem(STORAGE_RESULTADOS);

    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al leer resultados:", error);
        }
    }

    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify([]));
    return [];
}

function guardarOperacionesSistema() {
    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify(operacionesSistema));
}

function guardarResultadosSistema() {
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify(resultadosSistema));
}

function cargarAuditoriaSistema() {
    const data = localStorage.getItem(STORAGE_AUDITORIA);

    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al leer auditoría:", error);
        }
    }

    localStorage.setItem(STORAGE_AUDITORIA, JSON.stringify([]));
    return [];
}

function guardarAuditoriaSistema() {
    localStorage.setItem(STORAGE_AUDITORIA, JSON.stringify(auditoriaSistema));
}

function cargarUsuariosSistema() {
    const data = localStorage.getItem(STORAGE_USUARIOS);

    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al leer usuarios del localStorage:", error);
        }
    }

    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify([]));
    return [];
}

function guardarUsuariosSistema() {
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuariosSistema));
}
function leerJsonStorage(clave, valorPorDefecto) {
    const data = localStorage.getItem(clave);

    if (!data) return valorPorDefecto;

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error leyendo ${clave}:`, error);
        return valorPorDefecto;
    }
}

function recargarDatosDesdeStorage() {
    usuariosSistema = leerJsonStorage(STORAGE_USUARIOS, []);
    operacionesSistema = leerJsonStorage(STORAGE_OPERACIONES, []);
    resultadosSistema = leerJsonStorage(STORAGE_RESULTADOS, []);
    auditoriaSistema = leerJsonStorage(STORAGE_AUDITORIA, []);
}


const subtiposOperacion = {
    "DEFENSA EXTERNA": [],
    "AMBITO INTERNO": [
        "CAMEX (Patrullaje y Controles militares)",
        "Apoyo a PN en CRS (Seguridad)",
        "CAMEX CRS Intervención",
        "Reconocimiento ofensivo",
        "Apoyo al CNE",
        "Apoyo al ARCH",
        "Apoyo al SENAE",
        "Apoyo al ARCOM",
        "Apoyo al SNGRE",
        "Apoyo al ECU 911",
        "Seguridad oleoducto, bloques y estaciones petroleras",
        "Protección de altas autoridades nacionales e internacionales"
    ]
};

const categoriasResultados = {
    "Armas de fuego cortas": {
        subcategorias: ["Pistola", "Revólver", "Otras armas cortas"],
        unidades: ["unidades"]
    },
    "Armas de fuego largas": {
        subcategorias: ["Fusil", "Carabina", "Escopeta", "RPG-7", "Francotirador", "Otras armas largas"],
        unidades: ["unidades"]
    },
    "Armas blancas": {
        subcategorias: ["Cuchillo", "Navaja", "Machete", "Puñal", "Otras armas blancas"],
        unidades: ["unidades"]
    },
    "Armas de fuego no letales": {
        subcategorias: ["Traumáticas"],
        unidades: ["unidades"]
    },
    "Armas no letales": {
        subcategorias: [
            "Eléctrica",
            "Aire comprimido",
            "Gas pimienta",
            "Toletes",
            "Bastones",
            "Otras armas no letales"
        ],
        unidades: ["unidades"]
    },
    "Municiones": {
        subcategorias: ["9 mm", "5.56 mm", "7.62 mm", "Otras municiones"],
        unidades: ["unidades"]
    },
    "Munición percutida": {
        subcategorias: ["9 mm percutida", "5.56 mm percutida", "7.62 mm percutida", "Otra munición percutida"],
        unidades: ["unidades"]
    },
    "Alimentadoras": {
        subcategorias: ["Corto alcance", "Largo alcance", "Otra alimentadora"],
        unidades: ["unidades"]
    },
    "Accesorios de armas": {
        subcategorias: ["Accesorio de arma", "Otros accesorios de armas"],
        unidades: ["unidades"]
    },
    "Explosivos": {
        subcategorias: ["Cargas explosivas", "Cápsulas detonantes", "Mecha lenta", "Minas", "Otros explosivos"],
        unidades: ["unidades", "metros", "kilogramos"]
    },
    "Granadas": {
        subcategorias: ["Granada de mano", "Granada 40 mm", "Granada incendiaria", "Granada fragmentaria", "Otras granadas"],
        unidades: ["unidades"]
    },
    "Dinero efectivo": {
        subcategorias: ["Dólares americanos", "Otra moneda"],
        unidades: ["dólares americanos"]
    },
    "Sustancias catalogadas sujetas a fiscalización": {
        subcategorias: ["Clorhidrato de cocaína", "Marihuana", "Heroína", "Otras sustancias"],
        unidades: ["gramos", "kilogramos"]
    },
    "Teléfonos celulares": {
        subcategorias: ["Teléfono celular"],
        unidades: ["unidades"]
    },
    "Accesorios celulares": {
        subcategorias: ["Cargadores", "Cables USB", "Chips", "Audífonos", "Otros accesorios celulares"],
        unidades: ["unidades"]
    },
    "Equipos de comunicación": {
        subcategorias: ["Radios portátiles", "Radios móviles vehiculares", "Otros equipos de comunicación"],
        unidades: ["unidades"]
    },
    "Equipos de videovigilancia": {
        subcategorias: ["Cámaras", "Drones", "DVR", "Otros equipos de videovigilancia"],
        unidades: ["unidades"]
    },
    "Equipos de red": {
        subcategorias: ["Módem", "Router", "Cable de red", "Fibra óptica", "Antena satelital", "Otros equipos de red"],
        unidades: ["unidades", "metros"]
    },
    "Equipamiento táctico": {
        subcategorias: [
            "Chalecos antibalas",
            "Uniformes militares/policiales",
            "Otras prendas militares o policiales",
            "Esposas",
            "Otros equipos tácticos"
        ],
        unidades: ["unidades"]
    },
    "Combustible": {
        subcategorias: ["Diésel", "Gasolina", "Derivados"],
        unidades: ["galones", "litros"]
    },
    "Vehículos y maquinaria": {
        subcategorias: ["Motocicleta", "Vehículo", "Tanquero", "Camión", "Maquinaria pesada", "Otros vehículos o maquinaria"],
        unidades: ["unidades"]
    },
    "Personas aprehendidas": {
        subcategorias: ["Persona aprehendida"],
        unidades: ["personas"]
    },
    "Bebidas alcohólicas": {
        subcategorias: ["Bebidas alcohólicas"],
        unidades: ["litros"]
    },
    "Tabacos": {
        subcategorias: ["Tabacos"],
        unidades: ["unidades"]
    },
    "Otros objetos": {
        subcategorias: ["Balanzas", "Pipas", "Herramientas eléctricas", "Herramientas manuales", "Documentación", "Otros objetos"],
        unidades: ["unidades"]
    }
};
const ubicacionCatalogo = {
    provincia: "MANABÍ",
    cantones: [
        "PORTOVIEJO",
        "ROCAFUERTE",
        "JUNÍN",
        "24 DE MAYO",
        "SANTA ANA",
        "PAJÁN",
        "OLMEDO",
        "PICHINCHA",
        "MANTA"
    ],
    parroquiasPorCanton: {
        "PORTOVIEJO": [
            "12 DE MARZO",
            "18 DE OCTUBRE",
            "ANDRÉS DE VERA",
            "COLÓN",
            "FRANCISCO PACHECO",
            "PICOAZÁ",
            "PORTOVIEJO",
            "SAN PABLO",
            "SIMÓN BOLÍVAR",
            "ABDÓN CALDERÓN",
            "ALHAJUELA",
            "CHIRIJOS",
            "CRUCITA",
            "PUEBLO NUEVO",
            "RIOCHICO",
            "SAN PLÁCIDO"
        ],
        "ROCAFUERTE": ["ROCAFUERTE"],
        "JUNÍN": ["JUNÍN"],
        "24 DE MAYO": [
            "SUCRE",
            "BELLAVISTA",
            "NOBOA",
            "ARQ. SIXTO DURÁN BALLÉN"
        ],
        "SANTA ANA": [
            "SANTA ANA",
            "LODANA",
            "AYACUCHO",
            "HONORATO VÁSQUEZ",
            "LA UNIÓN",
            "SAN PABLO DE PUEBLO NUEVO"
        ],
        "PAJÁN": [
            "PAJÁN",
            "CAMPOZANO",
            "CASCOL",
            "GUALE",
            "LASCANO"
        ],
        "OLMEDO": ["OLMEDO"],
        "PICHINCHA": [
            "PICHINCHA",
            "BARRAGANETE",
            "SAN SEBASTIÁN"
        ],
        "MANTA": []
    }
};

const menuPorRol = {
    ADMIN: [
        { id: "inicioPage", title: "Inicio", subtitle: "Panel general del administrador", label: "Inicio" },
        { id: "usuariosPage", title: "Usuarios", subtitle: "Gestión de usuarios y roles", label: "Usuarios" },
        { id: "registrarPage", title: "Registrar operación", subtitle: "Registro de operaciones militares", label: "Registrar operación" },
        { id: "operacionesPage", title: "Operaciones", subtitle: "Administración general de operaciones", label: "Operaciones" },
        { id: "dashboardPage", title: "Dashboard", subtitle: "Estadísticas operacionales", label: "Dashboard" },
        { id: "reportesPage", title: "Reportes", subtitle: "Consulta y exportación de información", label: "Reportes" },
        { id: "auditoriaPage", title: "Auditoría", subtitle: "Historial de acciones del sistema", label: "Auditoría" }
    ],
    COMANDANTE_ECO: [
        { id: "inicioPage", title: "Inicio", subtitle: "Panel del comandante de eco", label: "Inicio" },
        { id: "registrarPage", title: "Registrar operación", subtitle: "Registro de operaciones y resultados", label: "Registrar operación" },
        { id: "misOperacionesPage", title: "Mis operaciones", subtitle: "Operaciones registradas por el usuario", label: "Mis operaciones" }
    ],
    COMANDANTE_UNIDAD: [
        { id: "dashboardPage", title: "Dashboard", subtitle: "Estadísticas generales de operaciones", label: "Dashboard" },
        { id: "reportesPage", title: "Reportes", subtitle: "Consulta y exportación de información", label: "Reportes" }
    ]
};

let usuarioActual = null;
let resultadosTemporales = [];
let mapaOperacion = null;
let marcadorOperacion = null;
let coordenadasSeleccionadasMapa = null;

// Elementos principales
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const menu = document.getElementById("menu");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");

const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeText = document.getElementById("welcomeText");

// Formulario operación
const tipoOperacion = document.getElementById("tipoOperacion");
const subTipoOperacion = document.getElementById("subTipoOperacion");
const huboResultados = document.getElementById("huboResultados");
const resultadosBlock = document.getElementById("resultadosBlock");

const categoriaResultado = document.getElementById("categoriaResultado");
const subcategoriaResultado = document.getElementById("subcategoriaResultado");
const unidadMedida = document.getElementById("unidadMedida");
const agregarResultadoBtn = document.getElementById("agregarResultadoBtn");
const resultadosTableBody = document.getElementById("resultadosTableBody");

const cantonSelect = document.getElementById("canton");
const parroquiaSelect = document.getElementById("parroquia");
const ubicacionBtn = document.getElementById("ubicacionBtn");
const geoStatus = document.getElementById("geoStatus");

const operacionForm = document.getElementById("operacionForm");
const formMessage = document.getElementById("formMessage");

document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarCantones();
    configurarFormularioMobile();
    configurarGestionUsuarios();
    configurarMisOperaciones();
    configurarAdministrarOperaciones();
    configurarDashboard();
    configurarReportes();
    configurarAuditoria();

    configurarModalAccionAdmin();

    configurarMapaOperacion();

    configurarMenuCuenta();
    configurarModalPassword();
    configurarModalResetPassword();

    migrarRolesAntiguos();
    migrarCamposPasswordUsuarios();
    aplicarIconosDashboard();

    configurarAcordeonResultadosDashboard();

    renderUsuariosAdmin();
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
    renderReportes();
    renderAuditoria();

    restaurarSesionGuardada();
});
ubicacionBtn.addEventListener("click", () => {
    const coordenadasInput = document.getElementById("coordenadas");

    if (!navigator.geolocation) {
        geoStatus.textContent = "Este navegador no permite obtener ubicación. Ingrese las coordenadas manualmente.";
        geoStatus.style.color = "#B42318";
        return;
    }

    if (!window.isSecureContext) {
        geoStatus.textContent = "La ubicación solo funciona en HTTPS o localhost. Publique en Netlify o pruebe con Live Server.";
        geoStatus.style.color = "#B42318";
        return;
    }

    ubicacionBtn.disabled = true;
    ubicacionBtn.textContent = "Obteniendo...";
    geoStatus.textContent = "Obteniendo ubicación actual. Espere unos segundos...";
    geoStatus.style.color = "#666272";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const accuracy = Math.round(position.coords.accuracy || 0);

            coordenadasInput.value = `${lat}, ${lng}`;
            const sectorInput = document.getElementById("sector");

            if (sectorInput && !sectorInput.value.trim()) {
                sectorInput.value = "Ubicación GPS actual";
            }

            geoStatus.textContent = `Ubicación capturada correctamente. Precisión aproximada: ${accuracy} m.`;
            geoStatus.style.color = "#2F6B3F";

            ubicacionBtn.disabled = false;
            ubicacionBtn.textContent = "Actualizar ubicación";
        },
        (error) => {
            let mensaje = "No se pudo obtener la ubicación. Puede ingresarla manualmente.";

            if (error.code === error.PERMISSION_DENIED) {
                mensaje = "Permiso de ubicación denegado. Active la ubicación del navegador o ingrese las coordenadas manualmente.";
            }

            if (error.code === error.POSITION_UNAVAILABLE) {
                mensaje = "Ubicación no disponible. Revise que el GPS esté activo o ingrese las coordenadas manualmente.";
            }

            if (error.code === error.TIMEOUT) {
                mensaje = "El GPS tardó demasiado. Intente nuevamente o ingrese las coordenadas manualmente.";
            }

            geoStatus.textContent = mensaje;
            geoStatus.style.color = "#B42318";

            ubicacionBtn.disabled = false;
            ubicacionBtn.textContent = "Usar ubicación";
        },
        {
            enableHighAccuracy: true,
            timeout: 25000,
            maximumAge: 30000
        }
    );
});
// LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginBtn = loginForm.querySelector('button[type="submit"]');

    loginError.textContent = "";

    if (!usuario || !password) {
        loginError.textContent = "Ingrese usuario y contraseña.";
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = "Validando...";
    }

    try {
        const resultadoLogin = await apiPost("LOGIN", {
            usuario,
            password
        });

        if (!resultadoLogin.autorizado) {
            loginError.textContent = resultadoLogin.mensaje || "Credenciales incorrectas.";
            return;
        }

        usuarioActual = { ...resultadoLogin.usuario };
        localStorage.setItem("gcm12_usuario_actual", JSON.stringify(usuarioActual));

        sessionToken = resultadoLogin.session_token || "";

        if (!sessionToken) {
            throw new Error("No se recibió token de sesión.");
        }

        localStorage.setItem(STORAGE_SESSION_TOKEN, sessionToken);

        limpiarDatosOperativosEnMemoria();

        iniciarSistema();

        mostrarAvisoPasswordReseteada();

        cargarDatosInicialesEnSegundoPlano();

        apiPost("UPDATE_LAST_ACCESS", {
            id_usuario: usuarioActual.id_usuario
        }).catch((error) => {
            console.warn("No se pudo actualizar último acceso:", error);
        });

    } catch (error) {
        console.error("Error login :", error);
        loginError.textContent = `No se pudo iniciar sesión: ${error.message}`;
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = "Iniciar sesión";
        }
    }
});

logoutBtn.addEventListener("click", () => {
    detenerActualizacionAutomaticaSheets();
    detenerControlInactividad();
    resetearLoaderGlobal();

    usuarioActual = null;
    sessionToken = "";
    resultadosTemporales = [];

    localStorage.removeItem("gcm12_usuario_actual");
    localStorage.removeItem(STORAGE_SESSION_TOKEN);

    loginForm.reset();
    loginError.textContent = "";

    appView.classList.add("hidden");
    loginView.classList.remove("hidden");
});

// INICIAR SISTEMA
function iniciarSistema() {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");

    const nombreCompleto = `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`;

    userName.textContent = nombreCompleto;
    userRole.textContent = usuarioActual.rol;

    document.getElementById("responsable").value = `${usuarioActual.nombres} ${usuarioActual.apellidos}`;
    document.getElementById("gradoResponsable").value = usuarioActual.grado;

    welcomeTitle.textContent = `Bienvenido, ${nombreCompleto}`;
    welcomeText.textContent = `Rol asignado: ${usuarioActual.rol}.`;

    construirMenu(usuarioActual.rol);
    iniciarActualizacionAutomaticaSheets();
    iniciarControlInactividad();
}

async function restaurarSesionGuardada() {
    const data = localStorage.getItem("gcm12_usuario_actual");

    const tokenGuardado = localStorage.getItem(STORAGE_SESSION_TOKEN);

    if (!data) return;

    if (!tokenGuardado) {
        localStorage.removeItem("gcm12_usuario_actual");
        return;
    }

    sessionToken = tokenGuardado;



    try {
        usuarioActual = JSON.parse(data);

        if (!usuarioActual || !usuarioActual.id_usuario || !usuarioActual.rol) {
            localStorage.removeItem("gcm12_usuario_actual");
            usuarioActual = null;
            return;
        }

        const usuarios = await obtenerUsuariosDesdeGoogleSheets();

        const usuarioVigente = usuarios.find((u) => {
            return String(u.id_usuario) === String(usuarioActual.id_usuario);
        });

        if (!usuarioVigente) {
            cerrarSesionForzada("El usuario ya no existe en el sistema.");
            return;
        }

        if (usuarioVigente.estado !== "ACTIVO") {
            cerrarSesionForzada("El usuario se encuentra inactivo. Contacte al administrador.");
            return;
        }

        usuarioActual = { ...usuarioVigente };
        localStorage.setItem("gcm12_usuario_actual", JSON.stringify(usuarioActual));

        iniciarSistema();

        cargarDatosInicialesEnSegundoPlano();

    } catch (error) {
        console.error("Error restaurando sesión:", error);
        localStorage.removeItem("gcm12_usuario_actual");
        usuarioActual = null;
    }
}

// MENÚ POR ROL
function construirMenu(rol) {
    menu.innerHTML = "";

    const opciones = menuPorRol[rol] || [];

    opciones.forEach((item, index) => {
        const button = document.createElement("button");
        button.textContent = item.label;
        button.dataset.page = item.id;

        if (index === 0) {
            button.classList.add("active");
            mostrarPagina(item.id, item.title, item.subtitle);
        }

        button.addEventListener("click", () => {
            if (!usuarioTieneAccesoPagina(item.id)) {
                alert("No tiene permisos para acceder a esta sección.");
                return;
            }

            document.querySelectorAll(".menu button").forEach((b) => b.classList.remove("active"));
            button.classList.add("active");

            mostrarPagina(item.id, item.title, item.subtitle);
        });

        menu.appendChild(button);
    });
}

function mostrarPagina(pageId, title, subtitle) {
    if (usuarioActual && !usuarioTieneAccesoPagina(pageId)) {
        alert("No tiene permisos para acceder a esta sección.");
        redirigirAPaginaInicialRol();
        return;
    }
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    pageTitle.textContent = title;
    pageSubtitle.textContent = subtitle;
    recargarDatosDesdeStorage();

    renderPaginaActiva();

    cargarDatosDePagina(pageId);
}

function mostrarEstadoCargaPagina(texto = "") {
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (!pageSubtitle) return;

    if (texto) {
        pageSubtitle.dataset.originalText = pageSubtitle.dataset.originalText || pageSubtitle.textContent;
        pageSubtitle.textContent = texto;
        return;
    }

    if (pageSubtitle.dataset.originalText) {
        pageSubtitle.textContent = pageSubtitle.dataset.originalText;
        delete pageSubtitle.dataset.originalText;
    }
}

function usuarioTieneAccesoPagina(pageId) {
    if (!usuarioActual || !usuarioActual.rol) return false;

    const opciones = menuPorRol[usuarioActual.rol] || [];

    return opciones.some((item) => item.id === pageId);
}

function obtenerPrimeraPaginaRol(rol) {
    const opciones = menuPorRol[rol] || [];
    return opciones.length > 0 ? opciones[0] : null;
}

function redirigirAPaginaInicialRol() {
    if (!usuarioActual) return;

    const paginaInicial = obtenerPrimeraPaginaRol(usuarioActual.rol);

    if (!paginaInicial) {
        cerrarSesionForzada("No existe una página inicial configurada para este rol.");
        return;
    }

    mostrarPagina(
        paginaInicial.id,
        paginaInicial.title,
        paginaInicial.subtitle
    );
}

function iniciarControlInactividad() {
    detenerControlInactividad();

    ultimaActividadUsuario = Date.now();

    EVENTOS_ACTIVIDAD_USUARIO.forEach((evento) => {
        document.addEventListener(evento, registrarActividadUsuario, true);
    });

    programarCierrePorInactividad();
}

function detenerControlInactividad() {
    if (temporizadorInactividad) {
        clearTimeout(temporizadorInactividad);
        temporizadorInactividad = null;
    }

    EVENTOS_ACTIVIDAD_USUARIO.forEach((evento) => {
        document.removeEventListener(evento, registrarActividadUsuario, true);
    });
}

function registrarActividadUsuario() {
    if (!usuarioActual) return;

    ultimaActividadUsuario = Date.now();
    programarCierrePorInactividad();
}

function programarCierrePorInactividad() {
    if (!usuarioActual) return;

    if (temporizadorInactividad) {
        clearTimeout(temporizadorInactividad);
    }

    temporizadorInactividad = setTimeout(() => {
        verificarCierrePorInactividad();
    }, TIEMPO_INACTIVIDAD_MS);
}

function verificarCierrePorInactividad() {
    if (!usuarioActual) return;

    const tiempoSinActividad = Date.now() - ultimaActividadUsuario;

    if (tiempoSinActividad >= TIEMPO_INACTIVIDAD_MS) {
        cerrarSesionForzada("Sesión cerrada automáticamente por inactividad.");
        return;
    }

    const tiempoRestante = TIEMPO_INACTIVIDAD_MS - tiempoSinActividad;

    temporizadorInactividad = setTimeout(() => {
        verificarCierrePorInactividad();
    }, tiempoRestante);
}

function cerrarSesionForzada(mensaje = "La sesión ya no es válida. Inicie sesión nuevamente.") {
    detenerActualizacionAutomaticaSheets();
    detenerControlInactividad();
    resetearLoaderGlobal();

    usuarioActual = null;
    sessionToken = "";
    resultadosTemporales = [];

    localStorage.removeItem("gcm12_usuario_actual");
    localStorage.removeItem(STORAGE_SESSION_TOKEN);

    appView.classList.add("hidden");
    loginView.classList.remove("hidden");

    loginForm.reset();
    loginError.textContent = mensaje;
}

// SUBTIPOS POR TIPO DE OPERACIÓN
tipoOperacion.addEventListener("change", () => {
    const tipo = tipoOperacion.value;
    const opciones = subtiposOperacion[tipo] || [];

    subTipoOperacion.innerHTML = "";

    if (opciones.length === 0) {
        subTipoOperacion.innerHTML = `<option value="">Sin subtipos configurados</option>`;
        return;
    }

    subTipoOperacion.innerHTML = `<option value="">Seleccione...</option>`;

    opciones.forEach((subtipo) => {
        const option = document.createElement("option");
        option.value = subtipo;
        option.textContent = subtipo;
        subTipoOperacion.appendChild(option);
    });
});

// MOSTRAR / OCULTAR RESULTADOS
huboResultados.addEventListener("change", () => {
    if (huboResultados.value === "SI") {
        resultadosBlock.classList.remove("hidden");
    } else {
        resultadosBlock.classList.add("hidden");
        resultadosTemporales = [];
        renderResultados();
    }
});

// CATEGORÍAS
function cargarCategorias() {
    categoriaResultado.innerHTML = `<option value="">Seleccione...</option>`;

    Object.keys(categoriasResultados).forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        categoriaResultado.appendChild(option);
    });
}

categoriaResultado.addEventListener("change", () => {
    const categoria = categoriaResultado.value;
    const data = categoriasResultados[categoria];

    subcategoriaResultado.innerHTML = `<option value="">Seleccione...</option>`;
    unidadMedida.innerHTML = `<option value="">Seleccione...</option>`;

    if (!data) return;

    data.subcategorias.forEach((subcat) => {
        const option = document.createElement("option");
        option.value = subcat;
        option.textContent = subcat;
        subcategoriaResultado.appendChild(option);
    });

    data.unidades.forEach((unidad) => {
        const option = document.createElement("option");
        option.value = unidad;
        option.textContent = unidad;
        unidadMedida.appendChild(option);
    });
});

// AGREGAR RESULTADO TEMPORAL
agregarResultadoBtn.addEventListener("click", () => {
    const categoria = categoriaResultado.value;
    const subcategoria = subcategoriaResultado.value;
    const cantidad = Number(document.getElementById("cantidadResultado").value);
    const unidad = unidadMedida.value;
    const descripcion = document.getElementById("descripcionResultado").value.trim();

    if (!categoria || !subcategoria || !cantidad || cantidad <= 0 || !unidad) {
        mostrarMensaje("Complete categoría, subcategoría, cantidad válida y unidad de medida.", "error");
        return;
    }

    resultadosTemporales.push({
        categoria,
        subcategoria,
        cantidad,
        unidad,
        descripcion
    });

    categoriaResultado.value = "";
    subcategoriaResultado.innerHTML = `<option value="">Seleccione categoría...</option>`;
    unidadMedida.innerHTML = `<option value="">Seleccione categoría...</option>`;
    document.getElementById("cantidadResultado").value = "";
    document.getElementById("descripcionResultado").value = "";

    renderResultados();
    mostrarMensaje("Resultado agregado temporalmente.", "success");
});

function renderResultados() {
    resultadosTableBody.innerHTML = "";

    if (resultadosTemporales.length === 0) {
        resultadosTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">Sin resultados agregados</td>
      </tr>
    `;
        return;
    }

    resultadosTemporales.forEach((resultado, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${resultado.categoria}</td>
      <td>${resultado.subcategoria}</td>
      <td>${resultado.cantidad}</td>
      <td>${resultado.unidad}</td>
      <td>
        <button type="button" class="btn btn-outline-dark" onclick="eliminarResultado(${index})">
          Quitar
        </button>
      </td>
    `;

        resultadosTableBody.appendChild(tr);
    });
}

function eliminarResultado(index) {
    resultadosTemporales.splice(index, 1);
    renderResultados();
}

// GUARDAR OPERACIÓN 
operacionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const guardarBtn = document.getElementById("guardarOperacionBtn");

    if (!usuarioActual) {
        mostrarMensaje("No existe una sesión activa.", "error");
        return;
    }

    if (huboResultados.value === "SI") {
        const parroquia = document.getElementById("parroquia").value.trim();
        const sector = document.getElementById("sector").value.trim();
        const coordenadas = document.getElementById("coordenadas").value.trim();
        const canton = document.getElementById("canton").value;

        if (canton !== "MANTA" && !parroquia) {
            mostrarMensaje("Si hubo resultados, la parroquia es obligatoria.", "error");
            return;
        }

        if (!sector || !coordenadas) {
            mostrarMensaje("Si hubo resultados, sector y coordenadas son obligatorios.", "error");
            return;
        }

        if (resultadosTemporales.length === 0) {
            mostrarMensaje("Debe agregar al menos un resultado.", "error");
            return;
        }
    }

    if (guardandoOperacion) {
        mostrarMensaje("La operación ya se está guardando. Espere unos segundos.", "error");
        return;
    }

    guardandoOperacion = true;

    if (guardarBtn) {
        guardarBtn.disabled = true;
        guardarBtn.textContent = operacionEditandoId ? "Actualizando..." : "Guardando...";
    }

    try {
        if (operacionEditandoId) {
            await actualizarOperacionExistente();
        } else {
            await crearNuevaOperacion();
        }
    } catch (error) {
        console.error("Error al guardar operación:", error);

        mostrarMensaje(
            "No se pudo confirmar el guardado. Revise antes de intentar nuevamente.",
            "error"
        );
    } finally {
        guardandoOperacion = false;

        if (guardarBtn) {
            guardarBtn.disabled = false;
            guardarBtn.textContent = operacionEditandoId ? "Actualizar operación" : "Guardar operación";
        }
    }
});

async function crearNuevaOperacion() {
    const idOperacion = obtenerIdOperacionPendiente();
    const fechaActual = new Date().toISOString();

    const operacion = {
        id_operacion: idOperacion,
        fecha_operacion: document.getElementById("fechaOperacion").value,
        hora_inicio: document.getElementById("horaInicio").value,
        hora_fin: document.getElementById("horaFin").value,
        tipo_operacion: tipoOperacion.value,
        sub_tipo_operacion: subTipoOperacion.value,
        provincia: document.getElementById("provincia").value.trim(),
        canton: document.getElementById("canton").value.trim(),
        parroquia: document.getElementById("parroquia").value.trim(),
        sector: document.getElementById("sector").value.trim(),
        coordenadas: document.getElementById("coordenadas").value.trim(),
        responsable: `${usuarioActual.nombres} ${usuarioActual.apellidos}`,
        grado_responsable: usuarioActual.grado,
        num_oficiales: Number(document.getElementById("numOficiales").value),
        num_vol: Number(document.getElementById("numVol").value),
        num_sldr: Number(document.getElementById("numSldr").value),
        hubo_resultados: huboResultados.value,
        estado_operacion: "REGISTRADO",
        registrado_por: `${usuarioActual.nombres} ${usuarioActual.apellidos}`,
        id_usuario_registro: usuarioActual.id_usuario,
        usuario_cedula: usuarioActual.usuario,
        fecha_registro: fechaActual,
        ultima_modificacion: fechaActual,
        observacion_general: document.getElementById("observacionGeneral").value.trim(),
        observacion_admin: "",
        motivo_anulacion: "",
        validado_por: "",
        fecha_validacion: "",
        observado_por: "",
        fecha_observacion: "",
        anulado_por: "",
        fecha_anulacion: "",
        corregido_por: "",
        fecha_correccion_observacion: ""
    };

    const resultados = [];

    if (huboResultados.value === "SI") {
        resultadosTemporales.forEach((resultado) => {
            resultados.push({
                id_resultado: generarIdResultado(),
                id_operacion: idOperacion,
                categoria: resultado.categoria,
                subcategoria: resultado.subcategoria,
                cantidad: resultado.cantidad,
                unidad_medida: resultado.unidad,
                descripcion: resultado.descripcion,
                registrado_por: `${usuarioActual.nombres} ${usuarioActual.apellidos}`,
                fecha_registro: fechaActual
            });
        });
    }

    await apiPost("SAVE_OPERATION", {
        operacion,
        resultados
    });

    registrarAuditoria(
        "CREAR",
        "OPERACIONES",
        idOperacion,
        `Registró operación ${operacion.tipo_operacion} - ${operacion.sub_tipo_operacion}`
    );

    await refrescarOperacionesDesdeGoogleSheets();

    limpiarIdOperacionPendiente();

    limpiarFormularioOperacion();

    mostrarMensaje("Operación guardada correctamente.", "success");
}

async function actualizarOperacionExistente() {
    const index = operacionesSistema.findIndex((op) => op.id_operacion === operacionEditandoId);

    if (index === -1) {
        mostrarMensaje("No se encontró la operación para actualizar.", "error");
        return;
    }

    const operacionActual = operacionesSistema[index];

    if (!puedeEditarOperacion(operacionActual)) {
        mostrarMensaje("No puede editar una operación validada o anulada.", "error");
        return;
    }

    const fechaActual = new Date().toISOString();
    const estabaObservada = operacionActual.estado_operacion === "OBSERVADO";

    const operacionActualizada = {
        ...operacionActual,
        fecha_operacion: document.getElementById("fechaOperacion").value,
        hora_inicio: document.getElementById("horaInicio").value,
        hora_fin: document.getElementById("horaFin").value,
        tipo_operacion: tipoOperacion.value,
        sub_tipo_operacion: subTipoOperacion.value,
        provincia: document.getElementById("provincia").value.trim(),
        canton: document.getElementById("canton").value.trim(),
        parroquia: document.getElementById("parroquia").value.trim(),
        sector: document.getElementById("sector").value.trim(),
        coordenadas: document.getElementById("coordenadas").value.trim(),
        num_oficiales: Number(document.getElementById("numOficiales").value),
        num_vol: Number(document.getElementById("numVol").value),
        num_sldr: Number(document.getElementById("numSldr").value),
        hubo_resultados: huboResultados.value,
        ultima_modificacion: fechaActual,
        estado_operacion: estabaObservada ? "REGISTRADO" : operacionActual.estado_operacion,
        corregido_por: estabaObservada && usuarioActual
            ? `${usuarioActual.nombres} ${usuarioActual.apellidos}`
            : operacionActual.corregido_por || "",
        fecha_correccion_observacion: estabaObservada
            ? fechaActual
            : operacionActual.fecha_correccion_observacion || "",
        observacion_general: document.getElementById("observacionGeneral").value.trim()
    };

    const resultados = [];

    if (huboResultados.value === "SI") {
        resultadosTemporales.forEach((resultado) => {
            resultados.push({
                id_resultado: generarIdResultado(),
                id_operacion: operacionEditandoId,
                categoria: resultado.categoria,
                subcategoria: resultado.subcategoria,
                cantidad: resultado.cantidad,
                unidad_medida: resultado.unidad,
                descripcion: resultado.descripcion,
                registrado_por: `${usuarioActual.nombres} ${usuarioActual.apellidos}`,
                fecha_registro: fechaActual
            });
        });
    }

    await apiPost("SAVE_OPERATION", {
        operacion: operacionActualizada,
        resultados
    });

    registrarAuditoria(
        estabaObservada ? "CORREGIR_OBSERVACION" : "EDITAR",
        "OPERACIONES",
        operacionEditandoId,
        estabaObservada
            ? "Corrigió operación observada y la devolvió a estado REGISTRADO"
            : "Actualizó operación registrada"
    );

    await refrescarOperacionesDesdeGoogleSheets();

    limpiarFormularioOperacion();

    mostrarMensaje("Operación actualizada correctamente.", "success");
}

function limpiarFormularioOperacion() {
    operacionForm.reset();

    document.getElementById("responsable").value = `${usuarioActual.nombres} ${usuarioActual.apellidos}`;
    document.getElementById("gradoResponsable").value = usuarioActual.grado;

    resultadosTemporales = [];
    renderResultados();
    resultadosBlock.classList.add("hidden");

    cargarCantones();
    parroquiaSelect.innerHTML = `<option value="">Seleccione cantón...</option>`;
    parroquiaSelect.disabled = false;

    if (!operacionEditandoId) {
        limpiarIdOperacionPendiente();
    }

    operacionEditandoId = null;

    const guardarBtn = document.getElementById("guardarOperacionBtn");
    if (guardarBtn) guardarBtn.textContent = "Guardar operación";

    mostrarObservacionCorreccionOperacion(null);

}

function generarIdOperacion() {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 9000) + 1000;

    return `OP-${yyyy}${mm}${dd}-${random}`;
}
function obtenerIdOperacionPendiente() {
    let idOperacion = sessionStorage.getItem(STORAGE_OPERACION_PENDIENTE_ID);

    if (!idOperacion) {
        idOperacion = generarIdOperacion();
        sessionStorage.setItem(STORAGE_OPERACION_PENDIENTE_ID, idOperacion);
    }

    return idOperacion;
}

function limpiarIdOperacionPendiente() {
    sessionStorage.removeItem(STORAGE_OPERACION_PENDIENTE_ID);
}

function generarIdResultado() {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 9000) + 1000;

    return `RES-${yyyy}${mm}${dd}-${random}`;
}

function mostrarMensaje(mensaje, tipo) {
    formMessage.textContent = mensaje;
    formMessage.className = `form-message ${tipo}`;

    setTimeout(() => {
        formMessage.textContent = "";
        formMessage.className = "form-message";
    }, 4500);
}

function cargarCantones() {
    cantonSelect.innerHTML = `<option value="">Seleccione...</option>`;

    ubicacionCatalogo.cantones.forEach((canton) => {
        const option = document.createElement("option");
        option.value = canton;
        option.textContent = canton;
        cantonSelect.appendChild(option);
    });
}

function configurarFormularioMobile() {
    const form = document.getElementById("operacionForm");

    form.addEventListener("reset", () => {
        setTimeout(() => {
            cargarCantones();
            parroquiaSelect.innerHTML = `<option value="">Seleccione cantón...</option>`;
            parroquiaSelect.disabled = false;
            resultadosTemporales = [];
            renderResultados();
            resultadosBlock.classList.add("hidden");
            geoStatus.textContent = "";

            operacionEditandoId = null;

            const guardarBtn = document.getElementById("guardarOperacionBtn");
            if (guardarBtn) guardarBtn.textContent = "Guardar operación";

            if (usuarioActual) {
                document.getElementById("responsable").value = `${usuarioActual.nombres} ${usuarioActual.apellidos}`;
                document.getElementById("gradoResponsable").value = usuarioActual.grado;
            }
        }, 0);
    });
}

cantonSelect.addEventListener("change", () => {
    const canton = cantonSelect.value;
    const parroquias = ubicacionCatalogo.parroquiasPorCanton[canton] || [];

    parroquiaSelect.innerHTML = "";

    if (canton === "MANTA") {
        parroquiaSelect.innerHTML = `<option value="">No aplica para este registro</option>`;
        parroquiaSelect.disabled = true;
        return;
    }

    parroquiaSelect.disabled = false;

    if (parroquias.length === 0) {
        parroquiaSelect.innerHTML = `<option value="">Sin parroquias configuradas</option>`;
        return;
    }

    parroquiaSelect.innerHTML = `<option value="">Seleccione...</option>`;

    parroquias.forEach((parroquia) => {
        const option = document.createElement("option");
        option.value = parroquia;
        option.textContent = parroquia;
        parroquiaSelect.appendChild(option);
    });
});

// =====================================================
// GESTIÓN DE USUARIOS - ADMIN
// =====================================================

function configurarGestionUsuarios() {
    const nuevoUsuarioBtn = document.getElementById("nuevoUsuarioBtn");
    const cancelarUsuarioBtn = document.getElementById("cancelarUsuarioBtn");
    const usuarioAdminForm = document.getElementById("usuarioAdminForm");
    const buscarUsuarioInput = document.getElementById("buscarUsuarioInput");
    const filtroRolUsuario = document.getElementById("filtroRolUsuario");
    const filtroEstadoUsuario = document.getElementById("filtroEstadoUsuario");
    const usuariosTableBody = document.getElementById("usuariosTableBody");
    const userCedulaInput = document.getElementById("userCedula");

    if (userCedulaInput) {
        userCedulaInput.addEventListener("input", () => {
            userCedulaInput.value = limpiarSoloNumeros(userCedulaInput.value, 10);
        });
    }

    if (!nuevoUsuarioBtn || !usuarioAdminForm) return;

    nuevoUsuarioBtn.addEventListener("click", abrirFormularioNuevoUsuario);

    cancelarUsuarioBtn.addEventListener("click", () => {
        cerrarFormularioUsuario();
    });

    usuarioAdminForm.addEventListener("submit", guardarUsuarioDesdeAdmin);

    buscarUsuarioInput.addEventListener("input", renderUsuariosAdmin);
    filtroRolUsuario.addEventListener("change", renderUsuariosAdmin);
    filtroEstadoUsuario.addEventListener("change", renderUsuariosAdmin);

    usuariosTableBody.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const idUsuario = button.dataset.id;
        const accion = button.dataset.action;

        if (accion === "editar") {
            abrirFormularioEditarUsuario(idUsuario);
        }

        if (accion === "estado") {
            cambiarEstadoUsuario(idUsuario);
        }

        if (accion === "eliminar") {
            eliminarUsuarioAdmin(idUsuario);
        }
        if (accion === "reset-password") {
            resetearPasswordUsuario(idUsuario);
        }
    });
}

function crearBotonAccion({
    action,
    id,
    icono,
    tipo = "neutral",
    titulo,
    disabled = false
}) {
    return `
        <button 
            type="button"
            class="icon-action ${tipo}"
            data-action="${action}"
            data-id="${id}"
            title="${titulo}"
            aria-label="${titulo}"
            ${disabled ? "disabled" : ""}
        >
            <iconify-icon icon="${icono}"></iconify-icon>
        </button>
    `;
}

function renderUsuariosAdmin() {
    const tbody = document.getElementById("usuariosTableBody");
    if (!tbody) return;

    const texto = (document.getElementById("buscarUsuarioInput")?.value || "").toLowerCase().trim();
    const rol = document.getElementById("filtroRolUsuario")?.value || "";
    const estado = document.getElementById("filtroEstadoUsuario")?.value || "";

    let usuariosFiltrados = usuariosSistema.filter((u) => {
        const nombreCompleto = `${u.nombres} ${u.apellidos} ${u.grado} ${u.usuario} ${u.correo || ""}`.toLowerCase();

        const coincideTexto = !texto || nombreCompleto.includes(texto);
        const coincideRol = !rol || u.rol === rol;
        const coincideEstado = !estado || u.estado === estado;

        return coincideTexto && coincideRol && coincideEstado;
    });

    tbody.innerHTML = "";

    if (usuariosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">No existen usuarios con esos filtros.</td>
            </tr>
        `;
        return;
    }

    usuariosFiltrados.forEach((u) => {
        const nombreCompleto = `${u.nombres} ${u.apellidos}`;
        const estadoClass = (u.estado || "").toLowerCase();

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.id_usuario}</td>
            <td>
                <strong>${nombreCompleto}</strong><br>
                <small>${u.cargo || ""}</small>
            </td>
            <td>${u.grado}</td>
            <td>${u.usuario}</td>
            <td><span class="role-badge">${u.rol}</span></td>
            <td><span class="status-badge ${estadoClass}">${u.estado}</span></td>
            
            <td class="acciones-cell">
                <div class="action-buttons action-buttons-icons">
                    ${crearBotonAccion({
            action: "editar",
            id: u.id_usuario,
            icono: "mdi:pencil-outline",
            tipo: "neutral",
            titulo: "Editar usuario"
        })}

                    ${crearBotonAccion({
            action: "reset-password",
            id: u.id_usuario,
            icono: "mdi:key-variant",
            tipo: "warning",
            titulo: "Resetear clave"
        })}

                    ${crearBotonAccion({
            action: "estado",
            id: u.id_usuario,
            icono: u.estado === "ACTIVO" ? "mdi:account-cancel-outline" : "mdi:account-check-outline",
            tipo: u.estado === "ACTIVO" ? "warning" : "success",
            titulo: u.estado === "ACTIVO" ? "Inactivar usuario" : "Activar usuario"
        })}

                    ${crearBotonAccion({
            action: "eliminar",
            id: u.id_usuario,
            icono: "mdi:trash-can-outline",
            tipo: "danger",
            titulo: "Eliminar usuario"
        })}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function abrirFormularioNuevoUsuario() {
    const formPanel = document.getElementById("usuarioFormPanel");
    const form = document.getElementById("usuarioAdminForm");

    form.reset();

    document.getElementById("usuarioFormTitle").textContent = "Nuevo usuario";
    document.getElementById("usuarioEditId").value = "";
    document.getElementById("userUnidad").value = "GCM 12";
    document.getElementById("userEstado").value = "ACTIVO";
    document.getElementById("userRol").value = "COMANDANTE_ECO";

    formPanel.classList.remove("hidden");
    formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirFormularioEditarUsuario(idUsuario) {
    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeUsuarios("Usuario no encontrado.", "error");
        return;
    }

    document.getElementById("usuarioFormTitle").textContent = "Editar usuario";
    document.getElementById("usuarioEditId").value = usuario.id_usuario;
    document.getElementById("userNombres").value = usuario.nombres || "";
    document.getElementById("userApellidos").value = usuario.apellidos || "";
    document.getElementById("userGrado").value = usuario.grado || "";
    document.getElementById("userCargo").value = usuario.cargo || "";
    document.getElementById("userUnidad").value = usuario.unidad || "GCM 12";
    document.getElementById("userCorreo").value = usuario.correo || "";
    document.getElementById("userCedula").value = usuario.usuario || "";
    document.getElementById("userPassword").value = "";
    document.getElementById("userRol").value = usuario.rol || "";
    document.getElementById("userEstado").value = usuario.estado || "ACTIVO";
    document.getElementById("userObservacion").value = usuario.observacion || "";

    document.getElementById("usuarioFormPanel").classList.remove("hidden");
    document.getElementById("usuarioFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function guardarUsuarioDesdeAdmin(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');

    const restaurarBoton = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Guardar usuario";
        }
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Guardando...";
    }

    try {
        const idEditando = document.getElementById("usuarioEditId").value;

        const nombres = document.getElementById("userNombres").value.trim();
        const apellidos = document.getElementById("userApellidos").value.trim();
        const grado = document.getElementById("userGrado").value.trim();
        const cargo = document.getElementById("userCargo").value.trim();
        const unidad = document.getElementById("userUnidad").value.trim();
        const correo = document.getElementById("userCorreo").value.trim();
        const cedula = document.getElementById("userCedula").value.trim();
        const password = document.getElementById("userPassword").value.trim();
        const rol = document.getElementById("userRol").value;
        const estado = document.getElementById("userEstado").value;
        const observacion = document.getElementById("userObservacion").value.trim();

        if (!nombres || !apellidos || !grado || !cargo || !unidad || !cedula || !rol || !estado) {
            mostrarMensajeUsuarios("Complete todos los campos obligatorios.", "error");
            return;
        }

        if (!validarCedula10Digitos(cedula)) {
            mostrarMensajeUsuarios("La cédula debe contener exactamente 10 dígitos numéricos.", "error");
            return;
        }

        await obtenerUsuariosDesdeGoogleSheets();

        const cedulaDuplicada = usuariosSistema.some((u) => {
            return u.usuario === cedula && u.id_usuario !== idEditando;
        });

        if (cedulaDuplicada) {
            mostrarMensajeUsuarios("Ya existe un usuario registrado con esa cédula.", "error");
            return;
        }

        if (!idEditando && !password) {
            mostrarMensajeUsuarios("Para crear un usuario debe ingresar una contraseña.", "error");
            return;
        }

        if (password) {
            const validacionPassword = validarPasswordSegura(password);

            if (!validacionPassword.valido) {
                mostrarMensajeUsuarios(validacionPassword.mensaje, "error");
                return;
            }
        }

        if (idEditando) {
            const index = usuariosSistema.findIndex((u) => u.id_usuario === idEditando);

            if (index === -1) {
                mostrarMensajeUsuarios("Usuario no encontrado para editar.", "error");
                return;
            }

            const usuarioAnterior = usuariosSistema[index];

            const usuarioActualizado = {
                ...usuarioAnterior,
                nombres,
                apellidos,
                grado,
                cargo,
                unidad,
                correo,
                usuario: cedula,
                password: password || usuarioAnterior.password,
                rol,
                estado,
                observacion,
                debe_cambiar_password: "NO",
                fecha_cambio_password: usuarioAnterior.fecha_cambio_password || "",
                ultimo_reset_password: usuarioAnterior.ultimo_reset_password || "",
                reset_password_por: usuarioAnterior.reset_password_por || "",
                password_reseteada: password ? "SI" : (usuarioAnterior.password_reseteada || "NO")
            };

            await apiPost("SAVE_USER", {
                usuario: usuarioActualizado
            });

            mostrarMensajeUsuarios("Usuario actualizado correctamente.", "success");

            registrarAuditoria(
                "EDITAR",
                "USUARIOS",
                idEditando,
                `Actualizó datos del usuario ${nombres} ${apellidos}`
            );
        } else {
            const nuevoUsuario = {
                id_usuario: generarIdUsuario(),
                nombres,
                apellidos,
                grado,
                cargo,
                unidad,
                correo,
                usuario: cedula,
                password,
                rol,
                estado,
                fecha_creacion: new Date().toISOString(),
                ultimo_acceso: "",
                observacion,
                debe_cambiar_password: "NO",
                fecha_cambio_password: "",
                ultimo_reset_password: "",
                reset_password_por: "",
                password_reseteada: "NO"
            };

            await apiPost("SAVE_USER", {
                usuario: nuevoUsuario
            });

            mostrarMensajeUsuarios("Usuario creado correctamente.", "success");

            registrarAuditoria(
                "CREAR",
                "USUARIOS",
                nuevoUsuario.id_usuario,
                `Creó el usuario ${nombres} ${apellidos} con rol ${rol}`
            );
        }

        await refrescarUsuariosDesdeGoogleSheets();

        cerrarFormularioUsuario();

    } catch (error) {
        console.error("Error al guardar usuario:", error);
        mostrarMensajeUsuarios(`No se pudo guardar el usuario: ${error.message}`, "error");
    } finally {
        restaurarBoton();
    }
}

async function cambiarEstadoUsuario(idUsuario) {
    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeUsuarios("Usuario no encontrado.", "error");
        return;
    }

    if (usuarioActual && usuario.id_usuario === usuarioActual.id_usuario) {
        mostrarMensajeUsuarios("No puede cambiar el estado del usuario con sesión activa.", "error");
        return;
    }

    const estadoAnterior = usuario.estado;
    usuario.estado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    try {
        await apiPost("SAVE_USER", {
            usuario
        });
    } catch (error) {
        console.error("Error al cambiar estado de usuario:", error);
        usuario.estado = estadoAnterior;
        mostrarMensajeUsuarios(`No se pudo cambiar el estado: ${error.message}`, "error");
        return;
    }

    await refrescarUsuariosDesdeGoogleSheets();

    registrarAuditoria(
        usuario.estado === "ACTIVO" ? "ACTIVAR" : "INACTIVAR",
        "USUARIOS",
        usuario.id_usuario,
        `${usuario.estado === "ACTIVO" ? "Activó" : "Inactivó"} al usuario ${usuario.nombres} ${usuario.apellidos}`
    );
    renderInicioPorRol();

    mostrarMensajeUsuarios(`Usuario ${usuario.estado === "ACTIVO" ? "activado" : "inactivado"} correctamente.`, "success");
}

async function eliminarUsuarioAdmin(idUsuario) {
    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeUsuarios("Usuario no encontrado.", "error");
        return;
    }

    if (usuarioActual && usuario.id_usuario === usuarioActual.id_usuario) {
        mostrarMensajeUsuarios("No puede eliminar el usuario con sesión activa.", "error");
        return;
    }

    const confirmar = await abrirModalAccionAdmin({
        titulo: "Eliminar usuario",
        texto: `¿Está seguro de eliminar al usuario ${usuario.nombres} ${usuario.apellidos}? Esta acción eliminará el registro del sistema.`,
        requiereTexto: false,
        textoConfirmar: "Eliminar usuario",
        claseConfirmar: "btn-danger"
    });

    if (!confirmar) return;

    try {
        await apiPost("DELETE_USER", {
            id_usuario: idUsuario
        });

        await refrescarUsuariosDesdeGoogleSheets();

        mostrarMensajeUsuarios("Usuario eliminado correctamente.", "success");

        registrarAuditoria(
            "ELIMINAR",
            "USUARIOS",
            idUsuario,
            `Eliminó al usuario ${usuario.nombres} ${usuario.apellidos}`
        );

        renderInicioPorRol();

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        mostrarMensajeUsuarios(`No se pudo eliminar el usuario: ${error.message}`, "error");
    }
}

function cerrarFormularioUsuario() {
    const formPanel = document.getElementById("usuarioFormPanel");
    const form = document.getElementById("usuarioAdminForm");

    form.reset();
    formPanel.classList.add("hidden");
}

function generarIdUsuario() {
    const mayor = usuariosSistema.reduce((max, usuario) => {
        const match = String(usuario.id_usuario || "").match(/USR-(\d+)/);
        const numero = match ? Number(match[1]) : 0;
        return numero > max ? numero : max;
    }, 0);

    return `USR-${String(mayor + 1).padStart(3, "0")}`;
}

function mostrarMensajeUsuarios(mensaje, tipo, destino = "auto") {
    const mensajeTabla = document.getElementById("usuariosMessage");
    const mensajeFormulario = document.getElementById("usuariosFormMessage");
    const formPanel = document.getElementById("usuarioFormPanel");

    const formVisible = formPanel && !formPanel.classList.contains("hidden");

    if (mensajeTabla) {
        mensajeTabla.textContent = "";
        mensajeTabla.className = "form-message";
    }

    if (mensajeFormulario) {
        mensajeFormulario.textContent = "";
        mensajeFormulario.className = "form-message";
    }

    const usarFormulario =
        destino === "form" ||
        (destino === "auto" && formVisible && tipo === "error");

    const message = usarFormulario && mensajeFormulario
        ? mensajeFormulario
        : mensajeTabla;

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;

    if (usarFormulario) {
        message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    setTimeout(() => {
        message.textContent = "";
        message.className = "form-message";
    }, 4500);
}

// ======================================================
// MIS OPERACIONES
// ======================================================

function configurarMisOperaciones() {
    const buscar = document.getElementById("buscarMisOperaciones");
    const filtroEstado = document.getElementById("filtroEstadoMisOperaciones");
    const filtroResultados = document.getElementById("filtroResultadosMisOperaciones");
    const tbody = document.getElementById("misOperacionesTableBody");

    if (!tbody) return;

    if (buscar) buscar.addEventListener("input", () => cargarPaginaMisOperaciones(1));
    if (filtroEstado) filtroEstado.addEventListener("change", () => cargarPaginaMisOperaciones(1));
    if (filtroResultados) filtroResultados.addEventListener("change", () => cargarPaginaMisOperaciones(1));

    tbody.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const idOperacion = button.dataset.id;
        const accion = button.dataset.action;

        if (accion === "ver") {
            verDetalleOperacion(idOperacion);
        }

        if (accion === "editar") {
            cargarOperacionParaEditar(idOperacion);
        }
    });
}

function renderMisOperaciones() {
    const tbody = document.getElementById("misOperacionesTableBody");
    if (!tbody) return;
    recargarDatosDesdeStorage();

    const texto = (document.getElementById("buscarMisOperaciones")?.value || "").toLowerCase().trim();
    const estado = document.getElementById("filtroEstadoMisOperaciones")?.value || "";
    const resultados = document.getElementById("filtroResultadosMisOperaciones")?.value || "";

    recargarDatosDesdeStorage();

    let operaciones = [...operacionesSistema];

    if (usuarioActual && usuarioActual.rol === "COMANDANTE_ECO") {
        operaciones = operaciones.filter((op) => esOperacionDelUsuarioActual(op));
    }

    operaciones = operaciones.filter((op) => {
        const textoOperacion = `
            ${op.id_operacion}
            ${op.tipo_operacion}
            ${op.sub_tipo_operacion}
            ${op.canton}
            ${op.parroquia}
            ${op.sector}
            ${op.estado_operacion}
        `.toLowerCase();

        const coincideTexto = !texto || textoOperacion.includes(texto);
        const coincideEstado = !estado || op.estado_operacion === estado;
        const coincideResultados = !resultados || op.hubo_resultados === resultados;

        return coincideTexto && coincideEstado && coincideResultados;
    });

    tbody.innerHTML = "";

    if (operaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">Sin operaciones registradas.</td>
            </tr>
        `;
        return;
    }

    operaciones.forEach((op) => {
        const puedeEditar = puedeEditarOperacion(op);
        const estadoClass = normalizarEstadoClass(op.estado_operacion);

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${op.id_operacion}</td>
            <td>${formatearFecha(op.fecha_operacion)}</td>
            <td>${op.tipo_operacion}</td>
            <td>${op.sub_tipo_operacion}</td>
            <td>${op.canton}</td>
            <td>${op.hubo_resultados}</td>
            <td><span class="op-status ${estadoClass}">${op.estado_operacion}</span></td>
            <td class="acciones-cell">
                <div class="action-buttons action-buttons-icons">
                    ${crearBotonAccion({
            action: "ver",
            id: op.id_operacion,
            icono: "mdi:eye-outline",
            tipo: "neutral",
            titulo: "Ver detalle"
        })}

                    ${puedeEditar ? crearBotonAccion({
            action: "editar",
            id: op.id_operacion,
            icono: "mdi:pencil-outline",
            tipo: "warning",
            titulo: "Editar operación"
        }) : ""}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function verDetalleOperacion(idOperacion) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeMisOperaciones("Operación no encontrada.", "error");
        return;
    }

    const resultados = resultadosSistema.filter((r) => r.id_operacion === idOperacion);

    const panel = document.getElementById("detalleOperacionPanel");
    const content = document.getElementById("detalleOperacionContent");

    const resultadosHtml = resultados.length === 0
        ? `<p class="empty-table">Esta operación no tiene resultados asociados.</p>`
        : `
            <div class="resultado-list">
                ${resultados.map((r, index) => `
                    <div class="resultado-card">
                        <strong>Resultado ${index + 1}: ${r.categoria}</strong>
                        <p>
                            Subcategoría: ${r.subcategoria}<br>
                            Cantidad: ${r.cantidad} ${r.unidad_medida}<br>
                            Descripción: ${r.descripcion || "Sin descripción"}
                        </p>
                    </div>
                `).join("")}
            </div>
        `;

    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span>ID operación</span>
                <strong>${operacion.id_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Fecha</span>
                <strong>${formatearFecha(operacion.fecha_operacion)}</strong>
            </div>

            <div class="detail-item">
                <span>Horario</span>
                <strong>${formatearHoraOperacion(operacion.hora_inicio)} - ${formatearHoraOperacion(operacion.hora_fin)}</strong>
            </div>

            <div class="detail-item">
                <span>Tipo</span>
                <strong>${operacion.tipo_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Subtipo</span>
                <strong>${operacion.sub_tipo_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Estado</span>
                <strong>${operacion.estado_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Provincia</span>
                <strong>${operacion.provincia}</strong>
            </div>

            <div class="detail-item">
                <span>Cantón</span>
                <strong>${operacion.canton}</strong>
            </div>

            <div class="detail-item">
                <span>Parroquia</span>
                <strong>${operacion.parroquia || "No aplica"}</strong>
            </div>

            <div class="detail-item">
                <span>Sector</span>
                <strong>${operacion.sector || "Sin sector"}</strong>
            </div>

            <div class="detail-item">
                <span>Coordenadas</span>
                <strong>${operacion.coordenadas || "Sin coordenadas"}</strong>
            </div>

            <div class="detail-item">
                <span>Responsable</span>
                <strong>${operacion.grado_responsable} ${operacion.responsable}</strong>
            </div>

            <div class="detail-item">
                <span>Personal</span>
                <strong>Of: ${operacion.num_oficiales} | Vol: ${operacion.num_vol} | Sldr: ${operacion.num_sldr}</strong>
            </div>

            <div class="detail-item">
                <span>Hubo resultados</span>
                <strong>${operacion.hubo_resultados}</strong>
            </div>

            <div class="detail-item">
                <span>Registrado por</span>
                <strong>${operacion.registrado_por}</strong>
            </div>
        </div>
        ${operacion.estado_operacion === "OBSERVADO" && operacion.observacion_admin ? `
        <div class="admin-note correction-note">
            <strong>Operación observada por el administrador:</strong><br>
            ${operacion.observacion_admin}
            ${operacion.observado_por ? `<br><br><strong>Observado por:</strong> ${operacion.observado_por}` : ""}
            ${operacion.fecha_observacion ? `<br><strong>Fecha:</strong> ${formatearFechaHora(operacion.fecha_observacion)}` : ""}
        </div>
        ` : ""}
        <div class="section-title">
            <h3>Resultados asociados</h3>
        </div>

        ${resultadosHtml}

        <div class="section-title">
            <h3>Observación general</h3>
        </div>

        <p>${operacion.observacion_general || "Sin observación general."}</p>
    `;

    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function normalizarFechaParaInput(valor) {
    if (!valor) return "";

    const texto = String(valor).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) {
        return texto.slice(0, 10);
    }

    const fecha = new Date(texto);

    if (!Number.isNaN(fecha.getTime())) {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
    }

    return "";
}

function normalizarHoraParaInput(valor) {
    if (!valor) return "";

    const texto = String(valor).trim();

    if (/^\d{2}:\d{2}$/.test(texto)) {
        return texto;
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(texto)) {
        return texto.slice(0, 5);
    }

    if (/T\d{2}:\d{2}/.test(texto)) {
        const match = texto.match(/T(\d{2}:\d{2})/);
        return match ? match[1] : "";
    }

    const fecha = new Date(texto);

    if (!Number.isNaN(fecha.getTime())) {
        const hh = String(fecha.getHours()).padStart(2, "0");
        const mm = String(fecha.getMinutes()).padStart(2, "0");

        return `${hh}:${mm}`;
    }

    return "";
}

function formatearHoraOperacion(valor) {
    const hora = normalizarHoraParaInput(valor);
    return hora || "";
}

function cargarOperacionParaEditar(idOperacion) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeMisOperaciones("Operación no encontrada.", "error");
        return;
    }

    if (!puedeEditarOperacion(operacion)) {
        mostrarMensajeMisOperaciones("Esta operación no puede ser editada porque está validada o anulada.", "error");
        return;
    }

    operacionEditandoId = idOperacion;

    mostrarPagina("registrarPage", "Editar operación", "Modificación de operación registrada");
    mostrarObservacionCorreccionOperacion(operacion);

    document.getElementById("fechaOperacion").value = normalizarFechaParaInput(operacion.fecha_operacion);
    document.getElementById("horaInicio").value = normalizarHoraParaInput(operacion.hora_inicio);
    document.getElementById("horaFin").value = normalizarHoraParaInput(operacion.hora_fin);



    tipoOperacion.value = operacion.tipo_operacion;
    tipoOperacion.dispatchEvent(new Event("change"));
    subTipoOperacion.value = operacion.sub_tipo_operacion;

    document.getElementById("provincia").value = operacion.provincia;
    document.getElementById("canton").value = operacion.canton;
    cantonSelect.dispatchEvent(new Event("change"));
    document.getElementById("parroquia").value = operacion.parroquia;

    document.getElementById("sector").value = operacion.sector;
    document.getElementById("coordenadas").value = operacion.coordenadas;

    document.getElementById("responsable").value = operacion.responsable;
    document.getElementById("gradoResponsable").value = operacion.grado_responsable;

    document.getElementById("numOficiales").value = operacion.num_oficiales;
    document.getElementById("numVol").value = operacion.num_vol;
    document.getElementById("numSldr").value = operacion.num_sldr;

    huboResultados.value = operacion.hubo_resultados;

    if (operacion.hubo_resultados === "SI") {
        resultadosBlock.classList.remove("hidden");

        resultadosTemporales = resultadosSistema
            .filter((r) => r.id_operacion === idOperacion)
            .map((r) => ({
                categoria: r.categoria,
                subcategoria: r.subcategoria,
                cantidad: r.cantidad,
                unidad: r.unidad_medida,
                descripcion: r.descripcion
            }));

        renderResultados();
    } else {
        resultadosBlock.classList.add("hidden");
        resultadosTemporales = [];
        renderResultados();
    }

    document.getElementById("observacionGeneral").value = operacion.observacion_general || "";

    const guardarBtn = document.getElementById("guardarOperacionBtn");
    if (guardarBtn) guardarBtn.textContent = "Actualizar operación";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function puedeEditarOperacion(operacion) {
    if (!operacion) return false;

    const estadosEditables = ["REGISTRADO", "OBSERVADO"];

    if (!estadosEditables.includes(operacion.estado_operacion)) {
        return false;
    }

    if (usuarioActual && usuarioActual.rol === "ADMIN") {
        return true;
    }

    if (usuarioActual && usuarioActual.rol === "COMANDANTE_ECO") {
        return operacion.id_usuario_registro === usuarioActual.id_usuario;
    }

    return false;
}

function normalizarEstadoClass(estado) {
    return (estado || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obtenerFechaISO(valor) {
    if (!valor) return "";

    const texto = String(valor).trim();

    // Caso correcto: 2026-06-12
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    // Caso que llega desde Google Sheets: 2026-06-12T05:00:00.000Z
    if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) {
        return texto.slice(0, 10);
    }

    // Caso eventual: 12/06/2026
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        const [dd, mm, yyyy] = texto.split("/");
        return `${yyyy}-${mm}-${dd}`;
    }

    const fecha = new Date(texto);

    if (!Number.isNaN(fecha.getTime())) {
        const yyyy = fecha.getUTCFullYear();
        const mm = String(fecha.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getUTCDate()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
    }

    return "";
}

function formatearFecha(fecha) {
    const fechaISO = obtenerFechaISO(fecha);

    if (!fechaISO) return "";

    const [yyyy, mm, dd] = fechaISO.split("-");

    return `${dd}/${mm}/${yyyy}`;
}

function mostrarMensajeMisOperaciones(mensaje, tipo) {
    const message = document.getElementById("misOperacionesMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;

    setTimeout(() => {
        message.textContent = "";
        message.className = "form-message";
    }, 4500);
}


// ======================================================
// ADMINISTRAR OPERACIONES - ADMIN
// ======================================================

function configurarAdministrarOperaciones() {
    const buscar = document.getElementById("buscarOperacionesAdmin");
    const filtroFechaDesde = document.getElementById("filtroFechaDesdeOperacionesAdmin");
    const filtroFechaHasta = document.getElementById("filtroFechaHastaOperacionesAdmin");
    const filtroEstado = document.getElementById("filtroEstadoOperacionesAdmin");
    const filtroTipo = document.getElementById("filtroTipoOperacionesAdmin");
    const filtroResultados = document.getElementById("filtroResultadosOperacionesAdmin");
    const limpiarBtn = document.getElementById("limpiarFiltrosOperacionesAdminBtn");
    const tbody = document.getElementById("operacionesAdminTableBody");

    if (!tbody) return;

    if (buscar) buscar.addEventListener("input", () => cargarPaginaOperacionesAdmin(1));
    if (filtroFechaDesde) filtroFechaDesde.addEventListener("change", () => cargarPaginaOperacionesAdmin(1));
    if (filtroFechaHasta) filtroFechaHasta.addEventListener("change", () => cargarPaginaOperacionesAdmin(1));
    if (filtroEstado) filtroEstado.addEventListener("change", () => cargarPaginaOperacionesAdmin(1));
    if (filtroTipo) filtroTipo.addEventListener("change", () => cargarPaginaOperacionesAdmin(1));
    if (filtroResultados) filtroResultados.addEventListener("change", () => cargarPaginaOperacionesAdmin(1));

    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", (event) => {
            event.preventDefault();
            limpiarFiltrosOperacionesAdmin();
        });
    }

    tbody.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const idOperacion = button.dataset.id;
        const accion = button.dataset.action;

        if (accion === "ver-admin") {
            verDetalleOperacionAdmin(idOperacion);
        }

        if (accion === "editar-admin") {
            cargarOperacionParaEditar(idOperacion);
        }

        if (accion === "validar") {
            cambiarEstadoOperacionAdmin(idOperacion, "VALIDADO");
        }

        if (accion === "observar") {
            observarOperacionAdmin(idOperacion);
        }

        if (accion === "anular") {
            anularOperacionAdmin(idOperacion);
        }
    });
}

function limpiarFiltrosOperacionesAdmin() {
    const buscar = document.getElementById("buscarOperacionesAdmin");
    const fechaDesde = document.getElementById("filtroFechaDesdeOperacionesAdmin");
    const fechaHasta = document.getElementById("filtroFechaHastaOperacionesAdmin");
    const estado = document.getElementById("filtroEstadoOperacionesAdmin");
    const tipo = document.getElementById("filtroTipoOperacionesAdmin");
    const resultados = document.getElementById("filtroResultadosOperacionesAdmin");
    const detallePanel = document.getElementById("detalleOperacionAdminPanel");

    if (buscar) buscar.value = "";
    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";
    if (estado) estado.value = "";
    if (tipo) tipo.value = "";
    if (resultados) resultados.value = "";

    if (detallePanel) {
        detallePanel.classList.add("hidden");
    }

    cargarPaginaOperacionesAdmin(1);
}

function renderOperacionesAdmin() {
    const tbody = document.getElementById("operacionesAdminTableBody");
    if (!tbody) return;

    recargarDatosDesdeStorage();

    const texto = (document.getElementById("buscarOperacionesAdmin")?.value || "").toLowerCase().trim();
    const fechaDesde = document.getElementById("filtroFechaDesdeOperacionesAdmin")?.value || "";
    const fechaHasta = document.getElementById("filtroFechaHastaOperacionesAdmin")?.value || "";
    const estado = document.getElementById("filtroEstadoOperacionesAdmin")?.value || "";
    const tipo = document.getElementById("filtroTipoOperacionesAdmin")?.value || "";
    const resultados = document.getElementById("filtroResultadosOperacionesAdmin")?.value || "";

    let operaciones = [...operacionesSistema];

    operaciones = operaciones.filter((op) => {
        const textoOperacion = `
            ${op.id_operacion}
            ${op.fecha_operacion}
            ${op.tipo_operacion}
            ${op.sub_tipo_operacion}
            ${op.canton}
            ${op.parroquia}
            ${op.sector}
            ${op.responsable}
            ${op.grado_responsable}
            ${op.registrado_por}
            ${op.estado_operacion}
        `.toLowerCase();

        const coincideTexto = !texto || textoOperacion.includes(texto);
        const fechaOperacion = obtenerFechaISO(op.fecha_operacion);

        const coincideFechaDesde = !fechaDesde || fechaOperacion >= fechaDesde;
        const coincideFechaHasta = !fechaHasta || fechaOperacion <= fechaHasta;
        const coincideEstado = !estado || op.estado_operacion === estado;
        const coincideTipo = !tipo || op.tipo_operacion === tipo;
        const coincideResultados = !resultados || op.hubo_resultados === resultados;

        return coincideTexto &&
            coincideFechaDesde &&
            coincideFechaHasta &&
            coincideEstado &&
            coincideTipo &&
            coincideResultados;
    });

    tbody.innerHTML = "";

    if (operaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-table">Sin operaciones registradas.</td>
            </tr>
        `;
        return;
    }

    operaciones.forEach((op) => {
        const estadoClass = normalizarEstadoClass(op.estado_operacion);

        const puedeValidar = op.estado_operacion !== "VALIDADO" && op.estado_operacion !== "ANULADO";
        const puedeObservar = op.estado_operacion !== "OBSERVADO" && op.estado_operacion !== "ANULADO";
        const puedeAnular = op.estado_operacion !== "ANULADO";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${op.id_operacion}</td>
            <td>${formatearFecha(op.fecha_operacion)}</td>
            <td>${op.tipo_operacion}</td>
            <td>${op.sub_tipo_operacion}</td>
            <td>${op.canton}</td>
            <td>${op.grado_responsable} ${op.responsable}</td>
            <td>${op.hubo_resultados}</td>
            <td><span class="op-status ${estadoClass}">${op.estado_operacion}</span></td>
            <td class="acciones-cell">
                <div class="admin-actions admin-actions-icons">
                    ${crearBotonAccion({
            action: "ver-admin",
            id: op.id_operacion,
            icono: "mdi:eye-outline",
            tipo: "neutral",
            titulo: "Ver detalle"
        })}

                    ${crearBotonAccion({
            action: "editar-admin",
            id: op.id_operacion,
            icono: "mdi:pencil-outline",
            tipo: "warning",
            titulo: "Editar operación"
        })}

                    ${crearBotonAccion({
            action: "validar",
            id: op.id_operacion,
            icono: "mdi:check-circle-outline",
            tipo: "success",
            titulo: "Validar operación",
            disabled: !puedeValidar
        })}

                    ${crearBotonAccion({
            action: "observar",
            id: op.id_operacion,
            icono: "mdi:comment-alert-outline",
            tipo: "blue",
            titulo: "Observar operación",
            disabled: !puedeObservar
        })}

                    ${crearBotonAccion({
            action: "anular",
            id: op.id_operacion,
            icono: "mdi:close-octagon-outline",
            tipo: "danger",
            titulo: "Anular operación",
            disabled: !puedeAnular
        })}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function verDetalleOperacionAdmin(idOperacion) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    const resultados = resultadosSistema.filter((r) => r.id_operacion === idOperacion);

    const panel = document.getElementById("detalleOperacionAdminPanel");
    const content = document.getElementById("detalleOperacionAdminContent");

    const resultadosHtml = resultados.length === 0
        ? `<p class="empty-table">Esta operación no tiene resultados asociados.</p>`
        : `
            <div class="resultado-list">
                ${resultados.map((r, index) => `
                    <div class="resultado-card">
                        <strong>Resultado ${index + 1}: ${r.categoria}</strong>
                        <p>
                            Subcategoría: ${r.subcategoria}<br>
                            Cantidad: ${r.cantidad} ${r.unidad_medida}<br>
                            Descripción: ${r.descripcion || "Sin descripción"}<br>
                            Registrado por: ${r.registrado_por}
                        </p>
                    </div>
                `).join("")}
            </div>
        `;

    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span>ID operación</span>
                <strong>${operacion.id_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Estado</span>
                <strong>${operacion.estado_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Fecha de operación</span>
                <strong>${formatearFecha(operacion.fecha_operacion)}</strong>
            </div>

            <div class="detail-item">
                <span>Hora inicio / fin</span>
                <strong>${formatearHoraOperacion(operacion.hora_inicio)} - ${formatearHoraOperacion(operacion.hora_fin)}</strong>
            </div>

            <div class="detail-item">
                <span>Tipo de operación</span>
                <strong>${operacion.tipo_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Subtipo de operación</span>
                <strong>${operacion.sub_tipo_operacion}</strong>
            </div>

            <div class="detail-item">
                <span>Provincia</span>
                <strong>${operacion.provincia}</strong>
            </div>

            <div class="detail-item">
                <span>Cantón</span>
                <strong>${operacion.canton}</strong>
            </div>

            <div class="detail-item">
                <span>Parroquia</span>
                <strong>${operacion.parroquia || "No aplica"}</strong>
            </div>

            <div class="detail-item">
                <span>Sector</span>
                <strong>${operacion.sector || "Sin sector"}</strong>
            </div>

            <div class="detail-item">
                <span>Coordenadas</span>
                <strong>${operacion.coordenadas || "Sin coordenadas"}</strong>
            </div>

            <div class="detail-item">
                <span>Responsable</span>
                <strong>${operacion.grado_responsable} ${operacion.responsable}</strong>
            </div>

            <div class="detail-item">
                <span>Personal participante</span>
                <strong>Of: ${operacion.num_oficiales} | Vol: ${operacion.num_vol} | Sldr: ${operacion.num_sldr}</strong>
            </div>

            <div class="detail-item">
                <span>Hubo resultados</span>
                <strong>${operacion.hubo_resultados}</strong>
            </div>

            <div class="detail-item">
                <span>Registrado por</span>
                <strong>${operacion.registrado_por}</strong>
            </div>

            <div class="detail-item">
                <span>Fecha de registro</span>
                <strong>${formatearFechaHora(operacion.fecha_registro)}</strong>
            </div>

            <div class="detail-item">
                <span>Última modificación</span>
                <strong>${formatearFechaHora(operacion.ultima_modificacion)}</strong>
            </div>
        </div>

        ${operacion.observacion_admin ? `
            <div class="admin-note">
                <strong>Observación administrativa:</strong><br>
                ${operacion.observacion_admin}
            </div>
        ` : ""}

        ${operacion.motivo_anulacion ? `
            <div class="admin-note">
                <strong>Motivo de anulación:</strong><br>
                ${operacion.motivo_anulacion}
            </div>
        ` : ""}

        <div class="section-title">
            <h3>Resultados asociados</h3>
        </div>

        ${resultadosHtml}

        <div class="section-title">
            <h3>Observación general</h3>
        </div>

        <p>${operacion.observacion_general || "Sin observación general."}</p>
    `;

    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

let adminActionResolver = null;

function abrirModalAccionAdmin({
    titulo,
    texto,
    requiereTexto = false,
    etiquetaTexto = "Detalle",
    placeholder = "Ingrese el detalle correspondiente...",
    textoConfirmar = "Confirmar",
    claseConfirmar = "btn-primary"
}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("adminActionModal");
        const title = document.getElementById("adminActionTitle");
        const text = document.getElementById("adminActionText");
        const group = document.getElementById("adminActionTextareaGroup");
        const label = document.getElementById("adminActionTextareaLabel");
        const textarea = document.getElementById("adminActionTextarea");
        const message = document.getElementById("adminActionMessage");
        const confirmBtn = document.getElementById("adminActionConfirmBtn");

        if (!modal || !title || !text || !group || !textarea || !message || !confirmBtn) {
            resolve(null);
            return;
        }

        adminActionResolver = resolve;

        title.textContent = titulo || "Confirmar acción";
        text.textContent = texto || "";
        label.textContent = etiquetaTexto;
        textarea.placeholder = placeholder;
        textarea.value = "";
        message.textContent = "";
        message.className = "form-message";

        group.classList.toggle("hidden", !requiereTexto);

        confirmBtn.textContent = textoConfirmar;
        confirmBtn.className = `btn ${claseConfirmar}`;

        modal.classList.remove("hidden");

        setTimeout(() => {
            if (requiereTexto) {
                textarea.focus();
            } else {
                confirmBtn.focus();
            }
        }, 100);
    });
}

function cerrarModalAccionAdmin(valor = null) {
    const modal = document.getElementById("adminActionModal");
    const message = document.getElementById("adminActionMessage");

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    if (modal) {
        modal.classList.add("hidden");
    }

    if (typeof adminActionResolver === "function") {
        adminActionResolver(valor);
    }

    adminActionResolver = null;
}

function configurarModalAccionAdmin() {
    const closeBtn = document.getElementById("adminActionCloseBtn");
    const cancelBtn = document.getElementById("adminActionCancelBtn");
    const confirmBtn = document.getElementById("adminActionConfirmBtn");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => cerrarModalAccionAdmin(null));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => cerrarModalAccionAdmin(null));
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const group = document.getElementById("adminActionTextareaGroup");
            const textarea = document.getElementById("adminActionTextarea");
            const message = document.getElementById("adminActionMessage");

            const requiereTexto = group && !group.classList.contains("hidden");

            if (requiereTexto) {
                const valor = textarea ? textarea.value.trim() : "";

                if (!valor) {
                    if (message) {
                        message.textContent = "Debe ingresar la información solicitada.";
                        message.className = "form-message error";
                    }
                    return;
                }

                cerrarModalAccionAdmin(valor);
                return;
            }

            cerrarModalAccionAdmin(true);
        });
    }
}

async function cambiarEstadoOperacionAdmin(idOperacion, nuevoEstado) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    const confirmar = await abrirModalAccionAdmin({
        titulo: "Validar operación",
        texto: `¿Está seguro de cambiar el estado de la operación ${idOperacion} a ${nuevoEstado}?`,
        requiereTexto: false,
        textoConfirmar: "Validar",
        claseConfirmar: "btn-primary"
    });

    if (!confirmar) return;

    const fechaActual = new Date().toISOString();

    const camposExtra = {
        ultima_modificacion: fechaActual
    };

    if (nuevoEstado === "VALIDADO") {
        camposExtra.validado_por = usuarioActual
            ? `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`
            : "";

        camposExtra.fecha_validacion = fechaActual;
    }

    try {
        await apiPost("UPDATE_OPERATION_STATUS", {
            id_operacion: idOperacion,
            estado_operacion: nuevoEstado,
            campos_extra: camposExtra
        });

        registrarAuditoria(
            nuevoEstado === "VALIDADO" ? "VALIDAR" : "EDITAR",
            "OPERACIONES",
            idOperacion,
            `Cambió estado de operación a ${nuevoEstado}`
        );

        await refrescarOperacionesDesdeGoogleSheets();

        renderAuditoria();

        mostrarMensajeOperacionesAdmin(`Operación actualizada a estado ${nuevoEstado}.`, "success");

    } catch (error) {
        console.error("Error al cambiar estado de operación:", error);
        mostrarMensajeOperacionesAdmin(`No se pudo cambiar el estado: ${error.message}`, "error");
    }
}

async function observarOperacionAdmin(idOperacion) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    if (operacion.estado_operacion === "ANULADO") {
        mostrarMensajeOperacionesAdmin("No puede observar una operación anulada.", "error");
        return;
    }

    const observacion = await abrirModalAccionAdmin({
        titulo: "Observar operación",
        texto: `Ingrese la observación administrativa para la operación ${idOperacion}. El responsable deberá corregir el registro.`,
        requiereTexto: true,
        etiquetaTexto: "Observación administrativa",
        placeholder: "Ejemplo: Corregir fecha, sector, resultados registrados o información incompleta.",
        textoConfirmar: "Guardar observación",
        claseConfirmar: "btn-blue"
    });

    if (!observacion) return;

    const fechaActual = new Date().toISOString();

    const camposExtra = {
        observacion_admin: observacion,
        observado_por: usuarioActual
            ? `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`
            : "",
        fecha_observacion: fechaActual,
        ultima_modificacion: fechaActual
    };

    try {
        await apiPost("UPDATE_OPERATION_STATUS", {
            id_operacion: idOperacion,
            estado_operacion: "OBSERVADO",
            campos_extra: camposExtra
        });

        registrarAuditoria(
            "OBSERVAR",
            "OPERACIONES",
            idOperacion,
            `Observó operación: ${observacion}`
        );

        await refrescarOperacionesDesdeGoogleSheets();

        renderAuditoria();

        mostrarMensajeOperacionesAdmin("Operación marcada como OBSERVADO.", "success");

    } catch (error) {
        console.error("Error al observar operación:", error);
        mostrarMensajeOperacionesAdmin(`No se pudo observar la operación: ${error.message}`, "error");
    }
}

async function anularOperacionAdmin(idOperacion) {
    const operacion = operacionesSistema.find((op) => op.id_operacion === idOperacion);

    if (!operacion) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    if (operacion.estado_operacion === "ANULADO") {
        mostrarMensajeOperacionesAdmin("La operación ya se encuentra anulada.", "error");
        return;
    }

    const motivo = await abrirModalAccionAdmin({
        titulo: "Anular operación",
        texto: `Ingrese el motivo de anulación de la operación ${idOperacion}. Esta acción no elimina el registro, solo cambia su estado a ANULADO.`,
        requiereTexto: true,
        etiquetaTexto: "Motivo de anulación",
        placeholder: "Ejemplo: Registro duplicado, error de digitación o información no correspondiente.",
        textoConfirmar: "Anular operación",
        claseConfirmar: "btn-danger"
    });

    if (!motivo) return;

    const fechaActual = new Date().toISOString();

    const camposExtra = {
        motivo_anulacion: motivo,
        anulado_por: usuarioActual
            ? `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`
            : "",
        fecha_anulacion: fechaActual,
        ultima_modificacion: fechaActual
    };

    try {
        await apiPost("UPDATE_OPERATION_STATUS", {
            id_operacion: idOperacion,
            estado_operacion: "ANULADO",
            campos_extra: camposExtra
        });

        registrarAuditoria(
            "ANULAR",
            "OPERACIONES",
            idOperacion,
            `Anuló operación. Motivo: ${motivo}`
        );

        await refrescarOperacionesDesdeGoogleSheets();

        renderAuditoria();

        mostrarMensajeOperacionesAdmin("Operación anulada correctamente.", "success");

    } catch (error) {
        console.error("Error al anular operación:", error);
        mostrarMensajeOperacionesAdmin(`No se pudo anular la operación: ${error.message}`, "error");
    }
}

function mostrarMensajeOperacionesAdmin(mensaje, tipo) {
    const message = document.getElementById("operacionesAdminMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;

    setTimeout(() => {
        message.textContent = "";
        message.className = "form-message";
    }, 4500);
}

function formatearFechaHora(fechaIso) {
    if (!fechaIso) return "";

    const fecha = new Date(fechaIso);

    if (Number.isNaN(fecha.getTime())) return fechaIso;

    return fecha.toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ======================================================
// DASHBOARD COMANDANTE DE UNIDAD
// ======================================================
function configurarAcordeonResultadosDashboard() {
    const contenedor = document.getElementById("dashTabResultados");

    if (!contenedor) return;

    const paneles = Array.from(contenedor.querySelectorAll(".dash-neon-panel"));

    paneles.forEach((panel) => {
        if (panel.dataset.accordionReady === "SI") return;

        const titulo = panel.querySelector(".dash-panel-title");

        if (!titulo) return;

        panel.classList.add("dash-collapsible", "dash-collapsed");

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "dash-collapse-btn";
        boton.innerHTML = `
            <span>Ver detalle</span>
            <iconify-icon icon="mdi:chevron-down"></iconify-icon>
        `;

        titulo.appendChild(boton);

        titulo.setAttribute("role", "button");
        titulo.setAttribute("tabindex", "0");

        titulo.addEventListener("click", () => {
            alternarPanelDashboard(panel, paneles);
        });

        titulo.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                alternarPanelDashboard(panel, paneles);
            }
        });

        panel.dataset.accordionReady = "SI";
        actualizarBotonPanelDashboard(panel);
    });
}

function alternarPanelDashboard(panelActivo, paneles) {
    const estabaCerrado = panelActivo.classList.contains("dash-collapsed");

    paneles.forEach((panel) => {
        panel.classList.add("dash-collapsed");
        actualizarBotonPanelDashboard(panel);
    });

    if (estabaCerrado) {
        panelActivo.classList.remove("dash-collapsed");
    }

    actualizarBotonPanelDashboard(panelActivo);
}

function actualizarBotonPanelDashboard(panel) {
    const boton = panel.querySelector(".dash-collapse-btn");

    if (!boton) return;

    const cerrado = panel.classList.contains("dash-collapsed");

    boton.innerHTML = cerrado
        ? `<span>Ver detalle</span><iconify-icon icon="mdi:chevron-down"></iconify-icon>`
        : `<span>Ocultar</span><iconify-icon icon="mdi:chevron-up"></iconify-icon>`;
}

function configurarDashboard() {
    const dashboardPage = document.getElementById("dashboardPage");
    if (!dashboardPage) return;

    cargarFiltrosDashboard();

    const filtros = [
        "dashFechaDesde",
        "dashFechaHasta",
        "dashEstado",
        "dashTipo",
        "dashSubtipo",
        "dashCanton",
        "dashParroquia",
        "dashCategoria",
        "dashSubcategoria"
    ];

    filtros.forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.addEventListener("change", renderDashboard);
    });

    const dashTipo = document.getElementById("dashTipo");
    const dashCanton = document.getElementById("dashCanton");
    const dashCategoria = document.getElementById("dashCategoria");

    if (dashTipo) {
        dashTipo.addEventListener("change", () => {
            cargarSubtiposDashboard();
            renderDashboard();
        });
    }

    if (dashCanton) {
        dashCanton.addEventListener("change", () => {
            cargarParroquiasDashboard();
            renderDashboard();
        });
    }

    if (dashCategoria) {
        dashCategoria.addEventListener("change", () => {
            cargarSubcategoriasDashboard();
            renderDashboard();
        });
    }

    const limpiarBtn = document.getElementById("dashLimpiarFiltros");

    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", (event) => {
            event.preventDefault();
            limpiarFiltrosDashboard();
        });
    }

    const toggleBtn = document.getElementById("dashToggleFiltros");
    const filtrosBody = document.getElementById("dashFiltersBody");

    if (toggleBtn && filtrosBody) {
        toggleBtn.addEventListener("click", () => {
            filtrosBody.classList.toggle("hidden");
        });
    }

    document.querySelectorAll(".dash-tab").forEach((button) => {
        button.addEventListener("click", () => {
            const tab = button.dataset.dashTab;

            document.querySelectorAll(".dash-tab").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".dash-tab-content").forEach((c) => c.classList.remove("active"));

            button.classList.add("active");

            const content = document.getElementById(`dashTab${capitalizar(tab)}`);
            if (content) content.classList.add("active");
        });
    });
}

function cargarFiltrosDashboard() {
    const dashCanton = document.getElementById("dashCanton");
    const dashCategoria = document.getElementById("dashCategoria");

    if (dashCanton) {
        dashCanton.innerHTML = `<option value="">Todos</option>`;

        ubicacionCatalogo.cantones.forEach((canton) => {
            const option = document.createElement("option");
            option.value = canton;
            option.textContent = canton;
            dashCanton.appendChild(option);
        });
    }

    if (dashCategoria) {
        dashCategoria.innerHTML = `<option value="">Todas</option>`;

        Object.keys(categoriasResultados).forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria;
            option.textContent = categoria;
            dashCategoria.appendChild(option);
        });
    }

    cargarSubtiposDashboard();
    cargarParroquiasDashboard();
    cargarSubcategoriasDashboard();
}

function cargarSubtiposDashboard() {
    const dashTipo = document.getElementById("dashTipo");
    const dashSubtipo = document.getElementById("dashSubtipo");

    if (!dashTipo || !dashSubtipo) return;

    const tipo = dashTipo.value;
    const opciones = tipo ? (subtiposOperacion[tipo] || []) : [];

    dashSubtipo.innerHTML = `<option value="">Todos</option>`;

    opciones.forEach((subtipo) => {
        const option = document.createElement("option");
        option.value = subtipo;
        option.textContent = subtipo;
        dashSubtipo.appendChild(option);
    });
}

function cargarParroquiasDashboard() {
    const dashCanton = document.getElementById("dashCanton");
    const dashParroquia = document.getElementById("dashParroquia");

    if (!dashCanton || !dashParroquia) return;

    const canton = dashCanton.value;
    const parroquias = ubicacionCatalogo.parroquiasPorCanton[canton] || [];

    dashParroquia.innerHTML = `<option value="">Todas</option>`;

    parroquias.forEach((parroquia) => {
        const option = document.createElement("option");
        option.value = parroquia;
        option.textContent = parroquia;
        dashParroquia.appendChild(option);
    });
}

function cargarSubcategoriasDashboard() {
    const dashCategoria = document.getElementById("dashCategoria");
    const dashSubcategoria = document.getElementById("dashSubcategoria");

    if (!dashCategoria || !dashSubcategoria) return;

    const categoria = dashCategoria.value;
    const data = categoriasResultados[categoria];

    dashSubcategoria.innerHTML = `<option value="">Todas</option>`;

    if (!data) return;

    data.subcategorias.forEach((subcategoria) => {
        const option = document.createElement("option");
        option.value = subcategoria;
        option.textContent = subcategoria;
        dashSubcategoria.appendChild(option);
    });
}

function limpiarFiltrosDashboard() {
    const fechaDesde = document.getElementById("dashFechaDesde");
    const fechaHasta = document.getElementById("dashFechaHasta");
    const estado = document.getElementById("dashEstado");
    const tipo = document.getElementById("dashTipo");
    const subtipo = document.getElementById("dashSubtipo");
    const canton = document.getElementById("dashCanton");
    const parroquia = document.getElementById("dashParroquia");
    const categoria = document.getElementById("dashCategoria");
    const subcategoria = document.getElementById("dashSubcategoria");

    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";

    // El dashboard oficial siempre debe quedar en VALIDADO.
    if (estado) estado.value = "VALIDADO";

    if (tipo) tipo.value = "";
    if (canton) canton.value = "";
    if (categoria) categoria.value = "";

    // Recargar listas dependientes después de limpiar tipo, cantón y categoría.
    cargarSubtiposDashboard();
    cargarParroquiasDashboard();
    cargarSubcategoriasDashboard();

    if (subtipo) subtipo.value = "";
    if (parroquia) parroquia.value = "";
    if (subcategoria) subcategoria.value = "";

    renderDashboard();
}

function renderDashboard() {
    const dashboardPage = document.getElementById("dashboardPage");
    if (!dashboardPage) return;
    recargarDatosDesdeStorage();

    const datos = obtenerDatosDashboardFiltrados();
    const operaciones = datos.operaciones;
    const resultados = datos.resultados;

    const totalOperaciones = operaciones.length;
    const conResultados = operaciones.filter((op) => op.hubo_resultados === "SI").length;
    const sinResultados = operaciones.filter((op) => op.hubo_resultados === "NO").length;
    const efectividad = totalOperaciones > 0 ? ((conResultados / totalOperaciones) * 100).toFixed(1) : "0.0";

    const totalOficiales = sumarCampoOperaciones(operaciones, "num_oficiales");
    const totalVoluntarios = sumarCampoOperaciones(operaciones, "num_vol");
    const totalSoldados = sumarCampoOperaciones(operaciones, "num_sldr");
    const totalPersonal = totalOficiales + totalVoluntarios + totalSoldados;

    setText("dashTotalOperaciones", formatNumero(totalOperaciones));
    setText("dashConResultados", formatNumero(conResultados));
    setText("dashSinResultados", formatNumero(sinResultados));
    setText("dashEfectividad", `${efectividad}%`);
    setText("dashOficiales", formatNumero(totalOficiales));
    setText("dashVoluntarios", formatNumero(totalVoluntarios));
    setText("dashSoldados", formatNumero(totalSoldados));
    setText("dashPersonalTotal", formatNumero(totalPersonal));

    // Armamento y municiones
    setText("dashArmasCortas", formatNumero(sumarCategoria(resultados, "Armas de fuego cortas")));
    setText("dashArmasLargas", formatNumero(sumarCategoria(resultados, "Armas de fuego largas")));
    setText("dashArmasFuegoNoLetales", formatNumero(sumarCategoria(resultados, "Armas de fuego no letales")));
    setText("dashArmasBlancas", formatNumero(sumarCategoria(resultados, "Armas blancas")));
    setText("dashArmasNoLetales", formatNumero(sumarCategoria(resultados, "Armas no letales")));
    setText("dashMuniciones", formatNumero(sumarCategoria(resultados, "Municiones")));
    setText("dashMunicionPercutida", formatNumero(sumarCategoria(resultados, "Munición percutida")));
    setText("dashAlimentadoras", formatNumero(sumarCategoria(resultados, "Alimentadoras")));
    setText("dashAccesoriosArmas", formatNumero(sumarCategoria(resultados, "Accesorios de armas")));

    // Explosivos y granadas
    setText("dashExplosivosUnidades", formatNumero(sumarCategoria(resultados, "Explosivos", "unidades")));
    setText("dashExplosivosMetros", `${formatDecimal(sumarCategoria(resultados, "Explosivos", "metros"))} m`);
    setText("dashExplosivosKg", `${formatDecimal(sumarCategoria(resultados, "Explosivos", "kilogramos"))} kg`);
    setText("dashGranadas", formatNumero(sumarCategoria(resultados, "Granadas")));

    // Sustancias catalogadas sujetas a fiscalización
    setText("dashSCSFTotalKg", `${formatDecimal(calcularSCSFEnKg(resultados))} kg`);
    setText("dashClorhidratoCocaina", `${formatDecimal(calcularSubcategoriaSCSFEnKg(resultados, "Clorhidrato de cocaína"))} kg`);
    setText("dashMarihuana", `${formatDecimal(calcularSubcategoriaSCSFEnKg(resultados, "Marihuana"))} kg`);
    setText("dashHeroina", `${formatDecimal(calcularSubcategoriaSCSFEnKg(resultados, "Heroína"))} kg`);
    setText("dashOtrasSustancias", `${formatDecimal(calcularSubcategoriaSCSFEnKg(resultados, "Otras sustancias"))} kg`);

    // Comunicaciones, vigilancia y tecnología
    setText("dashTelefonos", formatNumero(sumarCategoria(resultados, "Teléfonos celulares")));
    setText("dashChips", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Chips")));
    setText("dashRadios", formatNumero(sumarSubcategorias(resultados, "Equipos de comunicación", ["Radios portátiles", "Radios móviles vehiculares"])));
    setText("dashCamaras", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "Cámaras")));
    setText("dashDrones", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "Drones")));
    setText("dashDvr", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "DVR")));
    setText("dashModemRouter", formatNumero(sumarSubcategorias(resultados, "Equipos de red", ["Módem", "Router"])));
    setText("dashFibraCable", `${formatDecimal(sumarSubcategorias(resultados, "Equipos de red", ["Fibra óptica", "Cable de red"], "metros"))} m`);
    setText("dashAccesoriosCelulares", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Otros accesorios celulares")));
    setText("dashCargadores", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Cargadores")));
    setText("dashCablesUsb", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Cables USB")));
    setText("dashAudifonos", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Audífonos")));
    setText("dashAntenaSatelital", formatNumero(sumarSubcategoria(resultados, "Equipos de red", "Antena satelital")));
    setText("dashOtrosEquiposRed", formatNumero(sumarSubcategoria(resultados, "Equipos de red", "Otros equipos de red")));

    // Equipamiento táctico
    setText("dashChalecos", formatNumero(sumarSubcategoria(resultados, "Equipamiento táctico", "Chalecos antibalas")));
    setText("dashUniformesMilitares", formatNumero(sumarSubcategoria(resultados, "Equipamiento táctico", "Uniformes militares/policiales")));
    setText("dashPrendasMilPol", formatNumero(sumarSubcategoria(resultados, "Equipamiento táctico", "Otras prendas militares o policiales")));
    setText("dashEsposas", formatNumero(sumarSubcategoria(resultados, "Equipamiento táctico", "Esposas")));
    setText("dashOtrosEquiposTacticos", formatNumero(sumarSubcategoria(resultados, "Equipamiento táctico", "Otros equipos tácticos")));

    // Movilidad, combustibles
    setText("dashMotocicletas", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Motocicleta")));
    setText("dashVehiculos", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Vehículo")));
    setText("dashTanqueros", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Tanquero")));
    setText("dashCamiones", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Camión")));
    setText("dashMaquinaria", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Maquinaria pesada")));
    setText("dashCombustibleGal", `${formatDecimal(sumarCategoria(resultados, "Combustible", "galones"))} gal`);
    setText("dashCombustibleLitros", `${formatDecimal(sumarCategoria(resultados, "Combustible", "litros"))} L`);

    // Alcohol, tabacos y otros objetos
    setText("dashBebidas", `${formatDecimal(sumarCategoria(resultados, "Bebidas alcohólicas", "litros"))} L`);
    setText("dashCigarrillos", formatNumero(sumarCategoria(resultados, "Tabacos")));
    setText("dashBalanzas", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Balanzas")));
    setText("dashPipas", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Pipas")));
    setText("dashHerramientasElectricas", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Herramientas eléctricas")));
    setText("dashHerramientasManuales", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Herramientas manuales")));
    setText("dashOtrosObjetos", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Otros objetos")));
    setText("dashDocumentacion", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Documentación")));

    // Humanos y financieros
    setText("dashAprehendidos", formatNumero(sumarCategoria(resultados, "Personas aprehendidas")));
    setText("dashDinero", `$${formatNumero(sumarCategoria(resultados, "Dinero efectivo", "dólares americanos"))}`);

    renderRankingUbicacion("dashRankingCanton", operaciones, resultados, "canton");
    renderRankingUbicacion("dashRankingParroquia", operaciones, resultados, "parroquia");
    renderRankingUbicacion("dashRankingSector", operaciones, resultados, "sector");

    renderRankingTiempoMes(operaciones, "dashTiempoMes");

    renderRankingSubtipo(operaciones, "dashRankingSubtipo");
    renderRankingTipo(operaciones, "dashRankingTipo");

    renderGraficosDashboard(operaciones, resultados);
    renderDetalleCategoriaSubcategoria(resultados, "dashDetalleCategoriaSubcategoria");
}

function obtenerDatosDashboardFiltrados() {
    const fechaDesde = document.getElementById("dashFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("dashFechaHasta")?.value || "";
    const estado = "VALIDADO";
    const tipo = document.getElementById("dashTipo")?.value || "";
    const subtipo = document.getElementById("dashSubtipo")?.value || "";
    const canton = document.getElementById("dashCanton")?.value || "";
    const parroquia = document.getElementById("dashParroquia")?.value || "";
    const categoria = document.getElementById("dashCategoria")?.value || "";
    const subcategoria = document.getElementById("dashSubcategoria")?.value || "";

    let operaciones = operacionesSistema.filter((op) => {
        const fechaOperacion = obtenerFechaISO(op.fecha_operacion);

        const okFechaDesde = !fechaDesde || fechaOperacion >= fechaDesde;
        const okFechaHasta = !fechaHasta || fechaOperacion <= fechaHasta;
        const okEstado = op.estado_operacion === estado;
        const okTipo = !tipo || op.tipo_operacion === tipo;
        const okSubtipo = !subtipo || op.sub_tipo_operacion === subtipo;
        const okCanton = !canton || op.canton === canton;
        const okParroquia = !parroquia || op.parroquia === parroquia;

        return okFechaDesde && okFechaHasta && okEstado && okTipo && okSubtipo && okCanton && okParroquia;
    });

    const idsOperaciones = new Set(operaciones.map((op) => op.id_operacion));

    let resultados = resultadosSistema.filter((r) => idsOperaciones.has(r.id_operacion));

    if (categoria) {
        resultados = resultados.filter((r) => r.categoria === categoria);
    }

    if (subcategoria) {
        resultados = resultados.filter((r) => r.subcategoria === subcategoria);
    }

    if (categoria || subcategoria) {
        const idsConResultadoFiltrado = new Set(resultados.map((r) => r.id_operacion));
        operaciones = operaciones.filter((op) => idsConResultadoFiltrado.has(op.id_operacion));
    }

    return {
        operaciones,
        resultados
    };
}

function sumarCampoOperaciones(operaciones, campo) {
    return operaciones.reduce((total, op) => total + (Number(op[campo]) || 0), 0);
}

function sumarCategoria(resultados, categoria, unidad = "") {
    return resultados
        .filter((r) => r.categoria === categoria)
        .filter((r) => !unidad || r.unidad_medida === unidad)
        .reduce((total, r) => total + (Number(r.cantidad) || 0), 0);
}

function sumarSubcategoria(resultados, categoria, subcategoria, unidad = "") {
    return resultados
        .filter((r) => r.categoria === categoria && r.subcategoria === subcategoria)
        .filter((r) => !unidad || r.unidad_medida === unidad)
        .reduce((total, r) => total + (Number(r.cantidad) || 0), 0);
}

function sumarSubcategorias(resultados, categoria, subcategorias, unidad = "") {
    return resultados
        .filter((r) => r.categoria === categoria && subcategorias.includes(r.subcategoria))
        .filter((r) => !unidad || r.unidad_medida === unidad)
        .reduce((total, r) => total + (Number(r.cantidad) || 0), 0);
}

function calcularSCSFEnKg(resultados) {
    return resultados
        .filter((r) => r.categoria === "Sustancias catalogadas sujetas a fiscalización")
        .reduce((total, r) => {
            const cantidad = Number(r.cantidad) || 0;

            if (r.unidad_medida === "gramos") {
                return total + (cantidad / 1000);
            }

            if (r.unidad_medida === "kilogramos") {
                return total + cantidad;
            }

            return total;
        }, 0);
}

function calcularSubcategoriaSCSFEnKg(resultados, subcategoriaBuscada) {
    return resultados
        .filter((r) => {
            return r.categoria === "Sustancias catalogadas sujetas a fiscalización" &&
                r.subcategoria === subcategoriaBuscada;
        })
        .reduce((total, r) => {
            const cantidad = Number(r.cantidad) || 0;
            const unidad = String(r.unidad_medida || "").toLowerCase();

            if (unidad.includes("gramo")) {
                return total + (cantidad / 1000);
            }

            if (unidad.includes("kilogramo")) {
                return total + cantidad;
            }

            return total;
        }, 0);
}

function renderRankingUbicacion(tbodyId, operaciones, resultados, campo) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    operaciones.forEach((op) => {
        const clave = op[campo] || "SIN DATO";

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: clave,
                operaciones: 0,
                operaciones_con_resultados: 0,
                registros_resultado: 0,
                ids_operaciones_con_resultado: new Set()
            });
        }

        mapa.get(clave).operaciones += 1;

        if (op.hubo_resultados === "SI") {
            mapa.get(clave).ids_operaciones_con_resultado.add(op.id_operacion);
        }
    });

    resultados.forEach((r) => {
        const op = operaciones.find((o) => o.id_operacion === r.id_operacion);
        if (!op) return;

        const clave = op[campo] || "SIN DATO";

        if (mapa.has(clave)) {
            mapa.get(clave).registros_resultado += 1;
        }
    });

    const data = Array.from(mapa.values())
        .map((item) => ({
            nombre: item.nombre,
            operaciones: item.operaciones,
            operaciones_con_resultados: item.ids_operaciones_con_resultado.size,
            registros_resultado: item.registros_resultado
        }))
        .sort((a, b) => b.operaciones - a.operaciones)
        .slice(0, 10);

    renderTablaSimple(tbody, data, [
        "nombre",
        "operaciones",
        "operaciones_con_resultados",
        "registros_resultado"
    ]);
}

function renderRankingTiempoMes(operaciones, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    operaciones.forEach((op) => {
        const clave = op.fecha_operacion ? op.fecha_operacion.slice(0, 7) : "SIN FECHA";

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: clave,
                operaciones: 0,
                con_resultados: 0
            });
        }

        mapa.get(clave).operaciones += 1;

        if (op.hubo_resultados === "SI") {
            mapa.get(clave).con_resultados += 1;
        }
    });

    const data = Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderTablaSimple(tbody, data, ["nombre", "operaciones", "con_resultados"]);
}

function renderRankingTiempoSemana(operaciones, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    operaciones.forEach((op) => {
        const clave = obtenerClaveSemana(op.fecha_operacion);

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: clave,
                operaciones: 0,
                con_resultados: 0
            });
        }

        mapa.get(clave).operaciones += 1;

        if (op.hubo_resultados === "SI") {
            mapa.get(clave).con_resultados += 1;
        }
    });

    const data = Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderTablaSimple(tbody, data, ["nombre", "operaciones", "con_resultados"]);
}

function renderRankingSubtipo(operaciones, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    operaciones.forEach((op) => {
        const clave = op.sub_tipo_operacion || "SIN SUBTIPO";

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: clave,
                operaciones: 0,
                con_resultados: 0,
                efectividad: "0%"
            });
        }

        mapa.get(clave).operaciones += 1;

        if (op.hubo_resultados === "SI") {
            mapa.get(clave).con_resultados += 1;
        }
    });

    const data = Array.from(mapa.values()).map((item) => ({
        ...item,
        efectividad: item.operaciones > 0
            ? `${((item.con_resultados / item.operaciones) * 100).toFixed(1)}%`
            : "0%"
    })).sort((a, b) => b.operaciones - a.operaciones);

    renderTablaSimple(tbody, data, ["nombre", "operaciones", "con_resultados", "efectividad"]);
}

function renderRankingTipo(operaciones, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    operaciones.forEach((op) => {
        const clave = op.tipo_operacion || "SIN TIPO";

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: clave,
                operaciones: 0,
                con_resultados: 0
            });
        }

        mapa.get(clave).operaciones += 1;

        if (op.hubo_resultados === "SI") {
            mapa.get(clave).con_resultados += 1;
        }
    });

    const data = Array.from(mapa.values()).sort((a, b) => b.operaciones - a.operaciones);

    renderTablaSimple(tbody, data, ["nombre", "operaciones", "con_resultados"]);
}

function renderTablaSimple(tbody, data, campos) {
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${campos.length}" class="empty-table">Sin datos disponibles.</td>
            </tr>
        `;
        return;
    }

    data.forEach((item) => {
        const tr = document.createElement("tr");

        tr.innerHTML = campos.map((campo) => {
            const valor = item[campo];

            if (typeof valor === "number") {
                return `<td>${formatNumero(valor)}</td>`;
            }

            return `<td>${valor || ""}</td>`;
        }).join("");

        tbody.appendChild(tr);
    });
}

function obtenerClaveSemana(fechaTexto) {
    if (!fechaTexto) return "SIN FECHA";

    const fecha = new Date(`${fechaTexto}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return "SIN FECHA";

    const inicioAnio = new Date(fecha.getFullYear(), 0, 1);
    const dias = Math.floor((fecha - inicioAnio) / 86400000);
    const semana = Math.ceil((dias + inicioAnio.getDay() + 1) / 7);

    return `${fecha.getFullYear()}-S${String(semana).padStart(2, "0")}`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatNumero(value) {
    return new Intl.NumberFormat("es-EC").format(Number(value) || 0);
}

function formatDecimal(value) {
    return new Intl.NumberFormat("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function esOperacionDelUsuarioActual(operacion) {
    if (!usuarioActual || !operacion) return false;

    return (
        operacion.id_usuario_registro === usuarioActual.id_usuario ||
        operacion.usuario_cedula === usuarioActual.usuario
    );
}

window.addEventListener("storage", (event) => {
    const claves = [
        STORAGE_USUARIOS,
        STORAGE_OPERACIONES,
        STORAGE_RESULTADOS,
        STORAGE_AUDITORIA
    ];

    if (!claves.includes(event.key)) return;

    recargarDatosDesdeStorage();

    renderUsuariosAdmin();
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
});

// ======================================================
// ICONOS DASHBOARD CON ICONIFY
// ======================================================

function aplicarIconosDashboard() {
    const iconosPorMetrica = {
        // Resumen
        dashTotalOperaciones: "mdi:clipboard-text-outline",
        dashConResultados: "mdi:checkbox-marked-circle-outline",
        dashSinResultados: "mdi:close-circle-outline",
        dashEfectividad: "mdi:chart-line",
        dashOficiales: "mdi:account-star-outline",
        dashVoluntarios: "mdi:account-group-outline",
        dashSoldados: "mdi:account-outline",
        dashPersonalTotal: "mdi:account-multiple-outline",

        // Armamento y municiones
        dashArmasCortas: "game-icons:pistol-gun",
        dashArmasLargas: "game-icons:machine-gun",
        dashArmasFuegoNoLetales: "game-icons:gunshot",
        dashArmasBlancas: "game-icons:knife-thrust",
        dashArmasNoLetales: "game-icons:police-badge",
        dashMuniciones: "game-icons:bullets",
        dashMunicionPercutida: "game-icons:bullet-impacts",
        dashAlimentadoras: "game-icons:ammo-box",
        dashAccesoriosArmas: "game-icons:laser-gun",

        // Explosivos
        dashExplosivosUnidades: "game-icons:explosive-materials",
        dashExplosivosMetros: "game-icons:rope-coil",
        dashExplosivosKg: "game-icons:powder",
        dashGranadas: "game-icons:grenade",

        // Sustancias y procesamiento
        dashSCSFTotalKg: "game-icons:powder-bag",
        dashClorhidratoCocaina: "game-icons:powder",
        dashMarihuana: "mdi:cannabis",
        dashHeroina: "game-icons:medicine-pills",
        dashOtrasSustancias: "mdi:flask-outline",


        // Comunicaciones y tecnología
        dashTelefonos: "mdi:cellphone",
        dashChips: "mdi:sim",
        dashRadios: "mdi:radio-handheld",
        dashCamaras: "mdi:cctv",
        dashDrones: "mdi:drone",
        dashDvr: "mdi:harddisk",
        dashModemRouter: "mdi:router-wireless",
        dashFibraCable: "mdi:ethernet-cable",
        dashAntenaSatelital: "mdi:satellite-uplink",
        dashOtrosEquiposRed: "mdi:lan",

        // Accesorios celulares
        dashAccesoriosCelulares: "mdi:cellphone-cog",
        dashCargadores: "mdi:power-plug",
        dashCablesUsb: "mdi:usb",
        dashAudifonos: "mdi:headphones",

        // Equipamiento táctico

        dashChalecos: "game-icons:kevlar-vest",
        // dashUniformesPoliciales: "mdi:police-badge-outline",
        dashUniformesMilitares: "game-icons:military-fort",
        dashPrendasMilPol: "game-icons:clothes",
        dashEsposas: "game-icons:handcuffs",
        dashOtrosEquiposTacticos: "mdi:shield-half-full",

        // Movilidad, combustible y logística
        dashMotocicletas: "mdi:motorbike",
        dashVehiculos: "mdi:car",
        dashCamiones: "mdi:truck",
        dashTanqueros: "mdi:tanker-truck",
        dashMaquinaria: "mdi:excavator",
        dashCombustibleGal: "mdi:gas-station",
        dashCombustibleLitros: "mdi:gas-station",

        // Alcohol, tabacos y otros objetos
        dashCigarrillos: "mdi:cigar",
        dashHerramientasElectricas: "mdi:power-plug-outline",
        dashHerramientasManuales: "mdi:hammer-screwdriver",
        dashOtrosObjetos: "mdi:package-variant-closed",

        dashBalanzas: "mdi:scale-balance",
        dashPipas: "game-icons:smoking-pipe",
        dashDocumentacion: "mdi:file-document-outline",
        dashBebidas: "mdi:bottle-wine-outline",
        dashTabacos: "mdi:cigar",

        // Humanos y financieros
        dashAprehendidos: "mdi:account-lock-outline",
        dashDinero: "mdi:cash-multiple"
    };

    Object.entries(iconosPorMetrica).forEach(([idMetrica, iconName]) => {
        const metrica = document.getElementById(idMetrica);
        if (!metrica) return;

        const tarjeta = metrica.closest(".dash-summary-card, .dash-metric-card");
        if (!tarjeta) return;

        const yaTieneIcono = tarjeta.querySelector(".dash-card-icon");
        if (yaTieneIcono) {
            yaTieneIcono.setAttribute("icon", iconName);
            return;
        }

        const icon = document.createElement("iconify-icon");
        icon.setAttribute("icon", iconName);
        icon.setAttribute("class", "dash-card-icon");
        icon.setAttribute("aria-hidden", "true");

        tarjeta.appendChild(icon);
    });
}

function renderDetalleCategoriaSubcategoria(resultados, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const mapa = new Map();

    resultados.forEach((r) => {
        const categoria = r.categoria || "SIN CATEGORÍA";
        const subcategoria = r.subcategoria || "SIN SUBCATEGORÍA";
        const unidad = r.unidad_medida || "SIN UNIDAD";
        const clave = `${categoria}||${subcategoria}||${unidad}`;

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                categoria,
                subcategoria,
                unidad,
                cantidad: 0,
                registros: 0
            });
        }

        const item = mapa.get(clave);
        item.cantidad += Number(r.cantidad) || 0;
        item.registros += 1;
    });

    const data = Array.from(mapa.values()).sort((a, b) => {
        const catCompare = a.categoria.localeCompare(b.categoria);
        if (catCompare !== 0) return catCompare;

        return a.subcategoria.localeCompare(b.subcategoria);
    });

    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">Sin datos disponibles.</td>
            </tr>
        `;
        return;
    }

    data.forEach((item) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.categoria}</td>
            <td>${item.subcategoria}</td>
            <td>${item.unidad}</td>
            <td>${formatDecimal(item.cantidad)}</td>
            <td>${formatNumero(item.registros)}</td>
        `;

        tbody.appendChild(tr);
    });
}

// ======================================================
// REPORTES
// ======================================================

function configurarReportes() {
    const reportesPage = document.getElementById("reportesPage");
    if (!reportesPage) return;

    cargarFiltrosReportes();

    const filtros = [
        "repFechaDesde",
        "repFechaHasta",
        "repEstado",
        "repHuboResultados",
        "repTipo",
        "repSubtipo",
        "repCanton",
        "repParroquia",
        "repCategoria",
        "repSubcategoria",
        "repResponsable"
    ];

    filtros.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;

        const evento = element.tagName === "INPUT" ? "input" : "change";
        element.addEventListener(evento, renderReportes);
    });

    const repTipo = document.getElementById("repTipo");
    const repCanton = document.getElementById("repCanton");
    const repCategoria = document.getElementById("repCategoria");

    if (repTipo) {
        repTipo.addEventListener("change", () => {
            cargarSubtiposReportes();
            renderReportes();
        });
    }

    if (repCanton) {
        repCanton.addEventListener("change", () => {
            cargarParroquiasReportes();
            renderReportes();
        });
    }

    if (repCategoria) {
        repCategoria.addEventListener("change", () => {
            cargarSubcategoriasReportes();
            renderReportes();
        });
    }

    const limpiarBtn = document.getElementById("repLimpiarFiltrosBtn");

    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", (event) => {
            event.preventDefault();
            limpiarFiltrosReportes();
        });
    }

    const exportCsvBtn = document.getElementById("exportCsvBtn");
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", exportarReporteCSV);
    }

    const exportPdfBtn = document.getElementById("exportPdfBtn");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", exportarReportePDF);
    }
    const modoDetalladoBtn = document.getElementById("repModoDetalladoBtn");

    if (modoDetalladoBtn) {
        modoDetalladoBtn.addEventListener("click", () => {
            reporteDetallado = !reporteDetallado;

            modoDetalladoBtn.textContent = reporteDetallado ? "Detallado: SI" : "Detallado: NO";
            modoDetalladoBtn.classList.toggle("active", reporteDetallado);

            renderReportes();
        });
    }
}

function cargarFiltrosReportes() {
    const repCanton = document.getElementById("repCanton");
    const repCategoria = document.getElementById("repCategoria");

    if (repCanton) {
        repCanton.innerHTML = `<option value="">Todos</option>`;

        ubicacionCatalogo.cantones.forEach((canton) => {
            const option = document.createElement("option");
            option.value = canton;
            option.textContent = canton;
            repCanton.appendChild(option);
        });
    }

    if (repCategoria) {
        repCategoria.innerHTML = `<option value="">Todas</option>`;

        Object.keys(categoriasResultados).forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria;
            option.textContent = categoria;
            repCategoria.appendChild(option);
        });
    }

    cargarSubtiposReportes();
    cargarParroquiasReportes();
    cargarSubcategoriasReportes();
}

function cargarSubtiposReportes() {
    const repTipo = document.getElementById("repTipo");
    const repSubtipo = document.getElementById("repSubtipo");

    if (!repTipo || !repSubtipo) return;

    const tipo = repTipo.value;
    const opciones = tipo ? (subtiposOperacion[tipo] || []) : [];

    repSubtipo.innerHTML = `<option value="">Todos</option>`;

    opciones.forEach((subtipo) => {
        const option = document.createElement("option");
        option.value = subtipo;
        option.textContent = subtipo;
        repSubtipo.appendChild(option);
    });
}

function cargarParroquiasReportes() {
    const repCanton = document.getElementById("repCanton");
    const repParroquia = document.getElementById("repParroquia");

    if (!repCanton || !repParroquia) return;

    const canton = repCanton.value;
    const parroquias = ubicacionCatalogo.parroquiasPorCanton[canton] || [];

    repParroquia.innerHTML = `<option value="">Todas</option>`;

    parroquias.forEach((parroquia) => {
        const option = document.createElement("option");
        option.value = parroquia;
        option.textContent = parroquia;
        repParroquia.appendChild(option);
    });
}

function cargarSubcategoriasReportes() {
    const repCategoria = document.getElementById("repCategoria");
    const repSubcategoria = document.getElementById("repSubcategoria");

    if (!repCategoria || !repSubcategoria) return;

    const categoria = repCategoria.value;
    const data = categoriasResultados[categoria];

    repSubcategoria.innerHTML = `<option value="">Todas</option>`;

    if (!data) return;

    data.subcategorias.forEach((subcategoria) => {
        const option = document.createElement("option");
        option.value = subcategoria;
        option.textContent = subcategoria;
        repSubcategoria.appendChild(option);
    });
}
function limpiarFiltrosReportes() {
    const fechaDesde = document.getElementById("repFechaDesde");
    const fechaHasta = document.getElementById("repFechaHasta");
    const estado = document.getElementById("repEstado");
    const tipo = document.getElementById("repTipo");
    const subtipo = document.getElementById("repSubtipo");
    const canton = document.getElementById("repCanton");
    const parroquia = document.getElementById("repParroquia");
    const categoria = document.getElementById("repCategoria");
    const subcategoria = document.getElementById("repSubcategoria");
    const buscar = document.getElementById("repBuscar");

    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";

    // Reportes por defecto deben trabajar con operaciones validadas.
    if (estado) estado.value = "VALIDADO";

    if (tipo) tipo.value = "";
    if (canton) canton.value = "";
    if (categoria) categoria.value = "";
    if (buscar) buscar.value = "";

    // Recargar listas dependientes si existen estas funciones.
    if (typeof cargarSubtiposReportes === "function") {
        cargarSubtiposReportes();
    }

    if (typeof cargarParroquiasReportes === "function") {
        cargarParroquiasReportes();
    }

    if (typeof cargarSubcategoriasReportes === "function") {
        cargarSubcategoriasReportes();
    }

    if (subtipo) subtipo.value = "";
    if (parroquia) parroquia.value = "";
    if (subcategoria) subcategoria.value = "";

    renderReportes();
}

function obtenerColumnasReporte() {
    if (reporteDetallado) {
        return [
            { key: "fecha_operacion", titulo: "Fecha" },
            { key: "id_operacion", titulo: "ID operación" },
            { key: "tipo_operacion", titulo: "Tipo" },
            { key: "sub_tipo_operacion", titulo: "Subtipo" },
            { key: "canton", titulo: "Cantón" },
            { key: "parroquia", titulo: "Parroquia" },
            { key: "sector", titulo: "Sector" },
            { key: "responsable", titulo: "Responsable" },
            { key: "categoria", titulo: "Categoría" },
            { key: "subcategoria", titulo: "Subcategoría" },
            { key: "cantidad", titulo: "Cant." },
            { key: "unidad_medida", titulo: "Unidad" },
            { key: "descripcion", titulo: "Descripción" }
        ];
    }

    return [
        { key: "fecha_operacion", titulo: "Fecha" },
        { key: "id_operacion", titulo: "ID operación" },
        { key: "tipo_operacion", titulo: "Tipo" },
        { key: "sub_tipo_operacion", titulo: "Subtipo" },
        { key: "canton", titulo: "Cantón" },
        { key: "parroquia", titulo: "Parroquia" },
        { key: "sector", titulo: "Sector" },
        { key: "responsable", titulo: "Responsable" },
        { key: "hubo_resultados", titulo: "Hubo resultados" },
        { key: "observacion_general", titulo: "Observación general" }
    ];
}

function obtenerFilasReporteFiltradas() {
    recargarDatosDesdeStorage();

    const fechaDesde = document.getElementById("repFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("repFechaHasta")?.value || "";
    const estado = document.getElementById("repEstado")?.value || "";
    const huboResultados = document.getElementById("repHuboResultados")?.value || "";
    const tipo = document.getElementById("repTipo")?.value || "";
    const subtipo = document.getElementById("repSubtipo")?.value || "";
    const canton = document.getElementById("repCanton")?.value || "";
    const parroquia = document.getElementById("repParroquia")?.value || "";
    const categoria = document.getElementById("repCategoria")?.value || "";
    const subcategoria = document.getElementById("repSubcategoria")?.value || "";
    const responsable = (document.getElementById("repResponsable")?.value || "").toLowerCase().trim();

    let operaciones = [...operacionesSistema];

    operaciones = operaciones.filter((op) => {
        const fechaOperacion = obtenerFechaISO(op.fecha_operacion);

        const okFechaDesde = !fechaDesde || fechaOperacion >= fechaDesde;
        const okFechaHasta = !fechaHasta || fechaOperacion <= fechaHasta;
        const okEstado = !estado || op.estado_operacion === estado;
        const okHuboResultados = !huboResultados || op.hubo_resultados === huboResultados;
        const okTipo = !tipo || op.tipo_operacion === tipo;
        const okSubtipo = !subtipo || op.sub_tipo_operacion === subtipo;
        const okCanton = !canton || op.canton === canton;
        const okParroquia = !parroquia || op.parroquia === parroquia;

        const textoResponsable = `${op.grado_responsable || ""} ${op.responsable || ""} ${op.registrado_por || ""}`.toLowerCase();
        const okResponsable = !responsable || textoResponsable.includes(responsable);

        return okFechaDesde &&
            okFechaHasta &&
            okEstado &&
            okHuboResultados &&
            okTipo &&
            okSubtipo &&
            okCanton &&
            okParroquia &&
            okResponsable;
    });

    const filas = [];

    operaciones.forEach((op) => {
        let resultados = resultadosSistema.filter((r) => r.id_operacion === op.id_operacion);

        if (categoria) {
            resultados = resultados.filter((r) => r.categoria === categoria);
        }

        if (subcategoria) {
            resultados = resultados.filter((r) => r.subcategoria === subcategoria);
        }

        if (categoria || subcategoria) {
            if (resultados.length === 0) return;
        }

        if (reporteDetallado) {
            if (resultados.length === 0) {
                filas.push(crearFilaReporteDetallado(op, null));
            } else {
                resultados.forEach((resultado) => {
                    filas.push(crearFilaReporteDetallado(op, resultado));
                });
            }
        } else {
            filas.push(crearFilaReporteGeneral(op));
        }
    });

    return filas;
}

function crearFilaReporteGeneral(op) {
    return {
        fecha_operacion: op.fecha_operacion || "",
        id_operacion: op.id_operacion || "",
        tipo_operacion: op.tipo_operacion || "",
        sub_tipo_operacion: op.sub_tipo_operacion || "",
        canton: op.canton || "",
        parroquia: op.parroquia || "",
        sector: op.sector || "",
        responsable: `${op.grado_responsable || ""} ${op.responsable || ""}`.trim(),
        hubo_resultados: op.hubo_resultados || "",
        observacion_general: op.observacion_general || ""
    };
}

function crearFilaReporteDetallado(op, resultado) {
    return {
        fecha_operacion: op.fecha_operacion || "",
        id_operacion: op.id_operacion || "",
        tipo_operacion: op.tipo_operacion || "",
        sub_tipo_operacion: op.sub_tipo_operacion || "",
        canton: op.canton || "",
        parroquia: op.parroquia || "",
        sector: op.sector || "",
        responsable: `${op.grado_responsable || ""} ${op.responsable || ""}`.trim(),
        categoria: resultado ? resultado.categoria : "Sin resultados",
        subcategoria: resultado ? resultado.subcategoria : "Sin resultados",
        cantidad: resultado ? resultado.cantidad : "",
        unidad_medida: resultado ? resultado.unidad_medida : "",
        descripcion: resultado ? (resultado.descripcion || "") : (op.observacion_general || "")
    };
}

function renderReportes() {
    const tbody = document.getElementById("reportesTableBody");
    const thead = document.getElementById("reportesTableHead");
    const table = document.querySelector(".report-table");

    if (!tbody || !thead) return;

    const columnas = obtenerColumnasReporte();
    const filas = obtenerFilasReporteFiltradas();

    if (table) {
        table.classList.toggle("detallado", reporteDetallado);
    }

    thead.innerHTML = `
        <tr>
            ${columnas.map((col) => `<th>${col.titulo}</th>`).join("")}
        </tr>
    `;

    tbody.innerHTML = "";

    if (filas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${columnas.length}" class="empty-table">Sin datos disponibles con los filtros seleccionados.</td>
            </tr>
        `;

        actualizarResumenReportes([]);
        return;
    }

    filas.forEach((fila) => {
        const tr = document.createElement("tr");

        tr.innerHTML = columnas.map((col) => {
            let valor = fila[col.key] || "";

            if (col.key === "fecha_operacion") {
                valor = formatearFecha(valor);
            }

            return `<td>${valor || ""}</td>`;
        }).join("");

        tbody.appendChild(tr);
    });

    actualizarResumenReportes(filas);
}

function actualizarResumenReportes(filas) {
    const idsOperaciones = new Set(filas.map((f) => f.id_operacion).filter(Boolean));

    let operacionesConResultados = new Set();

    filas.forEach((fila) => {
        const op = operacionesSistema.find((o) => o.id_operacion === fila.id_operacion);
        if (op && op.hubo_resultados === "SI") {
            operacionesConResultados.add(op.id_operacion);
        }
    });

    setText("repTotalFilas", formatNumero(filas.length));
    setText("repTotalOperaciones", formatNumero(idsOperaciones.size));
    setText("repOperacionesResultados", formatNumero(operacionesConResultados.size));
}

function exportarReporteCSV() {
    const filas = obtenerFilasReporteFiltradas();

    if (filas.length === 0) {
        mostrarMensajeReportes("No existen datos para exportar.", "error");
        return;
    }

    const columnas = obtenerColumnasReporte();

    const encabezado = columnas.map((col) => col.titulo);

    const filasCsv = filas.map((fila) => {
        return columnas.map((col) => {
            let valor = fila[col.key] || "";

            if (col.key === "fecha_operacion") {
                valor = formatearFecha(valor);
            }

            return valor;
        });
    });

    const csv = convertirACsv([encabezado, ...filasCsv]);
    const tipo = reporteDetallado ? "detallado" : "general";

    descargarArchivo(csv, `reporte_operaciones_${tipo}_${obtenerFechaArchivo()}.csv`, "text/csv;charset=utf-8;");
    registrarAuditoria(
        "EXPORTAR_CSV",
        "REPORTES",
        "",
        `Exportó reporte ${reporteDetallado ? "detallado" : "general"} en CSV`
    );

    mostrarMensajeReportes("Reporte CSV exportado correctamente.", "success");
}

function exportarReportePDF() {
    const filas = obtenerFilasReporteFiltradas();

    if (filas.length === 0) {
        mostrarMensajeReportes("No existen datos para exportar.", "error");
        return;
    }

    const columnas = obtenerColumnasReporte();

    const usuarioGenera = usuarioActual
        ? `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`
        : "Usuario no identificado";
    const fechaGeneracion = new Date().toLocaleString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
    const logoGrupo = `${baseUrl}assets/logo-gcm12.png`;
    const logoEjercito = `${baseUrl}assets/logo-ejercito.png`;

    const filasHtml = filas.map((fila) => `
        <tr>
            ${columnas.map((col) => {
        let valor = fila[col.key] || "";

        if (col.key === "fecha_operacion") {
            valor = formatearFecha(valor);
        }

        return `<td>${escaparHtml(valor)}</td>`;
    }).join("")}
        </tr>
    `).join("");

    const encabezadoHtml = columnas.map((col) => `<th>${escaparHtml(col.titulo)}</th>`).join("");

    const ventana = window.open("", "_blank");

    if (!ventana) {
        mostrarMensajeReportes("El navegador bloqueó la ventana emergente. Permita pop-ups para exportar PDF.", "error");
        return;
    }

    const tituloReporte = reporteDetallado
        ? "Reporte Operacional Detallado"
        : "Reporte Operacional General";



    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${tituloReporte} GCM 12</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }

                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin: 22px;
                    color: #111827;
                }

                .institutional-header {
                    display: grid;
                    grid-template-columns: 90px 1fr 90px;
                    align-items: center;
                    gap: 14px;
                    
                    padding-bottom: 12px;
                    margin-bottom: 14px;
                }

                .institutional-header img {
                    width: 72px;
                    height: 72px;
                    object-fit: contain;
                }

                .institutional-header .right-logo {
                    justify-self: end;
                }

                .institutional-title {
                    text-align: center;
                }

                .institutional-title h1 {
                    margin: 0;
                    color: #000000;
                    font-size: 22px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                .institutional-title h2 {
                    margin: 5px 0 0;
                    color: #111827;
                    font-size: 15px;
                    font-weight: 700;
                }

                .institutional-title h3 {
                    margin: 3px 0 0;
                    color: #374151;
                    font-size: 13px;
                    font-weight: 600;
                }

                .report-title {
                    margin: 12px 0 14px;
                }

                .report-title h4 {
                    margin: 0;
                    color: #361469;
                    font-size: 18px;
                }

                .report-title p {
                    margin: 4px 0 0;
                    color: #4b5563;
                    font-size: 12px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: ${reporteDetallado ? "9px" : "10px"};
                }

                th {
                    background: #361469;
                    color: #ffffff;
                    padding: 7px;
                    border: 1px solid #24113F;
                    text-align: left;
                }

                td {
                    padding: 6px;
                    border: 1px solid #d1d5db;
                    vertical-align: top;
                }

                tr:nth-child(even) td {
                    background: #F9FAFB;
                }

                .generated-by {
                    margin-top: 18px;
                    font-size: 12px;
                    color: #111827;
                    text-align: left;
                }

                .generated-by strong {
                    color: #361469;
                }
                .generated-info {
                    margin-top: 18px;
                    font-size: 12px;
                    color: #1f2937;
                }

                .generated-info p {
                    margin: 4px 0;
                }

                .generated-info strong {
                    color: #2d0b5c;
                }

                .footer {
                    margin-top: 8px;
                    font-size: 10px;
                    color: #6b7280;
                    border-top: 1px solid #E6E3EA;
                    padding-top: 8px;
                }

                @media print {
                    body {
                        margin: 0;
                    }

                    table {
                        page-break-inside: auto;
                    }

                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            </style>
        </head>

        <body>
            <div class="institutional-header">
                <img src="${logoGrupo}" alt="Logo GCM 12">

                <div class="institutional-title">
                    <h1>Fuerza Terrestre</h1>
                    <h1>Grupo de Caballería Mecanizado Nº 12</h1>
                    <h1>“Tnte Hugo Ortiz”</h1>
                </div>

                <img src="${logoEjercito}" alt="Logo Ejército" class="right-logo">
            </div>

            <div class="report-title">
                <h4>${tituloReporte} GCM 12</h4>
                
            </div>

            <table>
                <thead>
                    <tr>
                        ${encabezadoHtml}
                    </tr>
                </thead>

                <tbody>
                    ${filasHtml}
                </tbody>
            </table>

            <div class="generated-info">
                <p><strong>Generado por:</strong> ${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}</p>
                <p><strong>Fecha de generación:</strong> ${fechaGeneracion}</p>
            </div>

            <div class="footer">
                Documento generado desde el Sistema de Registro y Control de Operaciones Militares del GCM 12.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    registrarAuditoria(
        "EXPORTAR_PDF",
        "REPORTES",
        "",
        `Exportó reporte ${reporteDetallado ? "detallado" : "general"} en PDF`
    );
    ventana.document.close();

    mostrarMensajeReportes("Vista PDF generada. Use Guardar como PDF en la ventana de impresión.", "success");
}


function convertirACsv(filas) {
    return filas.map((fila) => {
        return fila.map((valor) => {
            const texto = String(valor ?? "").replace(/"/g, '""');
            return `"${texto}"`;
        }).join(";");
    }).join("\n");
}

function descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob(["\uFEFF" + contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function obtenerFechaArchivo() {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const mi = String(fecha.getMinutes()).padStart(2, "0");

    return `${yyyy}${mm}${dd}_${hh}${mi}`;
}

function mostrarMensajeReportes(mensaje, tipo) {
    const message = document.getElementById("reportesMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;

    setTimeout(() => {
        message.textContent = "";
        message.className = "form-message";
    }, 4500);
}

// ======================================================
// AUDITORÍA DEL SISTEMA
// ======================================================

function registrarAuditoria(accion, modulo, idRegistro = "", detalle = "", usuarioForzado = null) {
    const usuario = usuarioForzado || usuarioActual;

    const nombreUsuario = usuario
        ? `${usuario.grado || ""} ${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim()
        : "NO IDENTIFICADO";

    const rolUsuario = usuario ? usuario.rol : "NO_IDENTIFICADO";
    const usuarioCedula = usuario ? usuario.usuario : "";

    const registro = {
        id_auditoria: generarIdAuditoria(),
        fecha_hora: new Date().toISOString(),
        usuario: nombreUsuario,
        usuario_cedula: usuarioCedula,
        rol: rolUsuario,
        accion,
        modulo,
        id_registro: idRegistro || "",
        detalle: detalle || "",
        ip_dispositivo: "N/A"
    };

    auditoriaSistema.push(registro);
    guardarAuditoriaSistema();

    if (obtenerPaginaActivaId() === "auditoriaPage") {
        renderAuditoria();
    }

    if (USAR_GOOGLE_SHEETS) {
        apiPost("SAVE_AUDIT", {
            auditoria: registro
        }).catch((error) => {
            console.warn("No se pudo guardar auditoría ", error);
        });
    }
}

function generarIdAuditoria() {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 900000) + 100000;

    return `AUD-${yyyy}${mm}${dd}-${random}`;
}

function configurarAuditoria() {
    const auditoriaPage = document.getElementById("auditoriaPage");
    if (!auditoriaPage) return;

    const filtros = [
        "auditoriaBuscar",
        "auditoriaAccion",
        "auditoriaModulo",
        "auditoriaRol",
        "auditoriaFechaDesde",
        "auditoriaFechaHasta"
    ];

    filtros.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;

        const evento = element.tagName === "INPUT" ? "input" : "change";
        element.addEventListener(evento, renderAuditoria);
    });

    const limpiarBtn = document.getElementById("limpiarFiltrosAuditoriaBtn");

    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", limpiarFiltrosAuditoria);
    }
}

function limpiarFiltrosAuditoria() {
    document.getElementById("auditoriaBuscar").value = "";
    document.getElementById("auditoriaAccion").value = "";
    document.getElementById("auditoriaModulo").value = "";
    document.getElementById("auditoriaRol").value = "";
    document.getElementById("auditoriaFechaDesde").value = "";
    document.getElementById("auditoriaFechaHasta").value = "";

    renderAuditoria();
}

function obtenerAuditoriaFiltrada() {
    recargarDatosDesdeStorage();

    const texto = (document.getElementById("auditoriaBuscar")?.value || "").toLowerCase().trim();
    const accion = document.getElementById("auditoriaAccion")?.value || "";
    const modulo = document.getElementById("auditoriaModulo")?.value || "";
    const rol = document.getElementById("auditoriaRol")?.value || "";
    const fechaDesde = document.getElementById("auditoriaFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("auditoriaFechaHasta")?.value || "";

    return auditoriaSistema
        .filter((item) => {
            const fecha = item.fecha_hora ? item.fecha_hora.slice(0, 10) : "";

            const textoRegistro = `
                ${item.usuario}
                ${item.usuario_cedula}
                ${item.rol}
                ${item.accion}
                ${item.modulo}
                ${item.id_registro}
                ${item.detalle}
            `.toLowerCase();

            const okTexto = !texto || textoRegistro.includes(texto);
            const okAccion = !accion || item.accion === accion;
            const okModulo = !modulo || item.modulo === modulo;
            const okRol = !rol || item.rol === rol;
            const okFechaDesde = !fechaDesde || fecha >= fechaDesde;
            const okFechaHasta = !fechaHasta || fecha <= fechaHasta;

            return okTexto && okAccion && okModulo && okRol && okFechaDesde && okFechaHasta;
        })
        .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
}

function renderAuditoria() {
    const tbody = document.getElementById("auditoriaTableBody");
    if (!tbody) return;

    const datos = obtenerAuditoriaFiltrada();

    tbody.innerHTML = "";

    if (datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">Sin registros de auditoría.</td>
            </tr>
        `;
        return;
    }

    datos.forEach((item) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${formatearFechaHora(item.fecha_hora)}</td>
            <td>${item.usuario}</td>
            <td>${item.rol}</td>
            <td><span class="audit-badge ${obtenerClaseAuditoria(item.accion)}">${item.accion}</span></td>
            <td>${item.modulo}</td>
            <td>${item.id_registro || "-"}</td>
            <td>${item.detalle || ""}</td>
        `;

        tbody.appendChild(tr);
    });
}

function obtenerClaseAuditoria(accion) {
    if (accion === "LOGIN") return "audit-login";
    if (accion === "LOGIN_FALLIDO") return "audit-error";
    if (accion === "CREAR") return "audit-create";
    if (accion === "EDITAR") return "audit-edit";

    if ([
        "VALIDAR",
        "OBSERVAR",
        "ANULAR",
        "ACTIVAR",
        "INACTIVAR",
        "ELIMINAR",
        "EXPORTAR_CSV",
        "EXPORTAR_PDF"
    ].includes(accion)) {
        return "audit-admin";
    }

    return "audit-admin";
}

// ======================================================
// INICIO POR ROL
// ======================================================

function renderInicioPorRol() {
    if (!usuarioActual) return;

    recargarDatosDesdeStorage();

    const statsGrid = document.getElementById("inicioStatsGrid");
    const actions = document.getElementById("inicioActions");
    const recentPanel = document.getElementById("inicioRecentPanel");
    const recentTitle = document.getElementById("inicioRecentTitle");
    const recentHead = document.getElementById("inicioRecentHead");
    const recentBody = document.getElementById("inicioRecentBody");

    if (!statsGrid || !actions || !recentPanel || !recentHead || !recentBody) return;

    statsGrid.innerHTML = "";
    actions.innerHTML = "";
    recentHead.innerHTML = "";
    recentBody.innerHTML = "";
    recentPanel.classList.add("hidden");

    if (usuarioActual.rol === "ADMIN") {
        renderInicioAdmin(statsGrid, actions, recentPanel, recentTitle, recentHead, recentBody);
        return;
    }

    if (usuarioActual.rol === "COMANDANTE_ECO") {
        renderInicioComandanteOperaciones(statsGrid, actions, recentPanel, recentTitle, recentHead, recentBody);
        return;
    }

    if (usuarioActual.rol === "COMANDANTE_UNIDAD") {
        renderInicioComandanteUnidad(statsGrid, actions);
    }
}

function crearStatInicio(titulo, valor, clase = "purple") {
    return `
        <article class="stat-card ${clase}">
            <span>${titulo}</span>
            <strong>${formatNumero(valor)}</strong>
        </article>
    `;
}

function crearBotonInicio(texto, pageId, title, subtitle, clase = "btn-primary") {
    return `
        <button 
            type="button" 
            class="btn ${clase} btn-auto"
            onclick="mostrarPagina('${pageId}', '${title}', '${subtitle}')"
        >
            ${texto}
        </button>
    `;
}

function renderInicioAdmin(statsGrid, actions, recentPanel, recentTitle, recentHead, recentBody) {
    const totalUsuarios = usuariosSistema.length;
    const usuariosActivos = usuariosSistema.filter((u) => u.estado === "ACTIVO").length;

    const operacionesRegistradas = operacionesSistema.filter((op) => op.estado_operacion === "REGISTRADO").length;
    const operacionesObservadas = operacionesSistema.filter((op) => op.estado_operacion === "OBSERVADO").length;
    const operacionesValidadas = operacionesSistema.filter((op) => op.estado_operacion === "VALIDADO").length;
    const operacionesAnuladas = operacionesSistema.filter((op) => op.estado_operacion === "ANULADO").length;

    statsGrid.innerHTML = `
        ${crearStatInicio("Pendientes de validar", operacionesRegistradas, "gold")}
        ${crearStatInicio("Operaciones observadas", operacionesObservadas, "red")}
        ${crearStatInicio("Operaciones validadas", operacionesValidadas, "green")}
        ${crearStatInicio("Operaciones anuladas", operacionesAnuladas, "gray")}
        ${crearStatInicio("Usuarios registrados", totalUsuarios, "purple")}
        ${crearStatInicio("Usuarios activos", usuariosActivos, "green")}
    `;

    actions.innerHTML = `
        ${crearBotonInicio("Gestionar usuarios", "usuariosPage", "Usuarios", "Gestión de usuarios y roles")}
        ${crearBotonInicio("Administrar operaciones", "operacionesPage", "Operaciones", "Administración general de operaciones", "btn-secondary")}
        ${crearBotonInicio("Ver reportes", "reportesPage", "Reportes", "Consulta y exportación de información", "btn-outline-dark")}
        ${crearBotonInicio("Auditoría", "auditoriaPage", "Auditoría", "Historial de acciones del sistema", "btn-outline-dark")}
    `;

    const ultimasOperaciones = [...operacionesSistema]
        .sort((a, b) => new Date(b.fecha_registro || b.ultima_modificacion || 0) - new Date(a.fecha_registro || a.ultima_modificacion || 0))
        .slice(0, 6);

    recentPanel.classList.remove("hidden");
    recentTitle.textContent = "Últimas operaciones registradas";

    recentHead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>ID</th>
            <th>Tipo</th>
            <th>Cantón</th>
            <th>Responsable</th>
            <th>Estado</th>
        </tr>
    `;

    if (ultimasOperaciones.length === 0) {
        recentBody.innerHTML = `
            <tr>
                <td colspan="6" class="home-empty">Sin operaciones registradas.</td>
            </tr>
        `;
        return;
    }

    recentBody.innerHTML = ultimasOperaciones.map((op) => `
        <tr>
            <td>${formatearFecha(op.fecha_operacion)}</td>
            <td>${op.id_operacion}</td>
            <td>${op.tipo_operacion}</td>
            <td>${op.canton}</td>
            <td>${op.grado_responsable} ${op.responsable}</td>
            <td><span class="op-status ${normalizarEstadoClass(op.estado_operacion)}">${op.estado_operacion}</span></td>
        </tr>
    `).join("");
}

function renderInicioComandanteOperaciones(statsGrid, actions, recentPanel, recentTitle, recentHead, recentBody) {
    const misOperaciones = operacionesSistema.filter((op) => esOperacionDelUsuarioActual(op));

    const total = misOperaciones.length;
    const conResultados = misOperaciones.filter((op) => op.hubo_resultados === "SI").length;
    const sinResultados = misOperaciones.filter((op) => op.hubo_resultados === "NO").length;
    const registradas = misOperaciones.filter((op) => op.estado_operacion === "REGISTRADO").length;
    const observadas = misOperaciones.filter((op) => op.estado_operacion === "OBSERVADO").length;
    const validadas = misOperaciones.filter((op) => op.estado_operacion === "VALIDADO").length;

    statsGrid.innerHTML = `
        ${crearStatInicio("Mis operaciones", total, "purple")}
        ${crearStatInicio("Con resultados", conResultados, "gold")}
        ${crearStatInicio("Sin resultados", sinResultados, "gray")}
        ${crearStatInicio("Pendientes", registradas, "purple")}
        ${crearStatInicio("Observadas", observadas, "red")}
        ${crearStatInicio("Validadas", validadas, "green")}
    `;

    actions.innerHTML = `
        ${crearBotonInicio("Registrar nueva operación", "registrarPage", "Registrar operación", "Registro de operaciones y resultados")}
        ${crearBotonInicio("Ver mis operaciones", "misOperacionesPage", "Mis operaciones", "Operaciones registradas por el usuario", "btn-secondary")}
    `;

    const ultimas = [...misOperaciones]
        .sort((a, b) => new Date(b.fecha_registro || b.ultima_modificacion || 0) - new Date(a.fecha_registro || a.ultima_modificacion || 0))
        .slice(0, 6);

    recentPanel.classList.remove("hidden");
    recentTitle.textContent = "Mis últimas operaciones";

    recentHead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>ID</th>
            <th>Tipo</th>
            <th>Subtipo</th>
            <th>Cantón</th>
            <th>Resultados</th>
            <th>Estado</th>
        </tr>
    `;

    if (ultimas.length === 0) {
        recentBody.innerHTML = `
            <tr>
                <td colspan="7" class="home-empty">Todavía no ha registrado operaciones.</td>
            </tr>
        `;
        return;
    }

    recentBody.innerHTML = ultimas.map((op) => `
        <tr>
            <td>${formatearFecha(op.fecha_operacion)}</td>
            <td>${op.id_operacion}</td>
            <td>${op.tipo_operacion}</td>
            <td>${op.sub_tipo_operacion}</td>
            <td>${op.canton}</td>
            <td>${op.hubo_resultados}</td>
            <td><span class="op-status ${normalizarEstadoClass(op.estado_operacion)}">${op.estado_operacion}</span></td>
        </tr>
    `).join("");
}

function renderInicioComandanteUnidad(statsGrid, actions) {
    const operacionesValidadas = operacionesSistema.filter((op) => op.estado_operacion === "VALIDADO");
    const total = operacionesValidadas.length;
    const conResultados = operacionesValidadas.filter((op) => op.hubo_resultados === "SI").length;
    const sinResultados = operacionesValidadas.filter((op) => op.hubo_resultados === "NO").length;

    statsGrid.innerHTML = `
        ${crearStatInicio("Operaciones validadas", total, "purple")}
        ${crearStatInicio("Con resultados", conResultados, "gold")}
        ${crearStatInicio("Sin resultados", sinResultados, "gray")}
    `;

    actions.innerHTML = `
        ${crearBotonInicio("Ir al dashboard", "dashboardPage", "Dashboard", "Estadísticas generales de operaciones")}
        ${crearBotonInicio("Ver reportes", "reportesPage", "Reportes", "Consulta y exportación de información", "btn-secondary")}
    `;
}

function obtenerPaginaActivaId() {
    const paginaActiva = document.querySelector(".page.active");
    return paginaActiva ? paginaActiva.id : "";
}

function renderPaginaActiva() {
    const pageId = obtenerPaginaActivaId();

    if (pageId === "inicioPage") {
        renderInicioPorRol();
        return;
    }

    if (pageId === "usuariosPage") {
        renderUsuariosAdmin();
        return;
    }

    if (pageId === "registrarPage") {
        return;
    }

    if (pageId === "misOperacionesPage") {
        renderMisOperaciones();
        return;
    }

    if (pageId === "operacionesPage") {
        renderOperacionesAdmin();
        return;
    }

    if (pageId === "dashboardPage") {
        renderDashboard();
        return;
    }

    if (pageId === "reportesPage") {
        renderReportes();
        return;
    }

    if (pageId === "auditoriaPage") {
        renderAuditoria();
        return;
    }

    renderInicioPorRol();
}

async function cargarDatosDePagina(pageId) {
    if (!usuarioActual) return;

    try {
        mostrarEstadoCargaPagina("Actualizando información...");

        if (pageId === "usuariosPage") {
            await obtenerUsuariosDesdeGoogleSheets();
            renderUsuariosAdmin();
            return;
        }

        if (pageId === "misOperacionesPage") {
            await cargarPaginaMisOperaciones(1);
            return;
        }

        if (pageId === "operacionesPage") {
            await cargarPaginaOperacionesAdmin(1);
            return;
        }

        if (
            pageId === "inicioPage" ||
            pageId === "misOperacionesPage" ||
            pageId === "operacionesPage" ||
            pageId === "dashboardPage" ||
            pageId === "reportesPage"
        ) {
            await obtenerOperacionesDesdeGoogleSheets();

            if (pageId === "inicioPage") {
                renderInicioPorRol();
                return;
            }

            if (pageId === "misOperacionesPage") {
                renderMisOperaciones();
                return;
            }

            if (pageId === "operacionesPage") {
                renderOperacionesAdmin();
                return;
            }

            if (pageId === "dashboardPage") {
                renderDashboard();
                return;
            }

            if (pageId === "reportesPage") {
                renderReportes();
                return;
            }
        }

        if (pageId === "auditoriaPage") {
            await obtenerAuditoriaDesdeGoogleSheets();
            renderAuditoria();
            return;
        }

    } catch (error) {
        console.warn("No se pudo cargar datos actualizados para la página:", error);
        renderPaginaActiva();
    } finally {
        mostrarEstadoCargaPagina("");
    }
}

// ======================================================
// GRÁFICOS DASHBOARD - CHART.JS
// ======================================================

let dashboardCharts = {};

function renderGraficosDashboard(operaciones, resultados) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js no está cargado.");
        return;
    }

    renderGraficoEfectividad(operaciones);
    renderGraficoPersonal(operaciones);
    renderGraficoCategorias(resultados);
    renderGraficoCanton(operaciones);
    renderGraficoMes(operaciones);
    renderGraficoSubtipo(operaciones);
}

function crearOActualizarGrafico(canvasId, tipo, labels, data, label, extraOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (dashboardCharts[canvasId]) {
        dashboardCharts[canvasId].destroy();
    }

    const ctx = canvas.getContext("2d");

    const colores = generarColores(data.length);

    dashboardCharts[canvasId] = new Chart(ctx, {
        type: tipo,
        data: {
            labels,
            datasets: [
                {
                    label,
                    data,
                    borderWidth: tipo === "line" ? 3 : 1.5,
                    borderColor: tipo === "line"
                        ? "rgba(243, 198, 35, 0.95)"
                        : "rgba(255, 255, 255, 0.18)",
                    backgroundColor: tipo === "line"
                        ? "rgba(243, 198, 35, 0.18)"
                        : colores,
                    pointBackgroundColor: "rgba(243, 198, 35, 0.95)",
                    pointBorderColor: "#ffffff",
                    pointRadius: 4,
                    tension: 0.35,
                    fill: tipo === "line"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: tipo === "doughnut",
                    position: "bottom",
                    labels: {
                        color: "rgba(255, 255, 255, 0.82)",
                        font: {
                            size: 12,
                            weight: "bold"
                        },
                        padding: 14
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(20, 10, 34, 0.96)",
                    titleColor: "#ffffff",
                    bodyColor: "#ffffff",
                    borderColor: "rgba(243, 198, 35, 0.45)",
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: tipo === "doughnut" ? {} : {
                x: {
                    ticks: {
                        color: "rgba(255, 255, 255, 0.78)",
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.06)"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "rgba(255, 255, 255, 0.78)",
                        precision: 0,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.08)"
                    }
                }
            },
            ...extraOptions
        }
    });
}

function generarColores(cantidad) {
    const base = [
        "rgba(243, 198, 35, 0.82)",   // dorado institucional
        "rgba(104, 207, 224, 0.70)",  // cian táctico suave
        "rgba(155, 109, 255, 0.68)",  // morado claro
        "rgba(62, 167, 106, 0.68)",   // verde operativo
        "rgba(212, 84, 100, 0.68)",   // rojo vino controlado
        "rgba(118, 115, 111, 0.70)",  // gris metálico
        "rgba(179, 152, 77, 0.68)",   // dorado oscuro
        "rgba(74, 42, 122, 0.72)"     // morado institucional
    ];

    const colores = [];

    for (let i = 0; i < cantidad; i++) {
        colores.push(base[i % base.length]);
    }

    return colores;
}

function renderGraficoEfectividad(operaciones) {
    const conResultados = operaciones.filter((op) => op.hubo_resultados === "SI").length;
    const sinResultados = operaciones.filter((op) => op.hubo_resultados === "NO").length;

    const canvasId = "dashChartEfectividad";
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;

    if (dashboardCharts[canvasId]) {
        dashboardCharts[canvasId].destroy();
    }

    dashboardCharts[canvasId] = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Con resultados", "Sin resultados"],
            datasets: [
                {
                    data: [conResultados, sinResultados],
                    backgroundColor: [
                        "rgba(243, 198, 35, 0.85)",
                        "rgba(118, 115, 111, 0.75)"
                    ],
                    borderColor: "rgba(255, 255, 255, 0.18)",
                    borderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: "rgba(255, 255, 255, 0.82)",
                        font: {
                            size: 12,
                            weight: "bold"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(20, 10, 34, 0.96)",
                    titleColor: "#ffffff",
                    bodyColor: "#ffffff",
                    borderColor: "rgba(243, 198, 35, 0.45)",
                    borderWidth: 1
                }
            }
        }
    });
}

function renderGraficoPersonal(operaciones) {
    const oficiales = sumarCampoOperaciones(operaciones, "num_oficiales");
    const voluntarios = sumarCampoOperaciones(operaciones, "num_vol");
    const soldados = sumarCampoOperaciones(operaciones, "num_sldr");

    crearOActualizarGrafico(
        "dashChartPersonal",
        "bar",
        ["Oficiales", "Voluntarios", "Soldados"],
        [oficiales, voluntarios, soldados],
        "Personal empleado"
    );
}

function renderGraficoCategorias(resultados) {
    const mapa = new Map();

    resultados.forEach((r) => {
        const categoria = r.categoria || "SIN CATEGORÍA";
        mapa.set(categoria, (mapa.get(categoria) || 0) + 1);
    });

    const data = Array.from(mapa.entries())
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

    crearOActualizarGrafico(
        "dashChartCategorias",
        "bar",
        data.map((item) => item.nombre),
        data.map((item) => item.valor),
        "Registros de resultado"
    );
}

function renderGraficoCanton(operaciones) {
    const mapa = new Map();

    operaciones.forEach((op) => {
        const canton = op.canton || "SIN CANTÓN";
        mapa.set(canton, (mapa.get(canton) || 0) + 1);
    });

    const data = Array.from(mapa.entries())
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => b.valor - a.valor);

    crearOActualizarGrafico(
        "dashChartCanton",
        "bar",
        data.map((item) => item.nombre),
        data.map((item) => item.valor),
        "Operaciones por cantón"
    );
}

function renderGraficoMes(operaciones) {
    const mapa = new Map();

    operaciones.forEach((op) => {
        const mes = op.fecha_operacion ? op.fecha_operacion.slice(0, 7) : "SIN FECHA";
        mapa.set(mes, (mapa.get(mes) || 0) + 1);
    });

    const data = Array.from(mapa.entries())
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    crearOActualizarGrafico(
        "dashChartMes",
        "line",
        data.map((item) => item.nombre),
        data.map((item) => item.valor),
        "Operaciones por mes"
    );
}

function renderGraficoSubtipo(operaciones) {
    const mapa = new Map();

    operaciones.forEach((op) => {
        const subtipo = op.sub_tipo_operacion || "SIN SUBTIPO";
        mapa.set(subtipo, (mapa.get(subtipo) || 0) + 1);
    });

    const data = Array.from(mapa.entries())
        .map(([nombre, valor]) => ({ nombre, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

    crearOActualizarGrafico(
        "dashChartSubtipo",
        "bar",
        data.map((item) => item.nombre),
        data.map((item) => item.valor),
        "Operaciones por subtipo",
        {
            indexAxis: "y"
        }
    );
}

function migrarRolesAntiguos() {
    let huboCambios = false;

    usuariosSistema = usuariosSistema.map((usuario) => {
        if (usuario.rol === "COMANDANTE_OPERACIONES") {
            huboCambios = true;

            return {
                ...usuario,
                rol: "COMANDANTE_ECO",
                cargo: usuario.cargo === "Comandante de operaciones"
                    ? "Comandante ECO"
                    : usuario.cargo
            };
        }

        return usuario;
    });

    if (usuarioActual && usuarioActual.rol === "COMANDANTE_OPERACIONES") {
        usuarioActual.rol = "COMANDANTE_ECO";
        huboCambios = true;
    }

    if (huboCambios) {
        guardarUsuariosSistema();
        localStorage.setItem("gcm12_usuario_actual", JSON.stringify(usuarioActual));
    }
}

function migrarCamposPasswordUsuarios() {
    let huboCambios = false;

    usuariosSistema = usuariosSistema.map((u) => {
        const actualizado = { ...u };

        if (actualizado.debe_cambiar_password === undefined) {
            actualizado.debe_cambiar_password = "NO";
            huboCambios = true;
        }

        if (actualizado.fecha_cambio_password === undefined) {
            actualizado.fecha_cambio_password = "";
            huboCambios = true;
        }

        if (actualizado.ultimo_reset_password === undefined) {
            actualizado.ultimo_reset_password = "";
            huboCambios = true;
        }

        if (actualizado.reset_password_por === undefined) {
            actualizado.reset_password_por = "";
            huboCambios = true;
        }

        if (actualizado.password_reseteada === undefined) {
            actualizado.password_reseteada = "NO";
            huboCambios = true;
        }

        return actualizado;
    });

    if (huboCambios) {
        guardarUsuariosSistema();
    }
}

function limpiarSoloNumeros(valor, maximo = 10) {
    return String(valor || "")
        .replace(/\D/g, "")
        .slice(0, maximo);
}

function validarCedula10Digitos(cedula) {
    return /^\d{10}$/.test(String(cedula || "").trim());
}

function validarPasswordSegura(password) {
    const valor = String(password || "").trim();

    if (valor.length < 6) {
        return {
            valido: false,
            mensaje: "La contraseña debe tener al menos 6 caracteres."
        };
    }

    return {
        valido: true,
        mensaje: ""
    };
}

function cambiarPasswordUsuarioActual() {
    abrirModalCambiarPassword();
}

function resetearPasswordUsuario(idUsuario) {
    abrirModalResetPassword(idUsuario);
}

function mostrarAvisoPasswordReseteada() {
    if (!usuarioActual || usuarioActual.password_reseteada !== "SI") return;

    setTimeout(() => {
        alert("Su contraseña fue reseteada por el administrador. Puede cambiarla desde el botón 'Cambiar contraseña' si lo desea.");

        recargarDatosDesdeStorage();

        const usuario = usuariosSistema.find((u) => u.id_usuario === usuarioActual.id_usuario);

        if (usuario) {
            usuario.password_reseteada = "NO";
            usuarioActual.password_reseteada = "NO";

            guardarUsuariosSistema();
            localStorage.setItem("gcm12_usuario_actual", JSON.stringify(usuarioActual));
        }
    }, 300);
}

function configurarMenuCuenta() {
    const accountMenuBtn = document.getElementById("accountMenuBtn");
    const accountDropdown = document.getElementById("accountDropdown");
    const userBox = document.querySelector(".user-box");

    if (!accountMenuBtn || !accountDropdown) return;

    accountMenuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        accountDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
        if (!userBox) return;

        if (!userBox.contains(event.target)) {
            cerrarMenuCuenta();
        }
    });
}

function cerrarMenuCuenta() {
    const accountDropdown = document.getElementById("accountDropdown");

    if (accountDropdown) {
        accountDropdown.classList.add("hidden");
    }
}

function configurarModalPassword() {
    const cambiarPasswordBtn = document.getElementById("cambiarPasswordBtn");
    const passwordForm = document.getElementById("passwordForm");
    const cerrarBtn = document.getElementById("passwordModalClose");
    const cancelarBtn = document.getElementById("passwordCancelarBtn");

    if (cambiarPasswordBtn) {
        cambiarPasswordBtn.addEventListener("click", () => {
            cerrarMenuCuenta();
            abrirModalCambiarPassword();
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener("submit", procesarCambioPasswordDesdeModal);
    }

    if (cerrarBtn) {
        cerrarBtn.addEventListener("click", cerrarModalPassword);
    }

    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", cerrarModalPassword);
    }
}

function abrirModalCambiarPassword() {
    const modal = document.getElementById("passwordModal");
    const form = document.getElementById("passwordForm");
    const message = document.getElementById("passwordMessage");

    if (!modal || !form) return;

    form.reset();

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    modal.classList.remove("hidden");

    setTimeout(() => {
        document.getElementById("passwordActual")?.focus();
    }, 100);
}

function cerrarModalPassword() {
    const modal = document.getElementById("passwordModal");
    const form = document.getElementById("passwordForm");
    const message = document.getElementById("passwordMessage");

    if (form) form.reset();

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    if (modal) {
        modal.classList.add("hidden");
    }
}

function mostrarMensajePassword(mensaje, tipo) {
    const message = document.getElementById("passwordMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;
}

async function procesarCambioPasswordDesdeModal(event) {
    event.preventDefault();

    if (!usuarioActual) {
        mostrarMensajePassword("No existe una sesión activa.", "error");
        return;
    }

    const passwordActual = document.getElementById("passwordActual").value.trim();
    const nuevaPassword = document.getElementById("passwordNueva").value.trim();
    const confirmarPassword = document.getElementById("passwordConfirmar").value.trim();

    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
        mostrarMensajePassword("Complete todos los campos.", "error");
        return;
    }

    const validacion = validarPasswordSegura(nuevaPassword);

    if (!validacion.valido) {
        mostrarMensajePassword(validacion.mensaje, "error");
        return;
    }

    if (nuevaPassword === passwordActual) {
        mostrarMensajePassword("La nueva contraseña no puede ser igual a la contraseña actual.", "error");
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        mostrarMensajePassword("Las contraseñas no coinciden.", "error");
        return;
    }

    try {
        const usuarioActualizado = await apiPost("UPDATE_OWN_PASSWORD", {
            password_actual: passwordActual,
            nueva_password: nuevaPassword
        });

        usuarioActual = { ...usuarioActualizado };
        localStorage.setItem("gcm12_usuario_actual", JSON.stringify(usuarioActual));

        await obtenerUsuariosDesdeGoogleSheets();

        registrarAuditoria(
            "CAMBIAR_PASSWORD",
            "USUARIOS",
            usuarioActual.id_usuario,
            `El usuario ${usuarioActual.usuario} cambió su contraseña`
        );

        mostrarMensajePassword("Contraseña actualizada correctamente.", "success");

        setTimeout(() => {
            cerrarModalPassword();
        }, 1200);

    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        mostrarMensajePassword(`No se pudo cambiar la contraseña: ${error.message}`, "error");
    }
}

function configurarModalResetPassword() {
    const resetForm = document.getElementById("resetPasswordForm");
    const cerrarBtn = document.getElementById("resetPasswordModalClose");
    const cancelarBtn = document.getElementById("resetPasswordCancelarBtn");

    if (resetForm) {
        resetForm.addEventListener("submit", procesarResetPasswordDesdeModal);
    }

    if (cerrarBtn) {
        cerrarBtn.addEventListener("click", cerrarModalResetPassword);
    }

    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", cerrarModalResetPassword);
    }
}

function abrirModalResetPassword(idUsuario) {
    if (!usuarioActual || usuarioActual.rol !== "ADMIN") {
        alert("No tiene permisos para resetear contraseñas.");
        return;
    }

    recargarDatosDesdeStorage();

    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        alert("Usuario no encontrado.");
        return;
    }

    if (usuarioActual.id_usuario === usuario.id_usuario) {
        alert("No puede resetear la contraseña del usuario con sesión activa.");
        return;
    }

    const modal = document.getElementById("resetPasswordModal");
    const form = document.getElementById("resetPasswordForm");
    const inputId = document.getElementById("resetPasswordUsuarioId");
    const userInfo = document.getElementById("resetPasswordUserInfo");
    const message = document.getElementById("resetPasswordMessage");

    if (!modal || !form || !inputId || !userInfo) return;

    form.reset();
    inputId.value = usuario.id_usuario;

    userInfo.innerHTML = `
        ${usuario.grado || ""} ${usuario.nombres || ""} ${usuario.apellidos || ""}
        <span>Cédula: ${usuario.usuario || ""} | Rol: ${usuario.rol || ""}</span>
    `;

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    modal.classList.remove("hidden");

    setTimeout(() => {
        document.getElementById("resetPasswordNueva")?.focus();
    }, 100);
}

function cerrarModalResetPassword() {
    const modal = document.getElementById("resetPasswordModal");
    const form = document.getElementById("resetPasswordForm");
    const message = document.getElementById("resetPasswordMessage");

    if (form) form.reset();

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    if (modal) {
        modal.classList.add("hidden");
    }
}

function mostrarMensajeResetPassword(mensaje, tipo) {
    const message = document.getElementById("resetPasswordMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;
}

async function procesarResetPasswordDesdeModal(event) {
    event.preventDefault();

    if (!usuarioActual || usuarioActual.rol !== "ADMIN") {
        mostrarMensajeResetPassword("No tiene permisos para resetear contraseñas.", "error");
        return;
    }

    recargarDatosDesdeStorage();

    const idUsuario = document.getElementById("resetPasswordUsuarioId").value;
    const nuevaPassword = document.getElementById("resetPasswordNueva").value.trim();
    const confirmarPassword = document.getElementById("resetPasswordConfirmar").value.trim();

    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeResetPassword("Usuario no encontrado.", "error");
        return;
    }

    if (!nuevaPassword || !confirmarPassword) {
        mostrarMensajeResetPassword("Complete todos los campos.", "error");
        return;
    }

    const validacion = validarPasswordSegura(nuevaPassword);

    if (!validacion.valido) {
        mostrarMensajeResetPassword(validacion.mensaje, "error");
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        mostrarMensajeResetPassword("Las contraseñas no coinciden.", "error");
        return;
    }

    usuario.password = nuevaPassword;
    usuario.debe_cambiar_password = "NO";
    usuario.password_reseteada = "SI";
    usuario.ultimo_reset_password = new Date().toISOString();
    usuario.reset_password_por = `${usuarioActual.grado} ${usuarioActual.nombres} ${usuarioActual.apellidos}`;
    usuario.fecha_cambio_password = "";

    try {
        await apiPost("SAVE_USER", {
            usuario
        });
    } catch (error) {
        console.error("Error al resetear contraseña:", error);
        mostrarMensajeResetPassword(`No se pudo resetear la contraseña: ${error.message}`, "error");
        return;
    }

    await refrescarUsuariosDesdeGoogleSheets();

    registrarAuditoria(
        "RESET_PASSWORD",
        "USUARIOS",
        usuario.id_usuario,
        `Se reseteó la contraseña del usuario ${usuario.usuario}`
    );

    mostrarMensajeResetPassword("Contraseña reseteada correctamente.", "success");

    setTimeout(() => {
        cerrarModalResetPassword();
    }, 1200);
}

function configurarMapaOperacion() {
    const mapaBtn = document.getElementById("mapaBtn");
    const cerrarBtn = document.getElementById("mapaModalClose");
    const cancelarBtn = document.getElementById("mapaCancelarBtn");
    const confirmarBtn = document.getElementById("mapaConfirmarBtn");

    if (mapaBtn) {
        mapaBtn.addEventListener("click", abrirMapaOperacion);
    }

    if (cerrarBtn) {
        cerrarBtn.addEventListener("click", cerrarMapaOperacion);
    }

    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", cerrarMapaOperacion);
    }

    if (confirmarBtn) {
        confirmarBtn.addEventListener("click", confirmarPuntoMapaOperacion);
    }
}

function abrirMapaOperacion() {
    const modal = document.getElementById("mapaModal");
    const sectorInput = document.getElementById("sector");
    const sectorMapaInput = document.getElementById("sectorMapaReferencia");
    const coordenadasInput = document.getElementById("coordenadas");
    const message = document.getElementById("mapaMessage");

    if (!modal) return;

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    if (sectorMapaInput) {
        sectorMapaInput.value = sectorInput ? sectorInput.value.trim() : "";
    }

    coordenadasSeleccionadasMapa = obtenerCoordenadasDesdeTexto(coordenadasInput?.value || "");

    modal.classList.remove("hidden");

    setTimeout(() => {
        inicializarMapaOperacion();
    }, 200);
}

function cerrarMapaOperacion() {
    const modal = document.getElementById("mapaModal");
    const message = document.getElementById("mapaMessage");

    if (message) {
        message.textContent = "";
        message.className = "form-message";
    }

    if (modal) {
        modal.classList.add("hidden");
    }
}

function inicializarMapaOperacion() {
    if (typeof L === "undefined") {
        mostrarMensajeMapa("No se pudo cargar Leaflet. Revise la conexión a internet o el script en index.html.", "error");
        return;
    }

    const mapaDiv = document.getElementById("mapaOperacion");
    if (!mapaDiv) return;

    const coordenadasInput = document.getElementById("coordenadas");
    const puntoActual = obtenerCoordenadasDesdeTexto(coordenadasInput?.value || "");

    const centroInicial = puntoActual || {
        lat: -1.05458,
        lng: -80.45445
    };

    if (!mapaOperacion) {
        mapaOperacion = L.map("mapaOperacion").setView([centroInicial.lat, centroInicial.lng], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }).addTo(mapaOperacion);

        mapaOperacion.on("click", (event) => {
            establecerPuntoMapaOperacion(event.latlng.lat, event.latlng.lng);
        });
    } else {
        mapaOperacion.setView([centroInicial.lat, centroInicial.lng], 13);
        mapaOperacion.invalidateSize();
    }

    if (puntoActual) {
        establecerPuntoMapaOperacion(puntoActual.lat, puntoActual.lng);
    } else {
        actualizarPreviewCoordenadas(null);
    }

    setTimeout(() => {
        mapaOperacion.invalidateSize();
    }, 300);
}

function establecerPuntoMapaOperacion(lat, lng) {
    const latFixed = Number(lat).toFixed(6);
    const lngFixed = Number(lng).toFixed(6);

    coordenadasSeleccionadasMapa = {
        lat: Number(latFixed),
        lng: Number(lngFixed)
    };

    if (!mapaOperacion) return;

    if (!marcadorOperacion) {
        marcadorOperacion = L.marker([latFixed, lngFixed], {
            draggable: true
        }).addTo(mapaOperacion);

        marcadorOperacion.on("dragend", () => {
            const posicion = marcadorOperacion.getLatLng();
            establecerPuntoMapaOperacion(posicion.lat, posicion.lng);
        });
    } else {
        marcadorOperacion.setLatLng([latFixed, lngFixed]);
    }

    actualizarPreviewCoordenadas(coordenadasSeleccionadasMapa);
}

function actualizarPreviewCoordenadas(punto) {
    const preview = document.getElementById("mapaCoordenadasPreview");

    if (!preview) return;

    if (!punto) {
        preview.textContent = "Ningún punto seleccionado";
        return;
    }

    preview.textContent = `${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}`;
}

function confirmarPuntoMapaOperacion() {
    const coordenadasInput = document.getElementById("coordenadas");
    const sectorInput = document.getElementById("sector");
    const sectorMapaInput = document.getElementById("sectorMapaReferencia");

    if (!coordenadasSeleccionadasMapa) {
        mostrarMensajeMapa("Seleccione un punto en el mapa antes de confirmar.", "error");
        return;
    }

    const coordenadasTexto = `${coordenadasSeleccionadasMapa.lat.toFixed(6)}, ${coordenadasSeleccionadasMapa.lng.toFixed(6)}`;

    if (coordenadasInput) {
        coordenadasInput.value = coordenadasTexto;
    }

    if (sectorInput) {
        const sectorMapa = sectorMapaInput ? sectorMapaInput.value.trim() : "";

        if (sectorMapa) {
            sectorInput.value = sectorMapa;
        } else if (!sectorInput.value.trim()) {
            sectorInput.value = "Punto seleccionado en mapa";
        }
    }

    if (geoStatus) {
        geoStatus.textContent = `Punto seleccionado en mapa: ${coordenadasTexto}`;
        geoStatus.style.color = "#2F6B3F";
    }

    cerrarMapaOperacion();
}

function obtenerCoordenadasDesdeTexto(texto) {
    const valor = String(texto || "").trim();

    if (!valor) return null;

    const partes = valor.split(",").map((p) => p.trim());

    if (partes.length !== 2) return null;

    const lat = Number(partes[0]);
    const lng = Number(partes[1]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return {
        lat,
        lng
    };
}

function mostrarMensajeMapa(mensaje, tipo) {
    const message = document.getElementById("mapaMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;
}

function mostrarObservacionCorreccionOperacion(operacion) {
    const box = document.getElementById("observacionCorreccionBox");

    if (!box) return;

    if (
        operacion &&
        operacion.estado_operacion === "OBSERVADO" &&
        operacion.observacion_admin
    ) {
        box.innerHTML = `
            <strong>Operación observada. Corrija el registro según la siguiente observación:</strong><br>
            ${operacion.observacion_admin}
            ${operacion.observado_por ? `<br><br><strong>Observado por:</strong> ${operacion.observado_por}` : ""}
            ${operacion.fecha_observacion ? `<br><strong>Fecha:</strong> ${formatearFechaHora(operacion.fecha_observacion)}` : ""}
        `;

        box.classList.remove("hidden");
        return;
    }

    box.innerHTML = "";
    box.classList.add("hidden");
}

async function apiPost(action, payload = {}, opciones = {}) {
    if (!USAR_GOOGLE_SHEETS) {
        throw new Error("Google Sheets está desactivado.");
    }

    if (!API_URL || API_URL.includes("PEGA_AQUI")) {
        throw new Error("Configure la URL de Apps Script en API_URL.");
    }

    const accionesConLoader = [
        "LOGIN",
        "SAVE_USER",
        "DELETE_USER",
        "SAVE_OPERATION",
        "UPDATE_OPERATION_STATUS",
        "UPDATE_OWN_PASSWORD"
    ];

    const usarLoader = opciones.usarLoader !== undefined
        ? opciones.usarLoader
        : accionesConLoader.includes(action);

    const textoLoader = opciones.textoLoader || obtenerTextoLoaderPorAccion(action);

    if (usarLoader) {
        mostrarLoaderGlobal(textoLoader);
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action,
                payload,
                token: sessionToken
            })
        });

        const data = await response.json();

        if (!data.ok) {
            const mensaje = data.error || "Error desconocido en Apps Script.";

            if (
                action !== "LOGIN" &&
                /sesión|session|expiró|expirada|inválida|válida/i.test(mensaje)
            ) {
                cerrarSesionForzada(mensaje);
            }

            throw new Error(mensaje);
        }

        return data.data;

    } finally {
        if (usarLoader) {
            ocultarLoaderGlobal();
        }
    }
}

function obtenerTextoLoaderPorAccion(action) {
    const textos = {
        LOGIN: "Validando credenciales...",
        SAVE_USER: "Guardando usuario...",
        DELETE_USER: "Eliminando usuario...",
        SAVE_OPERATION: "Guardando operación...",
        UPDATE_OPERATION_STATUS: "Actualizando estado de operación...",
        UPDATE_OWN_PASSWORD: "Cambiando contraseña...",
        GET_ALL_DATA: "Cargando información...",
        GET_USERS: "Cargando usuarios...",
        GET_OPERATIONS_DATA: "Cargando operaciones...",
        GET_AUDIT: "Cargando auditoría..."
    };

    return textos[action] || "Procesando información...";
}

async function cargarDatosDesdeGoogleSheets(renderizar = true) {
    const data = await apiPost("GET_ALL_DATA");

    usuariosSistema = data.usuarios || [];
    operacionesSistema = (data.operaciones || []).map(normalizarOperacionDesdeSheets);
    resultadosSistema = data.resultados || [];
    auditoriaSistema = data.auditoria || [];

    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuariosSistema));
    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify(operacionesSistema));
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify(resultadosSistema));
    localStorage.setItem(STORAGE_AUDITORIA, JSON.stringify(auditoriaSistema));

    if (!renderizar) return;

    renderPaginaActiva();
}

async function obtenerUsuariosDesdeGoogleSheets() {
    const usuarios = await apiPost("GET_USERS");

    usuariosSistema = usuarios || [];
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuariosSistema));

    return usuariosSistema;
}

async function refrescarUsuariosDesdeGoogleSheets() {
    await obtenerUsuariosDesdeGoogleSheets();

    renderPaginaActiva();
}
async function obtenerOperacionesDesdeGoogleSheets() {
    const data = await apiPost("GET_OPERATIONS_DATA");

    operacionesSistema = (data.operaciones || []).map(normalizarOperacionDesdeSheets);
    resultadosSistema = data.resultados || [];

    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify(operacionesSistema));
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify(resultadosSistema));

    return {
        operaciones: operacionesSistema,
        resultados: resultadosSistema
    };
}

function obtenerFiltrosOperacionesAdmin() {
    return {
        texto: (document.getElementById("buscarOperacionesAdmin")?.value || "").trim(),
        fecha_desde: document.getElementById("filtroFechaDesdeOperacionesAdmin")?.value || "",
        fecha_hasta: document.getElementById("filtroFechaHastaOperacionesAdmin")?.value || "",
        estado: document.getElementById("filtroEstadoOperacionesAdmin")?.value || "",
        tipo_operacion: document.getElementById("filtroTipoOperacionesAdmin")?.value || "",
        hubo_resultados: document.getElementById("filtroResultadosOperacionesAdmin")?.value || ""
    };
}

function obtenerFiltrosMisOperaciones() {
    return {
        texto: (document.getElementById("buscarMisOperaciones")?.value || "").trim(),
        estado: document.getElementById("filtroEstadoMisOperaciones")?.value || "",
        hubo_resultados: document.getElementById("filtroResultadosMisOperaciones")?.value || ""
    };
}

async function cargarPaginaOperacionesAdmin(page = 1) {
    const data = await apiPost("GET_OPERATIONS_PAGE", {
        page,
        pageSize: paginacionOperacionesAdmin.pageSize,
        solo_mias: false,
        filtros: obtenerFiltrosOperacionesAdmin()
    }, {
        usarLoader: true,
        textoLoader: "Cargando operaciones..."
    });

    operacionesSistema = (data.operaciones || []).map(normalizarOperacionDesdeSheets);
    resultadosSistema = data.resultados || [];

    paginacionOperacionesAdmin = {
        page: data.page || 1,
        pageSize: data.pageSize || PAGE_SIZE_OPERACIONES,
        total: data.total || 0,
        totalPages: data.totalPages || 1
    };

    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify(operacionesSistema));
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify(resultadosSistema));

    renderOperacionesAdmin();
    renderPaginacionOperacionesAdmin();
}



async function cargarPaginaMisOperaciones(page = 1) {
    const data = await apiPost("GET_OPERATIONS_PAGE", {
        page,
        pageSize: paginacionMisOperaciones.pageSize,
        solo_mias: true,
        filtros: obtenerFiltrosMisOperaciones()
    }, {
        usarLoader: true,
        textoLoader: "Cargando mis operaciones..."
    });

    operacionesSistema = (data.operaciones || []).map(normalizarOperacionDesdeSheets);
    resultadosSistema = data.resultados || [];

    paginacionMisOperaciones = {
        page: data.page || 1,
        pageSize: data.pageSize || PAGE_SIZE_OPERACIONES,
        total: data.total || 0,
        totalPages: data.totalPages || 1
    };

    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify(operacionesSistema));
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify(resultadosSistema));

    renderMisOperaciones();
    renderPaginacionMisOperaciones();
}

function renderPaginacionOperacionesAdmin() {
    const contenedor = document.getElementById("operacionesAdminPaginacion");
    if (!contenedor) return;

    renderPaginacionGenerica(
        contenedor,
        paginacionOperacionesAdmin,
        "cambiarPaginaOperacionesAdmin"
    );
}

function renderPaginacionMisOperaciones() {
    const contenedor = document.getElementById("misOperacionesPaginacion");
    if (!contenedor) return;

    renderPaginacionGenerica(
        contenedor,
        paginacionMisOperaciones,
        "cambiarPaginaMisOperaciones"
    );
}

function renderPaginacionGenerica(contenedor, paginacion, nombreFuncionCambio) {
    const inicio = paginacion.total === 0
        ? 0
        : ((paginacion.page - 1) * paginacion.pageSize) + 1;

    const fin = Math.min(paginacion.page * paginacion.pageSize, paginacion.total);

    contenedor.innerHTML = `
        <div class="pagination-info">
            Mostrando ${inicio} - ${fin} de ${paginacion.total} registros
            | Página ${paginacion.page} de ${paginacion.totalPages}
        </div>

        <div class="pagination-actions">
            <button 
                type="button" 
                class="btn btn-outline-dark"
                onclick="${nombreFuncionCambio}(-1)"
                ${paginacion.page <= 1 ? "disabled" : ""}
            >
                Anterior
            </button>

            <button 
                type="button" 
                class="btn btn-outline-dark"
                onclick="${nombreFuncionCambio}(1)"
                ${paginacion.page >= paginacion.totalPages ? "disabled" : ""}
            >
                Siguiente
            </button>
        </div>
    `;
}

function cambiarPaginaOperacionesAdmin(direccion) {
    const nuevaPagina = paginacionOperacionesAdmin.page + direccion;

    if (nuevaPagina < 1 || nuevaPagina > paginacionOperacionesAdmin.totalPages) return;

    cargarPaginaOperacionesAdmin(nuevaPagina);
}

function cambiarPaginaMisOperaciones(direccion) {
    const nuevaPagina = paginacionMisOperaciones.page + direccion;

    if (nuevaPagina < 1 || nuevaPagina > paginacionMisOperaciones.totalPages) return;

    cargarPaginaMisOperaciones(nuevaPagina);
}

function normalizarOperacionDesdeSheets(operacion) {
    return {
        ...operacion,
        fecha_operacion: obtenerFechaISO(operacion.fecha_operacion),
        hora_inicio: formatearHoraOperacion(operacion.hora_inicio),
        hora_fin: formatearHoraOperacion(operacion.hora_fin)
    };
}

async function obtenerAuditoriaDesdeGoogleSheets() {
    const auditoria = await apiPost("GET_AUDIT");

    auditoriaSistema = auditoria || [];
    localStorage.setItem(STORAGE_AUDITORIA, JSON.stringify(auditoriaSistema));

    return auditoriaSistema;
}

async function refrescarAuditoriaDesdeGoogleSheets() {
    await obtenerAuditoriaDesdeGoogleSheets();
    renderPaginaActiva();
}

async function refrescarOperacionesDesdeGoogleSheets() {
    await obtenerOperacionesDesdeGoogleSheets();

    renderPaginaActiva();
}


function limpiarDatosOperativosEnMemoria() {
    operacionesSistema = [];
    resultadosSistema = [];
    auditoriaSistema = [];

    localStorage.setItem(STORAGE_OPERACIONES, JSON.stringify([]));
    localStorage.setItem(STORAGE_RESULTADOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_AUDITORIA, JSON.stringify([]));
}

async function cargarDatosInicialesEnSegundoPlano() {
    try {
        await cargarDatosDesdeGoogleSheets(false);
        renderPaginaActiva();
    } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        alert("Ingresó al sistema, pero no se pudieron cargar todos los datos. Revise la conexión.");
    }
}

function paginaActivaUsaOperaciones() {
    const pageId = obtenerPaginaActivaId();

    return [
        "inicioPage",
        "misOperacionesPage",
        "operacionesPage",
        "dashboardPage",
        "reportesPage"
    ].includes(pageId);
}

async function actualizarDatosPaginaActivaDesdeSheets() {
    if (!usuarioActual) return;

    const pageId = obtenerPaginaActivaId();

    try {
        if (pageId === "usuariosPage") {
            await obtenerUsuariosDesdeGoogleSheets();
            renderPaginaActiva();
            return;
        }

        if (pageId === "misOperacionesPage") {
            await cargarPaginaMisOperaciones(paginacionMisOperaciones.page);
            return;
        }

        if (pageId === "operacionesPage") {
            await cargarPaginaOperacionesAdmin(paginacionOperacionesAdmin.page);
            return;
        }

        if (paginaActivaUsaOperaciones()) {
            await obtenerOperacionesDesdeGoogleSheets();
            renderPaginaActiva();
            return;
        }

        if (pageId === "auditoriaPage") {
            await obtenerAuditoriaDesdeGoogleSheets();
            renderPaginaActiva();
            return;
        }
    } catch (error) {
        console.warn("No se pudo actualizar datos de la página activa:", error);
    }
}
let intervaloActualizacionSheets = null;

function iniciarActualizacionAutomaticaSheets() {
    if (intervaloActualizacionSheets) {
        clearInterval(intervaloActualizacionSheets);
    }

    intervaloActualizacionSheets = setInterval(() => {
        if (document.hidden) return;
        if (!usuarioActual) return;

        actualizarDatosPaginaActivaDesdeSheets();
    }, 30000);
}

function detenerActualizacionAutomaticaSheets() {
    if (intervaloActualizacionSheets) {
        clearInterval(intervaloActualizacionSheets);
        intervaloActualizacionSheets = null;
    }
}
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && usuarioActual) {
        verificarCierrePorInactividad();

        if (usuarioActual) {
            actualizarDatosPaginaActivaDesdeSheets();
        }
    }
});