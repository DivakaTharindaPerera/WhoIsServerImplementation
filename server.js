const fs = require('fs');
const path = require('path');
const parserFunction = require('./parser');

const DATA_DIR = './data'; // directory containing TXT files
const OUTPUT_FILE = './out/data.json'; // output file to store parsed data

const workers = [];
let completed = 0;

function writeData(parsedData) {
    // append data to output file
    // since there can be 10M+ domain files, we need to append to a file
    // this way we have prevented loading the whole already written data JSON content in to the memory
    // the data will be in a single line. so when the HTTP request comes, 
    // we can only load a single line to the memory and get the required data wihout loading the whole file into the memory
    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(parsedData) + '\n');
}


// read all files in the directory
fs.readdir(DATA_DIR, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        processFile(file,files);
    });
});

function processFile(file, files){
    const filePath = path.join(DATA_DIR, file);

    const data = parserFunction(filePath);
    writeData(data);
}


