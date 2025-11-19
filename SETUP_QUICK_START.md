# 🚀 Inicio Rápido - Backend Lex Virtual

## Comandos Rápidos (Copia y Pega)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Crear archivo .env
Crea un archivo `.env` en la raíz con:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña
DB_NAME=lex_virtual
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES=24h
UPLOAD_PATH=uploads
UPLOAD_BASE_URL=http://localhost:3000
```

### 3. Crear Base de Datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE lex_virtual;
\q
```

### 4. Compilar
```bash
npm run build
```

### 5. Ejecutar
```bash
npm run start:dev
```

---

## ⚡ Comandos en una Línea (Windows PowerShell)

```powershell
# Instalar dependencias
npm install

# Crear .env (editar manualmente después)
New-Item -Path .env -ItemType File

# Compilar
npm run build

# Ejecutar
npm run start:dev
```

---

## ⚡ Comandos en una Línea (Linux/Mac)

```bash
# Instalar dependencias
npm install

# Crear .env (editar manualmente después)
touch .env

# Compilar
npm run build

# Ejecutar
npm run start:dev
```

---

## 📝 Notas Importantes

1. **PostgreSQL debe estar corriendo** antes de ejecutar el servidor
2. **Edita el archivo `.env`** con tus credenciales de PostgreSQL
3. **Genera un JWT_SECRET seguro** con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

Para más detalles, ver `docs/SETUP_INSTRUCTIONS.md`

