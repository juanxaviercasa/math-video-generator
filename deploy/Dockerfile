FROM node:20-bookworm AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY backend backend
COPY frontend frontend
RUN npm run build:backend
RUN npm --workspace backend run prisma:generate

FROM node:20-bookworm

ENV NODE_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev build-essential pkg-config \
    libcairo2-dev libpango1.0-dev ffmpeg \
    texlive-latex-base texlive-latex-extra texlive-fonts-recommended \
    dvisvgm ghostscript \
  && python3 -m pip install --break-system-packages --no-cache-dir manim edge-tts \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma

RUN mkdir -p /var/lib/math-video-generator/media \
  && node -e "const {PrismaClient}=require('@prisma/client'); if(!PrismaClient) process.exit(1)"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) process.exit(1)})"

EXPOSE 3001
CMD ["node", "dist/index.js"]
