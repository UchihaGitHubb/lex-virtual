# Endpoints de Tracking (Panel de Seguimiento)

Este documento describe los endpoints disponibles para el panel de seguimiento de estudiantes.

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### HU_6.1.1 - Lista de Estudiantes con Casos Realizados

**GET** `/tracking/students`

Obtiene una lista de todos los estudiantes con el número de casos completados.

**Respuesta:**
```json
[
  {
    "studentId": "uuid",
    "studentName": "Juan",
    "studentLastName": "Pérez",
    "casesCompleted": 3,
    "lastCaseNumber": 3,
    "lastCaseTimeSeconds": 1200
  }
]
```

**Notas:**
- `lastCaseTimeSeconds`: Tiempo en segundos del último caso completado (HU_6.2.1)
- Permite comparar el tiempo de completación entre estudiantes

### HU_6.1.2 - Detalles de un Estudiante

**GET** `/tracking/students/:studentId`

Obtiene los detalles de un estudiante incluyendo todas sus métricas de desempeño.

**Respuesta:**
```json
{
  "studentId": "uuid",
  "studentName": "Juan",
  "studentLastName": "Pérez",
  "casesCompleted": 3,
  "performanceMetrics": [
    {
      "caseId": "uuid",
      "caseNumber": 1,
      "fillerWords": ["eh", "um", "este"],
      "interruptionsCount": 5,
      "totalTimeSeconds": 1200,
      "heartRateBpm": 85,
      "nerviosismLevel": "medium"
    }
  ]
}
```

**Notas:**
- `totalTimeSeconds`: Tiempo de completación de cada caso (HU_6.2.1)
- `caseId` y `caseNumber`: Permiten acceder a los detalles específicos de cada caso

### HU_6.1.2 y HU_6.2.1 - Métricas de Desempeño de un Caso

**GET** `/tracking/cases/:caseId/performance`

Obtiene las métricas detalladas de un caso específico, incluyendo tiempo de completación.

**Respuesta:**
```json
{
  "caseId": "uuid",
  "caseNumber": 1,
  "fillerWords": ["eh", "um"],
  "interruptionsCount": 3,
  "totalTimeSeconds": 900,
  "heartRateBpm": 80,
  "nerviosismLevel": "low",
  "nerviosismChart": [
    {
      "stage": "introduction",
      "stageName": "Introducción",
      "bpmValue": 75,
      "levelLabel": "low",
      "timestampSeconds": 0
    },
    {
      "stage": "testimony",
      "stageName": "Testimonio",
      "bpmValue": 85,
      "levelLabel": "medium",
      "timestampSeconds": 300
    }
  ]
}
```

**Notas:**
- `totalTimeSeconds`: Tiempo total de completación del caso (HU_6.2.1)
- `nerviosismChart`: Datos ordenados cronológicamente por `timestampSeconds` para el gráfico
- `stageName`: Nombre legible de la etapa en español (HU_6.2.2)

### HU_6.2.2 - Gráfico de Nerviosismo por Etapas

**GET** `/tracking/cases/:caseId/nerviosism-chart`

Obtiene los datos del gráfico de nerviosismo dividido por etapas del juicio.

**Respuesta:**
```json
{
  "caseId": "uuid",
  "caseNumber": 1,
  "totalTimeSeconds": 1200,
  "stages": [
    {
      "stage": "introduction",
      "stageName": "Introducción",
      "bpmValue": 75,
      "levelLabel": "low",
      "timestampSeconds": 0
    },
    {
      "stage": "testimony",
      "stageName": "Testimonio",
      "bpmValue": 85,
      "levelLabel": "medium",
      "timestampSeconds": 300
    },
    {
      "stage": "objection",
      "stageName": "Objeción",
      "bpmValue": 95,
      "levelLabel": "high",
      "timestampSeconds": 600
    },
    {
      "stage": "final_argument",
      "stageName": "Alegato final",
      "bpmValue": 88,
      "levelLabel": "medium",
      "timestampSeconds": 900
    }
  ]
}
```

