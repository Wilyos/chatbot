FROM node:20-slim

# Instalar Chromium y dependencias necesarias para Puppeteer en Debian
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Forzar a Puppeteer a usar el Chromium de sistema que acabamos de instalar
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Puerto para Railway
EXPOSE 8080

CMD ["npm", "start"]
