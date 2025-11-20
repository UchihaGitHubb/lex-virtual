# Guía Paso a Paso: Registro en Unity con el Backend

Esta guía te mostrará cómo implementar el sistema de registro en Unity para conectarse con el backend de Lex Virtual.

## 📋 Requisitos Previos

1. **Unity 2020.3 o superior**
2. **Backend corriendo** en `http://localhost:3000` (o tu URL de producción)
3. **Guía de Login completada** (recomendado, ya que comparten código base)

---

## 🚀 Paso 1: Actualizar las Clases de Datos

Si ya tienes `AuthModels.cs` del login, solo necesitas agregar estas clases. Si no, crea el archivo completo:

```csharp
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

[Serializable]
public class RegisterResponse
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

**Nota:** Si ya tienes `UserData` y `ErrorResponse` del login, no necesitas duplicarlos.

---

## 🚀 Paso 2: Agregar Método de Registro al AuthManager

Actualiza tu `AuthManager.cs` para incluir el método de registro:

```csharp
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using System.Text;

public class AuthManager : MonoBehaviour
{
    // Eventos para notificar el resultado del registro
    public static event Action<RegisterResponse> OnRegisterSuccess;
    public static event Action<string> OnRegisterError;
    
    // Eventos de login (si no los tienes ya)
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
    /// Registra un nuevo usuario
    /// </summary>
    /// <param name="email">Email del usuario</param>
    /// <param name="password">Contraseña del usuario</param>
    /// <param name="role">Rol del usuario ("student" o "teacher")</param>
    /// <param name="firstName">Nombre del usuario (opcional)</param>
    /// <param name="lastName">Apellido del usuario (opcional)</param>
    public void Register(string email, string password, string role = "student", string firstName = null, string lastName = null)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            OnRegisterError?.Invoke("Email y contraseña son requeridos");
            return;
        }
        
        if (string.IsNullOrEmpty(role))
        {
            role = "student"; // Por defecto es estudiante
        }
        
        // Validar que el rol sea válido
        if (role != "student" && role != "teacher")
        {
            OnRegisterError?.Invoke("El rol debe ser 'student' o 'teacher'");
            return;
        }
        
        StartCoroutine(RegisterCoroutine(email, password, role, firstName, lastName));
    }
    
    /// <summary>
    /// Corrutina que realiza la petición HTTP de registro
    /// </summary>
    private IEnumerator RegisterCoroutine(string email, string password, string role, string firstName, string lastName)
    {
        // Crear el objeto de petición
        RegisterRequest request = new RegisterRequest
        {
            email = email,
            password = password,
            role = role,
            firstName = firstName,
            lastName = lastName
        };
        
        // Convertir a JSON
        string jsonData = JsonUtility.ToJson(request);
        Debug.Log($"Enviando registro: {jsonData.Replace(password, "***")}"); // No loguear la contraseña
        
        // Crear la petición HTTP
        string url = ApiConfig.GetFullUrl("/auth/register");
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
                // Registro exitoso
                string responseText = www.downloadHandler.text;
                Debug.Log($"Respuesta del servidor: {responseText}");
                
                try
                {
                    RegisterResponse response = JsonUtility.FromJson<RegisterResponse>(responseText);
                    
                    // Guardar el token y datos del usuario
                    authToken = response.accessToken;
                    userId = response.user.id;
                    
                    // Guardar en PlayerPrefs para persistencia
                    PlayerPrefs.SetString("AuthToken", authToken);
                    PlayerPrefs.SetString("UserId", userId);
                    PlayerPrefs.SetString("UserEmail", response.user.email);
                    PlayerPrefs.SetString("UserRole", response.user.role);
                    PlayerPrefs.Save();
                    
                    Debug.Log($"Registro exitoso! Token guardado.");
                    Debug.Log($"Usuario ID: {userId}");
                    Debug.Log($"Email: {response.user.email}");
                    Debug.Log($"Rol: {response.user.role}");
                    
                    // Notificar éxito
                    OnRegisterSuccess?.Invoke(response);
                }
                catch (Exception e)
                {
                    Debug.LogError($"Error al parsear respuesta: {e.Message}");
                    OnRegisterError?.Invoke("Error al procesar la respuesta del servidor");
                }
            }
            else
            {
                // Error en la petición
                string errorMessage = www.error;
                int responseCode = www.responseCode;
                
                Debug.LogError($"Error en registro - Código: {responseCode}, Error: {errorMessage}");
                
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
                    if (responseCode == 409)
                    {
                        errorMessage = "Ya existe un usuario con este email";
                    }
                    else if (responseCode == 400)
                    {
                        errorMessage = "Datos inválidos. Verifica que el email tenga formato correcto y el rol sea válido";
                    }
                    else if (responseCode == 0)
                    {
                        errorMessage = "No se pudo conectar al servidor. Verifica que el backend esté corriendo";
                    }
                }
                
                // Notificar error
                OnRegisterError?.Invoke(errorMessage);
            }
        }
    }
    
    // ... (mantén los métodos de login y otros métodos existentes)
    
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
        PlayerPrefs.DeleteKey("UserRole");
        PlayerPrefs.Save();
        Debug.Log("Sesión cerrada");
    }
}
```

---

## 🚀 Paso 3: Crear la UI de Registro

Crea un script para manejar la UI del registro llamado `RegisterUI.cs`:

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class RegisterUI : MonoBehaviour
{
    [Header("UI References")]
    public TMP_InputField emailInput;
    public TMP_InputField firstNameInput; // Campo para el nombre
    public TMP_InputField lastNameInput; // Campo para el apellido
    public TMP_InputField passwordInput;
    public TMP_InputField confirmPasswordInput;
    public TMP_Dropdown roleDropdown; // Opcional: para seleccionar rol
    public Button registerButton;
    public TextMeshProUGUI errorText;
    public TextMeshProUGUI successText;
    public GameObject loadingPanel;
    
    [Header("Navigation")]
    public GameObject loginPanel; // Panel de login (opcional)
    public GameObject registerPanel; // Este panel
    
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
        AuthManager.OnRegisterSuccess += HandleRegisterSuccess;
        AuthManager.OnRegisterError += HandleRegisterError;
        
        // Configurar el botón
        if (registerButton != null)
        {
            registerButton.onClick.AddListener(OnRegisterButtonClicked);
        }
        
        // Configurar el dropdown de roles (opcional)
        if (roleDropdown != null)
        {
            roleDropdown.ClearOptions();
            roleDropdown.AddOptions(new System.Collections.Generic.List<string> { "Estudiante", "Profesor" });
            roleDropdown.value = 0; // Por defecto estudiante
        }
        
        // Ocultar mensajes inicialmente
        if (errorText != null)
        {
            errorText.gameObject.SetActive(false);
        }
        
        if (successText != null)
        {
            successText.gameObject.SetActive(false);
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
        AuthManager.OnRegisterSuccess -= HandleRegisterSuccess;
        AuthManager.OnRegisterError -= HandleRegisterError;
    }
    
    private void OnRegisterButtonClicked()
    {
        if (emailInput == null || passwordInput == null)
        {
            Debug.LogError("Los campos de email o contraseña no están asignados!");
            return;
        }
        
        string email = emailInput.text.Trim();
        string firstName = firstNameInput != null ? firstNameInput.text.Trim() : "";
        string lastName = lastNameInput != null ? lastNameInput.text.Trim() : "";
        string password = passwordInput.text;
        string confirmPassword = confirmPasswordInput != null ? confirmPasswordInput.text : "";
        
        // Validaciones
        if (string.IsNullOrEmpty(email))
        {
            ShowError("Por favor ingresa tu email");
            return;
        }
        
        if (!IsValidEmail(email))
        {
            ShowError("Por favor ingresa un email válido");
            return;
        }
        
        // Validar nombre y apellido (recomendado para estudiantes)
        if (string.IsNullOrEmpty(firstName))
        {
            ShowError("Por favor ingresa tu nombre");
            return;
        }
        
        if (string.IsNullOrEmpty(lastName))
        {
            ShowError("Por favor ingresa tu apellido");
            return;
        }
        
        if (string.IsNullOrEmpty(password))
        {
            ShowError("Por favor ingresa una contraseña");
            return;
        }
        
        if (password.Length < 6)
        {
            ShowError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        
        // Validar confirmación de contraseña (si existe el campo)
        if (confirmPasswordInput != null && !string.IsNullOrEmpty(confirmPassword))
        {
            if (password != confirmPassword)
            {
                ShowError("Las contraseñas no coinciden");
                return;
            }
        }
        
        // Obtener el rol seleccionado
        string role = "student"; // Por defecto
        if (roleDropdown != null)
        {
            role = roleDropdown.value == 0 ? "student" : "teacher";
        }
        
        // Mostrar loading
        SetLoading(true);
        HideError();
        HideSuccess();
        
        // Realizar registro
        authManager.Register(email, password, role, firstName, lastName);
    }
    
    private void HandleRegisterSuccess(RegisterResponse response)
    {
        SetLoading(false);
        ShowSuccess($"¡Registro exitoso! Bienvenido {response.user.email}");
        Debug.Log($"Registro exitoso! Usuario: {response.user.email}, Rol: {response.user.role}");
        
        // Opcional: Cambiar a panel de login o menú principal después de unos segundos
        // StartCoroutine(WaitAndNavigate());
    }
    
    private void HandleRegisterError(string errorMessage)
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
        Debug.LogError($"Error de registro: {message}");
    }
    
    private void HideError()
    {
        if (errorText != null)
        {
            errorText.gameObject.SetActive(false);
        }
    }
    
    private void ShowSuccess(string message)
    {
        if (successText != null)
        {
            successText.text = message;
            successText.gameObject.SetActive(true);
        }
        Debug.Log($"Éxito: {message}");
    }
    
    private void HideSuccess()
    {
        if (successText != null)
        {
            successText.gameObject.SetActive(false);
        }
    }
    
    private void SetLoading(bool isLoading)
    {
        if (loadingPanel != null)
        {
            loadingPanel.SetActive(isLoading);
        }
        
        if (registerButton != null)
        {
            registerButton.interactable = !isLoading;
        }
    }
    
    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
    
    // Método para cambiar al panel de login (opcional)
    public void ShowLoginPanel()
    {
        if (registerPanel != null)
        {
            registerPanel.SetActive(false);
        }
        
        if (loginPanel != null)
        {
            loginPanel.SetActive(true);
        }
    }
    
    // Corrutina para navegar después del registro (opcional)
    private System.Collections.IEnumerator WaitAndNavigate()
    {
        yield return new WaitForSeconds(2f);
        // Aquí puedes cambiar de escena o mostrar el menú principal
        // SceneManager.LoadScene("MainMenu");
    }
}
```

