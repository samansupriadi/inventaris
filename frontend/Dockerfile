# frontend/Dockerfile

# --- Stage 1: Build React ---
FROM node:22.12.0-alpine as build-stage
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Build aplikasi (hasilnya ada di folder /app/dist)
RUN npm run build

# --- Stage 2: Serve dengan Nginx ---
FROM nginx:alpine as production-stage
# Copy hasil build dari Stage 1 ke folder Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy konfigurasi Nginx kustom kita
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]