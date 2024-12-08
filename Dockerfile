FROM node:18-slim

# Install Python, git, and cron
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    cron \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone scholar_to_bibtex repository
RUN git clone https://github.com/jshinodea/scholar_to_bibtex.git /app/scholar_to_bibtex
WORKDIR /app/scholar_to_bibtex
RUN pip3 install -r requirements.txt
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

COPY package*.json ./
RUN npm install

COPY . .

# Setup cron job
COPY update_citations.sh /app/
RUN chmod +x /app/update_citations.sh
RUN echo "0 0 * * * /app/update_citations.sh >> /var/log/cron.log 2>&1" | crontab -

EXPOSE 3000

# Start both cron and the Node.js server
CMD service cron start && npm start