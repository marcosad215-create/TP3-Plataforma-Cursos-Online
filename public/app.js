const decodificarToken = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
};

// Seleccionamos los elementos de la pantalla de autenticación y la pantalla principal
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// Seleccionamos los formularios
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const crearCursoForm = document.getElementById('crear-curso-form');

// Contenedor donde se listarán los cursos y el botón de salir
const listaCursos = document.getElementById('lista-cursos');
const btnLogout = document.getElementById('btn-logout');

// Función para verificar si ya hay un token guardado al abrir la página
const chequearAutenticacion = () => {
    const token = localStorage.getItem('token');
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
    btnLogout.className = 'btn-secundario'; // Le asignamos el estilo moderno
    }

    if (token) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';

        const datosUsuario = decodificarToken(token);
        const rol = datosUsuario.rol;

        // Si es ESTUDIANTE, ocultamos el formulario de ADMIN (crear curso)
        const boxCrear = document.querySelector('.crear-curso-box');
        if (rol === 'estudiante') {
            boxCrear.style.display = 'none';
            document.querySelector('#app-container h2').innerText = "Cursos para Estudiantes";
        } else {
            boxCrear.style.display = 'block';
            document.querySelector('#app-container h2').innerText = "Panel de Administrador";
        }

        cargarCursos(rol); 
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
};

// ==========================================
// EVENTO: REGISTRARSE
// ==========================================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitamos que la página se recargue al enviar el formulario

    // Obtenemos los valores que escribió el usuario
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        // Enviamos los datos al servidor usando fetch[cite: 1]
        const respuesta = await fetch('/api/auth/register', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, // Avisamos que enviamos JSON
            body: JSON.stringify({ nombre, email, password }) // Convertimos los datos a texto
        });

        const data = await respuesta.json(); // Leemos la respuesta del servidor

        if (respuesta.ok) {
            alert('Registro exitoso. Ahora podés iniciar sesión.');
            registerForm.reset(); // Limpiamos el formulario
        } else {
            alert('Error: ' + data.error); 
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
});

// ==========================================
// EVENTO: INICIAR SESIÓN (LOGIN)
// ==========================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            // Si el login es correcto, guardamos el token JWT en el localStorage[cite: 1]
            localStorage.setItem('token', data.token);
            loginForm.reset();
            // Cambiamos de pantalla
            chequearAutenticacion();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
});

// ==========================================
// EVENTO: CERRAR SESIÓN
// ==========================================
btnLogout.addEventListener('click', () => {
    // Borramos el token del almacenamiento local para destruir la sesión
    localStorage.removeItem('token');
    // Volvemos a la pantalla de login
    chequearAutenticacion();
});

