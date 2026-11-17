// ==========================================
// 1. PROTECCIÓN DE RUTAS Y ACCESO A PEDIDOS
// ==========================================
const PAGINAS_PROTEGIDAS = ["admin_panel.html", "admin.html"];

function verificarAcceso() {
    const rutaCompleta = decodeURIComponent(window.location.pathname);
    const paginaActual = rutaCompleta.substring(rutaCompleta.lastIndexOf("/") + 1);
    const sesionActiva = JSON.parse(localStorage.getItem("sesionSaborMarino"));

    // Proteger zona administrativa
    if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !sesionActiva) {
        alert("Debes iniciar sesión para acceder a la zona administrativa.");
        window.location.replace("login.html");
        return;
    }

    // Esconder pedido.html si no viene con ?plato=
    if (paginaActual === "pedido.html") {
        const parametros = new URLSearchParams(window.location.search);
        const platoElegido = parametros.get("plato");

        if (!platoElegido || platoElegido.trim() === "") {
            window.location.replace("la carta.html");
            return;
        }

        document.addEventListener("DOMContentLoaded", function () {
            const inputPlato = document.getElementById("plato-seleccionado") || document.querySelector('input[name="plato"]');
            if (inputPlato) {
                inputPlato.value = platoElegido;
            }
        });
    }
}

verificarAcceso();

function cerrarSesion() {
    localStorage.removeItem("sesionSaborMarino");
    localStorage.removeItem("usuarioActivo");
    alert("Sesión cerrada correctamente.");
    window.location.href = "login.html";
}

// ==========================================
// 2. CAMBIO DE VISTAS Y ERRORES EN LOGIN.HTML
// ==========================================
function mostrarRegistro() {
    cerrarErrores();
    var vistaLogin = document.getElementById("vista-login");
    var vistaRegistro = document.getElementById("vista-registro");
    if (vistaLogin) vistaLogin.classList.add("oculto");
    if (vistaRegistro) vistaRegistro.classList.remove("oculto");
}

function mostrarLogin() {
    cerrarErrores();
    var vistaRegistro = document.getElementById("vista-registro");
    var vistaLogin = document.getElementById("vista-login");
    if (vistaRegistro) vistaRegistro.classList.add("oculto");
    if (vistaLogin) vistaLogin.classList.remove("oculto");
}

