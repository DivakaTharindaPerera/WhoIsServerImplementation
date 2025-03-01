const fs = require('fs');
const path = require('path');
const parserFunction = require('./parser');
const writeData = require('./writeToFile');

const DATA_DIR = './test_data';

let objects = [];

let completed = 0;
let totalTime = 0;

function test(){
    for(let i = 0; i < 100000; i++){
        const startTime = new Date().getTime();
        readAllFiles(DATA_DIR);
        const endTime = new Date().getTime();
        totalTime += (endTime - startTime);
    }

    const avgTimePerDomain = totalTime / 300000;
    console.log(`Average time per domain: ${avgTimePerDomain.toFixed(6)} ms`);
}

// redeclared for test emulation with synchrounous code
// we need synchrounous code to calculate the time
function readAllFiles(directory = DATA_DIR){
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
        processFile(file);
        completed++;

        if(objects.length >= 1000 || completed === files.length){
            // writing data to the file in bacthes in order to avoid writing overhead
            writeData(objects);
            objects = [];
        }
    });
}

function processFile(file){
    const filePath = path.join(DATA_DIR, file);

    const data = parserFunction(filePath);

    // check if all the data is empty
    // no point of keeping empty data
    if(Object.values(data).every(value => value === '')){
        return;
    }

    // check if the domain name is empty
    if(data.domainName === ''){
        console.log('Domain name is empty in file ', file);
    }

    objects.push(data);
}

test();