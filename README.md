# WhoIsServerImplementation

# Instructions to run
- use `npm install` to install the dependencies
- use `npm start` to start the server
- use `npm test` to test the server

# Implementations
- Uses worker threads and a worker pool to process the files in parallel
- Uses REGEX to efficeintly extract data from the files

# Folders
- `data` contains the TXT files to be processed
- `output` contains the output JSON file (data.json)
- `test_data` contains the test data to be used for testing
- `archive` contains the old files that were used for the previous implementations

# Performance
- Average time per domain: 0.0041 ms
- This will aproximately take 41 seconds to process 10,000,000 domains
