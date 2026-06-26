// ======================================================
// PROTOTIPO VISUAL SIS-OPERACIONES GCM 12
// Esta versión todavía no conecta con Google Sheets.
// Luego reemplazaremos los usuarios y catálogos por Apps Script.
// ======================================================

// Usuarios temporales solo para probar el diseño.
const usuariosDemo = [
    {
        id_usuario: "USR-001",
        nombres: "Administrador",
        apellidos: "Sistema",
        grado: "N/A",
        cargo: "Administrador del sistema",
        unidad: "GCM 12",
        correo: "admin@gcm12.local",
        usuario: "0100000001",
        password: "Admin123",
        rol: "ADMIN",
        estado: "ACTIVO"
    },
    {
        id_usuario: "USR-002",
        nombres: "Comandante",
        apellidos: "Operaciones",
        grado: "TNTE.",
        cargo: "Comandante de operaciones",
        unidad: "GCM 12",
        correo: "operaciones@gcm12.local",
        usuario: "123456",
        password: "Oper123",
        rol: "COMANDANTE_OPERACIONES",
        estado: "ACTIVO"
    },
    {
        id_usuario: "USR-003",
        nombres: "Comandante",
        apellidos: "Unidad",
        grado: "MAYO.",
        cargo: "Comandante de unidad",
        unidad: "GCM 12",
        correo: "comandante@gcm12.local",
        usuario: "0100000003",
        password: "Cmd123",
        rol: "COMANDANTE_UNIDAD",
        estado: "ACTIVO"
    }
];

const STORAGE_USUARIOS = "gcm12_usuarios";

let usuariosSistema = cargarUsuariosSistema();

const STORAGE_OPERACIONES = "gcm12_operaciones";
const STORAGE_RESULTADOS = "gcm12_resultados";

let operacionesSistema = cargarOperacionesSistema();
let resultadosSistema = cargarResultadosSistema();
let operacionEditandoId = null;

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

function cargarUsuariosSistema() {
    const data = localStorage.getItem(STORAGE_USUARIOS);

    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Error al leer usuarios del localStorage:", error);
        }
    }

    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuariosDemo));
    return [...usuariosDemo];
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
    usuariosSistema = leerJsonStorage(STORAGE_USUARIOS, usuariosDemo);
    operacionesSistema = leerJsonStorage(STORAGE_OPERACIONES, []);
    resultadosSistema = leerJsonStorage(STORAGE_RESULTADOS, []);
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
            "Uniformes policiales",
            "Uniformes militares",
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
    COMANDANTE_OPERACIONES: [
        { id: "inicioPage", title: "Inicio", subtitle: "Panel del comandante de operaciones", label: "Inicio" },
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

    renderUsuariosAdmin();
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
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
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    const encontrado = usuariosSistema.find(
        (u) => u.usuario === usuario && u.password === password
    );

    if (!encontrado) {
        loginError.textContent = "Credenciales incorrectas.";
        return;
    }

    if (encontrado.estado !== "ACTIVO") {
        loginError.textContent = "Usuario inactivo o bloqueado.";
        return;
    }

    usuarioActual = encontrado;
    iniciarSistema();
});

logoutBtn.addEventListener("click", () => {
    usuarioActual = null;
    resultadosTemporales = [];

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
            document.querySelectorAll(".menu button").forEach((b) => b.classList.remove("active"));
            button.classList.add("active");
            mostrarPagina(item.id, item.title, item.subtitle);
        });

        menu.appendChild(button);
    });
}

