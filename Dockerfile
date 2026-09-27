# Stage 1: Build Angular 22
FROM node:22-alpine AS builder

WORKDIR /app

# Aumentar límite de memoria para compilaciones en servidores con recursos ajustados
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Servidor Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/intecap-web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
