FROM node:lts as build_state
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY . .
RUN yarn install
RUN yarn build

FROM nginx:latest as Production_state
COPY --from=build_state /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]