**Configuración en Unity:**
1. Crea un Canvas en tu escena (o usa el existente)
2. Agrega cinco `TMP_InputField` (email, firstName, lastName, password, confirmPassword)
3. Agrega un `TMP_Dropdown` para seleccionar el rol (opcional)
4. Agrega un `Button` para el registro
5. Agrega dos `TextMeshProUGUI` para mostrar errores y mensajes de éxito
6. Agrega un `GameObject` como panel de carga (opcional)
7. Asigna todas las referencias en el inspector del script `RegisterUI`

**Nota:** Los campos `firstName` y `lastName` son opcionales en el backend, pero se recomienda requerirlos para estudiantes ya que el profesor los verá en la lista de estudiantes.

---

## 🚀 Paso 4: Validaciones Adicionales (Opcional pero Recomendado)

Puedes agregar validaciones más robustas en el `RegisterUI`:

```csharp
// Validación de email más robusta
private bool IsValidEmail(string email)
{
    if (string.IsNullOrEmpty(email))
        return false;
    
    try
    {
        var addr = new System.Net.Mail.MailAddress(email);
        return addr.Address == email;
    }
    catch
    {
        return false;
    }
}

// Validación de contraseña
private bool IsValidPassword(string password)
{
    if (string.IsNullOrEmpty(password))
        return false;
    
    // Mínimo 6 caracteres
    if (password.Length < 6)
        return false;
    
    // Puedes agregar más validaciones aquí:
    // - Al menos una mayúscula
    // - Al menos un número
    // - Al menos un carácter especial
    // etc.
    
    return true;
}

// Mostrar fortaleza de la contraseña (opcional)
public void OnPasswordChanged(string password)
{
    if (string.IsNullOrEmpty(password))
        return;
    
    int strength = CalculatePasswordStrength(password);
    // Actualizar UI con la fortaleza
}
```

