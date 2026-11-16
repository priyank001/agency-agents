# ==============================================================================
# OpsAutomator SaaS Platform - Multi-Stage Production Dockerfile
# Lightweight, secure, non-root user execution
# ==============================================================================

FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY package.json ./
COPY server/ ./server/
COPY client/ ./client/

# Security: run as non-root node user
USER node

EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/stats || exit 1

CMD ["node", "server/index.js"]

