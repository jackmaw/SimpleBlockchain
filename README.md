# Simple Blockchain Web Service

Simple Blockchain Web Service is a blockchain which is exposed via Web Service using RESTful API.

This project was built while working through Term 1 of [Udacity Blockchain Nanodegree](https://eu.udacity.com/course/blockchain-developer-nanodegree--nd1309)

### Prerequisites

In order to be able to run this application you need to [install](https://nodejs.org/en/download/) node 8.0 or greater.

### Installing

Clone this repository then navigate to its directory and install application using npm:

```
npm install
```

Then run application using

```
npm run start
```

or in development mode:

```
npm run watch
```

## API Resources

  - [GET /block/:blockHeight](#get-blockblockHeight)
  - [GET /mempool/:jobId](#get-mempooljobid)
  - [POST /block](#post-block)

### GET /block/:blockHeight

Returns block from the blockchain based on given block height

Response body: 

```json
    {
        "hash": "68ecee1c0e1deb8ca1573d00f04b4d1d68cd72bb61a3f98010ccd39d095c3dec",
        "height": 340,
        "body": "Block body",
        "time": "1538504769567",
        "previousBlockHash": "7d26f81a518952197e6470a40a2019526a9db025d7329a8ef357adceca6dfcce"
    }
```

Response body when error:

```json
{
    "error": "INVALID_HEIGHT",
    "message": "Block Height should be an integer >= 0"
}
```
Errors: 
INVALID_HEIGHT ||  BLOCK_NOT_FOUND_IN_BLOCKCHAIN ||  BLOCKCHAIN_UNAVAILABLE

### GET /mempool/:jobId

Return block from the mempool. Includes block processing status.

Response body: 

```json
    {
        "jobId": "a2a762b7d41ad8cdf96735462a020abf",
        "block": "{\"hash\":\"43173818ef5cdfd33f74738209dabfb096b72a93588cc5e51f6811f5243e9eec\",\"height\":347,\"body\":\"trorlrlr\",\"time\":\"1538507668440\",\"previousBlockHash\":\"2af6780d8d949fce7a9a568e5d444bc3964a27e2d663927c92828fed1ac65d01\"}",
        "status": "INSERTED"
    }
```

Response body when error:

```json
{
    "error": "BLOCK_NOT_FOUND_IN_MEMPOOL",
    "message": ""
}
```
Block statuses:

**ENQUEUED** - Block added to the mempool

**INSERTED** - Block was sucesfully added to the blockchain

**REJECTED** - There was an error while adding block to the 
blockchain, block got removed from mempool as well, user should retry if this status occurs

**PROCESSING** - Block was removed from the mempool and adding to the blockchain is in progress


Errors: BLOCK_NOT_FOUND_IN_MEMPOOL

### POST /block

Adds block to the blockchain

Example request body:

```json
    {
        "body": "Some example body"
    }
```
Response body: 

```json
{
    "status": "INSERTED",
    "block": {
        "hash": "43173818ef5cdfd33f74738209dabfb096b72a93588cc5e51f6811f5243e9eec",
        "height": 347,
        "body": "trorlrlr",
        "time": "1538507668440",
        "previousBlockHash": "2af6780d8d949fce7a9a568e5d444bc3964a27e2d663927c92828fed1ac65d01"
    }
}
```

Response body when error:

```json
{
    "error": "INVALID_BLOCK_DATA",
    "message": "Error while parsing data"
}
```
Errors: 
INVALID_BLOCK_DATA ||  BLOCK_CANNOT_BE_ADDED || TIMEOUT

## Built With
* [crypto.js](https://www.npmjs.com/package/crypto-js) - go to cryptography library for node.js
* [leveldb](https://www.npmjs.com/package/level) - simple storage for applications
* [Express.js](http://expressjs.com) - lightweight and fast framework for making robust web services

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 



## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

