// utils/invertedIndex.js
const { invertedIndex, termFrequency, uploadedFiles } = require('../sharedState');
const fs = require('fs');
const path = require('path');

//Stop word list to exclude common words from the index
// const stopWords = new Set([
//     'a', 'an', 'the', 'and', 'or', 'but', 'if', 'is', 'are', 'was', 'were', 'to',
//     'of', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'as', 'it', 'this', 'that',
//     'these', 'those', 'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'not',
//     'no', 'so', 'too', 'very', 'can', 'will', 'just', 'about'
//   ]);
  

function constructInvertedIndex() {
  // Clear existing data
  Object.keys(invertedIndex).forEach(k => delete invertedIndex[k]);
  Object.keys(termFrequency).forEach(k => delete termFrequency[k]);

  for (const [filename, content] of Object.entries(uploadedFiles)) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = {};

    for (const word of words) {
      //if (stopWords.has(word)) continue; //add this if you want to skip stop words! Sorry this was not included in the walkthroguh but hopefully it is intuitive!!!
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    for (const [word, freq] of Object.entries(wordCount)) {
      if (!invertedIndex[word]) {
        invertedIndex[word] = [];
        termFrequency[word] = 0;
      }
      invertedIndex[word].push({ file: filename, freq });
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
}

module.exports = { constructInvertedIndex };
