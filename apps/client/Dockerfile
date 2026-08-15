# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY package.json package-lock.json* nx.json tsconfig.base.json workspace.json angular.json ./
COPY apps/client ./apps/client
RUN npx ng build client --configuration=production

FROM nginx:1.27-alpine AS runner
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/client/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
