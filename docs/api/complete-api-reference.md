# Referencia Completa de la API - Lex Virtual

Esta es la referencia completa de todos los endpoints disponibles en el backend.

## Base URL

```
http://localhost:3000
```

En producción, reemplaza con la URL de tu servidor.

## Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

## Endpoints Públicos

### POST /auth/register
Registra un nuevo usuario (estudiante o profesor).

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "role": "student" // o "teacher"
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "accessToken": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "student",
    "roleConfirmed": false
  }
}
```

### POST /auth/login
Inicia sesión con email y contraseña.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "accessToken": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "student",
    "roleConfirmed": false
  }
}
```

### GET /auth/whoami
Obtiene información del usuario actual (requiere autenticación).

**Respuesta:**
```json
{
  "sub": "uuid",
  "email": "usuario@example.com",
  "role": "student",
  "roleConfirmed": false
}
```

## Endpoints para Unity (VR APP) - Estudiantes

### POST /tracking/cases
Crea un nuevo caso cuando el estudiante inicia una sesión.

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

### PUT /tracking/cases/:caseId/status
Actualiza el estado de un caso.

**Body:**
```json
{
  "status": "completed" // o "in_progress"
}
```

**Respuesta:**
```json
{
  "caseId": "uuid",
  "status": "completed"
}
```

### POST /tracking/cases/:caseId/metrics
Envía las métricas de desempeño al completar un caso.

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

### PUT /tracking/cases/:caseId/metrics
Actualiza las métricas de un caso existente (mismo body que POST).

## Endpoints para Frontend Web - Estudiantes

### GET /tracking/my-feedbacks
Obtiene todas las retroalimentaciones del estudiante (filtradas por grupo).

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
    "content": "El estudiante mostró un buen dominio...",
    "voiceUrl": null,
    "voiceDurationSeconds": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Endpoints para Frontend Web - Profesores

### GET /tracking/students
Lista todos los estudiantes con sus casos completados.

**Respuesta:**
```json
[
  {
    "studentId": "uuid",
    "studentName": "María",
    "studentLastName": "González",
    "casesCompleted": 3,
    "lastCaseNumber": 3,
    "lastCaseTimeSeconds": 1200
  }
]
```

### GET /tracking/students/:studentId
Obtiene los detalles de un estudiante específico.

**Respuesta:**
```json
{
  "studentId": "uuid",
  "studentName": "María",
  "studentLastName": "González",
  "casesCompleted": 3,
  "performanceMetrics": [
    {
      "caseId": "uuid",
      "caseNumber": 1,
      "fillerWords": ["eh", "um"],
      "interruptionsCount": 3,
      "totalTimeSeconds": 900,
      "heartRateBpm": 80,
      "nerviosismLevel": "low"
    }
  ]
}
```

### GET /tracking/cases/:caseId/performance
Obtiene las métricas detalladas de un caso específico.

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
    }
  ]
}
```

### GET /tracking/cases/:caseId/nerviosism-chart
Obtiene los datos del gráfico de nerviosismo por etapas.

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
    }
  ]
}
```

### POST /tracking/feedback/text
Crea un comentario de texto (mínimo 300 caracteres).

**Body:**
```json
{
  "caseId": "uuid",
  "content": "El estudiante mostró un buen dominio del caso..."
}
```

**Respuesta:**
```json
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
```

### POST /tracking/feedback/voice
Crea un comentario de voz (máximo 60 segundos).

**Body:**
```json
{
  "caseId": "uuid",
  "voiceUrl": "https://storage.example.com/audio/feedback-123.mp3",
  "voiceDurationSeconds": 45
}
```

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

### POST /upload/audio
Sube un archivo de audio para feedback de voz.

**Content-Type:** `multipart/form-data`

**Body (FormData):**
- `file`: Archivo de audio

**Respuesta:**
```json
{
  "url": "http://localhost:3000/uploads/audio/uuid.mp3"
}
```

### GET /tracking/students/:studentId/feedback
Obtiene todos los feedbacks de un estudiante.

### GET /tracking/cases/:caseId/feedback
Obtiene todos los feedbacks de un caso específico.

## Endpoints de Grupos

### POST /groups
Crea un nuevo grupo (solo profesores).

**Body:**
```json
{
  "name": "Grupo A - Derecho Penal" // Opcional
}
```

**Respuesta:**
```json
{
  "groupId": "uuid",
  "code": "12345678",
  "name": "Grupo A - Derecho Penal",
  "teacherId": "uuid",
  "teacherName": "Juan",
  "teacherLastName": "Pérez",
  "studentsCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /groups/validate/:code
Valida un código de grupo (público).

**Respuesta:**
```json
{
  "groupId": "uuid",
  "code": "12345678",
  "name": "Grupo A - Derecho Penal",
  "teacherId": "uuid",
  "teacherName": "Juan",
  "teacherLastName": "Pérez"
}
```

### POST /groups/join
Unirse a un grupo (solo estudiantes).

**Body:**
```json
{
  "code": "12345678"
}
```

### GET /groups/my-group
Obtiene el grupo del usuario actual.

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Solicitud inválida
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado (rol incorrecto)
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (recurso ya existe)
- `500 Internal Server Error`: Error del servidor

## Enumeraciones

### UserRole
- `student` - Estudiante
- `teacher` - Profesor

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

