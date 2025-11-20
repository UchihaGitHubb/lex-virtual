// ============================================
// EJEMPLO SIMPLE DE LOGIN EN UNITY
// ============================================
// Copia estos scripts a tu proyecto Unity
// ============================================

// ============================================
// 1. ApiConfig.cs
// ============================================
using UnityEngine;

public static class ApiConfig
{
    public static string BaseUrl = "http://localhost:3000";
}

// ============================================
// 2. AuthModels.cs
// ============================================
using System;
using UnityEngine;

[Serializable]
public class LoginRequest
{
    public string email;
    public string password;
}

[Serializable]
public class LoginResponse
{
    public string message;
    public string accessToken;
    public UserData user;
}

[Serializable]
public class UserData
{
    public string id;
    public string email;
    public string role;
    public bool roleConfirmed;
}

// ============================================
// 3. AuthManager.cs (Versión Simplificada)
// ============================================
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;

public class AuthManager : MonoBehaviour
{
    private string authToken;
    
    // Método principal para hacer login
    public void Login(string email, string password)
    {
        StartCoroutine(LoginCoroutine(email, password));
    }
    
    private IEnumerator LoginCoroutine(string email, string password)
    {
        // 1. Crear el objeto de petición
        LoginRequest request = new LoginRequest
        {
            email = email,
            password = password
        };
        
        // 2. Convertir a JSON
        string jsonData = JsonUtility.ToJson(request);
        
        // 3. Crear la petición HTTP
        string url = $"{ApiConfig.BaseUrl}/auth/login";
        using (UnityWebRequest www = UnityWebRequest.Post(url, jsonData, "application/json"))
        {
            // 4. Configurar el body
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            
            // 5. Enviar y esperar
            yield return www.SendWebRequest();
            
            // 6. Procesar respuesta
            if (www.result == UnityWebRequest.Result.Success)
            {
                // ÉXITO
                LoginResponse response = JsonUtility.FromJson<LoginResponse>(
                    www.downloadHandler.text);
                
                authToken = response.accessToken;
                PlayerPrefs.SetString("AuthToken", authToken);
                PlayerPrefs.SetString("UserId", response.user.id);
                PlayerPrefs.Save();
                
                Debug.Log($"Login exitoso! Token guardado.");
                Debug.Log($"Usuario: {response.user.email}");
            }
            else
            {
                // ERROR
                Debug.LogError($"Error: {www.error}");
                Debug.LogError($"Código: {www.responseCode}");
            }
        }
    }
    
    // Obtener el token guardado
    public string GetToken()
    {
        if (string.IsNullOrEmpty(authToken))
        {
            authToken = PlayerPrefs.GetString("AuthToken", "");
        }
        return authToken;
    }
}

// ============================================
// 4. Ejemplo de Uso desde otro Script
// ============================================
using UnityEngine;

public class LoginExample : MonoBehaviour
{
    public AuthManager authManager;
    
    void Start()
    {
        // Obtener referencia al AuthManager
        if (authManager == null)
        {
            authManager = FindObjectOfType<AuthManager>();
        }
    }
    
    // Llamar este método desde un botón o cuando quieras hacer login
    public void OnLoginButtonClicked()
    {
        string email = "estudiante@example.com";
        string password = "password123";
        
        authManager.Login(email, password);
    }
    
    // Verificar si hay token guardado
    void CheckToken()
    {
        string token = authManager.GetToken();
        if (!string.IsNullOrEmpty(token))
        {
            Debug.Log("Usuario ya está logueado");
        }
        else
        {
            Debug.Log("Usuario no está logueado");
        }
    }
}

// ============================================
// INSTRUCCIONES RÁPIDAS:
// ============================================
// 1. Crea estos 4 scripts en Unity
// 2. Crea un GameObject vacío llamado "AuthManager"
// 3. Agrega el componente AuthManager al GameObject
// 4. Cambia ApiConfig.BaseUrl si tu backend está en otra URL
// 5. Llama authManager.Login(email, password) desde donde necesites
// 6. El token se guardará automáticamente en PlayerPrefs
// ============================================

