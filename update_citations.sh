#!/bin/bash

# Log start time
echo "[$(date)] Starting citations update"

# Backup existing citations if they exist
if [ -f /app/data/citations.bib ]; then
    cp /app/data/citations.bib /app/data/citations.bib.backup
    echo "[$(date)] Created backup of existing citations"
fi

# Update SERPAPI configuration
echo "{\"serpapi_key\": \"$SERPAPI_KEY\"}" > /app/scholar_to_bibtex/config.json

# Run the scholar_to_bibtex script
cd /app/scholar_to_bibtex
python3 scholar_to_bibtex.py "$SCHOLAR_URL" > /app/data/citations.bib

# Check if the operation was successful
if [ $? -eq 0 ] && [ -s /app/data/citations.bib ]; then
    echo "[$(date)] Successfully updated citations.bib"
else
    echo "[$(date)] Error updating citations.bib"
    if [ -f /app/data/citations.bib.backup ]; then
        cp /app/data/citations.bib.backup /app/data/citations.bib
        echo "[$(date)] Restored from backup"
    else
        echo "[$(date)] No backup available"
    fi
fi 