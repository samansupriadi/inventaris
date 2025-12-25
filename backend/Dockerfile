# backend/Dockerfile

# Gunakan Node.js versi ringan
FROM node:22.12.0-alpine

# Set folder kerja
WORKDIR /app

# Copy package.json dulu (agar cache layer optimal)
COPY package.json package-lock.json* ./

# Install dependencies production saja
RUN npm install --production

# Copy seluruh source code
COPY . .

# Expose port backend
EXPOSE 4000

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]