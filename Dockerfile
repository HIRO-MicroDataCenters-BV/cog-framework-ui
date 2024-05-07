# Stage 1: Build Angular app
FROM node:18.20.0 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve Angular app with Nginx

FROM nginx:1.26.0-alpine


COPY --from=build /app/dist/cog-framework-ui/ /usr/share/nginx/html
#COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80