function mostrarPagina(pageId, title, subtitle) {
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

    if (pageId === "misOperacionesPage") {
        renderMisOperaciones();
    }

    if (pageId === "operacionesPage") {
        renderOperacionesAdmin();
    }

    if (pageId === "dashboardPage") {
        renderDashboard();
    }

    if (pageId === "usuariosPage") {
        renderUsuariosAdmin();
    }
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

// GUARDAR OPERACIÓN EN LOCALSTORAGE
operacionForm.addEventListener("submit", (event) => {
    event.preventDefault();

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

    if (operacionEditandoId) {
        actualizarOperacionExistente();
    } else {
        crearNuevaOperacion();
    }
});

function crearNuevaOperacion() {
    const idOperacion = generarIdOperacion();
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
        observacion_general: document.getElementById("observacionGeneral").value.trim()
    };

    operacionesSistema.push(operacion);

    if (huboResultados.value === "SI") {
        resultadosTemporales.forEach((resultado) => {
            resultadosSistema.push({
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

    guardarOperacionesSistema();
    guardarResultadosSistema();

    limpiarFormularioOperacion();

    mostrarMensaje("Operación guardada correctamente en modo demo.", "success");
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
}

function actualizarOperacionExistente() {
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

    operacionesSistema[index] = {
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
        observacion_general: document.getElementById("observacionGeneral").value.trim()
    };

    resultadosSistema = resultadosSistema.filter((r) => r.id_operacion !== operacionEditandoId);

    if (huboResultados.value === "SI") {
        resultadosTemporales.forEach((resultado) => {
            resultadosSistema.push({
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

    guardarOperacionesSistema();
    guardarResultadosSistema();

    limpiarFormularioOperacion();

    mostrarMensaje("Operación actualizada correctamente.", "success");
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
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

    operacionEditandoId = null;

    const guardarBtn = document.getElementById("guardarOperacionBtn");
    if (guardarBtn) guardarBtn.textContent = "Guardar operación";
}

function generarIdOperacion() {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 9000) + 1000;

    return `OP-${yyyy}${mm}${dd}-${random}`;
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
    });
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
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn btn-outline-dark btn-small" data-action="editar" data-id="${u.id_usuario}">
                        Editar
                    </button>
                    <button type="button" class="btn btn-warning btn-small" data-action="estado" data-id="${u.id_usuario}">
                        ${u.estado === "ACTIVO" ? "Inactivar" : "Activar"}
                    </button>
                    <button type="button" class="btn btn-danger btn-small" data-action="eliminar" data-id="${u.id_usuario}">
                        Eliminar
                    </button>
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
    document.getElementById("userRol").value = "COMANDANTE_OPERACIONES";

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

function guardarUsuarioDesdeAdmin(event) {
    event.preventDefault();

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

    const cedulaDuplicada = usuariosSistema.some((u) => {
        return u.usuario === cedula && u.id_usuario !== idEditando;
    });

    if (cedulaDuplicada) {
        mostrarMensajeUsuarios("Ya existe un usuario registrado con esa cédula.", "error");
        return;
    }

    if (!idEditando && !password) {
        mostrarMensajeUsuarios("Para crear un usuario debe ingresar una contraseña temporal.", "error");
        return;
    }

    if (idEditando) {
        const index = usuariosSistema.findIndex((u) => u.id_usuario === idEditando);

        if (index === -1) {
            mostrarMensajeUsuarios("Usuario no encontrado para editar.", "error");
            return;
        }

        usuariosSistema[index] = {
            ...usuariosSistema[index],
            nombres,
            apellidos,
            grado,
            cargo,
            unidad,
            correo,
            usuario: cedula,
            password: password || usuariosSistema[index].password,
            rol,
            estado,
            observacion
        };

        mostrarMensajeUsuarios("Usuario actualizado correctamente.", "success");
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
            observacion
        };

        usuariosSistema.push(nuevoUsuario);
        mostrarMensajeUsuarios("Usuario creado correctamente.", "success");
    }

    guardarUsuariosSistema();
    renderUsuariosAdmin();
    cerrarFormularioUsuario();
}

function cambiarEstadoUsuario(idUsuario) {
    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeUsuarios("Usuario no encontrado.", "error");
        return;
    }

    if (usuarioActual && usuario.id_usuario === usuarioActual.id_usuario) {
        mostrarMensajeUsuarios("No puede cambiar el estado del usuario con sesión activa.", "error");
        return;
    }

    usuario.estado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    guardarUsuariosSistema();
    renderUsuariosAdmin();

    mostrarMensajeUsuarios(`Usuario ${usuario.estado === "ACTIVO" ? "activado" : "inactivado"} correctamente.`, "success");
}

function eliminarUsuarioAdmin(idUsuario) {
    const usuario = usuariosSistema.find((u) => u.id_usuario === idUsuario);

    if (!usuario) {
        mostrarMensajeUsuarios("Usuario no encontrado.", "error");
        return;
    }

    if (usuarioActual && usuario.id_usuario === usuarioActual.id_usuario) {
        mostrarMensajeUsuarios("No puede eliminar el usuario con sesión activa.", "error");
        return;
    }

    const confirmar = confirm(`¿Está seguro de eliminar al usuario ${usuario.nombres} ${usuario.apellidos}?`);

    if (!confirmar) return;

    usuariosSistema = usuariosSistema.filter((u) => u.id_usuario !== idUsuario);

    guardarUsuariosSistema();
    renderUsuariosAdmin();

    mostrarMensajeUsuarios("Usuario eliminado correctamente en modo demo.", "success");
}

function cerrarFormularioUsuario() {
    const formPanel = document.getElementById("usuarioFormPanel");
    const form = document.getElementById("usuarioAdminForm");

    form.reset();
    formPanel.classList.add("hidden");
}

function generarIdUsuario() {
    const numero = usuariosSistema.length + 1;
    return `USR-${String(numero).padStart(3, "0")}`;
}

function mostrarMensajeUsuarios(mensaje, tipo) {
    const message = document.getElementById("usuariosMessage");

    if (!message) return;

    message.textContent = mensaje;
    message.className = `form-message ${tipo}`;

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

    if (buscar) buscar.addEventListener("input", renderMisOperaciones);
    if (filtroEstado) filtroEstado.addEventListener("change", renderMisOperaciones);
    if (filtroResultados) filtroResultados.addEventListener("change", renderMisOperaciones);

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

    if (usuarioActual && usuarioActual.rol === "COMANDANTE_OPERACIONES") {
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
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn btn-outline-dark btn-small" data-action="ver" data-id="${op.id_operacion}">
                        Ver
                    </button>

                    ${puedeEditar ? `
                    <button 
                        type="button" 
                        class="btn btn-warning btn-small" 
                        data-action="editar" 
                        data-id="${op.id_operacion}"
                    >
                        Editar
                    </button>
                ` : ""}
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
                <strong>${operacion.hora_inicio} - ${operacion.hora_fin}</strong>
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

    document.getElementById("fechaOperacion").value = operacion.fecha_operacion;
    document.getElementById("horaInicio").value = operacion.hora_inicio;
    document.getElementById("horaFin").value = operacion.hora_fin;

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

    if (usuarioActual && usuarioActual.rol === "COMANDANTE_OPERACIONES") {
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

function formatearFecha(fecha) {
    if (!fecha) return "";

    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
    const filtroEstado = document.getElementById("filtroEstadoOperacionesAdmin");
    const filtroTipo = document.getElementById("filtroTipoOperacionesAdmin");
    const filtroResultados = document.getElementById("filtroResultadosOperacionesAdmin");
    const tbody = document.getElementById("operacionesAdminTableBody");

    if (!tbody) return;

    if (buscar) buscar.addEventListener("input", renderOperacionesAdmin);
    if (filtroEstado) filtroEstado.addEventListener("change", renderOperacionesAdmin);
    if (filtroTipo) filtroTipo.addEventListener("change", renderOperacionesAdmin);
    if (filtroResultados) filtroResultados.addEventListener("change", renderOperacionesAdmin);

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

function renderOperacionesAdmin() {
    const tbody = document.getElementById("operacionesAdminTableBody");
    if (!tbody) return;

    recargarDatosDesdeStorage();

    const texto = (document.getElementById("buscarOperacionesAdmin")?.value || "").toLowerCase().trim();
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
        const coincideEstado = !estado || op.estado_operacion === estado;
        const coincideTipo = !tipo || op.tipo_operacion === tipo;
        const coincideResultados = !resultados || op.hubo_resultados === resultados;

        return coincideTexto && coincideEstado && coincideTipo && coincideResultados;
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
            <td>
                <div class="admin-actions">
                    <button type="button" class="btn btn-outline-dark btn-small" data-action="ver-admin" data-id="${op.id_operacion}">
                        Ver
                    </button>

                    <button type="button" class="btn btn-warning btn-small" data-action="editar-admin" data-id="${op.id_operacion}">
                        Editar
                    </button>

                    <button 
                        type="button" 
                        class="btn btn-success btn-small" 
                        data-action="validar" 
                        data-id="${op.id_operacion}"
                        ${puedeValidar ? "" : "disabled"}
                    >
                        Validar
                    </button>

                    <button 
                        type="button" 
                        class="btn btn-blue btn-small" 
                        data-action="observar" 
                        data-id="${op.id_operacion}"
                        ${puedeObservar ? "" : "disabled"}
                    >
                        Observar
                    </button>

                    <button 
                        type="button" 
                        class="btn btn-danger btn-small" 
                        data-action="anular" 
                        data-id="${op.id_operacion}"
                        ${puedeAnular ? "" : "disabled"}
                    >
                        Anular
                    </button>
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
                <strong>${operacion.hora_inicio} - ${operacion.hora_fin}</strong>
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

function cambiarEstadoOperacionAdmin(idOperacion, nuevoEstado) {
    const index = operacionesSistema.findIndex((op) => op.id_operacion === idOperacion);

    if (index === -1) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    const confirmar = confirm(`¿Está seguro de cambiar el estado de la operación a ${nuevoEstado}?`);

    if (!confirmar) return;

    operacionesSistema[index] = {
        ...operacionesSistema[index],
        estado_operacion: nuevoEstado,
        ultima_modificacion: new Date().toISOString(),
        validado_por: usuarioActual ? `${usuarioActual.nombres} ${usuarioActual.apellidos}` : "",
        fecha_validacion: nuevoEstado === "VALIDADO" ? new Date().toISOString() : operacionesSistema[index].fecha_validacion || ""
    };

    guardarOperacionesSistema();

    renderOperacionesAdmin();
    renderMisOperaciones();
    renderDashboard();

    mostrarMensajeOperacionesAdmin(`Operación actualizada a estado ${nuevoEstado}.`, "success");
}

function observarOperacionAdmin(idOperacion) {
    const index = operacionesSistema.findIndex((op) => op.id_operacion === idOperacion);

    if (index === -1) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    if (operacionesSistema[index].estado_operacion === "ANULADO") {
        mostrarMensajeOperacionesAdmin("No puede observar una operación anulada.", "error");
        return;
    }

    const observacion = prompt("Ingrese la observación para que el responsable corrija la operación:");

    if (!observacion || !observacion.trim()) {
        mostrarMensajeOperacionesAdmin("Debe ingresar una observación.", "error");
        return;
    }

    operacionesSistema[index] = {
        ...operacionesSistema[index],
        estado_operacion: "OBSERVADO",
        observacion_admin: observacion.trim(),
        observado_por: usuarioActual ? `${usuarioActual.nombres} ${usuarioActual.apellidos}` : "",
        fecha_observacion: new Date().toISOString(),
        ultima_modificacion: new Date().toISOString()
    };

    guardarOperacionesSistema();

    renderOperacionesAdmin();
    renderMisOperaciones();
    renderDashboard();
    mostrarMensajeOperacionesAdmin("Operación marcada como OBSERVADO.", "success");
}

function anularOperacionAdmin(idOperacion) {
    const index = operacionesSistema.findIndex((op) => op.id_operacion === idOperacion);

    if (index === -1) {
        mostrarMensajeOperacionesAdmin("Operación no encontrada.", "error");
        return;
    }

    if (operacionesSistema[index].estado_operacion === "ANULADO") {
        mostrarMensajeOperacionesAdmin("La operación ya se encuentra anulada.", "error");
        return;
    }

    const motivo = prompt("Ingrese el motivo de anulación de la operación:");

    if (!motivo || !motivo.trim()) {
        mostrarMensajeOperacionesAdmin("Debe ingresar un motivo de anulación.", "error");
        return;
    }

    const confirmar = confirm("¿Confirma la anulación de esta operación? Esta acción no eliminará el registro, solo cambiará su estado.");

    if (!confirmar) return;

    operacionesSistema[index] = {
        ...operacionesSistema[index],
        estado_operacion: "ANULADO",
        motivo_anulacion: motivo.trim(),
        anulado_por: usuarioActual ? `${usuarioActual.nombres} ${usuarioActual.apellidos}` : "",
        fecha_anulacion: new Date().toISOString(),
        ultima_modificacion: new Date().toISOString()
    };

    guardarOperacionesSistema();

    renderOperacionesAdmin();
    renderMisOperaciones();
    renderDashboard();

    mostrarMensajeOperacionesAdmin("Operación anulada correctamente.", "success");
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
        limpiarBtn.addEventListener("click", limpiarFiltrosDashboard);
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
    document.getElementById("dashFechaDesde").value = "";
    document.getElementById("dashFechaHasta").value = "";
    document.getElementById("dashEstado").value = "VALIDADO";
    document.getElementById("dashTipo").value = "";
    document.getElementById("dashCanton").value = "";
    document.getElementById("dashCategoria").value = "";

    cargarSubtiposDashboard();
    cargarParroquiasDashboard();
    cargarSubcategoriasDashboard();

    document.getElementById("dashSubtipo").value = "";
    document.getElementById("dashParroquia").value = "";
    document.getElementById("dashSubcategoria").value = "";

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

    // Sustancias y procesamiento
    setText("dashSCSFTotalKg", `${formatDecimal(calcularSCSFEnKg(resultados))} kg`);
    setText("dashBalanzas", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Balanzas")));
    setText("dashPipas", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Pipas")));
    setText("dashDocumentacion", formatNumero(sumarSubcategoria(resultados, "Otros objetos", "Documentación")));

    // Comunicaciones y tecnología
    setText("dashTelefonos", formatNumero(sumarCategoria(resultados, "Teléfonos celulares")));
    setText("dashChips", formatNumero(sumarSubcategoria(resultados, "Accesorios celulares", "Chips")));
    setText("dashRadios", formatNumero(sumarSubcategorias(resultados, "Equipos de comunicación", ["Radios portátiles", "Radios móviles vehiculares"])));
    setText("dashCamaras", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "Cámaras")));
    setText("dashDrones", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "Drones")));
    setText("dashDvr", formatNumero(sumarSubcategoria(resultados, "Equipos de videovigilancia", "DVR")));
    setText("dashModemRouter", formatNumero(sumarSubcategorias(resultados, "Equipos de red", ["Módem", "Router"])));
    setText("dashFibraCable", `${formatDecimal(sumarSubcategorias(resultados, "Equipos de red", ["Fibra óptica", "Cable de red"], "metros"))} m`);

    // Movilidad, combustible y logística
    setText("dashMotocicletas", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Motocicleta")));
    setText("dashVehiculos", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Vehículo")));
    setText("dashCamiones", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Camión")));
    setText("dashTanqueros", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Tanquero")));
    setText("dashMaquinaria", formatNumero(sumarSubcategoria(resultados, "Vehículos y maquinaria", "Maquinaria pesada")));
    setText("dashCombustibleGal", `${formatDecimal(sumarCategoria(resultados, "Combustible", "galones"))} gal`);
    setText("dashCombustibleLitros", `${formatDecimal(sumarCategoria(resultados, "Combustible", "litros"))} L`);
    setText("dashBebidas", `${formatDecimal(sumarCategoria(resultados, "Bebidas alcohólicas", "litros"))} L`);
    setText("dashTabacos", formatNumero(sumarCategoria(resultados, "Tabacos")));

    // Humanos y financieros
    setText("dashAprehendidos", formatNumero(sumarCategoria(resultados, "Personas aprehendidas")));
    setText("dashDinero", `$${formatNumero(sumarCategoria(resultados, "Dinero efectivo", "dólares americanos"))}`);

    renderRankingUbicacion("dashRankingCanton", operaciones, resultados, "canton");
    renderRankingUbicacion("dashRankingParroquia", operaciones, resultados, "parroquia");
    renderRankingUbicacion("dashRankingSector", operaciones, resultados, "sector");

    renderRankingTiempoMes(operaciones, "dashTiempoMes");
    renderRankingTiempoSemana(operaciones, "dashTiempoSemana");

    renderRankingSubtipo(operaciones, "dashRankingSubtipo");
    renderRankingTipo(operaciones, "dashRankingTipo");
}

function obtenerDatosDashboardFiltrados() {
    const fechaDesde = document.getElementById("dashFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("dashFechaHasta")?.value || "";
    const estado = document.getElementById("dashEstado")?.value || "";
    const tipo = document.getElementById("dashTipo")?.value || "";
    const subtipo = document.getElementById("dashSubtipo")?.value || "";
    const canton = document.getElementById("dashCanton")?.value || "";
    const parroquia = document.getElementById("dashParroquia")?.value || "";
    const categoria = document.getElementById("dashCategoria")?.value || "";
    const subcategoria = document.getElementById("dashSubcategoria")?.value || "";

    let operaciones = operacionesSistema.filter((op) => {
        const okFechaDesde = !fechaDesde || op.fecha_operacion >= fechaDesde;
        const okFechaHasta = !fechaHasta || op.fecha_operacion <= fechaHasta;
        const okEstado = !estado || op.estado_operacion === estado;
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
                resultados: 0,
                ids: new Set()
            });
        }

        mapa.get(clave).operaciones += 1;
        mapa.get(clave).ids.add(op.id_operacion);
    });

    resultados.forEach((r) => {
        const op = operaciones.find((o) => o.id_operacion === r.id_operacion);
        if (!op) return;

        const clave = op[campo] || "SIN DATO";
        if (mapa.has(clave)) {
            mapa.get(clave).resultados += 1;
        }
    });

    const data = Array.from(mapa.values())
        .sort((a, b) => b.operaciones - a.operaciones)
        .slice(0, 10);

    renderTablaSimple(tbody, data, ["nombre", "operaciones", "resultados"]);
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
        STORAGE_RESULTADOS
    ];

    if (!claves.includes(event.key)) return;

    recargarDatosDesdeStorage();

    renderUsuariosAdmin();
    renderMisOperaciones();
    renderOperacionesAdmin();
    renderDashboard();
});