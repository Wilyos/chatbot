require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ChatbotResponses = require('./chatbotResponses');
const http = require('http');

// Inicializar el sistema de respuestas
const chatbot = new ChatbotResponses();

// Crear cliente de WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.RAILWAY_VOLUME_MOUNT_PATH ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/.wwebjs_auth` : '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  // Configuración adicional para evitar errores
  qrMaxRetries: 5
});

// Evento: Código QR generado
client.on('qr', (qr) => {
  console.log('\n📱 Escanea este código QR con WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⚠️  IMPORTANTE: Abre WhatsApp en tu teléfono → Configuración → Dispositivos vinculados → Vincular dispositivo\n');
});

// Evento: Cliente listo
client.on('ready', () => {
  console.log('✅ ¡Chatbot de WhatsApp conectado y listo!');
  console.log('📱 Ahora puedes recibir y responder mensajes');
  console.log('⏰ Hora de inicio:', new Date().toLocaleString('es-ES'));
  
  // Limpiar sesiones antiguas cada hora
  setInterval(() => {
    chatbot.cleanOldSessions();
  }, 60 * 60 * 1000);
});

// Evento: Autenticación exitosa
client.on('authenticated', () => {
  console.log('🔐 Autenticación exitosa');
});

// Evento: Error de autenticación
client.on('auth_failure', (message) => {
  console.error('❌ Error de autenticación:', message);
  console.log('💡 Intenta eliminar la carpeta .wwebjs_auth y escanear el QR nuevamente');
});

// Evento: Cliente desconectado
client.on('disconnected', (reason) => {
  console.log('⚠️  Cliente desconectado:', reason);
  console.log('🔄 Intentando reconectar...');
});

// Evento: Mensaje recibido
client.on('message_create', async (message) => {
  try {
    // Solo procesar mensajes que no sean nuestros
    if (message.fromMe) {
      return;
    }

    // Ignorar estados/historias de WhatsApp
    if (message.from === 'status@broadcast' || message.isStatus) {
      return;
    }

    // Obtener información del mensaje
    const userId = message.from;
    const messageBody = message.body;

    // Ignorar si no hay contenido
    if (!messageBody || messageBody.trim() === '') {
      return;
    }

    // Verificar si es un grupo
    const chat = await message.getChat();
    if (chat.isGroup) {
      console.log('⚠️  Mensaje de grupo ignorado');
      return;
    }

    // Obtener información del contacto
    const contact = await message.getContact();
    
    // Log del mensaje recibido
    console.log(`\n📨 Mensaje de ${contact.pushname || contact.number}:`);
    console.log(`   Contenido: "${messageBody}"`);
    console.log(`   ID Usuario: ${userId}`);
    console.log(`   Hora: ${new Date().toLocaleTimeString('es-ES')}`);

    // Procesar el mensaje y obtener respuesta
    const responseData = chatbot.processWithContext(userId, messageBody);
    
    // Extraer mensaje y flag de marcar no leído
    const response = typeof responseData === 'string' ? responseData : responseData.message;
    const shouldMarkUnread = responseData.markUnread || false;

    // Pequeña pausa para simular escritura
    await new Promise(resolve => setTimeout(resolve, 800));

    // Enviar respuesta de manera más segura usando sendMessage directo del chat
    try {
      await chat.sendMessage(response, { sendSeen: false });
      console.log(`✅ Respuesta enviada`);
      
      // Si se debe marcar como no leído, hacerlo después de enviar
      if (shouldMarkUnread) {
        try {
          await chat.markUnread();
          console.log(`📌 Chat marcado como no leído - Requiere atención humana`);
        } catch (markError) {
          console.log(`⚠️  No se pudo marcar como no leído (esto es normal en algunas versiones)`);
        }
      }
      
    } catch (sendError) {
      // Método alternativo si falla
      console.log('⚠️  Intentando método alternativo de envío...');
      const ChatId = await message.getChat();
      await ChatId.sendMessage(response);
      console.log(`✅ Respuesta enviada (método alternativo)`);
      
      // Intentar marcar como no leído con método alternativo
      if (shouldMarkUnread) {
        try {
          await ChatId.markUnread();
          console.log(`📌 Chat marcado como no leído - Requiere atención humana`);
        } catch (markError) {
          console.log(`⚠️  No se pudo marcar como no leído`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error al procesar mensaje:', error.message);
  }
});

// Evento: Mensaje multimedia
client.on('message_create', async (message) => {
  // Solo para mensajes con multimedia que enviamos nosotros
  if (message.fromMe && message.hasMedia) {
    console.log('📎 Mensaje multimedia enviado');
  }
});

// Manejo de errores globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection en:', promise);
  console.error('   Razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // No cerrar el proceso en producción
  // process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  console.log('\n⚠️  Cerrando chatbot...');
  await client.destroy();
  console.log('✅ Chatbot cerrado correctamente');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Señal SIGTERM recibida, cerrando...');
  await client.destroy();
  process.exit(0);
});

// Inicializar el cliente
console.log('🚀 Iniciando chatbot de WhatsApp...');
console.log('⏳ Esperando código QR...\n');

client.initialize();

// Servidor web básico para Railway (Healthcheck)
// Railway requiere que las aplicaciones abran un puerto para saber que están vivas
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('El chatbot de WhatsApp esta funcionando correctamente!');
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor web de healthcheck iniciado en el puerto ${PORT}`);
});

module.exports = client;
