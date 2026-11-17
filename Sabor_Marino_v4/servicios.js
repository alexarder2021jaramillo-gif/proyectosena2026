// ==========================================
// 1. PROTECCIÓN DE RUTAS Y ACCESO A PEDIDOS
// ==========================================
const PAGINAS_PROTEGIDAS = ["admin_panel.html", "admin.html"];

function verificarAcceso() {
    const rutaCompleta = decodeURIComponent(window.location.pathname);
    const paginaActual = rutaCompleta.substring(rutaCompleta.lastIndexOf("/") + 1);
    const sesionActiva = JSON.parse(localStorage.getItem("sesionSaborMarino"));

    // 1. Proteger la zona administrativa
    if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !sesionActiva) {
        alert("Debes iniciar sesión para acceder a la zona administrativa.");
        window.location.replace("./login.html");
        return;
    }

    // 2. Esconder pedido.html: solo accesible si trae ?plato= desde la carta
    if (paginaActual === "pedido.html") {
        const parametros = new URLSearchParams(window.location.search);
        const platoElegido = parametros.get("plato");

        if (!platoElegido || platoElegido.trim() === "") {
            window.location.replace("./la carta.html");
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

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("sesionSaborMarino");
    alert("Sesión cerrada correctamente.");
    window.location.href = "./login.html";
}

// ==========================================
// 2. VISTAS Y ERRORES DE LOGIN / REGISTRO
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
// 3. GESTIÓN DE USUARIOS (localStorage)
// ==========================================
function obtenerUsuarios() {
    var datos = localStorage.getItem("usuariosSaborMarino");
    if (datos) {
        var lista = JSON.parse(datos);
        if (lista.length > 0) return lista;
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

    // --- B) Formulario de Inicio de Sesión -> Redirige a admin_panel.html ---
    var formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();
            var inputCorreo = document.getElementById("login-correo") || formLogin.querySelector('input[type="email"]');
            var inputPass = document.getElementById("login-password") || formLogin.querySelector('input[type="password"]');

            var correo = inputCorreo ? inputCorreo.value.trim().toLowerCase() : "";
            var password = inputPass ? inputPass.value.trim() : "";
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
                window.location.href = "./admin_panel.html";
            } else {
                mostrarErrores(["Correo o contrasena incorrectos, o el usuario no esta registrado."]);
            }
        });
    }

    // --- C) Capturar formulario de Pedido (pedido.html) ---
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
                alert("¡Pedido enviado con éxito! El administrador ya puede verlo en el panel.");
                window.location.href = "./la carta.html";
            });
        }
    }

    // --- D) Capturar formulario de Reserva (reservas.html) ---
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

                var cliente = inputCliente ? inputCliente.value : "Cliente";
                var fecha = inputFecha ? inputFecha.value : "Sin fecha";
                var hora = inputHora ? inputHora.value : "Sin hora";
                var personas = inputPersonas ? inputPersonas.value : 2;
                var mesa = selectMesa ? selectMesa.value : "Salón principal";

                guardarReserva(cliente, fecha, hora, personas, mesa);
                alert("¡Reserva registrada con éxito!");
                formReserva.reset();
            });
        }
    }

    // --- E) Cargar datos si estamos en el Panel Administrativo
