# Guía de Integración para Frontend React Router

Esta guía describe cómo integrar el backend con tu aplicación React Router.

## Configuración Base

### Configuración de API

Crea un archivo de configuración para la API:

```typescript
// src/config/api.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};
```

### Cliente HTTP

```typescript
// src/services/api.ts
import axios from 'axios';
import { apiConfig } from '../config/api';

const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Autenticación

### Para Estudiantes (Solo Login)

```typescript
// src/services/authService.ts
import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string | null;
    roleConfirmed: boolean;
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async whoAmI() {
    const response = await apiClient.get('/auth/whoami');
    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
```

### Para Profesores (Registro y Login)

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  role: 'teacher';
}

export const teacherAuthService = {
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    return authService.login(data);
  },
};
```

## Servicios de Tracking

### Obtener Mis Retroalimentaciones (Estudiante)

```typescript
// src/services/feedbackService.ts
import apiClient from './api';

export interface StudentFeedbackItem {
  feedbackId: string;
  caseId: string;
  caseNumber: number;
  teacherId: string;
  teacherName: string | null;
  teacherLastName: string | null;
  type: 'text' | 'voice';
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: string;
}

export const feedbackService = {
  async getMyFeedbacks(): Promise<StudentFeedbackItem[]> {
    const response = await apiClient.get<StudentFeedbackItem[]>(
      '/tracking/my-feedbacks'
    );
    return response.data;
  },
};
```

### Servicios para Profesores

```typescript
// src/services/trackingService.ts
import apiClient from './api';

export interface StudentListItem {
  studentId: string;
  studentName: string;
  studentLastName: string;
  casesCompleted: number;
  lastCaseNumber: number | null;
  lastCaseTimeSeconds: number | null;
}

export interface StudentDetails {
  studentId: string;
  studentName: string;
  studentLastName: string;
  casesCompleted: number;
  performanceMetrics: {
    caseId: string;
    caseNumber: number;
    fillerWords: string[];
    interruptionsCount: number;
    totalTimeSeconds: number;
    heartRateBpm: number | null;
    nerviosismLevel: 'low' | 'medium' | 'high';
  }[];
}

export interface CasePerformance {
  caseId: string;
  caseNumber: number;
  fillerWords: string[];
  interruptionsCount: number;
  totalTimeSeconds: number;
  heartRateBpm: number | null;
  nerviosismLevel: 'low' | 'medium' | 'high';
  nerviosismChart: {
    stage: string;
    stageName: string;
    bpmValue: number | null;
    levelLabel: string | null;
    timestampSeconds: number;
  }[];
}

export interface NerviosismChart {
  caseId: string;
  caseNumber: number;
  totalTimeSeconds: number;
  stages: {
    stage: string;
    stageName: string;
    bpmValue: number | null;
    levelLabel: string | null;
    timestampSeconds: number;
  }[];
}

export const trackingService = {
  async getStudentsList(): Promise<StudentListItem[]> {
    const response = await apiClient.get<StudentListItem[]>(
      '/tracking/students'
    );
    return response.data;
  },

  async getStudentDetails(studentId: string): Promise<StudentDetails> {
    const response = await apiClient.get<StudentDetails>(
      `/tracking/students/${studentId}`
    );
    return response.data;
  },

  async getCasePerformance(caseId: string): Promise<CasePerformance> {
    const response = await apiClient.get<CasePerformance>(
      `/tracking/cases/${caseId}/performance`
    );
    return response.data;
  },

  async getNerviosismChart(caseId: string): Promise<NerviosismChart> {
    const response = await apiClient.get<NerviosismChart>(
      `/tracking/cases/${caseId}/nerviosism-chart`
    );
    return response.data;
  },
};
```

### Servicios de Feedback para Profesores

```typescript
// src/services/teacherFeedbackService.ts
import apiClient from './api';

export interface CreateTextFeedbackRequest {
  caseId: string;
  content: string;
}

export interface CreateVoiceFeedbackRequest {
  caseId: string;
  voiceUrl: string;
  voiceDurationSeconds: number;
}

export interface FeedbackResponse {
  feedbackId: string;
  caseId: string;
  teacherId: string;
  type: 'text' | 'voice';
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: string;
}

export const teacherFeedbackService = {
  async createTextFeedback(
    data: CreateTextFeedbackRequest
  ): Promise<FeedbackResponse> {
    const response = await apiClient.post<FeedbackResponse>(
      '/tracking/feedback/text',
      data
    );
    return response.data;
  },

  async createVoiceFeedback(
    data: CreateVoiceFeedbackRequest
  ): Promise<FeedbackResponse> {
    const response = await apiClient.post<FeedbackResponse>(
      '/tracking/feedback/voice',
      data
    );
    return response.data;
  },

  async getStudentFeedback(studentId: string): Promise<FeedbackResponse[]> {
    const response = await apiClient.get<FeedbackResponse[]>(
      `/tracking/students/${studentId}/feedback`
    );
    return response.data;
  },

  async getCaseFeedback(caseId: string): Promise<FeedbackResponse[]> {
    const response = await apiClient.get<FeedbackResponse[]>(
      `/tracking/cases/${caseId}/feedback`
    );
    return response.data;
  },
};
```

### Servicio de Subida de Archivos

```typescript
// src/services/uploadService.ts
import apiClient from './api';

export interface UploadAudioResponse {
  url: string;
}

export const uploadService = {
  async uploadAudio(file: File): Promise<UploadAudioResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await apiClient.post<UploadAudioResponse>(
      '/upload/audio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
```

## Componentes React

### Hook de Autenticación

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .whoAmI()
        .then((userData) => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          authService.logout();
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
```

### Protected Route

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## Rutas de la Aplicación

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute requiredRole="teacher">
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Variables de Entorno

Crea un archivo `.env`:

```env
REACT_APP_API_URL=http://localhost:3000
```

## Notas Importantes

1. **Seguridad:** Nunca expongas tokens en el código del cliente
2. **Manejo de Errores:** Implementa manejo de errores global
3. **Loading States:** Muestra estados de carga durante las peticiones
4. **Validación:** Valida formularios antes de enviar datos
5. **TypeScript:** Usa TypeScript para type safety

