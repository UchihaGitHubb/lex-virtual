# Endpoints para Estudiantes (Panel del Estudiante)

Este documento describe los endpoints disponibles para que los estudiantes puedan ver su perfil, progreso, estadísticas y retroalimentaciones.

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

**Importante:** Estos endpoints solo pueden ser accedidos por usuarios con rol `student`.

## Endpoints

### GET /students/my-profile

Obtiene el perfil completo del estudiante autenticado, incluyendo información personal, resumen de actividad y datos del grupo.

**Respuesta:**
```json
{
  "studentId": "uuid",
  "email": "estudiante@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "casesCompleted": 5,
  "totalPracticeTime": 7200,
  "averageNerviosismLevel": "medium",
  "groupName": "Grupo A - Derecho Penal",
  "teacherName": "María",
  "teacherLastName": "González",
  "joinedAt": "2024-01-15T10:00:00.000Z"
}
```

**Campos:**
- `studentId`: ID único del estudiante
- `email`: Correo electrónico del estudiante
- `firstName`: Nombre del estudiante (puede ser null)
- `lastName`: Apellido del estudiante (puede ser null)
- `casesCompleted`: Número de casos completados
- `totalPracticeTime`: Tiempo total de práctica en segundos
- `averageNerviosismLevel`: Nivel promedio de nerviosismo ("low", "medium", "high" o null si no hay casos completados)
- `groupName`: Nombre del grupo al que pertenece (null si no está en ningún grupo)
- `teacherName`: Nombre del profesor del grupo (null si no está en ningún grupo)
- `teacherLastName`: Apellido del profesor del grupo (null si no está en ningún grupo)
- `joinedAt`: Fecha en que se unió al grupo (null si no está en ningún grupo)

**Errores:**
- `403 Forbidden`: Si el usuario no es un estudiante

---

### GET /students/my-cases

Obtiene todos los casos del estudiante con sus métricas de desempeño y retroalimentaciones asociadas.

**Respuesta:**
```json
[
  {
    "caseId": "uuid",
    "caseNumber": 3,
    "status": "completed",
    "completedAt": "2024-01-20T15:30:00.000Z",
    "performanceMetrics": {
      "fillerWords": ["eh", "um", "este"],
      "interruptionsCount": 5,
      "totalTimeSeconds": 1200,
      "heartRateBpm": 85,
      "nerviosismLevel": "medium"
    },
    "feedbacks": [
      {
        "feedbackId": "uuid",
        "type": "text",
        "content": "Excelente trabajo en este caso. El estudiante mostró un buen dominio...",
        "voiceUrl": null,
        "voiceDurationSeconds": null,
        "createdAt": "2024-01-21T10:00:00.000Z"
      },
      {
        "feedbackId": "uuid",
        "type": "voice",
        "content": null,
        "voiceUrl": "http://localhost:3000/uploads/audio/audio-uuid.mp3",
        "voiceDurationSeconds": 45,
        "createdAt": "2024-01-21T11:00:00.000Z"
      }
    ]
  },
  {
    "caseId": "uuid",
    "caseNumber": 2,
    "status": "in_progress",
    "completedAt": null,
    "performanceMetrics": null,
    "feedbacks": []
  }
]
```

**Campos:**
- `caseId`: ID único del caso
- `caseNumber`: Número del caso
- `status`: Estado del caso ("in_progress" o "completed")
- `completedAt`: Fecha de completación (null si está en progreso)
- `performanceMetrics`: Métricas de desempeño (null si el caso no está completado o no tiene métricas)
  - `fillerWords`: Array de palabras muletilla detectadas
  - `interruptionsCount`: Número de interrupciones
  - `totalTimeSeconds`: Tiempo total en segundos
  - `heartRateBpm`: Ritmo cardíaco en BPM (puede ser null)
  - `nerviosismLevel`: Nivel de nerviosismo ("low", "medium", "high")
- `feedbacks`: Array de retroalimentaciones del profesor
  - `feedbackId`: ID único del feedback
  - `type`: Tipo de feedback ("text" o "voice")
  - `content`: Contenido del feedback de texto (null si es voz)
  - `voiceUrl`: URL del audio (null si es texto)
  - `voiceDurationSeconds`: Duración del audio en segundos (null si es texto)
  - `createdAt`: Fecha de creación del feedback

**Notas:**
- Los casos se ordenan por número de caso descendente (más recientes primero)
- Si un caso está en progreso, `performanceMetrics` será null
- Si un caso no tiene retroalimentaciones, `feedbacks` será un array vacío

**Errores:**
- `403 Forbidden`: Si el usuario no es un estudiante

---

### GET /students/my-stats

Obtiene estadísticas generales y detalladas del estudiante, incluyendo distribución de nerviosismo, promedios por etapa y progreso a lo largo del tiempo.

