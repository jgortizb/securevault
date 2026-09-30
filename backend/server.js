// backend/server.js - Servidor API conectado a PostgreSQL (Usuarios y Notas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Conexión a la Base de Datos PostgreSQL (Compatible con Local y Nube)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Requerido por proveedores cloud como Render
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

// Probar conexión y crear tablas automáticamente si no existen
const inicializarBaseDatos = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('🐘 Conectado exitosamente a PostgreSQL.');

    // Auto-creación de tablas para despliegue en la nube
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS notas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        contenido TEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tablas "usuarios" y "notas" verificadas/creadas.');
  } catch (err) {
    console.error('❌ Error con la base de datos PostgreSQL:', err.message);
  }
};

inicializarBaseDatos();

// 2. Middlewares
app.use(cors());
app.use(express.json());

// Ruta de estado / bienvenida
app.get('/', (req, res) => {
  res.json({
    estado: 'Servidor activo',
    baseDeDatos: 'PostgreSQL Cloud Conectada',
    mensaje: 'API de SecureVault funcionando en producción'
  });
});

// 3. Rutas de Autenticación

// REGISTRO
app.post('/api/registro', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email y contraseña requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ ok: false, error: 'Este correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const resultado = await pool.query(
      'INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id, email, fecha_creacion',
      [email, passwordHash]
    );

    const nuevoUsuario = resultado.rows[0];

    res.status(201).json({
      ok: true,
      mensaje: '¡Usuario registrado correctamente!',
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email },
      hashGenerado: passwordHash
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ ok: false, error: 'Error en la base de datos' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const usuario = resultado.rows[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);

    if (!coincide) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    res.json({
      ok: true,
      mensaje: 'Autenticación satisfactoria.',
      usuario: { id: usuario.id, email: usuario.email }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, error: 'Error en el servidor' });
  }
});

// =============================================================================
// 4. RUTAS DEL DASHBOARD (MISIÓN 6: CRUD DE NOTAS PRIVADAS)
// =============================================================================

// OBTENER NOTAS DEL USUARIO
app.get('/api/notas', async (req, res) => {
  try {
    const usuarioId = req.query.usuario_id;
    if (!usuarioId) {
      return res.status(400).json({ ok: false, error: 'usuario_id es requerido' });
    }

    const resultado = await pool.query(
      'SELECT id, contenido, fecha_creacion FROM notas WHERE usuario_id = $1 ORDER BY fecha_creacion DESC',
      [usuarioId]
    );

    res.json({ ok: true, notas: resultado.rows });
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ ok: false, error: 'Error al consultar notas' });
  }
});

// CREAR UNA NUEVA NOTA
app.post('/api/notas', async (req, res) => {
  try {
    const { usuario_id, contenido } = req.body;

    if (!usuario_id || !contenido || !contenido.trim()) {
      return res.status(400).json({ ok: false, error: 'El contenido de la nota no puede estar vacío' });
    }

    const resultado = await pool.query(
      'INSERT INTO notas (usuario_id, contenido) VALUES ($1, $2) RETURNING id, contenido, fecha_creacion',
      [usuario_id, contenido.trim()]
    );

    res.status(201).json({ ok: true, nota: resultado.rows[0] });
  } catch (error) {
    console.error('Error al guardar nota:', error);
    res.status(500).json({ ok: false, error: 'Error al guardar nota' });
  }
});

// ELIMINAR UNA NOTA
app.delete('/api/notas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.query;

    await pool.query('DELETE FROM notas WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);

    res.json({ ok: true, mensaje: 'Nota eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({ ok: false, error: 'Error al eliminar nota' });
  }
});

// 5. Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend con Notas y Usuarios en: http://localhost:${PORT}`);
});
