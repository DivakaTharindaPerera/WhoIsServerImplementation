const os = require('os');
const express = require('express');
const fs = require('fs');
const path = require('path');
const {open} = require('lmdb');
const workerpool = require('workerpool');
const writeData = require('./writeToFile');

const app = express();
const port = 3000;

const DATA_DIR = './data'; // directory containing TXT files
const POOL_SIZE = os.cpus().length // number of workers to use

// create a worker pool with the specified number of workers
// these workers will process the files in parallel
const pool = workerpool.pool('./parserWorker.js', {maxWorkers:POOL_SIZE});

const lmdbDB = open({
    path: './lmdb-data',
    compression: true,
});

let objects = []; // array to store parsed data
let completed = 0;

// queue to store the data to be written to the lmdb database
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

// the writing to lmdb is happening asynchronously
// a writing queue is used to store the writing data for lmdb
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

// read all files in the directory
function readAllFiles(directory = DATA_DIR){
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(directory, file)
            
            pool.exec('parseFile', [filePath]).then(data => {
                if (data.domainName === '') {
                    // using these logs we can find which file has no domain name
                    // useful for debugging
                    console.log('Domain name is empty in file:', file);
                }

                if (Object.values(data).every(value => value === '')) {
                    // using these logs we can find which file has no data
                    // useful for debugging
                    console.log('No data found in file:', file);
                }else{
                    // only push data to the array if it has data
                    // so that we dont keep empty objects in the array
                    objects.push(data);
                }

                completed++;

                if(objects.length >= 1000 || completed === files.length){
                    // writing data to the file in bacthes in order to avoid writing overhead
                    writeData(objects);

                    // add the batch to the write queue
                    writeQueue.push([...objects]);

                    if (!isWriting) {
                        processWriteQueue();
                    }

                    objects = [];
                }

                if(completed === files.length){
                    // we need to terminate the worker pool when all files have been processed
                    // otherwise the worker pool will keep running in the background waiting for new jobs
                    pool.terminate();
                }
            }).catch(err => {
                console.error('Error: ', err);
            });
        });
    });
}

// GET endpoint to retrieve the domain status and created date
app.get('/domain/:domainName', (req, res) => {
    const domainName = req.params.domainName;

    const domainInfo = lmdbDB.get(domainName);

    if (domainInfo) {
        res.json({
            domainName,
            status: domainInfo.status,
            createdDate: domainInfo.createdDate,
        });
    } else {
        res.status(404).json({ error: 'Domain not found' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    readAllFiles(DATA_DIR);
});

process.on('exit', () => {
    pool.terminate();
});

module.exports = readAllFiles;