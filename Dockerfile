FROM node:15

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

CMD [ "node", "index.js" ]
