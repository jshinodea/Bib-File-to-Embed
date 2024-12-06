const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class FileValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
  }
}

function checkFileExists(filePath) {
  logger.info(`Checking if file exists: ${filePath}`);
  try {
    // Use fs.statSync to get detailed error information
    fs.statSync(filePath);
  } catch (error) {
    logger.error(`File check failed: ${error.message}`, { error });
    throw new FileValidationError(`BibTeX file not found: ${error.message}`, 'FILE_NOT_FOUND');
  }
}

function checkFileReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new FileValidationError(`BibTeX file is not readable: ${error.message}`, 'FILE_NOT_READABLE');
  }
}

function checkFileExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.bib') {
    throw new FileValidationError('File must have .bib extension', 'INVALID_EXTENSION');
  }
}

function checkFileSize(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new FileValidationError('BibTeX file is empty', 'FILE_EMPTY');
  }
  
  // Maximum file size (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (stats.size > MAX_SIZE) {
    throw new FileValidationError('BibTeX file is too large (max 10MB)', 'FILE_TOO_LARGE');
  }
}

function checkBibTeXContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    logger.info(`Successfully read file content from: ${filePath}`);
    
    // Check for basic BibTeX structure
    if (!content.includes('@')) {
      throw new FileValidationError('Invalid BibTeX file format', 'INVALID_FORMAT');
    }

    // Check for basic entry structure
    const hasValidEntry = /@\w+\s*\{[\s\S]*?\}/g.test(content);
    if (!hasValidEntry) {
      throw new FileValidationError('No valid BibTeX entries found', 'NO_VALID_ENTRIES');
    }

    return content;
  } catch (error) {
    if (error instanceof FileValidationError) {
      throw error;
    }
    throw new FileValidationError(`Error reading BibTeX content: ${error.message}`, 'READ_ERROR');
  }
}

function validateBibFile(filePath) {
  try {
    logger.info(`Starting validation for file: ${filePath}`);
    
    // Resolve the file path to handle any symbolic links
    const resolvedPath = path.resolve(filePath);
    logger.info(`Resolved file path: ${resolvedPath}`);
    
    checkFileExists(resolvedPath);
    checkFileReadable(resolvedPath);
    checkFileExtension(resolvedPath);
    checkFileSize(resolvedPath);
    const content = checkBibTeXContent(resolvedPath);
    
    logger.info('File validation successful');
    return content;
  } catch (error) {
    logger.error('File validation failed', {
      error: error.message,
      code: error.code,
      filePath,
      resolvedPath: path.resolve(filePath)
    });
    throw error;
  }
}

module.exports = {
  validateBibFile,
  FileValidationError
};