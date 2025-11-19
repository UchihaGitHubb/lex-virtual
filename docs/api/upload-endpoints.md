# Endpoints de Subida de Archivos

Este documento describe los endpoints disponibles para subir archivos al servidor.

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### Subir Archivo de Audio

**POST** `/upload/audio`

Sube un archivo de audio al servidor y devuelve la URL pública del archivo.

**Autenticación:** Requiere JWT

**Content-Type:** `multipart/form-data`

**Body (FormData):**
- `file`: Archivo de audio (requerido)

**Tipos de archivo permitidos:**
- `audio/mpeg`
- `audio/mp3`
- `audio/wav`
- `audio/webm`
- `audio/ogg`
- `audio/m4a`
- `audio/aac`

**Límites:**
- Tamaño máximo: 10MB

**Ejemplo de uso (JavaScript/TypeScript):**
```typescript
const formData = new FormData();
formData.append('file', audioFile);

const response = await fetch('http://localhost:3000/upload/audio', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
// { url: "http://localhost:3000/uploads/audio/uuid.mp3" }
```

**Respuesta exitosa (200):**
```json
{
  "url": "http://localhost:3000/uploads/audio/123e4567-e89b-12d3-a456-426614174000.mp3"
}
```

**Errores posibles:**
- `400 Bad Request`: 
  - Si no se proporcionó ningún archivo
  - Si el tipo de archivo no está permitido
  - Si el archivo excede el tamaño máximo (10MB)
- `401 Unauthorized`: Si no se proporcionó un token JWT válido

## Configuración

### Variables de Entorno

Puedes configurar el comportamiento del módulo de upload usando variables de entorno:

- `UPLOAD_PATH`: Ruta donde se guardarán los archivos (por defecto: `uploads`)
- `UPLOAD_BASE_URL`: URL base para generar las URLs públicas (por defecto: `http://localhost:3000`)

**Ejemplo (.env):**
```env
UPLOAD_PATH=uploads
UPLOAD_BASE_URL=https://api.tudominio.com
```

### Estructura de Directorios

Los archivos se guardan en la siguiente estructura:
```
uploads/
  audio/
    uuid1.mp3
    uuid2.wav
    ...
```

### Servir Archivos Estáticos

Los archivos subidos se sirven automáticamente desde la ruta `/uploads/`. Por ejemplo:
- Archivo guardado: `uploads/audio/123.mp3`
- URL pública: `http://localhost:3000/uploads/audio/123.mp3`

## Notas

- Los archivos se guardan localmente en el servidor
- En producción, se recomienda usar un servicio de almacenamiento en la nube (S3, Cloudinary, etc.)
- Los archivos subidos se ignoran en Git (ver `.gitignore`)
- El servicio genera nombres únicos usando UUID para evitar conflictos
- La extensión del archivo original se preserva

## Migración a Almacenamiento en la Nube

Para migrar a un servicio de almacenamiento en la nube (S3, Cloudinary, etc.), modifica el método `uploadAudioFile` en `src/modules/upload/upload.service.ts`:

```typescript
// Ejemplo con AWS S3
import { S3 } from 'aws-sdk';

async uploadAudioFile(file: Express.Multer.File): Promise<{ url: string }> {
  // ... validaciones ...
  
  const s3 = new S3();
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  await s3.putObject({
    Bucket: 'tu-bucket',
    Key: `audio/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  }).promise();
  
  const url = `https://tu-bucket.s3.amazonaws.com/audio/${fileName}`;
  return { url };
}
```

