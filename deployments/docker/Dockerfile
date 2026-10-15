# Build stage: compile TypeScript into public/dist
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.build.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# Runtime stage: serve static assets with Nginx
FROM nginx:alpine

COPY --from=build /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
