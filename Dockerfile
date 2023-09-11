FROM node:18
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE ${PORT}
CMD [ "dumb-init", "node", "index.js"]
