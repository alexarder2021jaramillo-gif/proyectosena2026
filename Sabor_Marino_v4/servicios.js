// Cambiar entre pantalla de Iniciar Sesion y Crear Cuenta
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

// Mostrar y cerrar caja de errores (Funcionalidad 3)
function mostrarErrores(mensajes) {
    var caja = document.getElementById("caja-errores");
    var lista = document.getElementById("lista-errores");
    lista.innerHTML = "";
    for (var i = 0; i < mensajes.length; i++) {
        var item = document.createElement("li");
        item.textContent = mensajes[i];
        lista.appendChild(item);
    }
    caja.style.display = "block";
}

function cerrarErrores() {
    document.getElementById("caja-errores").style.display = "none";
}

// Obtener usuarios guardados en localStorage
function obtenerUsuarios() {
    var datos = localStorage.getItem("usuariosSaborMarino");
    if (datos) {
        return JSON.parse(datos);
    }
    return [];
}

// Guardar lista actualizada en localStorage
function guardarUsuarios(listaUsuarios) {
    localStorage.setItem("usuariosSaborMarino", JSON.stringify(listaUsuarios));
}

// Validar y guardar formulario de Registro (Funcionalidad 1)
document.getElementById("form-registro").addEventListener("submit", function(evento) {
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

    // Verificar si el correo ya existe en localStorage
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
            password: password
        });
        guardarUsuarios(usuarios);

        document.getElementById("form-registro").reset();
        alert("Registro exitoso. Tus datos se guardaron en el navegador. Ahora puedes iniciar sesion.");
        mostrarLogin();
    }
});

// Validar formulario de Inicio de Sesion contra localStorage (Funcionalidad 2)
document.getElementById("form-login").addEventListener("submit", function(evento) {
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
        localStorage.setItem("usuarioActivo", JSON.stringify(usuarioEncontrado));
        alert("Bienvenido " + usuarioEncontrado.nombres + ", sesion iniciada correctamente.");
        window.location.href = "inicio.html";
    } else {
        mostrarErrores(["Correo o contrasena incorrectos, o el usuario no esta registrado."]);
    }
    // ==========================================
// 1. CONTROL DE SESIÓN Y PROTECCIÓN DE RUTAS
// ==========================================

// Lista de páginas que requieren inicio de sesión
const PAGINAS_PROTEGIDAS = ['admin_panel.html', 'mis_pedidos.html'];

function verificarAcceso() {
    const paginaActual = window.location.pathname.split('/').pop();
    const sesionActiva = JSON.parse(localStorage.getItem('sesionSaborMarino'));

    // Si está en una página protegida y NO hay sesión, redirigir al login
    if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !sesionActiva) {
        alert('Debes iniciar sesión para acceder a esta sección.');
        window.location.href = 'login.html';
    }
}

// Ejecutar verificación apenas cargue cualquier página
verificarAcceso();

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionSaborMarino');
    alert('Sesión cerrada correctamente.');
    window.location.href = 'login.html';
}

// ==========================================
// 2. GUARDAR PEDIDOS Y RESERVAS (Desde pedido.html y reservas.html)
// ==========================================

function guardarPedido(cliente, plato, cantidad, direccion) {
    const pedidos = JSON.parse(localStorage.getItem('pedidosSaborMarino')) || [];
    const nuevoPedido = {
        id: Date.now(),
        cliente: cliente,
        plato: plato,
        cantidad: cantidad,
        direccion: direccion,
        estado: 'Pendiente'
    };
    pedidos.push(nuevoPedido);
    localStorage.setItem('pedidosSaborMarino', JSON.stringify(pedidos));
}

function guardarReserva(cliente, fecha, hora, personas, mesa) {
    const reservas = JSON.parse(localStorage.getItem('reservasSaborMarino')) || [];
    const nuevaReserva = {
        id: Date.now(),
        cliente: cliente,
        fecha: fecha,
        hora: hora,
        personas: personas,
        mesa: mesa,
        estado: 'Confirmada'
    };
    reservas.push(nuevaReserva);
    localStorage.setItem('reservasSaborMarino', JSON.stringify(reservas));
}

// ==========================================
// 3. RENDERIZAR PANEL DE ADMINISTRACIÓN
// ==========================================

function cargarPanelAdmin() {
    const tablaPedidos = document.getElementById('tabla-pedidos');
    const tablaReservas = document.getElementById('tabla-reservas');
    if (!tablaPedidos || !tablaReservas) return;

    const pedidos = JSON.parse(localStorage.getItem('pedidosSaborMarino')) || [];
    const reservas = JSON.parse(localStorage.getItem('reservasSaborMarino')) || [];

    // Mostrar usuario logueado
    const sesion = JSON.parse(localStorage.getItem('sesionSaborMarino'));
    const spanUsuario = document.getElementById('usuario-activo');
    if (sesion && spanUsuario) {
        spanUsuario.textContent = sesion.correo || sesion.usuario;
    }

    // Llenar tabla de pedidos
    tablaPedidos.innerHTML = pedidos.length === 0 
        ? '<tr><td colspan="6">No hay pedidos registrados.</td></tr>'
        : pedidos.map((p, index) => `
            <tr>
                <td>#${p.id.toString().slice(-4)}</td>
                <td>${p.cliente}</td>
                <td>${p.plato} (x${p.cantidad})</td>
                <td>${p.direccion}</td>
                <td><strong>${p.estado}</strong></td>
                <td>
                    <button onclick="cambiarEstadoPedido(${index})" class="btn-accion">Entregar</button>
                    <button onclick="eliminarPedido(${index})" class="btn-eliminar">Eliminar</button>
                </td>
            </tr>
        `).join('');

    // Llenar tabla de reservas
    tablaReservas.innerHTML = reservas.length === 0
        ? '<tr><td colspan="6">No hay reservas registradas.</td></tr>'
        : reservas.map((r, index) => `
            <tr>
                <td>#${r.id.toString().slice(-4)}</td>
                <td>${r.cliente}</td>
                <td>${r.fecha} - ${r.hora}</td>
                <td>${r.personas} pers. (${r.mesa})</td>
                <td><strong>${r.estado}</strong></td>
                <td>
                    <button onclick="cancelarReserva(${index})" class="btn-eliminar">Cancelar</button>
                </td>
            </tr>
        `).join('');
}

function cambiarEstadoPedido(index) {
    const pedidos = JSON.parse(localStorage.getItem('pedidosSaborMarino')) || [];
    pedidos[index].estado = 'Entregado';
    localStorage.setItem('pedidosSaborMarino', JSON.stringify(pedidos));
    cargarPanelAdmin();
}

function eliminarPedido(index) {
    const pedidos = JSON.parse(localStorage.getItem('pedidosSaborMarino')) || [];
    pedidos.splice(index, 1);
    localStorage.setItem('pedidosSaborMarino', JSON.stringify(pedidos));
    cargarPanelAdmin();
}

function cancelarReserva(index) {
    const reservas = JSON.parse(localStorage.getItem('reservasSaborMarino')) || [];
    reservas.splice(index, 1);
    localStorage.setItem('reservasSaborMarino', JSON.stringify(reservas));
    cargarPanelAdmin();
}
});
