// consumer.js
const { kafka } = require('./kafkaClient');
const { invertedIndex } = require('./sharedState');
const {
    uploadedFiles,
    termFrequency,
    jobResults,
  } = require('./sharedState');


const consumer = kafka.consumer({ groupId: 'search-group' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'search-requests', fromBeginning: true });

  consumer.run({
    eachMessage: async ({ message }) => {
      const { jobId, query } = JSON.parse(message.value.toString());
      console.log(`Received query [${query}] for job ID: ${jobId}`);

      if (!invertedIndex[query]) {
        jobResults[jobId] = {
          term: query,
          results: [],
        };
        return;
      }

      jobResults[jobId] = {
        term: query,
        results: invertedIndex[query],
      };
    },
  });
}

module.exports = { startConsumer };
