FROM node:18-slim

# Install Python, git, and cron
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    cron \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone scholar_to_bibtex repository
RUN git clone https://github.com/jshinodea/scholar_to_bibtex.git /app/scholar_to_bibtex
WORKDIR /app/scholar_to_bibtex

# Install Python dependencies explicitly
RUN pip3 install --no-cache-dir \
    scholarly \
    serpapi \
    requests \
    beautifulsoup4

# Create configuration file for SERPAPI
RUN echo '{"serpapi_key": "${SERPAPI_KEY}"}' > config.json

WORKDIR /app

# Create uploads directory and data directory
RUN mkdir -p uploads data && chmod 777 uploads data

COPY package*.json ./
RUN npm install

COPY . .

# Setup cron job
COPY update_citations.sh /app/
RUN chmod +x /app/update_citations.sh
RUN echo "0 0 * * * SERPAPI_KEY=${SERPAPI_KEY} /app/update_citations.sh >> /var/log/cron.log 2>&1" | crontab -

EXPOSE 3000

# Start both cron and the Node.js server
CMD service cron start && npm start