# Guía de Integración para Unity (VR APP)

Esta guía describe cómo integrar el backend de Lex Virtual con tu aplicación Unity para VR.

## Configuración Base

### URL del Backend

Configura la URL base del backend en tu proyecto Unity:

```csharp
public class ApiConfig
{
    public static string BaseUrl = "http://localhost:3000"; // Cambiar en producción
    public static string ApiVersion = "v1";
}
```

### Librerías Necesarias

Para hacer peticiones HTTP desde Unity, puedes usar:

1. **UnityWebRequest** (nativo de Unity) - Recomendado
2. **RestClient** (asset de Unity Asset Store)
3. **HttpClient** (si usas .NET Standard 2.1+)

## Autenticación

### 1. Registro de Estudiante

**Endpoint:** `POST /auth/register`

**Código C# para Unity:**

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;

[System.Serializable]
public class RegisterRequest
{
    public string email;
    public string password;
    public string role = "student";
    public string firstName; // Opcional: nombre del estudiante
    public string lastName; // Opcional: apellido del estudiante
}

[System.Serializable]
public class RegisterResponse
{
    public string message;
    public string accessToken;
    public UserData user;
}

[System.Serializable]
public class UserData
{
    public string id;
    public string email;
    public string role;
    public bool roleConfirmed;
}

public class AuthManager : MonoBehaviour
{
    private string authToken;
    
    public IEnumerator Register(string email, string password, string firstName = null, string lastName = null)
    {
        RegisterRequest request = new RegisterRequest
        {
            email = email,
            password = password,
            role = "student",
            firstName = firstName,
            lastName = lastName
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = UnityWebRequest.Post(
            $"{ApiConfig.BaseUrl}/auth/register", 
            jsonData, 
            "application/json"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                RegisterResponse response = JsonUtility.FromJson<RegisterResponse>(
                    www.downloadHandler.text);
                authToken = response.accessToken;
                // Guardar token en PlayerPrefs
                PlayerPrefs.SetString("AuthToken", authToken);
                PlayerPrefs.SetString("UserId", response.user.id);
                Debug.Log("Registro exitoso!");
            }
            else
            {
                Debug.LogError($"Error en registro: {www.error}");
                // Manejar errores (email duplicado, etc.)
            }
        }
    }
}
```

### 2. Login de Estudiante

**Endpoint:** `POST /auth/login`

```csharp
[System.Serializable]
public class LoginRequest
{
    public string email;
    public string password;
}

[System.Serializable]
public class LoginResponse
{
    public string message;
    public string accessToken;
    public UserData user;
}

public IEnumerator Login(string email, string password)
{
    LoginRequest request = new LoginRequest
    {
        email = email,
        password = password
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest www = UnityWebRequest.Post(
        $"{ApiConfig.BaseUrl}/auth/login", 
        jsonData, 
        "application/json"))
    {
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        www.uploadHandler = new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        
        yield return www.SendWebRequest();
        
        if (www.result == UnityWebRequest.Result.Success)
        {
            LoginResponse response = JsonUtility.FromJson<LoginResponse>(
                www.downloadHandler.text);
            authToken = response.accessToken;
            PlayerPrefs.SetString("AuthToken", authToken);
            PlayerPrefs.SetString("UserId", response.user.id);
            Debug.Log("Login exitoso!");
        }
        else
        {
            Debug.LogError($"Error en login: {www.error}");
        }
    }
}
```

### 3. Verificar Token (Who Am I)

**Endpoint:** `GET /auth/whoami`

```csharp
public IEnumerator VerifyToken()
{
    string token = PlayerPrefs.GetString("AuthToken");
    
    if (string.IsNullOrEmpty(token))
    {
        Debug.LogError("No hay token guardado");
        yield break;
    }
    
    using (UnityWebRequest www = UnityWebRequest.Get(
        $"{ApiConfig.BaseUrl}/auth/whoami"))
    {
        www.SetRequestHeader("Authorization", $"Bearer {token}");
        
        yield return www.SendWebRequest();
        
        if (www.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Token válido");
        }
        else
        {
            Debug.LogError("Token inválido o expirado");
            // Redirigir a login
        }
    }
}
```

## Gestión de Casos y Métricas

### 1. Crear un Nuevo Caso

**Endpoint:** `POST /tracking/cases`

**Flujo:** Llamar cuando el estudiante inicia una sesión de práctica.

```csharp
[System.Serializable]
public class CreateCaseRequest
{
    public int caseNumber;
}

