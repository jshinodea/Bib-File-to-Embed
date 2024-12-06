FROM node:18-slim

WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Create directory for mounted BibTeX file
RUN mkdir -p /data && chmod 777 /data

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use environment variable for BibTeX file path
ENV BIBTEX_FILE=/data/input.bib

CMD ["npm", "start"]