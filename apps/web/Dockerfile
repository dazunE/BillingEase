# BillingEase web app. Build from the repo root: docker build -f apps/web/Dockerfile .
FROM node:22-bookworm-slim AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web
COPY apps/api/package.json apps/api/package.json
RUN npm ci --no-audit --no-fund
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @billingease/web

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Next's standalone output keeps the monorepo layout: the server is apps/web/server.js.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
