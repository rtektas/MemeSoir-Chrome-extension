FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
ENV PORT=8787
EXPOSE 8787
USER node
CMD ["node", "server/server.js"]
