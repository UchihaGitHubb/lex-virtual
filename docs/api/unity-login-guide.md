# Guía Paso a Paso: Login en Unity con el Backend

Esta guía te mostrará cómo implementar el sistema de login en Unity para conectarse con el backend de Lex Virtual.

## 📋 Requisitos Previos

1. **Unity 2020.3 o superior**
2. **Backend corriendo** en `http://localhost:3000` (o tu URL de producción)
3. **Usuario creado** en la base de datos (puedes crearlo desde el frontend o directamente en la BD)

---

## 🚀 Paso 1: Crear el Script de Configuración de API

Crea un nuevo script C# llamado `ApiConfig.cs`:

```csharp
using UnityEngine;

public static class ApiConfig
{
    // Cambia esta URL según tu entorno
    public static string BaseUrl = "http://localhost:3000";
    
    // No incluyas la barra final
    public static string GetFullUrl(string endpoint)
    {
        return $"{BaseUrl}{endpoint}";
    }
}
```

**Ubicación:** Crea este script en una carpeta `Scripts/API/` o similar.

---

## 🚀 Paso 2: Crear las Clases de Datos (DTOs)

Crea un nuevo script llamado `AuthModels.cs`:

```csharp
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

[Serializable]
public class ErrorResponse
{
    public string message;
    public string statusCode;
}
```

**Ubicación:** Crea este script en `Scripts/API/Models/` o similar.

---

## 🚀 Paso 3: Crear el Manager de Autenticación

Crea un nuevo script llamado `AuthManager.cs`:

