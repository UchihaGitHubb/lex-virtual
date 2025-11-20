// ============================================
// EJEMPLO SIMPLE DE REGISTRO EN UNITY
// ============================================
// Copia estos scripts a tu proyecto Unity
// ============================================

// ============================================
// 1. Agregar a AuthModels.cs
// ============================================
using System;
using UnityEngine;

[Serializable]
public class RegisterRequest
{
    public string email;
    public string password;
    public string role; // "student" o "teacher"
    public string firstName; // Opcional: nombre del estudiante
    public string lastName; // Opcional: apellido del estudiante
}

// RegisterResponse es igual que LoginResponse, puedes reutilizarla
// O crear una nueva:
[Serializable]
public class RegisterResponse
{
    public string message;
    public string accessToken;
    public UserData user;
}

// ============================================
// 2. Agregar a AuthManager.cs
// ============================================
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;

public class AuthManager : MonoBehaviour
{
    private string authToken;
    
    // Método principal para hacer registro
    public void Register(string email, string password, string role = "student", string firstName = null, string lastName = null)
    {
        StartCoroutine(RegisterCoroutine(email, password, role, firstName, lastName));
    }
    
    private IEnumerator RegisterCoroutine(string email, string password, string role, string firstName, string lastName)
    {
        // 1. Crear el objeto de petición
        RegisterRequest request = new RegisterRequest
        {
            email = email,
            password = password,
            role = role,
            firstName = firstName,
            lastName = lastName
        };
        
        // 2. Convertir a JSON
        string jsonData = JsonUtility.ToJson(request);
        
        // 3. Crear la petición HTTP
        string url = $"{ApiConfig.BaseUrl}/auth/register";
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
                RegisterResponse response = JsonUtility.FromJson<RegisterResponse>(
                    www.downloadHandler.text);
                
                authToken = response.accessToken;
                PlayerPrefs.SetString("AuthToken", authToken);
                PlayerPrefs.SetString("UserId", response.user.id);
                PlayerPrefs.SetString("UserEmail", response.user.email);
                PlayerPrefs.SetString("UserRole", response.user.role);
                PlayerPrefs.Save();
                
                Debug.Log($"Registro exitoso! Token guardado.");
                Debug.Log($"Usuario: {response.user.email}, Rol: {response.user.role}");
            }
            else
            {
                // ERROR
                Debug.LogError($"Error: {www.error}");
                Debug.LogError($"Código: {www.responseCode}");
                
                // Intentar obtener mensaje de error del servidor
                try
                {
                    string responseText = www.downloadHandler.text;
                    ErrorResponse errorResponse = JsonUtility.FromJson<ErrorResponse>(responseText);
                    Debug.LogError($"Mensaje: {errorResponse.message}");
                }
                catch
                {
                    // Si no se puede parsear, usar mensaje genérico
                    if (www.responseCode == 409)
                    {
                        Debug.LogError("Ya existe un usuario con este email");
                    }
                }
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
// 3. Ejemplo de Uso desde otro Script
// ============================================
using UnityEngine;

public class RegisterExample : MonoBehaviour
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
    
    // Llamar este método desde un botón o cuando quieras hacer registro
    public void OnRegisterButtonClicked()
    {
        string email = "nuevo.estudiante@example.com";
        string password = "password123";
        string role = "student"; // o "teacher"
        string firstName = "Juan"; // Nombre del estudiante
        string lastName = "Pérez"; // Apellido del estudiante
        
        authManager.Register(email, password, role, firstName, lastName);
    }
    
    // Ejemplo con validaciones básicas
    public void RegisterWithValidation(string email, string password, string confirmPassword, string role, string firstName = null, string lastName = null)
    {
        // Validar email
        if (string.IsNullOrEmpty(email) || !email.Contains("@"))
        {
            Debug.LogError("Email inválido");
            return;
        }
        
        // Validar contraseña
        if (string.IsNullOrEmpty(password) || password.Length < 6)
        {
            Debug.LogError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        
        // Validar confirmación
        if (password != confirmPassword)
        {
            Debug.LogError("Las contraseñas no coinciden");
            return;
        }
        
        // Validar rol
        if (role != "student" && role != "teacher")
        {
            Debug.LogError("El rol debe ser 'student' o 'teacher'");
            return;
        }
        
        // Hacer el registro
        authManager.Register(email, password, role, firstName, lastName);
    }
}

// ============================================
// 4. Ejemplo de UI Simple
// ============================================
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SimpleRegisterUI : MonoBehaviour
{
    public TMP_InputField emailInput;
    public TMP_InputField passwordInput;
    public TMP_InputField confirmPasswordInput;
    public Button registerButton;
    public TextMeshProUGUI messageText;
    
    private AuthManager authManager;
    
    void Start()
    {
        authManager = FindObjectOfType<AuthManager>();
        
        if (registerButton != null)
        {
            registerButton.onClick.AddListener(OnRegisterClick);
        }
    }
    
    void OnRegisterClick()
    {
        string email = emailInput.text;
        string password = passwordInput.text;
        string confirmPassword = confirmPasswordInput.text;
        
        // Validaciones básicas
        if (string.IsNullOrEmpty(email))
        {
            ShowMessage("Ingresa un email", true);
            return;
        }
        
        if (string.IsNullOrEmpty(password))
        {
            ShowMessage("Ingresa una contraseña", true);
            return;
        }
        
        if (password != confirmPassword)
        {
            ShowMessage("Las contraseñas no coinciden", true);
            return;
        }
        
        // Registrar (por defecto como estudiante)
        authManager.Register(email, password, "student");
        ShowMessage("Registrando...", false);
    }
    
    void ShowMessage(string message, bool isError)
    {
        if (messageText != null)
        {
            messageText.text = message;
            messageText.color = isError ? Color.red : Color.green;
        }
    }
}

// ============================================
// INSTRUCCIONES RÁPIDAS:
// ============================================
// 1. Agrega RegisterRequest a AuthModels.cs
// 2. Agrega el método Register() a AuthManager.cs
// 3. Crea tu UI con campos de email, password, confirmPassword
// 4. Llama authManager.Register(email, password, "student")
// 5. El token se guardará automáticamente en PlayerPrefs
// 6. El usuario quedará logueado automáticamente después del registro
// ============================================