**Respuesta:**
```json
{
  "totalCases": 5,
  "completedCases": 4,
  "inProgressCases": 1,
  "totalPracticeTime": 7200,
  "averageTimePerCase": 1800,
  "totalFillerWords": 25,
  "averageFillerWordsPerCase": 6.25,
  "totalInterruptions": 18,
  "averageInterruptionsPerCase": 4.5,
  "nerviosismDistribution": {
    "low": 1,
    "medium": 2,
    "high": 1
  },
  "nerviosismByStage": {
    "introduction": {
      "averageBpm": 75,
      "averageLevel": "low"
    },
    "testimony": {
      "averageBpm": 85,
      "averageLevel": "medium"
    },
    "objection": {
      "averageBpm": 95,
      "averageLevel": "high"
    },
    "final_argument": {
      "averageBpm": 88,
      "averageLevel": "medium"
    }
  },
  "progressOverTime": [
    {
      "caseNumber": 1,
      "totalTimeSeconds": 1500,
      "nerviosismLevel": "high",
      "completedAt": "2024-01-10T10:00:00.000Z"
    },
    {
      "caseNumber": 2,
      "totalTimeSeconds": 1800,
      "nerviosismLevel": "medium",
      "completedAt": "2024-01-15T14:00:00.000Z"
    },
    {
      "caseNumber": 3,
      "totalTimeSeconds": 1200,
      "nerviosismLevel": "medium",
      "completedAt": "2024-01-20T15:30:00.000Z"
    },
    {
      "caseNumber": 4,
      "totalTimeSeconds": 2700,
      "nerviosismLevel": "low",
      "completedAt": "2024-01-25T11:00:00.000Z"
    }
  ]
}
```

**Campos:**
- `totalCases`: Número total de casos (completados + en progreso)
- `completedCases`: Número de casos completados
- `inProgressCases`: Número de casos en progreso
- `totalPracticeTime`: Tiempo total de práctica en segundos
- `averageTimePerCase`: Promedio de tiempo por caso en segundos (null si no hay casos completados)
- `totalFillerWords`: Total de palabras muletilla detectadas en todos los casos
- `averageFillerWordsPerCase`: Promedio de palabras muletilla por caso (null si no hay casos completados)
- `totalInterruptions`: Total de interrupciones en todos los casos
- `averageInterruptionsPerCase`: Promedio de interrupciones por caso (null si no hay casos completados)
- `nerviosismDistribution`: Distribución de niveles de nerviosismo
  - `low`: Número de casos con nivel bajo
  - `medium`: Número de casos con nivel medio
  - `high`: Número de casos con nivel alto
- `nerviosismByStage`: Promedios de nerviosismo por etapa del juicio
  - `introduction`: Promedio de BPM y nivel para la etapa de Introducción
  - `testimony`: Promedio de BPM y nivel para la etapa de Testimonio
  - `objection`: Promedio de BPM y nivel para la etapa de Objeción
  - `final_argument`: Promedio de BPM y nivel para la etapa de Alegato Final
  - Cada etapa tiene:
    - `averageBpm`: Promedio de BPM (null si no hay datos)
    - `averageLevel`: Nivel promedio ("low", "medium", "high" o null)
- `progressOverTime`: Array con el progreso a lo largo del tiempo, ordenado por número de caso ascendente
  - `caseNumber`: Número del caso
  - `totalTimeSeconds`: Tiempo total en segundos
  - `nerviosismLevel`: Nivel de nerviosismo del caso
  - `completedAt`: Fecha de completación

**Notas:**
- Los promedios se calculan solo con casos completados que tengan métricas
- Si no hay datos para una etapa, `averageBpm` y `averageLevel` serán null
- `progressOverTime` solo incluye casos completados, ordenados cronológicamente

**Errores:**
- `403 Forbidden`: Si el usuario no es un estudiante

---

### GET /tracking/my-feedbacks

Obtiene todas las retroalimentaciones del estudiante, filtradas por el grupo al que pertenece.

**Nota:** Este endpoint ya está implementado en el módulo de tracking. Ver documentación en `tracking-endpoints.md`.

**Respuesta:**
```json
[
  {
    "feedbackId": "uuid",
    "caseId": "uuid",
    "caseNumber": 3,
    "teacherId": "uuid",
    "teacherName": "María",
    "teacherLastName": "González",
    "type": "text",
    "content": "Excelente trabajo en este caso...",
    "voiceUrl": null,
    "voiceDurationSeconds": null,
    "createdAt": "2024-01-21T10:00:00.000Z"
  }
]
```

---

## Flujo de Uso

1. **Login del estudiante:**
   - El estudiante se autentica usando `POST /auth/login`
   - Recibe un token JWT

2. **Ver perfil:**
   - El estudiante accede a `GET /students/my-profile` para ver su información general

3. **Ver progreso:**
   - El estudiante accede a `GET /students/my-cases` para ver todos sus casos con métricas y retroalimentaciones

4. **Ver estadísticas:**
   - El estudiante accede a `GET /students/my-stats` para ver estadísticas detalladas y gráficos

5. **Ver retroalimentaciones:**
   - El estudiante accede a `GET /tracking/my-feedbacks` para ver todas sus retroalimentaciones

## Consideraciones

- Todos los endpoints requieren que el usuario tenga rol `student`
- Los datos se filtran automáticamente para mostrar solo la información del estudiante autenticado
- Si el estudiante no está en un grupo, algunos campos relacionados con el grupo serán null
- Los casos sin métricas (en progreso) no aparecerán en las estadísticas detalladas
- Las retroalimentaciones se filtran por grupo, mostrando solo las del grupo del estudiante

## Ejemplo de Implementación en Frontend

```typescript
// Obtener perfil
const profile = await api.get('/students/my-profile');

// Obtener casos
const cases = await api.get('/students/my-cases');

// Obtener estadísticas
const stats = await api.get('/students/my-stats');

// Obtener retroalimentaciones
const feedbacks = await api.get('/tracking/my-feedbacks');
```

