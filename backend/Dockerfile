FROM node:22-slim AS app
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 1) Сначала только манифесты — слой кэшируется, пока не трогаешь зависимости
COPY package.json package-lock.json ./
RUN npm install

# 2) Схема нужна для generate
COPY prisma ./prisma
RUN npx prisma generate

# 3) Остальной код + папка data (векторный индекс)
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# миграции на старте, потом сервер
CMD ["sh", "-c", "npm start"]