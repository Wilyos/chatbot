require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ChatbotResponses = require('./chatbotResponses');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Inicializar el sistema de respuestas
const chatbot = new ChatbotResponses();

// Archivo para guardar números que ya recibieron el portafolio
const SENT_NUMBERS_FILE = path.join(__dirname, 'sent_numbers.json');

// Cargar números del archivo
function loadSentNumbers() {
  try {
    if (fs.existsSync(SENT_NUMBERS_FILE)) {
      const data = fs.readFileSync(SENT_NUMBERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Error al cargar sent_numbers.json:', error.message);
  }
  return [];
}

// Guardar número en el archivo
function saveSentNumber(number) {
  try {
    const numbers = loadSentNumbers();
    if (!numbers.includes(number)) {
      numbers.push(number);
      fs.writeFileSync(SENT_NUMBERS_FILE, JSON.stringify(numbers, null, 2), 'utf8');
      console.log(`💾 Número registrado en sent_numbers.json: ${number}`);
    }
  } catch (error) {
    console.error('❌ Error al guardar en sent_numbers.json:', error.message);
  }
}

// Guardar múltiples números en lote para mayor eficiencia al iniciar
function saveSentNumbersBatch(newNumbers) {
  try {
    const numbers = loadSentNumbers();
    let modified = false;
    for (const num of newNumbers) {
      if (!numbers.includes(num)) {
        numbers.push(num);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(SENT_NUMBERS_FILE, JSON.stringify(numbers, null, 2), 'utf8');
      console.log(`💾 Registrados en lote ${newNumbers.length} números de chats existentes en sent_numbers.json.`);
    }
  } catch (error) {
    console.error('❌ Error al guardar lote en sent_numbers.json:', error.message);
  }
}


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

// Variable para guardar el último QR y mostrarlo en la web
let latestQR = '';

// Evento: Código QR generado
client.on('qr', (qr) => {
  console.log('\n📱 Escanea este código QR con WhatsApp (o abre la URL web de Railway):\n');
  qrcode.generate(qr, { small: true });
  latestQR = qr;
  console.log('\n⚠️  IMPORTANTE: Abre WhatsApp en tu teléfono → Configuración → Dispositivos vinculados → Vincular dispositivo\n');
});

// Evento: Cliente listo
client.on('ready', async () => {
  latestQR = ''; // Limpiamos el QR porque ya se conectó
  console.log('✅ ¡Chatbot de WhatsApp conectado y listo!');
  console.log('📱 Ahora puedes recibir y responder mensajes');
  console.log('⏰ Hora de inicio:', new Date().toLocaleString('es-ES'));
  
  // Limpiar sesiones antiguas cada hora
  setInterval(() => {
    chatbot.cleanOldSessions();
  }, 60 * 60 * 1000);

  // Obtener e importar todos los chats abiertos existentes
  console.log('⏳ Cargando chats existentes para registrarlos...');
  try {
    const chats = await client.getChats();
    const existingNumbers = [];
    for (const chat of chats) {
      if (!chat.isGroup) {
        existingNumbers.push(chat.id._serialized);
      }
    }
    if (existingNumbers.length > 0) {
      saveSentNumbersBatch(existingNumbers);
    }
    console.log(`✅ Registro inicial completado. Se procesaron ${existingNumbers.length} chats individuales existentes.`);
  } catch (chatError) {
    console.error('❌ Error al cargar chats existentes:', chatError.message);
  }
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

    // Verificar si el número ya recibió la información
    const sentNumbers = loadSentNumbers();
    if (sentNumbers.includes(userId)) {
      // Ya se le envió el mensaje de bienvenida, ignorar por completo
      return;
    }
    
    // Log del mensaje recibido (primer contacto)
    console.log(`\n📨 ¡Nuevo chat detectado! Mensaje de ${contact.pushname || contact.number}:`);
    console.log(`   Contenido: "${messageBody}"`);
    console.log(`   ID Usuario: ${userId}`);
    console.log(`   Hora: ${new Date().toLocaleTimeString('es-ES')}`);

    const welcomeMessage = 'Hola, Gracias por tu mensaje. En un momento te pondremos en contacto con un asesor, mientras tanto puedes ir revisando nuestro portafolio';

    // Pequeña pausa para simular escritura
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enviar mensaje de bienvenida
    try {
      await chat.sendMessage(welcomeMessage, { sendSeen: false });
      console.log(`✅ Mensaje de bienvenida enviado a ${contact.number}`);
    } catch (sendError) {
      console.error(`❌ Error al enviar mensaje de bienvenida (método principal):`, sendError.message);
      // Reintentar con método alternativo
      const ChatId = await message.getChat();
      await ChatId.sendMessage(welcomeMessage);
      console.log(`✅ Mensaje de bienvenida enviado (método alternativo)`);
    }

    // Pequeña pausa entre mensajes
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Cargar y enviar el archivo PDF
    const pdfPath = path.join(__dirname, 'SISTEMAS LITOGRAFICOS PORTAFOLIO EMPAQUES -2  2026.pdf');
    if (fs.existsSync(pdfPath)) {
      try {
        const media = MessageMedia.fromFilePath(pdfPath);
        await chat.sendMessage(media, { sendSeen: false });
        console.log(`✅ PDF de portafolio enviado a ${contact.number}`);
      } catch (pdfError) {
        console.error(`❌ Error al enviar el PDF (método principal):`, pdfError.message);
        // Reintentar con método alternativo
        const ChatId = await message.getChat();
        const media = MessageMedia.fromFilePath(pdfPath);
        await ChatId.sendMessage(media);
        console.log(`✅ PDF de portafolio enviado (método alternativo)`);
      }
    } else {
      console.error(`❌ Archivo PDF no encontrado en la ruta: ${pdfPath}`);
    }

    // Guardar número en el registro persistente
    saveSentNumber(userId);

    // Marcar como no leído para atención humana
    try {
      await chat.markUnread();
      console.log(`📌 Chat marcado como no leído - Requiere atención humana`);
    } catch (markError) {
      console.log(`⚠️  No se pudo marcar como no leído (esto es normal en algunas versiones)`);
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

// Servidor web básico para Railway (Healthcheck y Vista de QR)
// Railway requiere que las aplicaciones abran un puerto para saber que están vivas
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (latestQR) {
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>WhatsApp Bot QR</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <style>
              body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f0f2f5; margin:0; text-align:center; padding: 20px;}
              #qrcode { padding:20px; background:white; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); margin-top: 20px;}
            </style>
          </head>
          <body>
            <h2>🤖 Vincula tu Chatbot</h2>
            <p>Escanea este código con tu WhatsApp para iniciar sesión.</p>
            <div id="qrcode"></div>
            <p style="margin-top:20px; color:#666; font-size: 14px;">(Si el QR expira, refresca la página)</p>
            <script>
              new QRCode(document.getElementById("qrcode"), {
                text: "${latestQR}",
                width: 256,
                height: 256,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
              });
            </script>
          </body>
        </html>
      `);
    } else {
      res.end(`
        <!DOCTYPE html>
        <html>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f0f2f5; margin:0; text-align:center;">
            <h2>✅ El chatbot está en línea y conectado a WhatsApp</h2>
          </body>
        </html>
      `);
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor web de healthcheck iniciado en el puerto ${PORT}`);
});

module.exports = client;
