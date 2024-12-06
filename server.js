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
    const bibFilePath = process.env.BIBTEX_FILE || '/data/input.bib';
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