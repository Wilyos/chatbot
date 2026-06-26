FROM ghcr.io/puppeteer/puppeteer:latest

# Cambiar a usuario root para instalar dependencias y crear carpetas
USER root

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Forzar las variables de entorno de Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Instalar dependencias del proyecto (incluyendo whatsapp-web.js)
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto para el servidor de healthcheck (Railway)
EXPOSE 8080

# Comando para iniciar el chatbot
CMD ["npm", "start"]
