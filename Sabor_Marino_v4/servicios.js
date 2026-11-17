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
});