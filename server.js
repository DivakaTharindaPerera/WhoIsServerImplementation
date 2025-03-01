const fs = require('fs');
const path = require('path');
const parserFunction = require('./parser');
const writeData = require('./writeToFile');

const DATA_DIR = './data'; // directory containing TXT files
let objects = []; // array to store parsed data

let completed = 0;

// read all files in the directory
function readAllFiles(directory = DATA_DIR){
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            processFile(file);
            completed++;

            if(objects.length >= 1000 || completed === files.length){
                // writing data to the file in bacthes in order to avoid writing overhead
                writeData(objects);
                objects = [];
            }
        });
    });
}

function processFile(file){
    const filePath = path.join(DATA_DIR, file);

    const data = parserFunction(filePath);

    // check if all the data is empty
    // no point of keeping empty data
    if(Object.values(data).every(value => value === '')){
        console.log('No data found in file ', file);
        return;
    }

    // check if the domain name is empty
    if(data.domainName === ''){
        console.log('Domain name is empty in file ', file);
    }

    objects.push(data);
}

readAllFiles(DATA_DIR);

module.exports = readAllFiles;