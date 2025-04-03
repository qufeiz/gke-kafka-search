// index.js
const express = require('express');
const bodyParser = require('body-parser');
//const { kafkaProducer } = require('./kafkaClient');
const multer = require('multer');


const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer();

const uploadedFiles = {};
let invertedIndex = {};
let termFrequency = {};

const fs = require('fs');
const path = require('path');

app.use(bodyParser.json());


// Upload files
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).send({ error: 'No file uploaded' });
  
    uploadedFiles[file.originalname] = file.buffer.toString();
    res.send({ message: `Uploaded ${file.originalname}` });
  });

// Construct Inverted Index
app.post('/construct_indices', (req, res) => {
    invertedIndex = {};
    termFrequency = {};
  
    for (const [filename, content] of Object.entries(uploadedFiles)) {
      const words = content.toLowerCase().match(/\b\w+\b/g);
      const wordCount = {};
  
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
  
      for (const [word, freq] of Object.entries(wordCount)) {
        if (!invertedIndex[word]) {
          invertedIndex[word] = [];
          termFrequency[word] = 0;
        }
  
        invertedIndex[word].push({
          file: filename,
          freq,
        });
  
        termFrequency[word] += freq;
      }
    }
    
    // Write to JSON file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(
        path.join(outputDir, 'inverted_index.json'),
        JSON.stringify(invertedIndex, null, 2)
    );

    fs.writeFileSync(
        path.join(outputDir, 'term_frequency.json'),
        JSON.stringify(termFrequency, null, 2)
    );

    res.send({ message: 'Inverted index constructed: '});
  });

app.post('/search', async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).send({ error: 'Missing query' });

  try {
    await kafkaProducer.send({
      topic: 'search-requests',
      messages: [{ value: query }],
    });
    res.send({ status: 'Message sent to Kafka', query });
  } catch (err) {
    console.error('Kafka error:', err);
    res.status(500).send({ error: 'Failed to send to Kafka' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kafka v2 backend listening on port ${PORT}`);
  });
  
