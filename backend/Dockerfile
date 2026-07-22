FROM node:20-alpine

WORKDIR /app

# Copy dependency files dulu (supaya layer cache optimal)
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy seluruh source code
COPY . .

# Buat folder uploads jika belum ada
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]