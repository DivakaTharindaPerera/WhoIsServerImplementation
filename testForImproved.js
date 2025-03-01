const fs = require('fs');
const path = require('path');
const workerpool = require('workerpool');
const writeData = require('./writeToFile');
const {open} = require('lmdb');

const lmdbDB = open({
    path: './lmdb-data',
    compression: true,
});

const DATA_DIR = './test_data'; 
const POOL_SIZE = require('os').cpus().length; // Use all available CPU cores

let totalTime = 0;

// measuring time for the workerpool initialization
const start = Date.now();
const pool = workerpool.pool('./parserWorker.js', { maxWorkers: POOL_SIZE });;
const end = Date.now();

totalTime += end - start;

let objects = []; 
let completed = 0;

const writeQueue = [];
let isWriting = false;

// write data to the lmdb database in batches
function writeBatchToLMDB(batch) {
    return new Promise((resolve, reject) => {
        setImmediate(() => {
            try {
                lmdbDB.transaction(() => {
                    batch.forEach(obj => {
                        lmdbDB.put(obj.domainName, {
                            status: obj.status,
                            createdDate: obj.creationDate,
                        });
                    });
                });

                resolve();
            } catch (err) {
                console.error('Error updating LMDB:', err);
                reject(err);
            }
        });
    });
}

async function processWriteQueue() {
    if (isWriting || writeQueue.length === 0) return;
    isWriting = true;

    try {
        const batch = writeQueue.shift();
        await writeBatchToLMDB(batch);
    } catch (err) {
        console.error('Error processing write queue:', err);
    } finally {
        isWriting = false;

        if (writeQueue.length > 0) {
            // process the next batch
            processWriteQueue();
        }
    }
}

// use a callback function to measure the time taken to process a file
// essential since we are reading the directory asynchronously
function measureTime(callback) {
    const start = Date.now();
    callback();
    const end = Date.now();
    return end - start;
}

function readAllFiles(directory = DATA_DIR) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        const totalFiles = files.length * 100000; 

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

                                writeQueue.push([...objects]);

                                if (!isWriting) {
                                    processWriteQueue();
                                }

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