FROM node:18-slim

# Install Python, git, and cron
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    cron \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone scholar_to_bibtex repository
RUN git clone https://github.com/jshinodea/scholar_to_bibtex.git /app/scholar_to_bibtex

# Create and activate virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app/scholar_to_bibtex

# Install Python dependencies in virtual environment
RUN pip3 install --no-cache-dir \
    scholarly==1.7.11 \
    google-scholar==1.0.1 \
    python-serpapi \
    requests==2.31.0 \
    beautifulsoup4==4.12.2 \
    selenium==4.15.2 \
    webdriver-manager==4.0.1

# Create configuration file for SERPAPI
RUN echo "{\"serpapi_key\": \"$SERPAPI_KEY\"}" > config.json

WORKDIR /app

# Create uploads directory and data directory
RUN mkdir -p uploads data && chmod 777 uploads data

COPY package*.json ./
RUN npm install

COPY . .

# Setup cron job with virtual environment Python
COPY update_citations.sh /app/
RUN chmod +x /app/update_citations.sh
RUN echo "0 0 * * * PATH=/app/venv/bin:\$PATH SERPAPI_KEY=${SERPAPI_KEY} /app/update_citations.sh >> /var/log/cron.log 2>&1" | crontab -

EXPOSE 3000

# Start both cron and the Node.js server
CMD service cron start && npm start