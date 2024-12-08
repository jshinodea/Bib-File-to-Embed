#!/bin/bash

# Log start time
echo "[$(date)] Starting citations update"

# Run the scholar_to_bibtex script
cd /app/scholar_to_bibtex
python3 scholar_to_bibtex.py "$SCHOLAR_URL" > /app/citations.bib

# Check if the operation was successful
if [ $? -eq 0 ] && [ -s /app/citations.bib ]; then
    echo "[$(date)] Successfully updated citations.bib"
else
    echo "[$(date)] Error updating citations.bib"
    # Restore from backup if it exists
    if [ -f /app/citations.bib.backup ]; then
        cp /app/citations.bib.backup /app/citations.bib
        echo "[$(date)] Restored from backup"
    fi
fi 