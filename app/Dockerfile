FROM node:lts-alpine3.15
WORKDIR /home/admin/22-23-ict-architecture-9/app
COPY ./public/* ./public/
COPY ./src/* ./src/
COPY *.json .
RUN npm install /home/admin/22-23-ict-architecture-9/app/.
CMD node /home/admin/22-23-ict-architecture-9/app/src/index.js
EXPOSE 3000