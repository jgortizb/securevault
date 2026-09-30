# 📘 SecureVault - Manual de Operación Técnica y Puesta en Marcha

Este manual contiene todo lo que necesitas saber para encender, apagar, diagnosticar y mantener la aplicación en funcionamiento diario.

---

## 1. Requisitos Previos del Entorno

Para que la aplicación funcione en cualquier computadora, debe tener instalados:
* **Node.js** (Versión 18 o superior, actualmente tienes la v22).
* **PostgreSQL** (Versión 14 o superior, actualmente tienes la v18).
* **Navegador Web** (Google Chrome, Edge, Brave o Firefox).
* **Visual Studio Code** con la extensión **Live Server**.

---

## 2. Protocolo de Encendido Paso a Paso (Puesta en Marcha)

Cada vez que enciendas tu computadora o quieras volver a trabajar en el proyecto, sigue estos 3 sencillos pasos:

```text
[ 1. Verificar PostgreSQL ] ──> [ 2. Encender Servidor Node ] ──> [ 3. Abrir Live Server ]
```

### Paso 1: Asegurarse de que PostgreSQL esté activo
El servicio de PostgreSQL en Windows normalmente arranca solo, pero puedes verificarlo en PowerShell con:
```powershell
Get-Service postgresql*
```
*(Debe decir `Status: Running`). Si estuviera detenido, se inicia con: `Start-Service postgresql-x64-18` en una terminal como Administrador).*

---

### Paso 2: Encender el Servidor Backend (API)
1. Abre tu proyecto en **VS Code**: `Archivo > Abrir carpeta > securevault`.
2. Abre la terminal integrada de VS Code (**`Ctrl` + `ñ`** o menú *Terminal > Nueva Terminal*).
3. Entra a la carpeta del backend y ejecuta el servidor:
   ```bash
   cd backend
   node --watch server.js
   ```
4. **Mensajes que confirman que todo está bien:**
   ```text
   🚀 Servidor backend con Notas y Usuarios en: http://localhost:3000
   🐘 Conectado a PostgreSQL (Base de datos: securevault)
   ```

---

### Paso 3: Abrir la Interfaz Frontend
1. En el explorador de archivos a la izquierda de VS Code, haz **clic derecho** sobre `index.html`.
2. Selecciona **"Open with Live Server"** (o presiona el botón **Go Live** abajo a la derecha).
3. Tu navegador se abrirá en `http://127.0.0.1:5500/index.html`.

¡Listo! La aplicación está 100% operativa.

---

## 3. Protocolo de Apagado

Cuando termines tu jornada de trabajo:

1. **Detener el Servidor Backend:**
   * En la terminal donde corre Node.js presiona: **`Ctrl` + `C`**.
2. **Cerrar Live Server:**
   * Haz clic en el botón azul inferior de VS Code que dice **"Port: 5500"** para detenerlo, o simplemente cierra la pestaña de tu navegador.

---

## 4. Diagnóstico de Salud (Health Checks)

| Componente | Qué verificar | Comando en PowerShell | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **API Backend** | ¿Está vivo el puerto 3000? | `tnc localhost -p 3000` | `TcpTestSucceeded : True` |
| **Ruta de Estado** | ¿Responde la API? | `curl localhost:3000` | JSON con estado `Servidor activo` |
| **Base de Datos** | ¿Está vivo PostgreSQL? | `tnc localhost -p 5432` | `TcpTestSucceeded : True` |
| **Proceso Node** | ¿Node está corriendo? | `ps node` | Muestra el ID del proceso y memoria |

---

## 5. Guía de Solución de Problemas (Troubleshooting)

### Problema A: *"Error: listen EADDRINUSE :::3000"*
* **Causa:** El puerto 3000 quedó tomado por otro proceso o terminal anterior.
* **Solución:** Ejecuta en PowerShell:
  ```powershell
  Stop-Process -Name node -Force
  ```
  Luego vuelve a iniciar con `node --watch server.js`.

### Problema B: *"Error al conectar a PostgreSQL: password authentication failed"*
* **Causa:** La contraseña en `backend/.env` no coincide.
* **Solución:** Revisa que `DB_PASSWORD` en `.env` sea tu contraseña exacta (`ABcd..12345`).

### Problema C: La web dice *"Error al conectar con el servidor"*
* **Causa:** El backend no está encendido en la terminal.
* **Solución:** Ejecuta `cd backend; node server.js`.

---

## 6. Comandos SQL de Mantenimiento

### Ver usuarios registrados:
```powershell
$env:PGPASSWORD='ABcd..12345'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault -c "SELECT id, email, password_hash, fecha_creacion FROM usuarios;"
```

### Ver notas con el correo de su dueño (JOIN SQL):
```powershell
$env:PGPASSWORD='ABcd..12345'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault -c "SELECT n.id, u.email, n.contenido, n.fecha_creacion FROM notas n INNER JOIN usuarios u ON n.usuario_id = u.id ORDER BY n.fecha_creacion DESC;"
```
