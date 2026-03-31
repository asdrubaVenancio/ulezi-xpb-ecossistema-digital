FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p uploads/documents uploads/payments uploads/logos uploads/receipts uploads/contracts
EXPOSE 5000
CMD ["node", "src/server.js"]
