using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;
using System;

/// <summary>
/// Ejemplo completo de integración con el backend de Lex Virtual
/// </summary>
public class LexVirtualAPI : MonoBehaviour
{
    [Header("Configuración")]
    public string baseUrl = "http://localhost:3000";
    
    private string authToken;
    private string userId;
    private string currentCaseId;
    
    // Eventos
    public event Action<string> OnLoginSuccess;
    public event Action<string> OnLoginError;
    public event Action<string> OnRegisterSuccess;
    public event Action<string> OnRegisterError;
    public event Action<string> OnCaseCreated;
    public event Action<string> OnMetricsSent;
    
    #region Autenticación
    
    /// <summary>
    /// Registra un nuevo estudiante
    /// </summary>
    public void RegisterStudent(string email, string password)
    {
        StartCoroutine(RegisterCoroutine(email, password));
    }
    
    private IEnumerator RegisterCoroutine(string email, string password)
    {
        var request = new RegisterRequest
        {
            email = email,
            password = password,
            role = "student"
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = CreatePostRequest("/auth/register", jsonData))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<RegisterResponse>(www.downloadHandler.text);
                authToken = response.accessToken;
                userId = response.user.id;
                
                PlayerPrefs.SetString("AuthToken", authToken);
                PlayerPrefs.SetString("UserId", userId);
                
                OnRegisterSuccess?.Invoke("Registro exitoso");
            }
            else
            {
                OnRegisterError?.Invoke(www.error);
            }
        }
    }
    
    /// <summary>
    /// Inicia sesión como estudiante
    /// </summary>
    public void LoginStudent(string email, string password)
    {
        StartCoroutine(LoginCoroutine(email, password));
    }
    
    private IEnumerator LoginCoroutine(string email, string password)
    {
        var request = new LoginRequest
        {
            email = email,
            password = password
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = CreatePostRequest("/auth/login", jsonData))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<LoginResponse>(www.downloadHandler.text);
                authToken = response.accessToken;
                userId = response.user.id;
                
                PlayerPrefs.SetString("AuthToken", authToken);
                PlayerPrefs.SetString("UserId", userId);
                
                OnLoginSuccess?.Invoke("Login exitoso");
            }
            else
            {
                OnLoginError?.Invoke(www.error);
            }
        }
    }
    
    /// <summary>
    /// Carga el token guardado
    /// </summary>
    public void LoadSavedToken()
    {
        authToken = PlayerPrefs.GetString("AuthToken", "");
        userId = PlayerPrefs.GetString("UserId", "");
    }
    
    #endregion
    
    #region Casos
    
    /// <summary>
    /// Crea un nuevo caso cuando el estudiante inicia una sesión
    /// </summary>
    public void CreateCase(int caseNumber)
    {
        StartCoroutine(CreateCaseCoroutine(caseNumber));
    }
    
    private IEnumerator CreateCaseCoroutine(int caseNumber)
    {
        var request = new CreateCaseRequest
        {
            caseNumber = caseNumber
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = CreateAuthenticatedPostRequest("/tracking/cases", jsonData))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<CreateCaseResponse>(www.downloadHandler.text);
                currentCaseId = response.caseId;
                OnCaseCreated?.Invoke(response.caseId);
            }
            else
            {
                Debug.LogError($"Error al crear caso: {www.error}");
            }
        }
    }
    
    /// <summary>
    /// Actualiza el estado del caso
    /// </summary>
    public void UpdateCaseStatus(string status)
    {
        if (string.IsNullOrEmpty(currentCaseId))
        {
            Debug.LogError("No hay un caso activo");
            return;
        }
        
        StartCoroutine(UpdateCaseStatusCoroutine(currentCaseId, status));
    }
    
    private IEnumerator UpdateCaseStatusCoroutine(string caseId, string status)
    {
        var request = new UpdateStatusRequest
        {
            status = status
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest www = CreateAuthenticatedPutRequest(
            $"/tracking/cases/{caseId}/status", 
            jsonData))
        {
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
    
    #endregion
    
    #region Métricas
    
    /// <summary>
    /// Envía las métricas de desempeño al completar un caso
    /// </summary>
    public void SendPerformanceMetrics(
        string[] fillerWords,
        int interruptionsCount,
        int totalTimeSeconds,
        int? heartRateBpm,
        string nerviosismLevel,
        NerviosismStageData[] nerviosismStages)
    {
        if (string.IsNullOrEmpty(currentCaseId))
        {
            Debug.LogError("No hay un caso activo");
            return;
        }
        
        StartCoroutine(SendMetricsCoroutine(
            currentCaseId,
            fillerWords,
            interruptionsCount,
            totalTimeSeconds,
            heartRateBpm,
            nerviosismLevel,
            nerviosismStages
        ));
    }
    
    private IEnumerator SendMetricsCoroutine(
        string caseId,
        string[] fillerWords,
        int interruptionsCount,
        int totalTimeSeconds,
        int? heartRateBpm,
        string nerviosismLevel,
        NerviosismStageData[] nerviosismStages)
    {
        var request = new CreateMetricsRequest
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
        
        using (UnityWebRequest www = CreateAuthenticatedPostRequest(
            $"/tracking/cases/{caseId}/metrics", 
            jsonData))
        {
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                OnMetricsSent?.Invoke("Métricas enviadas exitosamente");
            }
            else
            {
                Debug.LogError($"Error al enviar métricas: {www.error}");
            }
        }
    }
    
    #endregion
    
    #region Helpers
    
    private UnityWebRequest CreatePostRequest(string endpoint, string jsonData)
    {
        UnityWebRequest www = UnityWebRequest.Post($"{baseUrl}{endpoint}", jsonData, "application/json");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        www.uploadHandler = new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        return www;
    }
    
    private UnityWebRequest CreateAuthenticatedPostRequest(string endpoint, string jsonData)
    {
        UnityWebRequest www = CreatePostRequest(endpoint, jsonData);
        www.SetRequestHeader("Authorization", $"Bearer {authToken}");
        return www;
    }
    
    private UnityWebRequest CreateAuthenticatedPutRequest(string endpoint, string jsonData)
    {
        UnityWebRequest www = UnityWebRequest.Put($"{baseUrl}{endpoint}", jsonData);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        www.uploadHandler = new UploadHandlerRaw(bodyRaw);
        www.downloadHandler = new DownloadHandlerBuffer();
        www.SetRequestHeader("Content-Type", "application/json");
        www.SetRequestHeader("Authorization", $"Bearer {authToken}");
        return www;
    }
    
    #endregion
}

#region Data Classes

[System.Serializable]
public class RegisterRequest
{
    public string email;
    public string password;
    public string role;
}

[System.Serializable]
public class RegisterResponse
{
    public string message;
    public string accessToken;
    public UserData user;
}

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

[System.Serializable]
public class UserData
{
    public string id;
    public string email;
    public string role;
    public bool roleConfirmed;
}

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

[System.Serializable]
public class UpdateStatusRequest
{
    public string status;
}

[System.Serializable]
public class NerviosismStageData
{
    public string stage;
    public int? bpmValue;
    public string levelLabel;
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
    public string nerviosismLevel;
    public NerviosismStageData[] nerviosismStages;
}

#endregion

