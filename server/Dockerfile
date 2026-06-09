FROM node:20-slim
WORKDIR /app

# Python + dependencias del sistema para Playwright Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install playwright --break-system-packages

# Instala Chromium y todas sus dependencias del sistema de una vez
RUN python3 -m playwright install chromium --with-deps

# Node.js deps
COPY package*.json ./
RUN npm install

# Código del servidor
COPY . .

# Archivos del scraper (copiados desde el contexto raíz del proyecto)
COPY scraper/ ./scraper/

RUN npx prisma generate

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/server.ts"]
