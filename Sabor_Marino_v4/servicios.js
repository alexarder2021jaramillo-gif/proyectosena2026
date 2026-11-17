// ==========================================
// 1. PROTECCIÓN DE RUTAS Y ACCESO A PEDIDOS
// ==========================================
const PAGINAS_PROTEGIDAS = ["admin_panel.html", "admin.html"];

function verificarAcceso() {
    const paginaActual = decodeURIComponent(window.location.pathname.split("/").pop());
    const sesionActiva = JSON.parse(localStorage.getItem("sesionSaborMarino"));

    // 1. Proteger la zona administrativa
    if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !sesionActiva) {
        alert("Debes iniciar sesión para acceder a la zona administrativa.");
        window.location.replace("login.html");
        return;
    }

    // 2. Esconder pedido.html: solo accesible si trae ?plato= desde la carta
    if (paginaActual === "pedido.html") {
        const parametros = new URLSearchParams(window.location.search);
        const platoElegido = parametros.get("plato");

        if (!platoElegido || platoElegido.trim() === "") {
            window.location.replace("la carta.html");
            return;
        }

        // Rellenar automáticamente el campo del platillo en pedido.html cuando cargue el DOM
        document.addEventListener("DOMContentLoaded", function () {
            const inputPlato = document.getElementById("plato-seleccionado") || document.querySelector('input[name="plato"]');
            if (inputPlato) {
                inputPlato.value = platoElegido;
            }
        });
    }
}

// Ejecutar verificación apenas cargue el script
verificarAcceso();

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("sesionSaborMarino");
    alert("Sesión cerrada correctamente.");
    window.location.href = "login.html";
}

// ==========================================
// 2. VISTAS Y ERRORES DE LOGIN / REGISTRO
// ==========================================
function mostrarRegistro() {
    cerrarErrores();
    document.getElementById("vista-login").classList.add("oculto");
    document.getElementById("vista-registro").classList.remove("oculto");
}

function mostrarLogin() {
    cerrarErrores();
    document.getElementById("vista-registro").classList.add("oculto");
    document.getElementById("vista-login").classList.remove("oculto");
}

function mostrarErrores(mensajes) {
    var caja = document.getElementById("caja-errores");
    var lista = document.getElementById("lista-errores");
    if (!caja || !lista) return;

    lista.innerHTML = "";
    for (var i = 0; i < mensajes.length; i++) {
        var item = document.createElement("li");
        item.textContent = mensajes[i];
        lista.appendChild(item);
    }
    caja.style.display = "block";
}

function cerrarErrores() {
    var caja = document.getElementById("caja-errores");
    if (caja) {
        caja.style.display = "none";
    }
}

// ==========================================
// 3. GESTIÓN DE USUARIOS (localStorage)
// ==========================================
function obtenerUsuarios() {
    var datos = localStorage.getItem("usuariosSaborMarino");
    if (datos) {
        return JSON.parse(datos);
    }
    // Crear usuario administrador inicial si no existe ninguno
    var adminInicial = [
        {
            nombres: "Administrador Principal",
            correo: "admin@sabormarino.com",
            password: "1234",
            rol: "Administrador"
        }
    ];
    guardarUsuarios(adminInicial);
    return adminInicial;
}

function guardarUsuarios(listaUsuarios) {
    localStorage.setItem("usuariosSaborMarino", JSON.stringify(listaUsuarios));
}