**Notas (HU_6.2.2):**
- Los datos están ordenados cronológicamente por `timestampSeconds` para facilitar la creación del gráfico de línea
- `stageName`: Nombre legible de cada etapa del juicio en español
- `bpmValue`: Valor del ritmo cardíaco en BPM (puede ser null)
- `levelLabel`: Etiqueta de nivel de nerviosismo (low/medium/high)
- El gráfico debe mostrar cómo varió el nerviosismo a lo largo del caso, dividido por las 4 etapas del juicio
- El eje X puede usar `timestampSeconds` o `stageName` para las etiquetas
- El eje Y puede mostrar `bpmValue` (si está disponible) o usar `levelLabel` con una escala (bajo/medio/alto)

### HU_6.3.1 - Crear Comentario de Texto

**POST** `/tracking/feedback/text`

Crea un comentario de texto sobre el desempeño de un estudiante.

**Autenticación:** Requiere JWT (solo profesores)

**Body:**
```json
{
  "caseId": "uuid",
  "content": "El estudiante mostró un buen dominio del caso, pero necesita trabajar en reducir las muletillas. El tiempo de intervención fue adecuado y mantuvo un nivel de nerviosismo controlado durante la mayor parte del juicio. Se observó una mejora significativa en la confianza al presentar el alegato final, aunque aún hay espacio para mejorar en la gestión del tiempo durante las objeciones..."
}
```

**Validaciones (HU_6.3.1):**
- El contenido debe tener al menos 300 caracteres (sin contar espacios en blanco al inicio o final)
- El contenido no puede estar vacío
- El `caseId` debe ser un UUID válido
- El backend valida automáticamente y elimina espacios en blanco al inicio/final antes de guardar

**Recomendaciones para el Frontend:**
- Mostrar un campo de texto amplio y visible para redactar
- Mostrar un contador de caracteres (mínimo 300)
- El botón "Enviar comentario" debe estar deshabilitado si el texto tiene menos de 300 caracteres
- Validar en tiempo real mientras el usuario escribe

