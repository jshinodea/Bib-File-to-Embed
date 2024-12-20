const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cors = require('cors');
const { validateBibFile, FileValidationError } = require('./src/utils/fileValidator');
const { parseBibTeXContent, BibParseError } = require('./src/utils/bibParser');
const logger = require('./src/utils/logger');

const app = express();

// Enable CORS for script embedding
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(express.static('public'));

// Store publications in memory
let cachedPublications = null;

// Configure multer
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.toLowerCase().endsWith('.bib')) {
    cb(new Error('Only .bib files are allowed'), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize publications from mounted BibTeX file
async function initializePublications() {
  try {
    const bibFilePath = process.env.BIBTEX_FILE || path.join(__dirname, 'citations.bib');
    logger.info(`Attempting to load BibTeX file from: ${bibFilePath}`);
    
    const content = validateBibFile(bibFilePath);
    cachedPublications = parseBibTeXContent(content);
    logger.info(`Initialized ${cachedPublications.length} publications`);
  } catch (error) {
    logger.error('Failed to initialize publications', { 
      error: error.message,
      code: error.code 
    });
    throw error;
  }
}

// Endpoint to get publications
app.get('/publications', (req, res) => {
  if (!cachedPublications) {
    return res.status(503).json({
      error: 'Publications not yet initialized',
      code: 'NOT_INITIALIZED'
    });
  }
  res.json(cachedPublications);
});

app.post('/upload', upload.single('bibfile'), async (req, res) => {
  try {
    if (!req.file) {
      throw new FileValidationError('No file uploaded', 'NO_FILE');
    }

    logger.info('File upload received', {
      originalName: req.file.originalname,
      size: req.file.size
    });

    // Validate the file
    const content = validateBibFile(req.file.path);
    
    // Parse the BibTeX content
    const publications = parseBibTeXContent(content);
    cachedPublications = publications; // Update cached publications
    
    res.json({ publications });
  } catch (error) {
    logger.error('Error processing upload', {
      error: error.message,
      code: error.code
    });

    let statusCode = 400;
    if (error instanceof FileValidationError || error instanceof BibParseError) {
      statusCode = 400;
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
    } else {
      statusCode = 500;
    }

    res.status(statusCode).json({
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Add SSR endpoint
app.get('/embed-ssr', (req, res) => {
  if (!cachedPublications) {
    return res.status(503).send(`
      <div class="publications-viewer-container">
        <p>Loading publications...</p>
      </div>
    `);
  }

  // Generate initial HTML with publications data
  const initialHtml = `
    <div class="publications-viewer-container" id="publications-viewer">
      <div class="controls">
        <input type="text" class="search-input" placeholder="Search publications..." aria-label="Search publications">
        <div class="buttons-group">
          <div class="dropdown">
            <button class="btn sort-btn">Sort by</button>
            <div class="dropdown-content sort-options">
              <a href="#" data-sort="time">Date</a>
              <a href="#" data-sort="title">Title</a>
              <a href="#" data-sort="author">Author</a>
            </div>
          </div>
          <button class="direction-btn" aria-label="Toggle sort direction">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="publications-list">
        ${generatePublicationsHtml(cachedPublications)}
      </div>
    </div>
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(cachedPublications)};
    </script>
  `;

  res.send(initialHtml);
});

// Helper function to generate publications HTML
function generatePublicationsHtml(publications) {
  const groupedByYear = {};
  publications.forEach(pub => {
    const year = pub.year || 'Unknown';
    if (!groupedByYear[year]) {
      groupedByYear[year] = [];
    }
    groupedByYear[year].push(pub);
  });

  return Object.entries(groupedByYear)
    .sort(([a], [b]) => b - a)
    .map(([year, pubs]) => `
      <div class="year-group">
        <div class="year-header">
          <span>${year}</span>
          <span>${pubs.length} publication${pubs.length === 1 ? '' : 's'}</span>
        </div>
        <div class="publications-list">
          ${pubs.map(pub => `
            <div class="publication-card">
              <h3>${escapeHtml(pub.title)}</h3>
              <p>${escapeHtml(pub.author)}</p>
              ${pub.doi ? `<a href="https://doi.org/${pub.doi}" class="publication-link" target="_blank" rel="noopener">View Publication</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PORT = process.env.PORT || 3000;

// Initialize publications before starting the server
initializePublications()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server', { 
      error: error.message,
      code: error.code 
    });
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});