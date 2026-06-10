FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate --schema server/prisma/schema.prisma

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --schema server/prisma/schema.prisma --accept-data-loss && npx tsx server/src/server.ts"]
