const fs = require('fs');
const path = require('path');
const workerpool = require('workerpool');
const writeData = require('./writeToFile');

const DATA_DIR = './test_data'; 
const POOL_SIZE = require('os').cpus().length; // Use all available CPU cores


const pool = workerpool.pool('./parserWorker.js', { maxWorkers: POOL_SIZE });

let objects = []; 
let completed = 0;

// use a callback function to measure the time taken to process a file
// essential since we are reading the directory asynchronously
function measureTime(callback) {
    const start = Date.now();
    callback();
    const end = Date.now();
    return end - start;
}

// Read all files in the directory
function readAllFiles(directory = DATA_DIR) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        const totalFiles = files.length * 100000; 
        let totalTime = 0;

        files.forEach(file => {
            const filePath = path.join(directory, file);

            for (let i = 0; i < 100000; i++) {
                const timeTaken = measureTime(() => {
                    pool.exec('parseFile', [filePath])
                        .then(data => {
                            if (Object.values(data).every(value => value === '')) {
                                console.log('No data found in file:', file);
                            }else{
                                objects.push(data);
                            }

                            completed++;

                            if (objects.length >= 1000 || completed === totalFiles) {
                                writeData(objects);
                                objects = [];
                            }

                            if (completed === totalFiles) {
                                console.log('All files processed. Terminating worker pool...');
                                pool.terminate();

                                const averageTime = totalTime / totalFiles;
                                console.log(`Average time per file: ${averageTime} ms`);
                            }
                        })
                        .catch(err => {
                            console.error('Error processing file:', file, err);
                        });
                });

                totalTime += timeTaken;
            }
        });
    });
}

readAllFiles(DATA_DIR);