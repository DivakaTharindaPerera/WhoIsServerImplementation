# WhoIsServerImplementation

# Explanantion of the Implementation
## Reading the Files
- Reads all files in the `data` directory
- Each file is processed in parallel using a worker pool
- Data are extracted using a REGEX patterns
- empty domain data is not stored (ex: whois-isfree.txt)

## Use of LMDB
- When the dataset has 10M domains, it is not efficient to read data from the JSON file we created
- Uses LMDB to store the data
- LMDB is used to retrieve the data in a fast and efficient manner
- Store data in the LMDB database as key value pairs
- Domain name is taken as the key and the required values (status, createdDate) are stored as the value
- When the GET endpoint is called, the domain name is used as the key to retrieve the value from the LMDB database

# Performance Evaluation
- Refer to `ImprovedAverageTimePerDomain.png`
- Average time per domain: 0.0041 ms (including LMDB write time)
- This will aproximately take 41 seconds to process 10,000,000 domains

# Folders
- `data` contains the TXT files to be processed
- `output` contains the output JSON file (data.json)
- `test_data` contains the test data to be used for testing
- `archive` contains the old files that were used for the previous implementations

# Files
- `server.js` contains the file processing logic and the API endpoint
- `parserWorker.js` contains the worker thread logic to process the files with REGEX patterns
- `writeToFile.js` contains the logic to write the data to the LMDB database
- `testForImproved.js` contains the logic to measure the time taken to process the files

# Instructions to Run
- use `npm install` to install the dependencies
- use `npm start` to start the server
- use `npm test` to test the server

# API Endpoint
- GET `localhost:3000/domain/:domainName` to get the domain status and created date
- ex:
    - GET `localhost:3000/domain/009dutch.nl`
    - response: {
        "domainName": "009dutch.nl",
        "status": "active",
        "createdDate": "2007-07-01"
    }