function mostrarErrores(mensajes) {
    var caja = document.getElementById("caja-errores");
    var lista = document.getElementById("lista-errores");
    if (!caja || !lista) {
        alert(mensajes.join("\n"));
        return;
    }
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
// 3. USUARIOS EN LOCALSTORAGE
// ==========================================
function obtenerUsuarios() {
    var datos = localStorage.getItem("usuariosSaborMarino");
    if (datos) {
        try {
            var lista = JSON.parse(datos);
            if (Array.isArray(lista) && lista.length > 0) return lista;
        } catch (e) {}
    }
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
// 4. REGISTRO E INICIO DE SESIÓN (A PRUEBA DE FALLOS)
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // --- REGISTRO ---
    var formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", function (evento) {
            evento.preventDefault();

            // Buscar los inputs por ID o por tipo dentro del formulario
            var elNombres = document.getElementById("reg-nombres") || formRegistro.querySelector('input[type="text"]');
            var elCorreo = document.getElementById("reg-correo") || formRegistro.querySelector('input[type="email"]');
            var elPass = document.getElementById("reg-password") || formRegistro.querySelector('input[type="password"]');

            var nombres = elNombres ? elNombres.value.trim() : "";
            var correo = elCorreo ? elCorreo.value.trim().toLowerCase() : "";
            var password = elPass ? elPass.value.trim() : "";
            var errores = [];

            if (nombres === "") errores.push("El campo Nombres es obligatorio.");
            if (correo === "" || correo.indexOf("@") === -1) errores.push("Por favor ingresa un correo electronico valido.");
            if (password === "" || password.length < 4) errores.push("La contrasena debe tener al menos 4 caracteres.");

            var usuarios = obtenerUsuarios();
            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].correo === correo) {
                    errores.push("Este correo electronico ya se encuentra registrado.");
                    break;
                }
            }

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            cerrarErrores();
            usuarios.push({
                nombres: nombres,
                correo: correo,
                password: password,
                rol: "Cliente"
            });
            guardarUsuarios(usuarios);

            formRegistro.reset();
            alert("Registro exitoso. Ahora puedes iniciar sesion.");
            mostrarLogin();
        });
    }

    // --- INICIO DE SESIÓN ---
    var formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();

            var elCorreo = document.getElementById("login-correo") || formLogin.querySelector('input[type="email"], input[type="text"]');
            var elPass = document.getElementById("login-password") || formLogin.querySelector('input[type="password"]');

            var correo = elCorreo ? elCorreo.value.trim().toLowerCase() : "";
            var password = elPass ? elPass.value.trim() : "";
            var errores = [];

            if (correo === "" || correo.indexOf("@") === -1) errores.push("Por favor ingresa un correo electronico valido.");
            if (password === "" || password.length < 4) errores.push("La contrasena debe tener al menos 4 caracteres.");

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
                localStorage.setItem("usuarioActivo", JSON.stringify(usuarioEncontrado));
                alert("Bienvenido " + usuarioEncontrado.nombres + ", ingresando a la zona administrativa.");
                window.location.href = "admin_panel.html";
            } else {
                mostrarErrores(["Correo o contrasena incorrectos, o el usuario no esta registrado."]);
            }
        });
    }

    // --- PEDIDOS Y RESERVAS ---
    var rutaActual = decodeURIComponent(window.location.pathname);
    if (rutaActual.includes("pedido.html")) {
        var formPedido = document.querySelector("form");
        if (formPedido) {
            formPedido.addEventListener("submit", function (e) {
                e.preventDefault();
                var inputs = formPedido.querySelectorAll("input, select, textarea");
                var cliente = inputs[0] && inputs[0].value.trim() !== "" ? inputs[0].value.trim() : "Cliente Web";
                var inputPlato = document.getElementById("plato-seleccionado") || inputs[1];
                var plato = inputPlato ? inputPlato.value : "Platillo";
                var inputCantidad = formPedido.querySelector('input[type="number"]');
                var cantidad = inputCantidad ? inputCantidad.value : 1;
                var direccion = inputs[inputs.length - 1] ? inputs[inputs.length - 1].value : "En restaurante";

                guardarPedido(cliente, plato, cantidad, direccion);
                alert("¡Pedido enviado con éxito!");
                window.location.href = "la carta.html";
            });
        }
    }

    if (rutaActual.includes("reservas.html")) {
        var formReserva = document.querySelector("form");
        if (formReserva) {
            formReserva.addEventListener("submit", function (e) {
                e.preventDefault();
                var inputCliente = formReserva.querySelector('input[type="text"]');
                var inputFecha = formReserva.querySelector('input[type="date"]');
                var inputHora = formReserva.querySelector('input[type="time"]');
                var inputPersonas = formReserva.querySelector('input[type="number"]');
                var selectMesa = formReserva.querySelector("select");

                guardarReserva(
                    inputCliente ? inputCliente.value : "Cliente",
                    inputFecha ? inputFecha.value : "Sin fecha",
                    inputHora ? inputHora.value : "Sin hora",
                    inputPersonas ? inputPersonas.value : 2,
                    selectMesa ? selectMesa.value : "Salón principal"
                );
                alert("¡Reserva registrada con éxito!");
                formReserva.reset();
            });
        }
    }

    cargarPanelAdmin();
});

// ==========================================
// 5. GUARDAR PEDIDOS Y RESERVAS
// ==========================================
function guardarPedido(cliente, plato, cantidad, direccion) {
    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    pedidos.push({
        id: Date.now(),
        cliente: cliente,
        plato: plato,
        cantidad: cantidad,
        direccion: direccion,
        estado: "Pendiente"
    });
    localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
}

