# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# ---- dependencies -----------------------------------------------------------
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev (optional containerized dev workflow; hot reload via bind mount) -----
FROM dependencies AS dev
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- builder -----------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Build-time values only; the real secrets are supplied at runtime (see below).
# Public values must be present at build time because Next.js inlines
# NEXT_PUBLIC_* variables into the client bundle during `next build`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# Dummy values so build-time env validation doesn't fail; real secrets are
# only needed at runtime and are injected via `docker run --env-file`/compose.
ENV SUPABASE_SECRET_KEY=build-time-placeholder
ENV SUPABASE_DB_URL=postgresql://build-time-placeholder
RUN npm run build

# ---- runner (production) ------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
