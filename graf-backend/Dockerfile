# Dockerfile simple y robusto para NestJS en Cloud Run

# ================================
# Builder Stage
# ================================
FROM node:20 AS builder

# Paquetes necesarios solo para build (node:20 ya incluye python3, make, g++, git)
WORKDIR /app

# Instalar dependencias (incluye dev)
COPY package*.json ./
COPY tsconfig*.json ./
COPY jest.config.js ./
COPY nest-cli.json ./
COPY .eslintrc.js ./
# Vendor local de prizma-contracts (self-contained: permite build sin contexto de monorepo / sin Cloud Build)
COPY vendor-contracts ./vendor-contracts
RUN npm ci --silent

# Copiar código y construir
COPY src/ ./src/
COPY webpack.config.js ./
ENV NODE_ENV=production
# Use tsc directly to avoid webpack version conflicts; path aliases resolved at runtime via tsconfig-paths
RUN npx tsc -p tsconfig.build.json

# Dejar sólo dependencias de producción
RUN npm ci --only=production --silent && npm cache clean --force

# ================================
# Production Stage (Cloud Run)
# ================================
FROM node:20-slim AS production

# Utilidades para señalización y healthchecks
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar sólo lo necesario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/vendor-contracts ./vendor-contracts
COPY --from=builder /app/dist ./dist
COPY package*.json ./
COPY bootstrap.js ./

# Usar usuario estándar `node` (no root) disponible en la imagen
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:$PORT/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "bootstrap.js"]
