const os = require('os');
const fs = require('fs');
const path = require('path');
const workerpool = require('workerpool');
const writeData = require('./writeToFile');

const DATA_DIR = './data'; // directory containing TXT files
const POOL_SIZE = os.cpus().length // number of workers to use
const pool = workerpool.pool('./parserWorker.js', {maxWorkers:POOL_SIZE});

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
            console.log('running... ', file);
            const filePath = path.join(directory, file)

            pool.exec('parseFile', [filePath]).then(data => {
                if (data.domainName === '') {
                    console.log('Domain name is empty in file:', file);
                }

                if (Object.values(data).every(value => value === '')) {
                    console.log('No data found in file:', file);
                }else{
                    objects.push(data);
                }

                completed++;

                if(objects.length >= 1000 || completed === files.length){
                    // writing data to the file in bacthes in order to avoid writing overhead
                    writeData(objects);
                    objects = [];
                }

                if(completed === files.length){
                    pool.terminate();
                }
            }).catch(err => {
                console.error('Error: ', err);
            });
        });
    });
}

readAllFiles(DATA_DIR);

process.on('exit', () => {
    pool.terminate();
});

module.exports = readAllFiles;