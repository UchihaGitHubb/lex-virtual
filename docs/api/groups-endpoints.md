# Endpoints de Grupos

Este documento describe los endpoints disponibles para la gestión de grupos de estudiantes.

## Autenticación

La mayoría de los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

**Excepción:** El endpoint de validación de código es público y no requiere autenticación.

## Endpoints

### HU_6.4.1 - Crear Grupo (Profesor)

**POST** `/groups`

Crea un nuevo grupo y genera un código único de 6-8 caracteres numéricos.

**Autenticación:** Requiere JWT (solo profesores)

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

**Características:**
- El código generado es numérico y tiene entre 6 y 8 caracteres
- El código es único en el sistema
- El código se muestra inmediatamente después de crear el grupo
- El profesor puede compartir este código con sus estudiantes

**Errores posibles:**
- `403 Forbidden`: Si el usuario no es profesor
- `400 Bad Request`: Si no se pudo generar un código único (muy raro)

### HU_6.4.2 - Validar Código de Grupo (Público)

**GET** `/groups/validate/:code`

Valida un código de grupo y devuelve información del grupo y del profesor.

**Autenticación:** No requiere (endpoint público)

**Parámetros:**
- `code`: Código del grupo (6-8 caracteres numéricos)

**Ejemplo:**
```
GET /groups/validate/12345678
```

**Respuesta exitosa (200):**
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

**Errores posibles:**
- `404 Not Found`: Si el código no existe (mensaje: "Este código no existe")

**Uso:**
- Los estudiantes pueden validar el código antes de registrarse
- El frontend puede mostrar el nombre del profesor/grupo para confirmación
- Si el código es inválido, se muestra un mensaje claro

### HU_6.4.2 - Unirse a Grupo (Estudiante)

**POST** `/groups/join`

Permite que un estudiante se una a un grupo usando el código.

**Autenticación:** Requiere JWT (solo estudiantes)

**Body:**
```json
{
  "code": "12345678"
}
```

**Validaciones:**
- El código debe tener entre 6 y 8 caracteres
- El código debe ser numérico
- El código debe existir en el sistema
- El estudiante no debe estar ya en el grupo

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

**Errores posibles:**
- `403 Forbidden`: Si el usuario no es estudiante
- `404 Not Found`: Si el código no existe (mensaje: "Este código no existe")
- `409 Conflict`: Si el estudiante ya está en el grupo

**Nota:** Este endpoint también se llama automáticamente durante el registro si el estudiante proporciona un código de grupo.

### Obtener Mi Grupo

**GET** `/groups/my-group`

Obtiene la información del grupo al que pertenece el usuario actual.

**Autenticación:** Requiere JWT

**Respuesta (Profesor):**
```json
{
  "groupId": "uuid",
  "code": "12345678",
  "name": "Grupo A - Derecho Penal",
  "teacherId": "uuid",
  "teacherName": "Juan",
  "teacherLastName": "Pérez",
  "studentsCount": 15,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Respuesta (Estudiante):**
```json
{
  "groupId": "uuid",
  "code": "12345678",
  "name": "Grupo A - Derecho Penal",
  "teacherId": "uuid",
  "teacherName": "Juan",
  "teacherLastName": "Pérez",
  "studentsCount": 15,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Respuesta si no tiene grupo:**
```json
null
```

## Nota sobre Registro

Los estudiantes se registran desde Unity (VR APP). El registro en la web está disponible solo para profesores.

## Características del Código de Grupo

- **Formato:** Numérico (solo dígitos)
- **Longitud:** Entre 6 y 8 caracteres (aleatorio)
- **Unicidad:** Cada código es único en el sistema
- **Generación:** Automática al crear el grupo
- **Validación:** Se valida antes de vincular estudiantes

## Notas Importantes

1. **Validación antes del registro:** Los estudiantes pueden validar el código antes de registrarse usando el endpoint público `/groups/validate/:code`

2. **Vinculación automática:** Si un estudiante proporciona un código durante el registro, se vincula automáticamente al grupo

3. **Un solo grupo por estudiante:** Actualmente, un estudiante solo puede pertenecer a un grupo (se puede extender en el futuro)

4. **Un solo grupo por profesor:** Un profesor solo puede crear un grupo (se puede extender en el futuro)

5. **Mensajes claros:** Todos los errores incluyen mensajes claros para el usuario final

