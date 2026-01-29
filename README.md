# WhatsApp Chatbot 100% GRATUITO

Chatbot funcional para WhatsApp sin necesidad de APIs de pago. Usa **whatsapp-web.js** que se conecta directamente a WhatsApp Web.

## ✨ Características

- ✅ **100% GRATIS** - No necesitas Twilio, ni Meta API, ni ninguna plataforma de pago
- ✅ Conexión directa mediante código QR
- ✅ Menú interactivo con opciones
- ✅ Respuestas automáticas personalizables
- ✅ Sistema de contexto para conversaciones
- ✅ Manejo de sesiones de usuario
- ✅ Funciona con tu número de WhatsApp personal o empresarial

## 🚀 Configuración Rápida (5 minutos)

### 1. Prerrequisitos

- Node.js (v14 o superior)
- Tu número de WhatsApp
- ¡Y nada más! No necesitas cuentas de API ni tarjetas de crédito

### 2. Instalación

```bash
# Instalar dependencias
npm install
```

### 3. Ejecutar el Bot

```bash
# Iniciar el bot
npm start
```

### 4. Escanear el Código QR

1. Se generará un código QR en la terminal
2. Abre WhatsApp en tu teléfono
3. Ve a **Configuración** → **Dispositivos vinculados** → **Vincular dispositivo**
4. Escanea el código QR que aparece en la terminal
5. ¡Listo! El bot está conectado

**¡ESO ES TODO!** No necesitas configurar webhooks, APIs, ni nada más.

## 📱 Uso del Chatbot

1. Una vez conectado, envía un mensaje al número que vinculaste
2. Escribe **hola**, **menu** o **inicio** para ver el menú
3. Selecciona opciones usando los números (1-5)
4. El bot responderá automáticamente

### Comandos Disponibles

- **hola** / **menu** / **inicio** - Muestra el menú principal
- **1** - Información general
- **2** - Horarios de atención
- **3** - Ubicación
- **4** - Servicios
- **5** - Contactar con un humano

## 🛠️ Personalización

### Modificar Respuestas

Edita el archivo `chatbotResponses.js` para personalizar:
- Mensajes del menú
- Información de la empresa
- Horarios
- Servicios
- Ubicación

### Agregar Nuevas Funciones

En `chatbotResponses.js`, añade nuevos casos en el `switch` para manejar más opciones:

```javascript
case '6':
  return this.getNewFeature();
```

## 📂 Estructura del Proyecto

```
chatbot/
├── index.js                  # Cliente principal de WhatsApp
├── chatbotResponses.js       # Lógica de respuestas del bot
├── package.json              # Dependencias del proyecto
├── .env.example              # Ejemplo de variables de entorno (opcional)
├── .gitignore               # Archivos ignorados por git
├── .wwebjs_auth/            # Datos de sesión (generado automáticamente)
└── README.md                # Esta documentación
```

## 🔧 Cómo Funciona

1. **whatsapp-web.js** utiliza Puppeteer para automatizar WhatsApp Web
2. Se genera un código QR que vinculas con tu WhatsApp
3. El bot recibe todos los mensajes que lleguen a ese número
4. Procesa los mensajes y responde automáticamente
5. La sesión se guarda en `.wwebjs_auth/` para no escanear QR cada vez
mantener el bot corriendo 24/7:

### Opción 1: VPS (Recomendado)
- **DigitalOcean Droplet**: $5/mes
- **AWS EC2**: Free tier disponible
- **Google Cloud**: $10 crédito gratis

```bash
# Usar PM2 para mantener el bot corriendo
npm install -g pm2
pm2 start index.js --name whatsapp-bot
pm2 save
pm2 startup
```

### Opción 2: Computadora Local 24/7
- Mantén tu computadora encendida
- Usa PM2 para auto-reinicio si hay errores

### Opción 3: Railway / Render
- **Railway**: Tiene capa gratuita
- **Render**: Servicio gratuito con limitaciones
- Nota: Necesitas configurar persistencia de sesión para evitar escanear QR constantemente push heroku main
heroku config:set TWILIO_ACCOUNT_SID=tu_sid
heroku config:set TWILIO_AUTH_TOKEN=tu_token
```

## 📊 Monitoreo y Logs

```bash
# Ver logs en tiempo real
npm start
 y Limitaciones

### Seguridad
- ✅ Nunca subas la carpeta `.wwebjs_auth/` a git (contiene tu sesión)
- ✅ No compartas tu sesión con nadie
- ✅ Usa un número secundario si es posible

### Limitaciones
- ⚠️ WhatsApp puede banear cuentas por uso excesivo de bots
- ⚠️ No uses tu número personal principal
- ⚠️ Respeta los límites de mensajes de WhatsApp
- ⚠️ No envíes spam ni mensajes masivos
- ℹ️ Este método es para uso personal/pequeñas empresas, no para envíos masivos

- ✅ Nunca subas el archivo `.env` a git
- ✅ Usa variables de entorno para credenciales
- ✅ Considera agregar autenticación de webhook de Twilio
- ✅ Implementa rate limiting para producción
bot esté corriendo (`npm start`)
2. Revisa que la sesión esté conectada (debe decir "Cliente listo")
3. Revisa los logs en la consola

### Error al escanear QR

- Asegúrate de estar usando la última versión de WhatsApp
- Intenta eliminar la carpeta `.wwebjs_auth/` y volver a escanear
- Verifica que tienes Node.js v14 o superior

### El bot se desconecta

- WhatsApp puede desconectar si detecta actividad inusual
- Evita enviar muchos mensajes en poco tiempo
- Usa un número secundario para el bot si es posible
whatsapp-web.js](https://wwebjs.dev/)
- [GitHub de whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Guía de uso avanzado](https://wwebjs.dev/guide/)

## 💡 Ideas para Mejorar

- Integrar con bases de datos (MySQL, MongoDB)
- Agregar respuestas con IA (OpenAI, Gemini)
- Enviar imágenes y archivos
- Integrar con CRM o sistemas externos
- Agregar comandos administrativos
- Implementar horarios de atención
- Sistema de tickets de soporte
```bash
# Eliminar sesión y reconectar
rm -rf .wwebjs_auth
npm start
```iables

### Mensajes no llegan

- Confirma que enviaste el código de join al sandbox
- Verifica que el webhook esté configurado como POST

## 📚 Recursos Adicionales

- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [API Reference de Twilio](https://www.twilio.com/docs/libraries/node)
- [Express.js Documentation](https://expressjs.com/)

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.
