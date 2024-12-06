const fs = require('fs');
const Cite = require('citation-js');
const { v4: uuidv4 } = require('uuid');
const { validateBibFile } = require('./utils/fileValidator');

function parsePublications(filePath) {
  // Validate file before processing
  validateBibFile(filePath);

  const bibContent = fs.readFileSync(filePath, 'utf-8');
  const publications = [];
  
  const entries = bibContent.split('@').filter(entry => entry.trim());
  
  entries.forEach(entry => {
    try {
      const citation = new Cite(entry);
      const data = citation.data[0];
      
      publications.push({
        id: uuidv4(),
        title: data.title,
        authors: data.author.map(a => `${a.given} ${a.family}`).join(', '),
        year: data.issued['date-parts'][0][0],
        journal: data.journal,
        citations: parseInt(data.note?.match(/Cited by (\d+)/)?.[1] || '0'),
        url: data.URL
      });
    } catch (error) {
      console.error('Error parsing entry:', error);
    }
  });
  
  return publications;
}

module.exports = { parsePublications };