```csharp
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;

public class AuthManager : MonoBehaviour
{
    // Eventos para notificar el resultado del login
    public static event Action<LoginResponse> OnLoginSuccess;
    public static event Action<string> OnLoginError;
    
    // Token y datos del usuario
    private string authToken;
    private string userId;
    
    // Singleton pattern (opcional)
    public static AuthManager Instance { get; private set; }
    
    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadSavedToken();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    /// <summary>
    /// Realiza el login del usuario
    /// </summary>
    /// <param name="email">Email del usuario</param>
    /// <param name="password">Contraseña del usuario</param>
    public void Login(string email, string password)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            OnLoginError?.Invoke("Email y contraseña son requeridos");
            return;
        }
        
        StartCoroutine(LoginCoroutine(email, password));
    }
    
    /// <summary>
    /// Corrutina que realiza la petición HTTP de login
    /// </summary>
    private IEnumerator LoginCoroutine(string email, string password)
    {
        // Crear el objeto de petición
        LoginRequest request = new LoginRequest
        {
            email = email,
            password = password
        };
        
        // Convertir a JSON
        string jsonData = JsonUtility.ToJson(request);
        Debug.Log($"Enviando login: {jsonData}");
        
        // Crear la petición HTTP
        string url = ApiConfig.GetFullUrl("/auth/login");
        using (UnityWebRequest www = UnityWebRequest.Post(url, jsonData, "application/json"))
        {
            // Configurar el body de la petición
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            
            // Configurar headers
            www.SetRequestHeader("Content-Type", "application/json");
            
            // Enviar la petición y esperar respuesta
            yield return www.SendWebRequest();
            
            // Procesar la respuesta
            if (www.result == UnityWebRequest.Result.Success)
            {
                // Login exitoso
                string responseText = www.downloadHandler.text;
                Debug.Log($"Respuesta del servidor: {responseText}");
                
                try
                {
                    LoginResponse response = JsonUtility.FromJson<LoginResponse>(responseText);
                    
                    // Guardar el token y datos del usuario
                    authToken = response.accessToken;
                    userId = response.user.id;
                    
                    // Guardar en PlayerPrefs para persistencia
                    PlayerPrefs.SetString("AuthToken", authToken);
                    PlayerPrefs.SetString("UserId", userId);
                    PlayerPrefs.SetString("UserEmail", response.user.email);
                    PlayerPrefs.Save();
                    
                    Debug.Log($"Login exitoso! Token: {authToken.Substring(0, 20)}...");
                    Debug.Log($"Usuario ID: {userId}");
                    
                    // Notificar éxito
                    OnLoginSuccess?.Invoke(response);
                }
                catch (Exception e)
                {
                    Debug.LogError($"Error al parsear respuesta: {e.Message}");
                    OnLoginError?.Invoke("Error al procesar la respuesta del servidor");
                }
            }
            else
            {
                // Error en la petición
                string errorMessage = www.error;
                int responseCode = www.responseCode;
                
                Debug.LogError($"Error en login - Código: {responseCode}, Error: {errorMessage}");
                
                // Intentar parsear el error del servidor
                try
                {
                    string responseText = www.downloadHandler.text;
                    ErrorResponse errorResponse = JsonUtility.FromJson<ErrorResponse>(responseText);
                    errorMessage = errorResponse.message ?? errorMessage;
                }
                catch
                {
                    // Si no se puede parsear, usar el mensaje por defecto
                    if (responseCode == 401)
                    {
                        errorMessage = "Credenciales inválidas. Verifica tu email y contraseña";
                    }
                    else if (responseCode == 400)
                    {
                        errorMessage = "Datos inválidos. Verifica que el email tenga formato correcto";
                    }
                    else if (responseCode == 0)
                    {
                        errorMessage = "No se pudo conectar al servidor. Verifica que el backend esté corriendo";
                    }
                }
                
                // Notificar error
                OnLoginError?.Invoke(errorMessage);
            }
        }
    }
    
    /// <summary>
    /// Carga el token guardado desde PlayerPrefs
    /// </summary>
    public void LoadSavedToken()
    {
        authToken = PlayerPrefs.GetString("AuthToken", "");
        userId = PlayerPrefs.GetString("UserId", "");
        
        if (!string.IsNullOrEmpty(authToken))
        {
            Debug.Log("Token cargado desde PlayerPrefs");
        }
    }
    
    /// <summary>
    /// Verifica si hay un token guardado
    /// </summary>
    public bool IsLoggedIn()
    {
        return !string.IsNullOrEmpty(authToken);
    }
    
    /// <summary>
    /// Obtiene el token de autenticación
    /// </summary>
    public string GetToken()
    {
        return authToken;
    }
    
    /// <summary>
    /// Obtiene el ID del usuario
    /// </summary>
    public string GetUserId()
    {
        return userId;
    }
    
    /// <summary>
    /// Cierra sesión y elimina el token
    /// </summary>
    public void Logout()
    {
        authToken = "";
        userId = "";
        PlayerPrefs.DeleteKey("AuthToken");
        PlayerPrefs.DeleteKey("UserId");
        PlayerPrefs.DeleteKey("UserEmail");
        PlayerPrefs.Save();
        Debug.Log("Sesión cerrada");
    }
}
```

**Ubicación:** Crea este script en `Scripts/Managers/` o similar.

**Importante:** 
- Agrega este script a un GameObject vacío en tu escena (por ejemplo, "AuthManager")
- Si usas el patrón Singleton, asegúrate de que solo haya una instancia

---

## 🚀 Paso 4: Crear la UI de Login (Opcional pero Recomendado)

