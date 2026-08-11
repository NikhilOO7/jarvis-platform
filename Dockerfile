# Jarvis platform — multi-stage build.
# Stage 1 (deps): install exactly the lockfile.
# Stage 2 (build): prisma client + Next standalone build. Also the migration
#                  runner image (has the prisma CLI + schema).
# Stage 3 (runner): slim runtime — standalone server + static assets + the
#                   zero-dep worker/bridge scripts.
# debian-slim (not alpine) so Prisma's default openssl binary target just works.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY scripts ./scripts
EXPOSE 3000
CMD ["node", "server.js"]
