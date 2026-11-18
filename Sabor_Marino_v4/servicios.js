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
// 3. CONEXIÓN CON API PHP / MYSQL (CON RESPALDO LOCAL)
// ==========================================
async function llamarAPI(accion, datos = null) {
    try {
        const opciones = datos
            ? {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(datos)
              }
            : { method: "GET" };

        const respuesta = await fetch(`api.php?accion=${accion}`, opciones);
        if (!respuesta.ok) throw new Error("Sin servidor PHP");
        return await respuesta.json();
    } catch (error) {
        return null; // Activa modo respaldo localStorage si no está en WampServer
    }
}

function obtenerUsuariosLocal() {
    var datos = localStorage.getItem("usuariosSaborMarino");
    if (datos) {
        try {
            var lista = JSON.parse(datos);
            if (Array.isArray(lista) && lista.length > 0) return lista;
        } catch (e) {}
    }
    var adminInicial = [
        {
            id: 1,
            nombres: "Administrador Principal",
            correo: "admin@sabormarino.com",
            password: "1234",
            telefono: "3001234567",
            rol: "Administrador"
        }
    ];
    localStorage.setItem("usuariosSaborMarino", JSON.stringify(adminInicial));
    return adminInicial;
}

// ==========================================
// 4. REGISTRO, INICIO DE SESIÓN Y FORMULARIOS
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // Conectar botón de cerrar sesión en admin_panel.html
    var btnSalir = document.getElementById("btn-cerrar-sesion");
    if (btnSalir) {
        btnSalir.addEventListener("click", cerrarSesion);
    }

    // --- REGISTRO ---
    var formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            var elNombres = document.getElementById("reg-nombres");
            var elCorreo = document.getElementById("reg-correo");
            var elPass = document.getElementById("reg-password");

            var nombres = elNombres ? elNombres.value.trim() : "";
            var correo = elCorreo ? elCorreo.value.trim().toLowerCase() : "";
            var password = elPass ? elPass.value.trim() : "";
            var errores = [];

            if (nombres === "") errores.push("El campo Nombres es obligatorio.");
            if (correo === "" || correo.indexOf("@") === -1) errores.push("Por favor ingresa un correo electronico valido.");
            if (password === "" || password.length < 4) errores.push("La contrasena debe tener al menos 4 caracteres.");

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            // Intentar registrar en MySQL (WampServer)
            const resBD = await llamarAPI("registro", { nombres, correo, password });

            if (resBD) {
                if (!resBD.exito) {
                    mostrarErrores([resBD.mensaje]);
                    return;
                }
            } else {
                // Respaldo localStorage
                var usuarios = obtenerUsuariosLocal();
                if (usuarios.some(u => u.correo === correo)) {
                    mostrarErrores(["Este correo electronico ya se encuentra registrado."]);
                    return;
                }
                usuarios.push({
                    id: Date.now(),
                    nombres: nombres,
                    correo: correo,
                    password: password,
                    telefono: "No registrado",
                    rol: "Mesero"
                });
                localStorage.setItem("usuariosSaborMarino", JSON.stringify(usuarios));
            }

            cerrarErrores();
            formRegistro.reset();
            alert("Registro exitoso. Ahora puedes iniciar sesion.");
            mostrarLogin();
        });
    }

    // --- INICIO DE SESIÓN ---
    var formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            var elCorreo = document.getElementById("login-correo");
            var elPass = document.getElementById("login-password");

            var correo = elCorreo ? elCorreo.value.trim().toLowerCase() : "";
            var password = elPass ? elPass.value.trim() : "";
            var errores = [];

            if (correo === "" || correo.indexOf("@") === -1) errores.push("Por favor ingresa un correo electronico valido.");
            if (password === "" || password.length < 4) errores.push("La contrasena debe tener al menos 4 caracteres.");

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            var usuarioEncontrado = null;
            const resBD = await llamarAPI("login", { correo, password });

            if (resBD) {
                if (resBD.exito) {
                    usuarioEncontrado = resBD.usuario;
                } else {
                    mostrarErrores([resBD.mensaje]);
                    return;
                }
            } else {
                // Respaldo localStorage
                var usuarios = obtenerUsuariosLocal();
                usuarioEncontrado = usuarios.find(u => u.correo === correo && u.password === password) || null;
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

    // --- PEDIDOS ---
    var rutaActual = decodeURIComponent(window.location.pathname);
    if (rutaActual.includes("pedido.html")) {
        var formPedido = document.querySelector("form");
        if (formPedido) {
            formPedido.addEventListener("submit", async function (e) {
                e.preventDefault();
                var inputs = formPedido.querySelectorAll("input, select, textarea");
                var cliente = inputs[0] && inputs[0].value.trim() !== "" ? inputs[0].value.trim() : "Cliente Web";
                var inputPlato = document.getElementById("plato-seleccionado") || inputs[1];
                var plato = inputPlato ? inputPlato.value : "Platillo";
                var inputCantidad = formPedido.querySelector('input[type="number"]');
                var cantidad = inputCantidad ? inputCantidad.value : 1;
                var direccion = inputs[inputs.length - 1] ? inputs[inputs.length - 1].value : "En restaurante";

                const resBD = await llamarAPI("crear_pedido", { cliente, plato, cantidad, direccion });
                if (!resBD) {
                    const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
                    pedidos.push({ id: Date.now(), cliente, plato, cantidad, direccion, estado: "Pendiente" });
                    localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
                }

                alert("¡Pedido enviado con éxito!");
                window.location.href = "la carta.html";
            });
        }
    }

    // --- RESERVAS ---
    if (rutaActual.includes("reservas.html")) {
        var formReserva = document.querySelector("form");
        if (formReserva) {
            formReserva.addEventListener("submit", async function (e) {
                e.preventDefault();
                var inputCliente = formReserva.querySelector('input[type="text"]');
                var inputFecha = formReserva.querySelector('input[type="date"]');
                var inputHora = formReserva.querySelector('input[type="time"]');
                var inputPersonas = formReserva.querySelector('input[type="number"]');
                var selectMesa = formReserva.querySelector("select");

                var datosReserva = {
                    cliente: inputCliente ? inputCliente.value : "Cliente",
                    fecha: inputFecha ? inputFecha.value : "2026-11-17",
                    hora: inputHora ? inputHora.value : "12:00",
                    personas: inputPersonas ? inputPersonas.value : 2,
                    mesa: selectMesa ? selectMesa.value : "Salón principal"
                };

                const resBD = await llamarAPI("crear_reserva", datosReserva);
                if (!resBD) {
                    const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
                    reservas.push({ id: Date.now(), ...datosReserva, estado: "Confirmada" });
                    localStorage.setItem("reservasSaborMarino", JSON.stringify(reservas));
                }

                alert("¡Reserva registrada con éxito!");
                formReserva.reset();
            });
        }
    }

    cargarPanelAdmin();
});