**Respuesta:**
```json
{
  "feedbackId": "uuid",
  "caseId": "uuid",
  "teacherId": "uuid",
  "type": "text",
  "content": "El estudiante mostró un buen dominio del caso...",
  "voiceUrl": null,
  "voiceDurationSeconds": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores posibles:**
- `400 Bad Request`: Si el contenido tiene menos de 300 caracteres
- `404 Not Found`: Si el caso no existe
- `403 Forbidden`: Si el usuario no es profesor

### HU_6.3.2 - Crear Comentario de Voz

**POST** `/tracking/feedback/voice`

Crea un comentario de voz sobre el desempeño de un estudiante.

**Autenticación:** Requiere JWT (solo profesores)

**Body:**
```json
{
  "caseId": "uuid",
  "voiceUrl": "https://storage.example.com/audio/feedback-123.mp3",
  "voiceDurationSeconds": 45
}
```

**Validaciones (HU_6.3.2):**
- La duración debe ser entre 1 y 60 segundos (máximo 1 minuto)
- La `voiceUrl` debe ser una URL válida
- El `caseId` debe ser un UUID válido
- La URL del audio debe estar disponible (el frontend debe subir el archivo primero a un servicio de almacenamiento)

**Recomendaciones para el Frontend:**
- Mostrar un botón visible con ícono de micrófono para iniciar la grabación
- Mostrar un indicador de tiempo durante la grabación (máximo 60 segundos)
- Permitir al profesor escuchar el audio antes de enviarlo
- Permitir cancelar la grabación antes de enviar
- El botón "Enviar comentario" debe estar deshabilitado si no hay audio grabado
- El frontend debe subir el archivo de audio a un servicio de almacenamiento (S3, Cloudinary, etc.) y obtener la URL antes de llamar a este endpoint

**Flujo recomendado:**
1. Usuario hace clic en el botón de micrófono
2. Se inicia la grabación (máximo 60 segundos)
3. Usuario detiene la grabación
4. Se muestra un reproductor para escuchar el audio
5. Usuario puede:
   - Reproducir el audio para verificar
   - Cancelar y volver a grabar
   - Enviar el comentario
6. Al enviar, el frontend sube el audio a almacenamiento
7. Se llama a este endpoint con la URL del audio

**Respuesta:**
```json
{
  "feedbackId": "uuid",
  "caseId": "uuid",
  "teacherId": "uuid",
  "type": "voice",
  "content": null,
  "voiceUrl": "https://storage.example.com/audio/feedback-123.mp3",
  "voiceDurationSeconds": 45,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores posibles:**
- `400 Bad Request`: Si la duración excede 60 segundos o la URL no es válida
- `404 Not Found`: Si el caso no existe
- `403 Forbidden`: Si el usuario no es profesor

### HU_6.5.1 - Obtener Feedback de un Estudiante

**GET** `/tracking/students/:studentId/feedback`

Obtiene todos los feedbacks (texto y voz) de un estudiante, incluyendo niveles de nerviosismo.

**Respuesta:**
```json
[
  {
    "feedbackId": "uuid",
    "caseId": "uuid",
    "teacherId": "uuid",
    "type": "text",
    "content": "...",
    "voiceUrl": null,
    "voiceDurationSeconds": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Obtener Feedback de un Caso Específico

**GET** `/tracking/cases/:caseId/feedback`

Obtiene todos los feedbacks de un caso específico.

**Autenticación:** Requiere JWT (solo profesores)

**Respuesta:**
```json
[
  {
    "feedbackId": "uuid",
    "caseId": "uuid",
    "teacherId": "uuid",
    "type": "voice",
    "content": null,
    "voiceUrl": "https://storage.example.com/audio/feedback-123.mp3",
    "voiceDurationSeconds": 45,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Obtener Mis Retroalimentaciones (Estudiante)

**GET** `/tracking/my-feedbacks`

Obtiene todas las retroalimentaciones del estudiante, filtradas por el grupo al que pertenece.

**Autenticación:** Requiere JWT (solo estudiantes)

**Descripción:**
- Los estudiantes pueden ver todas las retroalimentaciones de su grupo
- Las retroalimentaciones se ordenan por fecha (más recientes primero)
- Incluye información del caso, del profesor y el tipo de retroalimentación (texto o voz)

**Respuesta:**
```json
[
  {
    "feedbackId": "uuid",
    "caseId": "uuid",
    "caseNumber": 1,
    "teacherId": "uuid",
    "teacherName": "Juan",
    "teacherLastName": "Pérez",
    "type": "text",
    "content": "El estudiante mostró un buen dominio del caso...",
    "voiceUrl": null,
    "voiceDurationSeconds": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "feedbackId": "uuid",
    "caseId": "uuid",
    "caseNumber": 2,
    "teacherId": "uuid",
    "teacherName": "Juan",
    "teacherLastName": "Pérez",
    "type": "voice",
    "content": null,
    "voiceUrl": "https://storage.example.com/audio/feedback-123.mp3",
    "voiceDurationSeconds": 45,
    "createdAt": "2024-01-02T00:00:00.000Z"
  }
]
```

**Características:**
- Solo muestra retroalimentaciones de casos de estudiantes del mismo grupo
- Incluye el número de caso para identificar fácilmente a qué caso corresponde
- Incluye el nombre completo del profesor que dejó la retroalimentación
- Si el estudiante no tiene grupo, retorna un array vacío

**Errores posibles:**
- `403 Forbidden`: Si el usuario no es estudiante
- `200 OK` con array vacío: Si el estudiante no tiene grupo o no hay retroalimentaciones

## Enumeraciones

### NerviosismLevel
- `low` - Bajo
- `medium` - Medio
- `high` - Alto

### TrialStage
- `introduction` - Introducción
- `testimony` - Testimonio
- `objection` - Objeción
- `final_argument` - Alegato final

### FeedbackType
- `text` - Comentario de texto
- `voice` - Comentario de voz

## Endpoints para Unity (VR APP)

Estos endpoints están diseñados para que la aplicación Unity envíe datos al backend.

### Crear un Nuevo Caso

**POST** `/tracking/cases`

Crea un nuevo caso cuando un estudiante inicia una sesión en Unity.

**Autenticación:** Requiere JWT (solo estudiantes)

**Body:**
```json
{
  "caseNumber": 1
}
```

**Respuesta:**
```json
{
  "caseId": "uuid",
  "caseNumber": 1,
  "status": "in_progress"
}
```

**Notas:**
- Solo se puede tener un caso en progreso a la vez por estudiante
- Si ya existe un caso en progreso, se retornará un error

### Actualizar Estado de un Caso

**PUT** `/tracking/cases/:caseId/status`

Actualiza el estado de un caso (por ejemplo, marcarlo como completado).

**Autenticación:** Requiere JWT (solo estudiantes)

**Body:**
```json
{
  "status": "completed"
}
```

**Respuesta:**
```json
{
  "caseId": "uuid",
  "status": "completed"
}
```

### Crear Métricas de Desempeño

**POST** `/tracking/cases/:caseId/metrics`

Crea las métricas de desempeño de un caso. Debe llamarse cuando el estudiante completa el caso.

**Autenticación:** Requiere JWT (solo estudiantes)

**Body:**
```json
{
  "caseId": "uuid",
  "fillerWords": ["eh", "um", "este"],
  "interruptionsCount": 5,
  "totalTimeSeconds": 1200,
  "heartRateBpm": 85,
  "nerviosismLevel": "medium",
  "nerviosismStages": [
    {
      "stage": "introduction",
      "bpmValue": 75,
      "levelLabel": "low",
      "timestampSeconds": 0
    },
    {
      "stage": "testimony",
      "bpmValue": 85,
      "levelLabel": "medium",
      "timestampSeconds": 300
    },
    {
      "stage": "objection",
      "bpmValue": 95,
      "levelLabel": "high",
      "timestampSeconds": 600
    },
    {
      "stage": "final_argument",
      "bpmValue": 88,
      "levelLabel": "medium",
      "timestampSeconds": 900
    }
  ]
}
```

**Respuesta:**
```json
{
  "metricsId": "uuid",
  "caseId": "uuid"
}
```

**Notas:**
- Solo se pueden crear métricas una vez por caso
- Si ya existen métricas, usar el endpoint PUT para actualizarlas

### Actualizar Métricas de Desempeño

**PUT** `/tracking/cases/:caseId/metrics`

Actualiza las métricas de desempeño de un caso existente.

**Autenticación:** Requiere JWT (solo estudiantes)

**Body:** (igual que POST)

**Respuesta:**
```json
{
  "metricsId": "uuid",
  "caseId": "uuid"
}
```

## Enumeraciones

### CaseStatus
- `in_progress` - Caso en progreso
- `completed` - Caso completado

### NerviosismLevel
- `low` - Bajo
- `medium` - Medio
- `high` - Alto

### TrialStage
- `introduction` - Introducción
- `testimony` - Testimonio
- `objection` - Objeción
- `final_argument` - Alegato final

### FeedbackType
- `text` - Comentario de texto
- `voice` - Comentario de voz

## Notas

- **Endpoints de profesores (GET):** Solo pueden ser accedidos por usuarios con rol `teacher`
- **Endpoints de Unity (POST/PUT):** Solo pueden ser accedidos por usuarios con rol `student`
- Todos los endpoints requieren autenticación JWT
- Los datos biométricos se envían desde Unity cuando el estudiante completa un caso
- El flujo típico es:
  1. Unity crea un caso (POST `/tracking/cases`)
  2. El estudiante completa el caso en Unity
  3. Unity envía las métricas (POST `/tracking/cases/:caseId/metrics`)
  4. Unity actualiza el estado del caso a "completed" (PUT `/tracking/cases/:caseId/status`)
  5. Los profesores pueden ver los datos en la web (GET endpoints)

