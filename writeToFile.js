const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = './output/data.json'; // output file to store parsed data
const filePath = path.join(__dirname, OUTPUT_FILE);

function writeData(objects) {
    const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    
    if (!fileExists) {
        const content = '[\n' + 
            objects.map(obj => JSON.stringify(obj, null, 2)).join(',\n') + 
            '\n]';
        fs.writeFileSync(filePath, content);
    } else {
        // File exists, append all objects at once
        const currentSize = fs.statSync(filePath).size;
        fs.truncateSync(filePath, currentSize - 1); // Remove closing bracket
        
        const appendStream = fs.createWriteStream(filePath, { flags: 'a' });
        const content = ',\n' + 
            objects.map(obj => JSON.stringify(obj, null, 2)).join(',\n') + 
            '\n]';
        appendStream.end(content);
    }
}

module.exports = writeData;