[System.Serializable]
public class CreateCaseResponse
{
    public string caseId;
    public int caseNumber;
    public string status;
}

public class CaseManager : MonoBehaviour
{
    private string currentCaseId;
    
    public IEnumerator CreateCase(int caseNumber)
    {
        string token = PlayerPrefs.GetString("AuthToken");
        CreateCaseRequest request = new CreateCaseRequest
        {
            caseNumber = caseNumber
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = UnityWebRequest.Post(
            $"{ApiConfig.BaseUrl}/tracking/cases", 
            jsonData, 
            "application/json"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("Authorization", $"Bearer {token}");
            
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                CreateCaseResponse response = JsonUtility.FromJson<CreateCaseResponse>(
                    www.downloadHandler.text);
                currentCaseId = response.caseId;
                Debug.Log($"Caso creado: {response.caseId}");
            }
            else
            {
                Debug.LogError($"Error al crear caso: {www.error}");
            }
        }
    }
}
```

### 2. Enviar Métricas de Desempeño

**Endpoint:** `POST /tracking/cases/:caseId/metrics`

**Flujo:** Llamar cuando el estudiante completa el caso.

```csharp
[System.Serializable]
public class NerviosismStageData
{
    public string stage; // "introduction", "testimony", "objection", "final_argument"
    public int? bpmValue;
    public string levelLabel; // "low", "medium", "high"
    public int timestampSeconds;
}

[System.Serializable]
public class CreateMetricsRequest
{
    public string caseId;
    public string[] fillerWords;
    public int interruptionsCount;
    public int totalTimeSeconds;
    public int? heartRateBpm;
    public string nerviosismLevel; // "low", "medium", "high"
    public NerviosismStageData[] nerviosismStages;
}

public IEnumerator SendPerformanceMetrics(
    string caseId,
    string[] fillerWords,
    int interruptionsCount,
    int totalTimeSeconds,
    int? heartRateBpm,
    string nerviosismLevel,
    NerviosismStageData[] nerviosismStages)
{
    string token = PlayerPrefs.GetString("AuthToken");
    
    CreateMetricsRequest request = new CreateMetricsRequest
    {
        caseId = caseId,
        fillerWords = fillerWords,
        interruptionsCount = interruptionsCount,
        totalTimeSeconds = totalTimeSeconds,
        heartRateBpm = heartRateBpm,
        nerviosismLevel = nerviosismLevel,
        nerviosismStages = nerviosismStages
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest www = UnityWebRequest.Post(
        $"{ApiConfig.BaseUrl}/tracking/cases/{caseId}/metrics", 
        jsonData, 
        "application/json"))
    {
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        www.uploadHandler = new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        www.SetRequestHeader("Authorization", $"Bearer {token}");
        
        yield return www.SendWebRequest();
        
        if (www.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Métricas enviadas exitosamente");
        }
        else
        {
            Debug.LogError($"Error al enviar métricas: {www.error}");
        }
    }
}
```

### 3. Actualizar Estado del Caso

**Endpoint:** `PUT /tracking/cases/:caseId/status`

**Flujo:** Llamar cuando el estudiante completa o cancela el caso.

```csharp
[System.Serializable]
public class UpdateStatusRequest
{
    public string status; // "in_progress" o "completed"
}

public IEnumerator UpdateCaseStatus(string caseId, string status)
{
    string token = PlayerPrefs.GetString("AuthToken");
    UpdateStatusRequest request = new UpdateStatusRequest
    {
        status = status
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest www = UnityWebRequest.Put(
        $"{ApiConfig.BaseUrl}/tracking/cases/{caseId}/status", 
        jsonData))
    {
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        www.uploadHandler = new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        www.SetRequestHeader("Authorization", $"Bearer {token}");
        
        yield return www.SendWebRequest();
        
        if (www.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Estado del caso actualizado");
        }
        else
        {
            Debug.LogError($"Error al actualizar estado: {www.error}");
        }
    }
}
```

## Flujo Completo en Unity

### Ejemplo de Flujo Completo

```csharp
public class GameSessionManager : MonoBehaviour
{
    private CaseManager caseManager;
    private string currentCaseId;
    private float sessionStartTime;
    private List<string> fillerWords = new List<string>();
    private int interruptionsCount = 0;
    private List<NerviosismStageData> nerviosismData = new List<NerviosismStageData>();
    
