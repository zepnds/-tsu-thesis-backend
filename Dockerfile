# backend/Dockerfile

# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install ALL deps (including devDeps like typescript, @nestjs/cli)
RUN npm ci

COPY . .

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: production image ────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
# Only production deps
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy uploads folder (if it exists)
COPY --from=builder /app/uploads ./uploads

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/main.js"]