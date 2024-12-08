# BibTeX Publications Viewer

A Docker container that generates an interactive publications viewer from BibTeX files.

## Usage

1. Build the Docker image:
```bash
docker build -t bibtex-viewer .
```

2. Run the container:
```cmd
docker run -p 3000:3000 -v "%cd%\citations.bib":/data/input.bib bibtex-viewer
```

3. Add the viewer to your webpage:
```html
<script src="http://localhost:3000/embed.js"></script>
```

The viewer will be automatically injected after the script tag. No iframes needed!

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

## Features

- Sort publications by date, title, author, or citations
- Group publications by year
- Search functionality
- Collapsible year groups
- Responsive design
- Uses UC Davis Aggies color theme
- File validation and error handling
- Direct page integration (no iframes)