---

## 🚀 Paso 5: Integrar con el Sistema de Login

Si quieres que después del registro el usuario quede automáticamente logueado (que ya lo hace), puedes agregar una transición suave:

```csharp
// En RegisterUI.cs, después del registro exitoso
private void HandleRegisterSuccess(RegisterResponse response)
{
    SetLoading(false);
    ShowSuccess($"¡Registro exitoso! Bienvenido {response.user.email}");
    
    // El usuario ya está logueado (el token se guardó automáticamente)
    // Puedes cambiar de escena o mostrar el menú principal
    StartCoroutine(WaitAndNavigateToMainMenu());
}

private System.Collections.IEnumerator WaitAndNavigateToMainMenu()
{
    yield return new WaitForSeconds(2f);
    
    // Cambiar a la escena del menú principal
    // SceneManager.LoadScene("MainMenu");
    
    // O mostrar el panel del menú principal
    // mainMenuPanel.SetActive(true);
    // registerPanel.SetActive(false);
}
```

---

## 🚀 Paso 6: Probar el Registro

1. **Asegúrate de que el backend esté corriendo:**
   ```bash
   npm run start:dev
   ```

2. **Ejecuta Unity y prueba:**
   - Ingresa un email válido
   - Ingresa una contraseña (mínimo 6 caracteres)
   - Confirma la contraseña (si tienes el campo)
   - Selecciona el rol (estudiante o profesor)
   - Haz clic en el botón de registro
   - Revisa la consola de Unity para ver los logs
   - Si es exitoso, deberías ver el token guardado