// ==========================================
// 5. PANEL ADMINISTRATIVO Y ACCIONES
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

async function cargarPanelAdmin() {
    const tablaPedidos = document.getElementById("tabla-pedidos");
    const tablaReservas = document.getElementById("tabla-reservas");
    const tablaRoles = document.getElementById("tabla-roles");

    if (!tablaPedidos && !tablaReservas && !tablaRoles) return;

    let pedidos = [];
    let reservas = [];
    let usuarios = [];

    const resBD = await llamarAPI("cargar_admin");
    if (resBD && resBD.exito) {
        pedidos = resBD.pedidos;
        reservas = resBD.reservas;
        usuarios = resBD.usuarios;
    } else {
        pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
        reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
        usuarios = obtenerUsuariosLocal();
    }

    if (tablaPedidos) {
        tablaPedidos.innerHTML = pedidos.length === 0
            ? '<tr><td colspan="6">No hay pedidos registrados.</td></tr>'
            : pedidos.map(function (p, index) {
                return `<tr>
                    <td>#${p.id.toString().slice(-4)}</td>
                    <td>${p.cliente}</td>
                    <td>${p.plato}</td>
                    <td>${p.cantidad} (${p.direccion || "En mesa"})</td>
                    <td><strong>${p.estado}</strong></td>
                    <td>
                        <button onclick="cambiarEstadoPedido(${p.id}, ${index})" class="btn-accion">Entregar</button>
                        <button onclick="eliminarPedido(${p.id}, ${index})" class="btn-eliminar">Eliminar</button>
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
                    <td>${r.fecha} - ${r.hora || ""}</td>
                    <td>${r.personas} pers. (${r.mesa || "Salón"})</td>
                    <td><strong>${r.estado}</strong></td>
                    <td>
                        <button onclick="cancelarReserva(${r.id}, ${index})" class="btn-eliminar">Cancelar</button>
                    </td>
                </tr>`;
            }).join("");
    }

    if (tablaRoles) {
        tablaRoles.innerHTML = usuarios.map(function (u, index) {
            var rolActual = ["Administrador", "Mesero", "Cocinero"].includes(u.rol) ? u.rol : "Mesero";
            return `<tr>
                <td>${u.nombres} (${u.correo})</td>
                <td><strong>${rolActual}</strong></td>
                <td>
                    <select onchange="cambiarRol(${u.id}, ${index}, this.value)">
                        <option value="Administrador" ${rolActual === "Administrador" ? "selected" : ""}>Administrador</option>
                        <option value="Mesero" ${rolActual === "Mesero" ? "selected" : ""}>Mesero</option>
                        <option value="Cocinero" ${rolActual === "Cocinero" ? "selected" : ""}>Cocinero</option>
                    </select>
                </td>
            </tr>`;
        }).join("");
    }
}

async function cambiarEstadoPedido(id, index) {
    const res = await llamarAPI("entregar_pedido", { id });
    if (!res) {
        const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
        if (pedidos[index]) pedidos[index].estado = "Entregado";
        localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
    }
    cargarPanelAdmin();
}

async function eliminarPedido(id, index) {
    if (!confirm("¿Seguro que deseas eliminar este pedido?")) return;
    const res = await llamarAPI("eliminar_pedido", { id });
    if (!res) {
        const pedidos = JSON.parse(localStorage.getItem("pedidosSaborMarino")) || [];
        pedidos.splice(index, 1);
        localStorage.setItem("pedidosSaborMarino", JSON.stringify(pedidos));
    }
    cargarPanelAdmin();
}

async function cancelarReserva(id, index) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    const res = await llamarAPI("cancelar_reserva", { id });
    if (!res) {
        const reservas = JSON.parse(localStorage.getItem("reservasSaborMarino")) || [];
        if (reservas[index]) reservas[index].estado = "Cancelada";
        localStorage.setItem("reservasSaborMarino", JSON.stringify(reservas));
    }
    cargarPanelAdmin();
}

async function cambiarRol(id, index, nuevoRol) {
    const res = await llamarAPI("cambiar_rol", { id, rol: nuevoRol });
    if (!res) {
        const usuarios = obtenerUsuariosLocal();
        if (usuarios[index]) usuarios[index].rol = nuevoRol;
        localStorage.setItem("usuariosSaborMarino", JSON.stringify(usuarios));
    }
    cargarPanelAdmin();
}
