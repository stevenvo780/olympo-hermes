# Etapa de desarrollo
FROM node:20 AS development

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Configurar variables de entorno para desarrollo
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo con hot reload
CMD ["npm", "run", "start:dev"]

# Etapa de construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilaciones nativas
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar solo las dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copiar archivos necesarios desde el builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Configurar variables de entorno para producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