3. **Verifica en la base de datos:**
   - El usuario debería aparecer en la tabla `users`
   - El `password_hash` debería estar encriptado
   - El `role` debería coincidir con el seleccionado

---

## 📝 Ejemplo de Uso Programático

Si quieres hacer el registro desde código sin UI:

```csharp
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
        
        authManager.Register(email, password, role);
    }
    
    // Suscribirse a los eventos para saber el resultado
    void OnEnable()
    {
        AuthManager.OnRegisterSuccess += HandleRegisterSuccess;
        AuthManager.OnRegisterError += HandleRegisterError;
    }
    
    void OnDisable()
    {
        AuthManager.OnRegisterSuccess -= HandleRegisterSuccess;
        AuthManager.OnRegisterError -= HandleRegisterError;
    }
    
    void HandleRegisterSuccess(RegisterResponse response)
    {
        Debug.Log($"Registro exitoso! Usuario: {response.user.email}");
        // Hacer algo después del registro exitoso
    }
    
    void HandleRegisterError(string error)
    {
        Debug.LogError($"Error en registro: {error}");
        // Mostrar error al usuario
    }
}
```

---

## ⚠️ Solución de Problemas

### Error: "Ya existe un usuario con este email"
- El email ya está registrado en la base de datos
- Usa otro email o intenta hacer login en su lugar

### Error: "Datos inválidos"
- Verifica que el email tenga formato válido (ejemplo@dominio.com)
- Verifica que el rol sea "student" o "teacher" (en minúsculas)
- Verifica que la contraseña no esté vacía

### Error: "No se pudo conectar al servidor"
- Verifica que el backend esté corriendo
- Verifica que la URL en `ApiConfig.BaseUrl` sea correcta
- Verifica que no haya firewall bloqueando la conexión

### El token no se guarda después del registro
- Verifica que `PlayerPrefs.Save()` se esté llamando
- Verifica los logs de Unity para ver si hay errores
- El registro exitoso debería guardar el token automáticamente

### El usuario se registra pero no puede hacer login después
- Verifica que el usuario esté activo en la base de datos (`is_active = true`)
- Verifica que la contraseña se haya guardado correctamente
- Intenta hacer login con las mismas credenciales

---

## 🔐 Consideraciones de Seguridad

1. **Validación de Contraseña:**
   - Implementa validaciones en el cliente (mínimo 6 caracteres)
   - El backend también valida, pero es mejor UX validar antes de enviar

2. **Confirmación de Contraseña:**
   - Siempre pide confirmar la contraseña en el registro
   - Valida que ambas contraseñas coincidan antes de enviar

3. **Validación de Email:**
   - Valida el formato del email en el cliente
   - El backend también valida, pero es mejor UX validar antes

4. **Mensajes de Error:**
   - No muestres información sensible en los mensajes de error
   - Usa mensajes genéricos para errores de seguridad

5. **Encriptación:**
   - Las contraseñas se encriptan en el backend (bcrypt)
   - Nunca envíes contraseñas en texto plano en logs

---

## 📚 Próximos Pasos

Una vez que el registro funcione:

1. **Implementar verificación de email:** Si planeas verificar emails, agrega la lógica después del registro

2. **Mejorar la UX:** 
   - Agrega indicadores de fortaleza de contraseña
   - Agrega animaciones de transición
   - Agrega feedback visual mientras se procesa

3. **Integrar con el flujo completo:**
   - Después del registro, redirigir al menú principal
   - O permitir que el usuario complete su perfil

4. **Agregar opciones adicionales:**
   - Registro con Google/Facebook (si lo implementas)
   - Recuperación de contraseña
   - Cambio de contraseña

---

## ✅ Checklist de Implementación

- [ ] Clase `RegisterRequest` agregada a `AuthModels.cs`
- [ ] Clase `RegisterResponse` agregada (o reutilizar `LoginResponse`)
- [ ] Método `Register()` agregado a `AuthManager`
- [ ] Método `RegisterCoroutine()` implementado
- [ ] Eventos `OnRegisterSuccess` y `OnRegisterError` configurados
- [ ] UI de registro creada (opcional pero recomendado)
- [ ] Script `RegisterUI.cs` implementado
- [ ] Validaciones de email y contraseña implementadas
- [ ] Campo de confirmación de contraseña agregado
- [ ] Dropdown de selección de rol agregado (opcional)
- [ ] Backend corriendo y accesible
- [ ] Registro probado y funcionando
- [ ] Token guardado correctamente después del registro
- [ ] Usuario creado correctamente en la base de datos

---

¡Listo! Ya tienes el sistema de registro funcionando en Unity. 🎉