Crea un script para manejar la UI del login llamado `LoginUI.cs`:

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class LoginUI : MonoBehaviour
{
    [Header("UI References")]
    public TMP_InputField emailInput;
    public TMP_InputField passwordInput;
    public Button loginButton;
    public TextMeshProUGUI errorText;
    public GameObject loadingPanel;
    
    private AuthManager authManager;
    
    private void Start()
    {
        // Obtener referencia al AuthManager
        authManager = FindObjectOfType<AuthManager>();
        if (authManager == null)
        {
            Debug.LogError("AuthManager no encontrado en la escena!");
            return;
        }
        
        // Suscribirse a los eventos
        AuthManager.OnLoginSuccess += HandleLoginSuccess;
        AuthManager.OnLoginError += HandleLoginError;
        
        // Configurar el botón
        if (loginButton != null)
        {
            loginButton.onClick.AddListener(OnLoginButtonClicked);
        }
        
        // Ocultar mensaje de error inicialmente
        if (errorText != null)
        {
            errorText.gameObject.SetActive(false);
        }
        
        // Ocultar panel de carga
        if (loadingPanel != null)
        {
            loadingPanel.SetActive(false);
        }
    }
    
    private void OnDestroy()
    {
        // Desuscribirse de los eventos
        AuthManager.OnLoginSuccess -= HandleLoginSuccess;
        AuthManager.OnLoginError -= HandleLoginError;
    }
    
    private void OnLoginButtonClicked()
    {
        if (emailInput == null || passwordInput == null)
        {
            Debug.LogError("Los campos de email o contraseña no están asignados!");
            return;
        }
        
        string email = emailInput.text.Trim();
        string password = passwordInput.text;
        
        // Validación básica
        if (string.IsNullOrEmpty(email))
        {
            ShowError("Por favor ingresa tu email");
            return;
        }
        
        if (string.IsNullOrEmpty(password))
        {
            ShowError("Por favor ingresa tu contraseña");
            return;
        }
        
        // Mostrar loading
        SetLoading(true);
        HideError();
        
        // Realizar login
        authManager.Login(email, password);
    }
    
    private void HandleLoginSuccess(LoginResponse response)
    {
        SetLoading(false);
        Debug.Log($"Login exitoso! Bienvenido {response.user.email}");
        
        // Aquí puedes cambiar de escena o mostrar el menú principal
        // SceneManager.LoadScene("MainMenu");
    }
    
    private void HandleLoginError(string errorMessage)
    {
        SetLoading(false);
        ShowError(errorMessage);
    }
    
    private void ShowError(string message)
    {
        if (errorText != null)
        {
            errorText.text = message;
            errorText.gameObject.SetActive(true);
        }
        Debug.LogError($"Error de login: {message}");
    }
    
    private void HideError()
    {
        if (errorText != null)
        {
            errorText.gameObject.SetActive(false);
        }
    }
    
    private void SetLoading(bool isLoading)
    {
        if (loadingPanel != null)
        {
            loadingPanel.SetActive(isLoading);
        }
        
        if (loginButton != null)
        {
            loginButton.interactable = !isLoading;
        }
    }
}
```

**Configuración en Unity:**
1. Crea un Canvas en tu escena
2. Agrega dos `TMP_InputField` (email y password)
3. Agrega un `Button` para el login
4. Agrega un `TextMeshProUGUI` para mostrar errores
5. Agrega un `GameObject` como panel de carga (opcional)
6. Asigna todas las referencias en el inspector del script `LoginUI`

---

## 🚀 Paso 5: Configurar la Escena

1. **Crear GameObject para AuthManager:**
   - Crea un GameObject vacío llamado "AuthManager"
   - Agrega el componente `AuthManager`
   - Si usas Singleton, este GameObject se mantendrá entre escenas

2. **Configurar la UI:**
   - Crea tu Canvas con los campos de login
   - Agrega el script `LoginUI` a un GameObject en el Canvas
   - Asigna todas las referencias en el Inspector

3. **Configurar ApiConfig:**
   - Asegúrate de que `ApiConfig.BaseUrl` apunte a tu backend
   - Para desarrollo local: `http://localhost:3000`
   - Para producción: `https://tu-dominio.com`

---

## 🚀 Paso 6: Probar el Login

1. **Asegúrate de que el backend esté corriendo:**
   ```bash
   npm run start:dev
   ```

2. **Verifica que tengas un usuario en la base de datos:**
   - Puedes crear uno desde el frontend web
   - O directamente en la base de datos

3. **Ejecuta Unity y prueba:**
   - Ingresa un email y contraseña válidos
   - Haz clic en el botón de login
   - Revisa la consola de Unity para ver los logs
   - Si es exitoso, deberías ver el token guardado

---

## 🔍 Verificación del Token

Para verificar que el token se guardó correctamente, puedes crear un script de prueba:

```csharp
using UnityEngine;

public class TokenChecker : MonoBehaviour
{
    private void Start()
    {
        string token = PlayerPrefs.GetString("AuthToken", "");
        string userId = PlayerPrefs.GetString("UserId", "");
        
        if (!string.IsNullOrEmpty(token))
        {
            Debug.Log($"Token encontrado: {token.Substring(0, Mathf.Min(20, token.Length))}...");
            Debug.Log($"User ID: {userId}");
        }
        else
        {
            Debug.Log("No hay token guardado");
        }
    }
}
```

---

## 📝 Uso del Token en Otras Peticiones

Una vez que tengas el token, puedes usarlo en otras peticiones HTTP. Ejemplo:

```csharp
using UnityEngine.Networking;

public class ApiHelper
{
    public static UnityWebRequest CreateAuthenticatedRequest(string endpoint, string method = "GET")
    {
        string token = PlayerPrefs.GetString("AuthToken", "");
        string url = ApiConfig.GetFullUrl(endpoint);
        
        UnityWebRequest www;
        
        if (method == "GET")
        {
            www = UnityWebRequest.Get(url);
        }
        else if (method == "POST")
        {
            www = UnityWebRequest.Post(url, "");
        }
        else
        {
            www = UnityWebRequest.Put(url, "");
        }
        
        // Agregar el token de autenticación
        www.SetRequestHeader("Authorization", $"Bearer {token}");
        www.SetRequestHeader("Content-Type", "application/json");
        
        return www;
    }
}
```

**Ejemplo de uso:**
```csharp
using (UnityWebRequest www = ApiHelper.CreateAuthenticatedRequest("/tracking/cases", "POST"))
{
    // Configurar body, etc.
    yield return www.SendWebRequest();
    // Procesar respuesta
}
```

---

## ⚠️ Solución de Problemas

### Error: "No se pudo conectar al servidor"
- Verifica que el backend esté corriendo
- Verifica que la URL en `ApiConfig.BaseUrl` sea correcta
- Verifica que no haya firewall bloqueando la conexión

### Error: "Credenciales inválidas"
- Verifica que el email y contraseña sean correctos
- Verifica que el usuario exista en la base de datos
- Verifica que el usuario esté activo (`isActive = true`)

### Error: "Error al parsear respuesta"
- Verifica que la respuesta del servidor sea JSON válido
- Revisa los logs del backend para ver qué está devolviendo
- Asegúrate de que las clases `LoginResponse` y `UserData` coincidan con la respuesta del servidor

### El token no se guarda
- Verifica que `PlayerPrefs.Save()` se esté llamando
- Verifica los permisos de escritura en la carpeta de Unity
- En algunas plataformas (como WebGL), PlayerPrefs puede tener limitaciones

---

## 📚 Próximos Pasos

Una vez que el login funcione:

1. **Implementar verificación de token:** Usa el endpoint `/auth/whoami` para verificar si el token sigue siendo válido al iniciar la aplicación

2. **Implementar registro:** Si los estudiantes se registran desde Unity, implementa el endpoint `/auth/register`

3. **Implementar refresh token:** Si implementas refresh tokens, agrega la lógica para renovar el token automáticamente

4. **Implementar logout:** Ya está incluido en el `AuthManager`, solo necesitas llamarlo desde tu UI

---

## ✅ Checklist de Implementación

- [ ] Script `ApiConfig.cs` creado y configurado
- [ ] Script `AuthModels.cs` con todas las clases de datos
- [ ] Script `AuthManager.cs` implementado
- [ ] GameObject `AuthManager` en la escena
- [ ] UI de login creada (opcional)
- [ ] Script `LoginUI.cs` implementado (opcional)
- [ ] Backend corriendo y accesible
- [ ] Usuario de prueba creado en la base de datos
- [ ] Login probado y funcionando
- [ ] Token guardado correctamente en PlayerPrefs

---

¡Listo! Ya tienes el sistema de login funcionando en Unity. 🎉

