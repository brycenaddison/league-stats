FROM node:alpine as base

WORKDIR /app

COPY package.json .

RUN npm install -g npm-check-updates
RUN ncu -u
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"] 