# Documentación de la API - Lex Virtual

Bienvenido a la documentación completa del backend de Lex Virtual. Este backend soporta tanto la aplicación Unity (VR) como el frontend web con React Router.

## 📚 Documentación Disponible

### Para Desarrolladores de Unity (VR APP)
- **[Guía de Integración Unity](./unity-integration-guide.md)** - Guía completa paso a paso
- **[Ejemplo de Código C#](./unity-example.cs)** - Código de ejemplo listo para usar

### Para Desarrolladores de Frontend (React Router)
- **[Guía de Integración React](./frontend-react-guide.md)** - Guía completa con ejemplos de TypeScript/React

### Referencia de API
- **[Referencia Completa de API](./complete-api-reference.md)** - Todos los endpoints documentados
- **[Endpoints de Tracking](./tracking-endpoints.md)** - Endpoints de seguimiento y métricas
- **[Endpoints de Grupos](./groups-endpoints.md)** - Gestión de grupos
- **[Endpoints de Upload](./upload-endpoints.md)** - Subida de archivos

## 🎯 Flujos Principales

### Flujo para Unity (VR APP) - Estudiantes

1. **Registro/Login**
   - `POST /auth/register` - Registrar nuevo estudiante
   - `POST /auth/login` - Iniciar sesión
   - Guardar token JWT localmente

2. **Durante la Sesión de Práctica**
   - `POST /tracking/cases` - Crear caso al iniciar sesión
   - Capturar métricas biométricas durante la práctica
   - `POST /tracking/cases/:caseId/metrics` - Enviar métricas al completar
   - `PUT /tracking/cases/:caseId/status` - Marcar caso como completado

### Flujo para Frontend Web - Estudiantes

1. **Login**
   - `POST /auth/login` - Iniciar sesión
   - Guardar token JWT

2. **Ver Retroalimentaciones**
   - `GET /tracking/my-feedbacks` - Ver todas las retroalimentaciones del grupo

### Flujo para Frontend Web - Profesores

1. **Registro/Login**
   - `POST /auth/register` - Registrar nuevo profesor
   - `POST /auth/login` - Iniciar sesión

2. **Gestión de Grupos**
   - `POST /groups` - Crear grupo y obtener código
   - Compartir código con estudiantes

3. **Ver Resultados de Estudiantes**
   - `GET /tracking/students` - Lista de estudiantes
   - `GET /tracking/students/:studentId` - Detalles del estudiante
   - `GET /tracking/cases/:caseId/performance` - Métricas de un caso
   - `GET /tracking/cases/:caseId/nerviosism-chart` - Gráfico de nerviosismo

4. **Dar Retroalimentación**
   - `POST /upload/audio` - Subir audio (si es feedback de voz)
   - `POST /tracking/feedback/text` - Crear feedback de texto
   - `POST /tracking/feedback/voice` - Crear feedback de voz

## 🔐 Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login o registro y debe guardarse localmente.

## 📋 Roles y Permisos

### Estudiante
- Puede registrarse y loguearse
- Puede crear casos y enviar métricas
- Puede ver sus retroalimentaciones
- Puede unirse a grupos

### Profesor
- Puede registrarse y loguearse (solo en web)
- Puede crear grupos
- Puede ver resultados de todos los estudiantes
- Puede crear retroalimentaciones (texto y voz)

## 🚀 Inicio Rápido

### Para Unity

1. Lee la [Guía de Integración Unity](./unity-integration-guide.md)
2. Copia el código de ejemplo de [unity-example.cs](./unity-example.cs)
3. Configura la URL del backend
4. Implementa el flujo de autenticación
5. Implementa el flujo de casos y métricas

### Para React

1. Lee la [Guía de Integración React](./frontend-react-guide.md)
2. Configura el cliente HTTP (axios recomendado)
3. Implementa los servicios de autenticación
4. Implementa los servicios de tracking/feedback
5. Crea las rutas protegidas

## 📝 Notas Importantes

1. **Base URL:** Configura la URL base del backend según el entorno
2. **Tokens:** Guarda los tokens de forma segura (PlayerPrefs en Unity, localStorage en React)
3. **Manejo de Errores:** Implementa manejo de errores robusto
4. **Validación:** Valida datos antes de enviarlos al servidor
5. **Timeouts:** Configura timeouts apropiados para las peticiones

## 🔗 Enlaces Útiles

- [Referencia Completa de API](./complete-api-reference.md)
- [Endpoints de Tracking](./tracking-endpoints.md)
- [Endpoints de Grupos](./groups-endpoints.md)
- [Endpoints de Upload](./upload-endpoints.md)

## 📞 Soporte

Para preguntas o problemas, consulta la documentación específica de cada plataforma o revisa los ejemplos de código proporcionados.

