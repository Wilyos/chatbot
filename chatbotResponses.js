// Módulo para manejar diferentes tipos de respuestas del chatbot
class ChatbotResponses {
  constructor() {
    this.sessionData = new Map(); // Guardar estado de la conversación por usuario
  }

  // Obtener o crear sesión para un usuario
  getSession(userId) {
    if (!this.sessionData.has(userId)) {
      this.sessionData.set(userId, {
        context: null,
        lastMessage: null,
        timestamp: Date.now()
      });
    }
    return this.sessionData.get(userId);
  }

  // Actualizar sesión
  updateSession(userId, data) {
    const session = this.getSession(userId);
    Object.assign(session, data);
    session.timestamp = Date.now();
  }

  // Limpiar sesiones antiguas (más de 1 hora)
  cleanOldSessions() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [userId, session] of this.sessionData.entries()) {
      if (now - session.timestamp > oneHour) {
        this.sessionData.delete(userId);
      }
    }
  }

  // Procesar mensaje con contexto
  processWithContext(userId, message) {
    const session = this.getSession(userId);
    const lowerMessage = message.toLowerCase().trim();

    // Si el usuario está en un contexto específico
    if (session.context === 'awaiting_contact') {
      this.updateSession(userId, { context: null, needsHumanReply: true });
      return {
        message: `✅ Gracias por tu mensaje. En un momento te pondremos en contacto con un asesor.\n\n` +
                 `Tu consulta: "${message}"\n\n` +
                 `Por favor espera, pronto te atenderemos. 🙏`,
        markUnread: true
      };
    }

    // Procesar comandos generales
    return this.processGeneralMessage(userId, lowerMessage);
  }

  processGeneralMessage(userId, lowerMessage) {
    // Menú principal
    if (lowerMessage === 'hola' || lowerMessage === 'menu' || lowerMessage === 'inicio') {
      this.updateSession(userId, { context: 'menu' });
      return { message: this.getMainMenu(), markUnread: false };
    }

    // Opciones del menú
    switch (lowerMessage) {
      case '1':
        return { message: this.getGeneralInfo(), markUnread: false };
      case '2':
        return { message: this.getSchedule(), markUnread: false };
      case '3':
        return { message: this.getLocation(), markUnread: false };
      case '4':
        return { message: this.getServices(), markUnread: false };
      case '5':
        this.updateSession(userId, { context: 'awaiting_contact' });
        return {
          message: this.getContactHuman(),
          markUnread: false
        };
      default:
        return { message: this.getSmartResponse(lowerMessage), markUnread: false };
    }
  }

  // Respuestas 
  getSmartResponse(message) {
    // Saludos
    if (message.includes('hola') || message.includes('buenos') || message.includes('buenas') || 
        message.includes('hi') || message.includes('hey') || message.includes('wenas')) {
      return `¡Hola! 👋 ¿En qué puedo ayudarte?\n\n` +
             `Escribe *MENU* para ver todas las opciones disponibles.`;
    }

    // Preguntas sobre horarios
    if (message.includes('hora') || message.includes('horario') || message.includes('atienden') || 
        message.includes('abren') || message.includes('cierran')) {
      return this.getSchedule();
    }

    // Preguntas sobre ubicación
    if (message.includes('donde') || message.includes('direccion') || message.includes('ubicacion') || 
        message.includes('quedan') || message.includes('encuentran')) {
      return this.getLocation();
    }

    // Preguntas sobre servicios
    if (message.includes('servicio') || message.includes('hacen') || message.includes('ofrecen') || 
        message.includes('productos') || message.includes('imprimen')) {
      return this.getServices();
    }

    // Preguntas sobre contacto
    if (message.includes('telefono') || message.includes('llamar') || message.includes('contacto') || 
        message.includes('email') || message.includes('correo') || message.includes('whatsapp')) {
      return `📞 *Información de Contacto*\n\n` +
             `Teléfono: 3015088598\n` +
             `Email: sistemaslitograficosmed@gmail.com\n` +
             `WhatsApp: Este mismo número 😊\n\n` +
             `Escribe *MENU* para ver todas las opciones.`;
    }

    // Preguntas sobre precios o cotizaciones
    if (message.includes('precio') || message.includes('costo') || message.includes('cuanto') || 
        message.includes('cotiza') || message.includes('valor')) {
      return `💰 *Cotizaciones*\n\n` +
             `Para solicitar una cotización personalizada, por favor:\n\n` +
             `1. Escribe el número *5* para contactar con un asesor\n` +
             `2. O llámanos directamente al 3116111687\n\n` +
             `¡Con gusto te atenderemos! 😊`;
    }

    // Agradecimientos
    if (message.includes('gracias') || message.includes('thanks') || message.includes('grax')) {
      return `¡De nada! 😊 Estamos para ayudarte.\n\n` +
             `Si necesitas algo más, escribe *MENU* para ver las opciones.`;
    }

    // Despedidas
    if (message.includes('adios') || message.includes('chao') || message.includes('bye') || 
        message.includes('hasta luego')) {
      return `¡Hasta pronto! 👋 Que tengas un excelente día.\n\n` +
             `Recuerda que puedes escribir *MENU* cuando quieras hablar de nuevo.`;
    }

    // Respuesta por defecto para cualquier otro mensaje
    return this.getDefaultResponse(message);
  }

  getMainMenu() {
    return `¡Hola! 👋 Bienvenido al chatbot de WhatsApp.\n\n` +
           `Escribe uno de los siguientes números:\n\n` +
           `1️⃣ - Información general\n` +
           `2️⃣ - Horarios de atención\n` +
           `3️⃣ - Ubicación\n` +
           `4️⃣ - Servicios\n` +
           `5️⃣ - Contactar con un asesor\n\n` +
           `Escribe *MENU* para ver estas opciones.`;
  }

  getGeneralInfo() {
    return `ℹ️ *Información General*\n\n` +
           `Somos una empresa dedicada a proporcionar soluciones innovadoras.\n` +
           `Nuestro compromiso es la satisfacción del cliente.\n\n` +
           `📞 Teléfono: 3116111687\n` +
           `📧 Email: sistemaslitograficosmed@gmail.com\n` +
           `Escribe *MENU* para volver al menú principal.`;
  }

  getSchedule() {
    return `🕐 *Horarios de Atención*\n\n` +
           `Lunes a Viernes: 8:00 AM - 5:00 PM\n` +
           `Sábados: 8:00 AM - 11:00 AM\n` +
           `Domingos: Cerrado\n\n` +
           `⏰ Hora actual del servidor: ${new Date().toLocaleString('es-ES')}\n\n` +
           `Escribe *MENU* para volver al menú principal.`;
  }

  getLocation() {
    return `📍 *Ubicación*\n\n` +
           `Dirección: Carrera 54 # 53-115\n` +
           `Ciudad: Medellín\n` +
           `País: Colombia\n` +
           `Código Postal: 050021\n\n` +
           `🗺️ Google Maps: [Tu enlace de Google Maps]\n\n` +
           `Escribe *MENU* para volver al menú principal.`;
  }

  getServices() {
    return `⚙️ *Nuestros Servicios*\n\n` +
           `✅ Editorial\n` +
           `✅ Publicidad\n` +
           `✅ Empaques\n` +
           `✅ Corporativo\n` +
           `✅ Publicidad exterior\n\n` +
           `💡 Para más información sobre cada servicio, ` +
           `escribe el número 5 para contactar con un asesor.\n\n` +
           `Escribe *MENU* para volver al menú principal.`;
  }

  getContactHuman() {
    return `👤 *Contactar con un humano*\n\n` +
           `Por favor, escribe tu consulta y uno de nuestros agentes ` +
           `te responderá lo antes posible.\n\n` +
           `También puedes:\n` +
           `📞 Llamarnos: 3015088598\n` +
           `📧 Email: sistemaslitograficosmed@gmail.com\n\n` +
           `Escribe tu mensaje ahora...`;
  }

  getDefaultResponse(originalMessage) {
    return `Entiendo que escribiste: "${originalMessage}" 💬\n\n` +
           `No estoy seguro de cómo responder a eso, pero puedo ayudarte con:\n\n` +
           `• Información sobre nuestros servicios\n` +
           `• Horarios de atención\n` +
           `• Ubicación y contacto\n` +
           `• Cotizaciones\n\n` +
           `Escribe *MENU* para ver todas las opciones disponibles. 😊`;
  }
}

module.exports = ChatbotResponses;
