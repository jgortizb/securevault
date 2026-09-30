// js/app.js - Misión 6: Control de Vistas y CRUD de Notas Privadas con PostgreSQL

const API_URL = 'http://localhost:3000/api';

// Estado local de la sesión (sin necesidad de tokens complejos por ahora)
let usuarioActual = null;

// Elementos del DOM
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const userBadge = document.getElementById('userBadge');
const btnLogout = document.getElementById('btnLogout');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');

const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const notesList = document.getElementById('notesList');
const notesCount = document.getElementById('notesCount');
const dashboardAlert = document.getElementById('dashboardAlert');

// =============================================================================
// UTILIDADES: MENSAJES Y CAMBIO DE PANTALLAS
// =============================================================================

function mostrarAlerta(elemento, mensaje, tipo = 'info', duracion = 4000) {
  elemento.className = `alert alert-${tipo} py-2 px-3 small mb-3 text-center`;
  elemento.innerHTML = mensaje;
  elemento.classList.remove('d-none');

  setTimeout(() => {
    elemento.classList.add('d-none');
  }, duracion);
}

function mostrarPantallaDashboard(usuario) {
  usuarioActual = usuario;
  userBadge.textContent = usuario.email;

  // Ocultamos la vista de autenticación y mostramos el dashboard
  authView.classList.add('d-none');
  dashboardView.classList.remove('d-none');

  // Cargamos de inmediato las notas del usuario desde PostgreSQL
  cargarNotas();
}

function cerrarSesion() {
  usuarioActual = null;
  notesList.innerHTML = '';
  dashboardView.classList.add('d-none');
  authView.classList.remove('d-none');
  loginForm.reset();
  registerForm.reset();
  mostrarAlerta(alertBox, '👋 Sesión cerrada correctamente.', 'info');
}

btnLogout.addEventListener('click', cerrarSesion);

// =============================================================================
// 1. REGISTRO DE USUARIO
// =============================================================================
registerForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  if (password.length < 6) {
    mostrarAlerta(alertBox, '⚠️ La contraseña debe tener al menos 6 caracteres.', 'danger');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';

  try {
    const res = await fetch(`${API_URL}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      mostrarAlerta(alertBox, `
        <strong>🎉 ¡Registrado con éxito en PostgreSQL!</strong><br>
        Ahora puedes iniciar sesión con tu cuenta.
      `, 'success', 6000);
      registerForm.reset();

      // Cambiar automáticamente a la pestaña de login
      const tabLoginBtn = document.getElementById('tab-login');
      const tabInstance = new bootstrap.Tab(tabLoginBtn);
      tabInstance.show();
    } else {
      mostrarAlerta(alertBox, `❌ Error: ${data.error}`, 'danger');
    }
  } catch (error) {
    mostrarAlerta(alertBox, '🔌 Error de conexión con el servidor.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-person-check-fill me-2"></i>Crear Cuenta';
  }
});

// =============================================================================
// 2. INICIO DE SESIÓN
// =============================================================================
loginForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      // Pasamos al Dashboard con los datos del usuario devueltos por la BD
      mostrarPantallaDashboard(data.usuario);
    } else {
      mostrarAlerta(alertBox, `⛔ ${data.error}: Revisa tus credenciales.`, 'danger');
    }
  } catch (error) {
    mostrarAlerta(alertBox, '🔌 Error al conectar con el servidor.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-unlock-fill me-2"></i>Entrar';
  }
});

// =============================================================================
// 3. CARGAR NOTAS DEL USUARIO (GET de PostgreSQL)
// =============================================================================
async function cargarNotas() {
  if (!usuarioActual) return;

  try {
    const res = await fetch(`${API_URL}/notas?usuario_id=${usuarioActual.id}`);
    const data = await res.json();

    if (res.ok) {
      renderizarNotas(data.notas);
    }
  } catch (error) {
    console.error('Error cargando notas:', error);
  }
}

function renderizarNotas(notas) {
  notesCount.textContent = notas.length;

  if (notas.length === 0) {
    notesList.innerHTML = `
      <div class="text-center text-muted p-4 border rounded bg-white">
        <i class="bi bi-journal-x fs-3 d-block mb-1 text-secondary"></i>
        No tienes notas aún. ¡Escribe la primera arriba!
      </div>
    `;
    return;
  }

  notesList.innerHTML = notas.map(nota => {
    const fecha = new Date(nota.fecha_creacion).toLocaleString();
    return `
      <div class="note-item p-3 rounded shadow-sm d-flex justify-content-between align-items-start bg-white">
        <div class="me-2">
          <p class="mb-1 text-dark" style="white-space: pre-wrap;">${nota.contenido}</p>
          <small class="text-muted" style="font-size: 0.75rem;">
            <i class="bi bi-clock me-1"></i>${fecha}
          </small>
        </div>
        <button class="btn btn-outline-danger btn-sm border-0" onclick="eliminarNota(${nota.id})" title="Eliminar de PostgreSQL">
          <i class="bi bi-trash3-fill"></i>
        </button>
      </div>
    `;
  }).join('');
}

// =============================================================================
// 4. CREAR UNA NOTA NUEVA (POST a PostgreSQL)
// =============================================================================
noteForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const contenido = noteInput.value.trim();
  if (!contenido) return;

  try {
    const res = await fetch(`${API_URL}/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioActual.id,
        contenido: contenido
      })
    });
    const data = await res.json();

    if (res.ok) {
      noteInput.value = '';
      mostrarAlerta(dashboardAlert, '💾 ¡Nota guardada en PostgreSQL!', 'success', 2000);
      cargarNotas(); // Recargar la lista
    } else {
      mostrarAlerta(dashboardAlert, `❌ ${data.error}`, 'danger');
    }
  } catch (error) {
    mostrarAlerta(dashboardAlert, '🔌 Error al guardar nota.', 'danger');
  }
});

// =============================================================================
// 5. ELIMINAR UNA NOTA (DELETE de PostgreSQL)
// =============================================================================
window.eliminarNota = async function(notaId) {
  try {
    const res = await fetch(`${API_URL}/notas/${notaId}?usuario_id=${usuarioActual.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      mostrarAlerta(dashboardAlert, '🗑️ Nota eliminada de la base de datos.', 'info', 2000);
      cargarNotas();
    }
  } catch (error) {
    mostrarAlerta(dashboardAlert, '🔌 Error al eliminar nota.', 'danger');
  }
};
