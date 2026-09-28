# -------------------------------------------------------------
# SmartReply AI Backend - Production Multi-Stage Containerfile
# -------------------------------------------------------------

FROM node:20-alpine AS base
WORKDIR /app

# Install security updates & tools
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Set secure non-root user
USER node

# Expose microservice port
EXPOSE 5006
ENV PORT=5006
ENV NODE_ENV=production

# Container healthcheck for Docker / Kubernetes
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5006/health || exit 1

# dumb-init handles PID 1 signal forwarding for clean graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Default to multi-core cluster supervisor in production
CMD ["node", "cluster.js"]