function guardarReserva(cliente, fecha, hora, personas, mesa) {
    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
    reservas.push({
        id: Date.now(),
        cliente: cliente,
        fecha: fecha,
        hora: hora,
        personas: personas,
        mesa: mesa,
        estado: "Confirmada"
    });
    localStorage.setItem("reservasSaborMarino", JSON.stringify(reservas));
}

// ==========================================
// 6. PANEL ADMINISTRATIVO
// ==========================================
function mostrarSeccion(idSeccion, boton) {
    document.querySelectorAll(".admin-seccion").forEach(function (sec) {
        sec.style.display = "none";
    });
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
        btn.classList.remove("activo");
    });
    var seccion = document.getElementById(idSeccion);
    if (seccion) seccion.style.display = "block";
    if (boton) boton.classList.add("activo");
}

function cargarPanelAdmin() {
    const tablaPedidos = document.getElementById("tabla-pedidos");
    const tablaReservas = document.getElementById("tabla-reservas");
    const tablaClientes = document.getElementById("tabla-clientes");
    const tablaRoles = document.getElementById("tabla-roles");

    if (!tablaPedidos && !tablaReservas && !tablaClientes && !tablaRoles) return;

    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
    const usuarios = obtenerUsuarios();

    const sesion = JSON.parse(localStorage.getItem("sesionSaborMarino"));
    const spanUsuario = document.getElementById("usuario-activo");
    if (sesion && spanUsuario) {
        spanUsuario.textContent = sesion.nombres || sesion.correo;
    }

    if (tablaPedidos) {
        tablaPedidos.innerHTML = pedidos.length === 0
            ? '<tr><td colspan="6">No hay pedidos registrados.</td></tr>'
            : pedidos.map(function (p, index) {
                return `<tr>
                    <td>#${p.id.toString().slice(-4)}</td>
                    <td>${p.cliente}</td>
                    <td>${p.plato} (x${p.cantidad})</td>
                    <td>${p.direccion || "En mesa"}</td>
                    <td><strong>${p.estado}</strong></td>
                    <td>
                        <button onclick="cambiarEstadoPedido(${index})" class="btn-accion">Entregar</button>
                        <button onclick="eliminarPedido(${index})" class="btn-eliminar">Eliminar</button>
                    </td>
                </tr>`;
            }).join("");
    }

    if (tablaReservas) {
        tablaReservas.innerHTML = reservas.length === 0
            ? '<tr><td colspan="6">No hay reservas registradas.</td></tr>'
            : reservas.map(function (r, index) {
                return `<tr>
                    <td>#${r.id.toString().slice(-4)}</td>
                    <td>${r.cliente}</td>
                    <td>${r.fecha} -${r.hora || ""}</td>
                    <td>${r.personas} pers.${r.mesa ? "(" + r.mesa + ")" : ""}</td>
                    <td><strong>${r.estado}</strong></td>
                    <td>
                        <button onclick="cancelarReserva(${index})" class="btn-eliminar">Cancelar</button>
                    </td>
                </tr>`;
            }).join("");
    }

    if (tablaClientes) {
        tablaClientes.innerHTML = usuarios.length === 0
            ? '<tr><td colspan="4">No hay clientes registrados.</td></tr>'
            : usuarios.map(function (u, index) {
                return `<tr>
                    <td>${index + 1}</td>
                    <td>${u.nombres}</td>
                    <td>${u.correo}</td>
                    <td>
                        <button onclick="eliminarCliente(${index})" class="btn-eliminar">Eliminar</button>
                    </td>
                </tr>`;
            }).join("");
    }

    if (tablaRoles) {
        tablaRoles.innerHTML = usuarios.map(function (u, index) {
            return `<tr>
                <td>${u.nombres} (${u.correo})</td>
                <td><strong>${u.rol || "Cliente"}</strong></td>
                <td>
                    <select onchange="cambiarRol(${index}, this.value)">
                        <option value="Administrador" ${u.rol === "Administrador" ? "selected" : ""}>Administrador</option>
                        <option value="Mesero / Cajero" ${u.rol === "Mesero / Cajero" ? "selected" : ""}>Mesero / Cajero</option>
                        <option value="Cliente"
    // --- E) Cargar datos si estamos en el Panel Administrativo
