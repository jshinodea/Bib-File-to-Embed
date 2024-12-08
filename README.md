# BibTeX Publications Viewer

A Docker container that generates an interactive publications viewer from BibTeX files, with automatic updates from Google Scholar.

## Usage

1. Build the Docker image:
```bash
docker build -t bibtex-viewer .
```

2. Run the container with your Google Scholar URL:
```cmd
docker run -p 3000:3000 -e SCHOLAR_URL="YOUR_GOOGLE_SCHOLAR_URL" bibtex-viewer
```

3. Add the viewer to your webpage:
```html
<script src="http://localhost:3000/embed.js"></script>
```

The viewer will be automatically injected after the script tag. No iframes needed!

## Automatic Updates

The container automatically updates the citations daily at midnight by:
1. Fetching new publications from the provided Google Scholar URL
2. Generating an updated BibTeX file
3. Replacing the existing citations while maintaining a backup

If the update fails, the system will automatically restore the previous working version.

## File Requirements

The BibTeX file must:
- Have a `.bib` extension
- Be a valid BibTeX format
- Contain at least one publication entry
- Be readable by the container
- Not be empty
- Not exceed 10MB in size

## Troubleshooting

If you encounter the "BibTeX file not found" error:
1. Ensure you're using absolute paths for the file mount
2. Check if the BibTeX file exists and is readable
3. Verify the file path doesn't contain special characters
4. For Windows users, make sure to use the correct path format for your shell

If the automatic updates aren't working:
1. Verify your Google Scholar URL is correct and accessible
2. Check the container logs for any error messages
3. Ensure the container has internet access

## Features

- Automatic daily updates from Google Scholar
- Sort publications by date, title, author, or citations
- Group publications by year
- Search functionality
- Collapsible year groups
- Responsive design
- Uses UC Davis Aggies color theme
- File validation and error handling
- Direct page integration (no iframes)