// ==========================================
// 4. EVENTOS DE FORMULARIOS Y CARGA DE PANEL
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // --- A) Formulario de Registro ---
    var formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", function (evento) {
            evento.preventDefault();
            var nombres = document.getElementById("reg-nombres").value.trim();
            var correo = document.getElementById("reg-correo").value.trim().toLowerCase();
            var password = document.getElementById("reg-password").value.trim();
            var errores = [];

            if (nombres === "") {
                errores.push("El campo Nombres es obligatorio.");
            }
            if (correo === "" || correo.indexOf("@") === -1) {
                errores.push("Por favor ingresa un correo electronico valido.");
            }
            if (password === "" || password.length < 4) {
                errores.push("La contrasena debe tener al menos 4 caracteres.");
            }

            var usuarios = obtenerUsuarios();
            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].correo === correo) {
                    errores.push("Este correo electronico ya se encuentra registrado.");
                    break;
                }
            }

            if (errores.length > 0) {
                mostrarErrores(errores);
            } else {
                cerrarErrores();
                usuarios.push({
                    nombres: nombres,
                    correo: correo,
                    password: password,
                    rol: "Cliente"
                });
                guardarUsuarios(usuarios);

                formRegistro.reset();
                alert("Registro exitoso. Tus datos se guardaron en el navegador. Ahora puedes iniciar sesion.");
                mostrarLogin();
            }
        });
    }

    // --- B) Formulario de Inicio de Sesión -> Redirige a Zona Administrativa ---
    var formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();
            var correo = document.getElementById("login-correo").value.trim().toLowerCase();
            var password = document.getElementById("login-password").value.trim();
            var errores = [];

            if (correo === "" || correo.indexOf("@") === -1) {
                errores.push("Por favor ingresa un correo electronico valido.");
            }
            if (password === "" || password.length < 4) {
                errores.push("La contrasena debe tener al menos 4 caracteres.");
            }

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            var usuarios = obtenerUsuarios();
            var usuarioEncontrado = null;

            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].correo === correo && usuarios[i].password === password) {
                    usuarioEncontrado = usuarios[i];
                    break;
                }
            }

            if (usuarioEncontrado) {
                cerrarErrores();
                localStorage.setItem("sesionSaborMarino", JSON.stringify(usuarioEncontrado));
                alert("Bienvenido " + usuarioEncontrado.nombres + ", ingresando a la zona administrativa.");
                window.location.href = "admin_panel.html";
            } else {
                mostrarErrores(["Correo o contrasena incorrectos, o el usuario no esta registrado."]);
            }
        });
    }

    // --- C) Cargar datos si estamos en el Panel Administrativo ---
    cargarPanelAdmin();
});

// ==========================================
// 5. GUARDAR PEDIDOS Y RESERVAS (Desde pedido.html y reservas.html)
// ==========================================
function guardarPedido(cliente, plato, cantidad, direccion) {
    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    const nuevoPedido = {
        id: Date.now(),
        cliente: cliente,
        plato: plato,
        cantidad: cantidad,
        direccion: direccion,
        estado: "Pendiente"
    };
    pedidos.push(nuevoPedido);
    localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
}

function guardarReserva(cliente, fecha, hora, personas, mesa) {
    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
    const nuevaReserva = {
        id: Date.now(),
        cliente: cliente,
        fecha: fecha,
        hora: hora,
        personas: personas,
        mesa: mesa,
        estado: "Confirmada"
    };
    reservas.push(nuevaReserva);
    localStorage.setItem("reservasSaborMarino", JSON.stringify(reservas));
}

// ==========================================
// 6. RENDERIZAR PANEL DE ADMINISTRACIÓN (Pedidos, Reservas, Clientes, Roles)
// ==========================================
function mostrarSeccion(idSeccion, boton) {
    document.querySelectorAll(".admin-seccion").forEach(sec => sec.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("activo"));
    var seccion = document.getElementById(idSeccion);
    if (seccion) seccion.style.display = "block";
    if (boton) boton.classList.add("activo");
}

