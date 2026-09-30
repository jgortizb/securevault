# 🛡️ SecureVault - Documentación Técnica y Manual Maestro de Ingeniería

**Autor:** José / Antigravity Engineering  
**Versión:** 1.0.0 (Producción)  
**Estado:** Desplegado y Operativo en la Nube  

---

## 📌 1. Ficha Técnica y Enlaces Oficiales

| Recurso | Proveedor / Tecnología | Enlace / Ubicación |
| :--- | :--- | :--- |
| **Sitio Web Público (Frontend)** | Render Static Site (CDN) | [https://securevault-app-3hx9.onrender.com](https://securevault-app-3hx9.onrender.com) |
| **API REST (Backend)** | Render Web Service (Node.js) | [https://securevault-yhf6.onrender.com](https://securevault-yhf6.onrender.com) |
| **Base de Datos en la Nube** | Render Managed PostgreSQL 18 | `dpg-daull4ojo6nc73dm0u60-a.oregon-postgres.render.com` |
| **Repositorio de Código** | GitHub | [https://github.com/jgortizb/securevault](https://github.com/jgortizb/securevault) |
| **Código Local en PC** | Windows File System | `C:\Users\JOSE\.gemini\antigravity\scratch\securevault` |

---

## 🏛️ 2. Arquitectura de Software y Flujo de Datos

SecureVault implementa una **Arquitectura Cliente-Servidor Desacoplada basada en API REST**. Ningún componente de la interfaz gráfica tiene acceso directo a la base de datos; toda la persistencia y validación ocurre a través de una API intermedia.

```text
[ Cliente (Frontend CDN) ] ──(fetch HTTPS / JSON)──> [ API REST (Node.js Express) ]
                                                              │
                                                        [ bcryptjs ] (Hashing + Salt)
                                                              │
                                            (Consultas Parametrizadas $1, $2)
                                                              ▼
                                               [ PostgreSQL 18 en Render ]
                                               (Tablas: usuarios y notas)
```

---

## 🗄️ 3. Modelo Relacional de Base de Datos

La base de datos utiliza un esquema relacional normalizado con **Integridad Referencial en Cascada**.

```sql
-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla Relacional de Notas
CREATE TABLE IF NOT EXISTS notas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **Integridad Referencial (`ON DELETE CASCADE`):** Si un registro de usuario se elimina en la tabla `usuarios`, el motor PostgreSQL borra automáticamente todas sus notas asociadas, evitando registros huérfanos.

---

## 🛡️ 4. Seguridad y Criptografía

El sistema fue diseñado bajo estrictos estándares de ciberseguridad para mitigar los principales vectores de ataque del **OWASP Top 10**:

### A. Mitigación de Tablas Arcoíris (*Rainbow Tables*)
* **El Problema:** Hashes tradicionales rápidos (MD5, SHA-1, SHA-256) son vulnerables a ataques por tablas de búsqueda precalculadas.
* **La Solución Implementada:** Se utilizó **`bcrypt`** con un factor de trabajo (*cost factor*) de **10 rondas**.
* **Garantía:** Incluso si dos usuarios eligen la misma contraseña, sus hashes son completamente diferentes gracias al *salt* aleatorio.

### B. Mitigación de Inyección SQL (*SQL Injection*)
* **El Problema:** La concatenación de cadenas en consultas permite a atacantes insertar sentencias SQL arbitrarias.
* **La Solución Implementada:** Todas las consultas en `server.js` emplean **consultas preparadas parametrizadas** nativas del driver `pg` (`$1, $2`).

### C. Aislamiento de Secretos de Entorno
* Ninguna credencial de conexión vive en el código fuente.
* Se gestiona mediante el archivo `.env` (en local) y las *Environment Variables* de Render (en producción).
* El archivo `.gitignore` prohíbe permanentemente la subida de `.env` y `node_modules` al control de versiones.

---

## 📡 5. Especificación de la API REST

Todos los intercambios de datos utilizan cabecera `Content-Type: application/json`.

| Método | Endpoint | Descripción | Códigos HTTP |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Comprobación de salud y estado de la API | `200` |
| **POST** | `/api/registro` | Registro seguro de nuevo usuario con bcrypt | `201`, `400`, `500` |
| **POST** | `/api/login` | Autenticación y verificación contra hash | `200`, `401`, `500` |
| **GET** | `/api/notas?usuario_id=X` | Obtiene notas de un usuario específico | `200`, `400`, `500` |
| **POST** | `/api/notas` | Crea una nueva nota asociada al usuario | `201`, `400`, `500` |
| **DELETE** | `/api/notas/:id?usuario_id=X` | Elimina una nota verificando propiedad | `200`, `500` |

---

## 📂 6. Anatomía del Código Fuente

```text
securevault/
├── index.html                   # Vista principal: Formularios de Login/Registro y Panel Bóveda
├── README.md                    # Resumen ejecutivo para GitHub
├── MANUAL_OPERACION.md          # Manual de arranque y parada diaria
├── COMANDOS.md                  # Acordeón de comandos para terminal
├── DOCUMENTACION_TECNICA.md     # Este manual maestro
├── .gitignore                   # Reglas de exclusión de Git (.env, node_modules)
│
├── css/
│   └── styles.css               # Estilos desacoplados: tarjetas, degradados y animaciones hover
│
├── js/
│   └── app.js                   # Controlador: captura de eventos DOM, fetch(), renderizado de notas
│
└── backend/
    ├── server.js                # Servidor Express, seguridad bcrypt y pool de PostgreSQL
    ├── package.json             # Manifiesto de dependencias y scripts de Node.js
    ├── package-lock.json        # Árbol de resolución determinista de dependencias
    └── .env                     # Credenciales locales (excluido de Git)
```

---

## ☁️ 7. Guía de Conexión y Consultas a la Base de Datos

### Conexión desde Terminal PowerShell (Remota a Render)
```powershell
$env:PGPASSWORD='cCAuf8KZoKWjjsjSmOuAyZpAtWzM0m3S'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h dpg-daull4ojo6nc73dm0u60-a.oregon-postgres.render.com -U securevault_9lc7_user -d securevault_9lc7 -c "SELECT n.id, u.email, n.contenido, n.fecha_creacion FROM notas n JOIN usuarios u ON n.usuario_id = u.id;"
```

### Configuración Gráfica en **pgAdmin 4**
1. Abrir pgAdmin 4.
2. Clic derecho en **Servers** > **Register** > **Server...**
3. **Pestaña General:** Name: `SecureVault Cloud (Render)`
4. **Pestaña Connection:**
   * **Host:** `dpg-daull4ojo6nc73dm0u60-a.oregon-postgres.render.com`
   * **Port:** `5432`
   * **Maintenance database:** `securevault_9lc7`
   * **Username:** `securevault_9lc7_user`
   * **Password:** `cCAuf8KZoKWjjsjSmOuAyZpAtWzM0m3S` *(Marcar "Save Password")*
5. Guardar para explorar visualmente.
