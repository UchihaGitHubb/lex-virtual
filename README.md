# Guía de Instalación y Configuración del Backend

Esta guía te ayudará a configurar y ejecutar el backend de Lex Virtual en un nuevo PC.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`
   - Verificar npm: `npm --version`

2. **PostgreSQL** (versión 12 o superior)
   - Descargar desde: https://www.postgresql.org/download/
   - O usar Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

3. **Git** (opcional, si vas a clonar el repositorio)
   - Descargar desde: https://git-scm.com/downloads

---

## 🚀 Pasos de Instalación

### 1. Obtener el Código

**Opción A: Clonar desde Git**
```bash
git clone <url-del-repositorio>
cd lex-virtual
```

**Opción B: Copiar la carpeta del proyecto**
- Copia toda la carpeta del proyecto al nuevo PC
- Navega a la carpeta: `cd ruta/a/lex-virtual`

---

### 2. Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias (puede tardar varios minutos).

---

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Puerto del servidor
PORT=3000

# Configuración de Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña_postgres
DB_NAME=lex_virtual

# Configuración JWT
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES=24h

# Configuración de Uploads
UPLOAD_PATH=uploads
UPLOAD_BASE_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu_contraseña_postgres` con la contraseña de tu base de datos PostgreSQL
- Reemplaza `tu_secreto_jwt_super_seguro_aqui_cambiar_en_produccion` con un secreto seguro (puedes generar uno con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Si tu base de datos está en otro servidor, cambia `DB_HOST` y `DB_PORT` según corresponda
- Si usas otro nombre de base de datos, cambia `DB_NAME`

---

### 4. Crear la Base de Datos

**Opción A: Usando psql (línea de comandos)**
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE lex_virtual;

# Salir de psql
\q
```

**Opción B: Usando pgAdmin (interfaz gráfica)**
1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL
3. Click derecho en "Databases" → "Create" → "Database"
4. Nombre: `lex_virtual`
5. Click en "Save"

**Opción C: Usando Docker**
```bash
# Si usas Docker, la base de datos se crea automáticamente
# Solo asegúrate de que el contenedor esté corriendo:
docker start postgres
```

---

### 5. Compilar el Proyecto

```bash
npm run build
```

Este comando compilará el código TypeScript a JavaScript en la carpeta `dist/`.

---

### 6. Ejecutar el Servidor

**Modo Desarrollo (con recarga automática):**
```bash
npm run start:dev
```

**Modo Producción:**
```bash
npm run start:prod
```

**Modo Normal:**
```bash
npm run start
```

---

## ✅ Verificar que Funciona

Una vez que el servidor esté corriendo, deberías ver un mensaje similar a:

```
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
```

Puedes verificar que el servidor está funcionando visitando:
- http://localhost:3000 (si tienes un endpoint de salud configurado)

---

## 📝 Comandos Útiles

### Desarrollo
```bash
# Iniciar en modo desarrollo (con watch)
npm run start:dev

# Compilar el proyecto
npm run build

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

### Producción
```bash
# Compilar para producción
npm run build

# Ejecutar en producción
npm run start:prod
```

### Testing
```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests e2e
npm run test:e2e

# Ejecutar tests con cobertura
npm run test:cov
```

---

## 🔧 Solución de Problemas

### Error: "Cannot find module"
```bash
# Elimina node_modules y package-lock.json, luego reinstala
rm -rf node_modules package-lock.json
npm install
```

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en el archivo `.env`
- Verifica que la base de datos `lex_virtual` exista
- Verifica que el puerto 5432 esté disponible

### Error: "Port 3000 is already in use"
- Cambia el puerto en el archivo `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

### Error de compilación TypeScript
```bash
# Limpia y recompila
rm -rf dist
npm run build
```

---

## 📁 Estructura de Carpetas Importantes

```
lex-virtual/
├── src/                    # Código fuente
│   ├── modules/           # Módulos de la aplicación
│   ├── config/            # Configuración
│   └── main.ts            # Punto de entrada
├── dist/                  # Código compilado (se genera automáticamente)
├── uploads/               # Archivos subidos (se crea automáticamente)
├── .env                   # Variables de entorno (crear manualmente)
├── package.json           # Dependencias del proyecto
└── tsconfig.json          # Configuración de TypeScript
```

---

## 🔐 Seguridad en Producción

**⚠️ IMPORTANTE para producción:**

1. **Cambiar JWT_SECRET:** Usa un secreto fuerte y único
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Desactivar synchronize:** En producción, cambia `synchronize: true` a `synchronize: false` en `src/config/configuration.ts` y usa migraciones

3. **Variables de entorno:** Nunca subas el archivo `.env` al repositorio (ya está en `.gitignore`)

4. **HTTPS:** Usa HTTPS en producción

5. **CORS:** Configura CORS apropiadamente para tu dominio

---

## 📚 Documentación Adicional

- **Endpoints de la API:** Ver `docs/api/`
- **Integración con Unity:** Ver `docs/api/unity-integration-guide.md`
- **Guía del Frontend:** Ver `docs/api/frontend-react-guide.md`

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que PostgreSQL esté corriendo y accesible
4. Revisa la documentación en `docs/`

---

## 📋 Checklist de Instalación

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado y corriendo
- [ ] Código del proyecto copiado/clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` creado y configurado
- [ ] Base de datos `lex_virtual` creada
- [ ] Proyecto compilado (`npm run build`)
- [ ] Servidor ejecutándose (`npm run start:dev`)
- [ ] Servidor accesible en http://localhost:3000

---

¡Listo! Tu backend debería estar funcionando correctamente. 🎉