    // 1. Al iniciar sesión de práctica
    public void StartPracticeSession(int caseNumber)
    {
        StartCoroutine(StartCase(caseNumber));
    }
    
    IEnumerator StartCase(int caseNumber)
    {
        yield return caseManager.CreateCase(caseNumber);
        currentCaseId = caseManager.currentCaseId;
        sessionStartTime = Time.time;
        // Iniciar captura de métricas biométricas
    }
    
    // 2. Durante la sesión, registrar eventos
    public void RecordFillerWord(string word)
    {
        fillerWords.Add(word);
    }
    
    public void RecordInterruption()
    {
        interruptionsCount++;
    }
    
    public void RecordNerviosismStage(string stage, int? bpm, string level)
    {
        nerviosismData.Add(new NerviosismStageData
        {
            stage = stage,
            bpmValue = bpm,
            levelLabel = level,
            timestampSeconds = Mathf.RoundToInt(Time.time - sessionStartTime)
        });
    }
    
    // 3. Al completar la sesión
    public void CompleteSession(int? heartRateBpm, string nerviosismLevel)
    {
        StartCoroutine(CompleteCase(heartRateBpm, nerviosismLevel));
    }
    
    IEnumerator CompleteCase(int? heartRateBpm, string nerviosismLevel)
    {
        int totalTimeSeconds = Mathf.RoundToInt(Time.time - sessionStartTime);
        
        // Enviar métricas
        yield return caseManager.SendPerformanceMetrics(
            currentCaseId,
            fillerWords.ToArray(),
            interruptionsCount,
            totalTimeSeconds,
            heartRateBpm,
            nerviosismLevel,
            nerviosismData.ToArray()
        );
        
        // Actualizar estado a completado
        yield return caseManager.UpdateCaseStatus(currentCaseId, "completed");
        
        Debug.Log("Sesión completada y datos enviados al servidor");
    }
}
```

## Manejo de Errores

### Códigos de Error Comunes

```csharp
public enum ApiError
{
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,
    BadRequest = 400
}

public void HandleApiError(UnityWebRequest request)
{
    switch (request.responseCode)
    {
        case 401:
            Debug.LogError("No autorizado. Token inválido o expirado");
            // Redirigir a login
            break;
        case 403:
            Debug.LogError("Acceso denegado. No tienes permisos");
            break;
        case 404:
            Debug.LogError("Recurso no encontrado");
            break;
        case 409:
            Debug.LogError("Conflicto. El recurso ya existe");
            break;
        case 400:
            Debug.LogError("Solicitud inválida");
            break;
        default:
            Debug.LogError($"Error desconocido: {request.error}");
            break;
    }
}
```

## Almacenamiento Local

### Guardar Token y Datos del Usuario

```csharp
public class PlayerDataManager
{
    public static void SaveAuthData(string token, string userId)
    {
        PlayerPrefs.SetString("AuthToken", token);
        PlayerPrefs.SetString("UserId", userId);
        PlayerPrefs.Save();
    }
    
    public static string GetAuthToken()
    {
        return PlayerPrefs.GetString("AuthToken", "");
    }
    
    public static string GetUserId()
    {
        return PlayerPrefs.GetString("UserId", "");
    }
    
    public static bool IsLoggedIn()
    {
        return !string.IsNullOrEmpty(GetAuthToken());
    }
    
    public static void Logout()
    {
        PlayerPrefs.DeleteKey("AuthToken");
        PlayerPrefs.DeleteKey("UserId");
        PlayerPrefs.Save();
    }
}
```

## Notas Importantes

1. **Seguridad:** Nunca hardcodees tokens o credenciales en el código
2. **Manejo de Errores:** Siempre maneja los errores de red y del servidor
3. **Validación:** Valida los datos antes de enviarlos al servidor
4. **Timeouts:** Configura timeouts apropiados para las peticiones
5. **Threading:** UnityWebRequest debe ejecutarse en el hilo principal (usar coroutines)

## Ejemplo de Clase Completa

Ver el archivo `docs/api/unity-example.cs` para un ejemplo completo de integración.

