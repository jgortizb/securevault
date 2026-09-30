# 🛠️ Hoja de Comandos - SecureVault

Guarda este archivo como tu "acordeón" o chuleta de comandos esenciales.

---

## 1. Servidor Backend (Node.js)

```bash
# Entrar a la carpeta del backend
cd backend

# Encender el servidor en modo normal
node server.js

# Encender el servidor con auto-reinicio inteligente (Recomendado)
node --watch server.js

# Apagar el servidor (en la misma terminal activa)
Ctrl + C

# Apagado forzoso (mata cualquier proceso de Node si el puerto 3000 queda trabado)
Stop-Process -Name node -Force
```

---

## 2. Diagnóstico y Monitoreo (Segunda Terminal)

```powershell
# Ver si Node.js está corriendo en memoria (muestra sus IDs y RAM)
ps node

# Comprobar si el puerto de la API (3000) responde (True = Encendido, False = Apagado)
tnc localhost -p 3000

# "Tocar el timbre" al servidor para ver su mensaje JSON
curl localhost:3000

# Comprobar si el puerto de PostgreSQL (5432) responde
tnc localhost -p 5432

# Ver si el servicio de Windows de PostgreSQL está activo (Running)
Get-Service postgresql*
```

---

## 3. Base de Datos (PostgreSQL 18)

```powershell
# Ver todos los usuarios registrados y sus hashes encriptados:
$env:PGPASSWORD='ABcd..12345'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault -c "SELECT id, email, password_hash, fecha_creacion FROM usuarios;"

# Ver todas las notas guardadas:
$env:PGPASSWORD='ABcd..12345'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault -c "SELECT * FROM notas;"

# Ver las notas junto al correo de su dueño (JOIN SQL):
$env:PGPASSWORD='ABcd..12345'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault -c "SELECT n.id, u.email, n.contenido, n.fecha_creacion FROM notas n JOIN usuarios u ON n.usuario_id = u.id ORDER BY n.fecha_creacion DESC;"

# Entrar a la consola interactiva de PostgreSQL:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d securevault
# (Dentro de la consola psql, para salir escribe: \q y presiona Enter)
```

---

## 4. Atajos de Teclado Clave en VS Code

* **`Ctrl` + `ñ`**: Abrir o cerrar el panel de la Terminal integrada.
* **`Ctrl` + `C`**: Cancelar o detener cualquier proceso en ejecución en la terminal.
* **Botón `+` (arriba a la derecha de la terminal)**: Abrir una segunda terminal limpia sin cerrar el servidor.
* **Clic derecho en `index.html` > "Open with Live Server"**: Lanzar el frontend en el navegador.
