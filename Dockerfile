FROM node:18-slim

WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]