function cargarPanelAdmin() {
    const tablaPedidos = document.getElementById("tabla-pedidos");
    const tablaReservas = document.getElementById("tabla-reservas");
    const tablaClientes = document.getElementById("tabla-clientes");
    const tablaRoles = document.getElementById("tabla-roles");

    // Si no existen las tablas en la página actual, salir sin errores
    if (!tablaPedidos && !tablaReservas && !tablaClientes && !tablaRoles) return;

    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
    const usuarios = obtenerUsuarios();

    // Mostrar usuario logueado
    const sesion = JSON.parse(localStorage.getItem("sesionSaborMarino"));
    const spanUsuario = document.getElementById("usuario-activo");
    if (sesion && spanUsuario) {
        spanUsuario.textContent = sesion.nombres || sesion.correo;
    }

    // 1. Llenar tabla de pedidos
    if (tablaPedidos) {
        tablaPedidos.innerHTML = pedidos.length === 0
            ? '<tr><td colspan="6">No hay pedidos registrados.</td></tr>'
            : pedidos.map((p, index) => `
                <tr>
                    <td>#${p.id.toString().slice(-4)}</td>
                    <td>${p.cliente}</td>
                    <td>${p.plato} (x${p.cantidad})</td>
                    <td>${p.direccion || "En mesa"}</td>
                    <td><strong>${p.estado}</strong></td>
                    <td>
                        <button onclick="cambiarEstadoPedido(${index})" class="btn-accion">Entregar</button>
                        <button onclick="eliminarPedido(${index})" class="btn-eliminar">Eliminar</button>
                    </td>
                </tr>
            `).join("");
    }

    // 2. Llenar tabla de reservas
    if (tablaReservas) {
        tablaReservas.innerHTML = reservas.length === 0
            ? '<tr><td colspan="6">No hay reservas registradas.</td></tr>'
            : reservas.map((r, index) => `
                <tr>
                    <td>#${r.id.toString().slice(-4)}</td>
                    <td>${r.cliente}</td>
                    <td>${r.fecha} - ${r.hora || ""}</td>
                    <td>${r.personas} pers. ${r.mesa ? "(" + r.mesa + ")" : ""}</td>
                    <td><strong>${r.estado}</strong></td>
                    <td>
                        <button onclick="cancelarReserva(${index})" class="btn-eliminar">Cancelar</button>
                    </td>
                </tr>
            `).join("");
    }

    // 3. Llenar tabla de clientes
    if (tablaClientes) {
        tablaClientes.innerHTML = usuarios.length === 0
            ? '<tr><td colspan="4">No hay clientes registrados.</td></tr>'
            : usuarios.map((u, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${u.nombres}</td>
                    <td>${u.correo}</td>
                    <td>
                        <button onclick="eliminarCliente(${index})" class="btn-eliminar">Eliminar</button>
                    </td>
                </tr>
            `).join("");
    }

    // 4. Llenar tabla de roles
    if (tablaRoles) {
        tablaRoles.innerHTML = usuarios.map((u, index) => `
            <tr>
                <td>${u.nombres} (${u.correo})</td>
                <td><strong>${u.rol || "Cliente"}</strong></td>
                <td>
                    <select onchange="cambiarRol(${index}, this.value)">
                        <option value="Administrador" ${u.rol === "Administrador" ? "selected" : ""}>Administrador</option>
                        <option value="Mesero / Cajero" ${u.rol === "Mesero / Cajero" ? "selected" : ""}>Mesero / Cajero</option>
                        <option value="Cliente" ${(!u.rol || u.rol === "Cliente") ? "selected" : ""}>Cliente</option>
                    </select>
                </td>
            </tr>
        `).join("");
    }
}

// ==========================================
// 7. ACCIONES DE LOS BOTONES DEL PANEL
// ==========================================
function cambiarEstadoPedido(index) {
    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    if (pedidos[index]) {
        pedidos[index].estado = "Entregado";
        localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
        cargarPanelAdmin();
    }
}

function eliminarPedido(index) {
    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    pedidos.splice(index, 1);
    localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
    cargarPanelAdmin();
}

function cancelarReserva(index) {
    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
    reservas.splice(index, 1);
    localStorage.setItem("reservasSaborMarino", JSON.stringify(reservas));
    cargarPanelAdmin();
}

function cambiarRol(index, nuevoRol) {
    const usuarios = obtenerUsuarios();
    if (usuarios[index]) {
        usuarios[index].rol = nuevoRol;
        guardarUsuarios(usuarios);
        cargarPanelAdmin();
    }
}

function eliminarCliente(index) {
    const usuarios = obtenerUsuarios();
    usuarios.splice(index, 1);
    guardarUsuarios(usuarios);
    cargarPanelAdmin();
}
