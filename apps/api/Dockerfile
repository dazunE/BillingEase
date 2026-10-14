# BillingEase API. Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api
COPY apps/web/package.json apps/web/package.json
RUN npm ci --no-audit --no-fund
RUN npm run build --workspace @billingease/api
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
ENV NODE_ENV=production API_PORT=4000 BE_MIGRATIONS_DIR=/app/migrations STORAGE_DIR=/data/files
WORKDIR /app
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/packages/db/migrations ./migrations
RUN mkdir -p /data/files && chown -R node:node /data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
