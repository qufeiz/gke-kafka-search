// kafkaClient.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'kafka-bridge',
  brokers: [process.env.KAFKA_BROKER || 'kafka.default.svc.cluster.local:9092']
  //brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const kafkaProducer = kafka.producer();
//const kafkaConsumer = kafka.consumer({ groupId: 'search-group' });

(async () => {
   await kafkaProducer.connect();
   console.log('Kafka producer connected');
 })();

module.exports = {
    kafkaProducer,
    kafka,
  };
