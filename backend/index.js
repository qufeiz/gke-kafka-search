// index.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { kafkaProducer} = require('./kafkaClient');
const { startConsumer } = require('./consumer');
const cors = require('cors');

const { constructInvertedIndex } = require('./utils/invertedIndex');
const {
    uploadedFiles,
    termFrequency,
    jobResults,
  } = require('./sharedState');

const app = express();

const upload = multer();
const PORT = process.env.PORT || 3000;

app.use(cors()); 

app.use(bodyParser.json());

// === Upload File ===
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send({ error: 'No file uploaded' });

  uploadedFiles[file.originalname] = file.buffer.toString();
  res.send({ message: `Uploaded ${file.originalname}` });
});

// === Construct Inverted Index ===
app.post('/construct_indices', (req, res) => {
  constructInvertedIndex();
  res.send({ message: 'Inverted index constructed' });
});

// === Search ===
app.post('/search', async (req, res) => {
    const query = req.body.query;
    if (!query) return res.status(400).send({ error: 'Missing query' });
  
    const jobId = uuidv4();
    const message = { jobId, query };
  
    try {
      await kafkaProducer.send({
        topic: 'search-requests',
        messages: [{ value: JSON.stringify(message) }],
      });
  
      res.send({ message: 'Search query submitted', jobId });
    } catch (err) {
      console.error('Kafka error:', err);
      res.status(500).send({ error: 'Failed to send to Kafka' });
    }
  });

// Polling endpoint to fetch result
app.get('/result/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const result = jobResults[jobId];
  
    if (!result) {
      return res.send({ status: 'Processing', jobId });
    }
  
    res.send({ status: 'Done', jobId, ...result });
  });

// === Top-N Frequent Terms ===
app.get('/top_n', (req, res) => {
  const n = parseInt(req.query.n) || 10;
  const top = Object.entries(termFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, freq]) => ({ term, freq }));

  res.send({ top_n: top });
});

app.listen(PORT, () => {
  console.log(`Kafka backend listening on port ${PORT}`);
  startConsumer(); 
});