// ==========================================
// FUNCIÓN: OBTENER Y MOSTRAR LOS CURSOS
// ==========================================
// Ojo: le sacamos la palabra "rol" de adentro de los paréntesis
const cargarCursos = async () => {
    const token = localStorage.getItem('token');
    // Si no hay token, no hacemos nada
    if (!token) return;

    // Leemos el rol del usuario desde el token
    const rol = decodificarToken(token).rol;

    try {
        const respuesta = await fetch('/api/cursos', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await respuesta.json();

        if (respuesta.ok) {
            listaCursos.innerHTML = '';
            
            cursos.forEach(curso => {
                const divCurso = document.createElement('div');
                divCurso.className = 'curso-item';
                
                const fecha = new Date(curso.fecha_limite).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                // Armamos la primera parte de la tarjeta del curso
                let html = `
                    <h4>${curso.titulo}</h4>
                    <p><strong>Cupos:</strong> ${curso.inscritos_actuales} / ${curso.cupo_maximo}</p>
                    <p><strong>Fecha límite:</strong> ${fecha}</p>
                    <hr>
                `;

                // ... dentro de cursos.forEach en la función cargarCursos ...

                // Agregamos los botones dependiendo del rol y de si está inscripto
                if (rol === 'estudiante') {
                    // Si el servidor nos dice que YA estamos inscriptos:
                    if (curso.ya_inscripto) {
                        html += `
                            <button disabled class="btn-disabled" style="margin-right: 10px;">
                                ✓ Ya Inscripto
                            </button>
                            <button onclick="cancelar(${curso.id})" class="btn-secundario">
                                Cancelar Inscripción
                            </button>
                        `;
                    } 
                    // Si NO estamos inscriptos:
                    else {
                        html += `
                            <button onclick="inscribirse(${curso.id})" class="btn-primario">
                                Inscribirme en el curso
                            </button>
                        `;
                    }
                } else {
                    // Si es Admin, solo ve el botón de eliminar (con un toque fucsia para que combine)
                    html += `<button onclick="eliminarCurso(${curso.id})" class="btn-secundario" style="color: var(--magenta-neón); border-color: var(--magenta-neón);">Eliminar Curso</button>`;
                }

                divCurso.innerHTML = html;
                listaCursos.appendChild(divCurso);
            });
        }
    } catch (error) {
        console.error('Error al cargar cursos', error);
    }
};

// ==========================================
// EVENTO: CREAR UN NUEVO CURSO
// ==========================================
crearCursoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('curso-titulo').value;
    const cupo_maximo = document.getElementById('curso-cupo').value;
    const fecha_limite = document.getElementById('curso-fecha').value; // <--- Nueva línea
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch('/api/cursos', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Permiso para crear[cite: 1]
            },
            // Como es un TP, mandamos IDs fijos de instructor y categoría para simplificar
            body: JSON.stringify({ titulo, cupo_maximo, fecha_limite, id_instructor: 2, id_categoria: 1 })
        });

        if (respuesta.ok) {
            alert('Curso creado con éxito');
            crearCursoForm.reset();
            // Recargamos la lista para ver el nuevo curso
            cargarCursos();
        } else {
            const data = await respuesta.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error al crear el curso');
    }
});

// Al cargar la página por primera vez, ejecutamos esta función
chequearAutenticacion();

// ==========================================
// EVENTO: INSCRIBIRSE EN UN CURSO
// ==========================================
window.inscribirse = async (id_curso) => {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch('/api/cursos/inscribirse', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ id_curso })
        });
        const data = await respuesta.json();
        
        if (respuesta.ok) {
            alert('¡Te inscribiste correctamente!');
            cargarCursos(); // Recargamos para ver cómo sube el numerito de inscriptos
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error al inscribirse');
    }
};

// ==========================================
// EVENTO: ELIMINAR UN CURSO
// ==========================================
window.cancelar = async (id_curso) => {
    if (!confirm('¿Seguro que deseas cancelar tu inscripción?')) return;
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch('/api/cursos/cancelar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ id_curso })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
            alert(data.mensaje);
            cargarCursos(); // Recargamos para que vuelva a aparecer el botón verde
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
};

window.cancelar = async (id_curso) => {
    if (!confirm('¿Seguro que deseas cancelar tu inscripción?')) return;
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch('/api/cursos/cancelar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ id_curso })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
            alert(data.mensaje);
            // Re-decodificamos el rol para recargar la vista correcta
            const rol = decodificarToken(token).rol;
            cargarCursos(rol);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
};

window.eliminarCurso = async (id) => {
    // 1. Pedimos confirmación para evitar accidentes
    if (!confirm('¿Estás seguro de que querés eliminar este curso? Esta acción también borrará todas las inscripciones asociadas.')) {
        return;
    }

    // 2. Buscamos el token del Admin en el almacenamiento local
    const token = localStorage.getItem('token');

    try {
        // 3. Hacemos la petición al servidor
        const respuesta = await fetch(`/api/cursos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // <--- CLAVE: Sin esto, el servidor no te deja borrar
            }
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            alert(data.mensaje);
            cargarCursos(); // Recargamos la lista para que el curso desaparezca de la vista
        } else {
            alert('Error: ' + (data.error || data.mensaje));
        }
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        alert('Hubo un error al conectar con el servidor.');
    }
};