# Star Notary Service

Star Notary Service is a service which allow registering a star, looking up for registered stars by wallet address, block hash and block height.

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

## Star Registration Procedure

In order to register star into this blockchain, you need a valid blockchain addres and star coordinations, then follow steps:

1. Request validation on your blockchain identity (bitcoin wallet) [check requestValidation](#post-requestValidation)

2. Verify your blockchain identity by signing message given in step 1, [message validation](#post-message-signaturevalidate)

3. If your blockchain identity was valid, make request to save a block with your star coordinates and story. [save block](#post-block)

**Remember! After requesting validation you have 5 minutes to register your star if you fail you need to start over again**

## API Resources

  - [GET /block/:blockHeight](#get-blockblockHeight)
  - [GET /star/address:walletAddress](#get-staraddresswalletaddress)
  - [GET /star/hash:blockhash](#get-starhashblockhash)
  - [GET /mempool/:jobId](#get-mempooljobid)
  - [POST /block](#post-block)
  - [POST /requestValidation](#post-requestValidation)
  - [POST /message-signature/validate](#post-message-signaturevalidate)

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

### GET /star/address:walletAddress

Returns all stars which was registered by given walletAddress.

Response body: 

```json
[
    {
        "hash": "9c44d9151ead4da3bc0781fb3b40fa9666bb06f4655228db1b647469ec0a90ac",
        "height": 1,
        "body": {
            "address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
            "star": {
                "dec": "-26° 29' 24.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
        },
        "time": 1539807036,
        "previousBlockHash": "dc19c4a9416b7c838059a8e70e332c8f3c8dfd5b0b329bb4027d4064bfd6785b"
    }
]
```

Response body when error:

```json
{
    "error": "INVALID_WALLET_ADDRESS_IN_REQUEST",
    "message": "Invalid wallet address"
}
```
Errors: 
INVALID_WALLET_ADDRESS_IN_REQUEST

### GET /star/hash:blockhash

Returns block from the blockchain based on given block hash.

Response body: 

```json
{
    "hash": "84c6b5c480c7ffd7df8bae887d4e54c548ced6a804a1bfb6675e264dc6c87d4a",
    "height": 6,
    "body": {
        "address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "Found star using https://www.google.com/sky/ 2"
        }
    },
    "time": 1540133045,
    "previousBlockHash": "c3533374d327faab2c6ca4f742d27423dcef2840bb7891e6d8a371728ed30b1d"
}
```

Response body when error:

```json
{
    "error": "INVALID_HASH_IN_REQUEST",
    "message": "Invalid hash provided"
}
```
Errors: 
INVALID_HASH_IN_REQUEST

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

Adds block to the blockchain. Star story max limit is 500 bytes.

Example request body:

```json
{
	"address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
	"star": {
	"dec": "-26° 29' 24.9",
	"ra": "16h 29m 1.0s",
	"story": "Found star using https://www.google.com/sky/ 2"
	}
}
```
Response body: 

```json
{
    "status": "INSERTED",
    "block": {
        "hash": "84c6b5c480c7ffd7df8bae887d4e54c548ced6a804a1bfb6675e264dc6c87d4a",
        "height": 6,
        "body": "{\"address\":\"1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE\",\"star\":{\"dec\":\"-26° 29' 24.9\",\"ra\":\"16h 29m 1.0s\",\"story\":\"466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f2032\"}}",
        "time": 1540133045,
        "previousBlockHash": "c3533374d327faab2c6ca4f742d27423dcef2840bb7891e6d8a371728ed30b1d"
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

### POST /requestValidation

Starts star registration for given address,
previous registration will be canceled.

Example request body:

```json
    {
        "address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE"
    }
```
Response body: 

```json
{
    "address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
    "requestTimestamp": 1540132977,
    "message": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE:1540132977:starRegistry",
    "validationWindow": 300
}
```

Response body when error:

```json
{
    "error": "INVALID_WALLET_ADDRESS_IN_REQUEST",
    "message": "Invalid wallet address"
}
```
Errors: 
INVALID_WALLET_ADDRESS_IN_REQUEST

### POST /message-signature/validate

Verifies if user have the rights to use given address to register a star. 

Example request body:

```json
{
	"address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
    "signature": "H8gLo0xPq2FbjmV+ozZPOSdKhxqa4zk2KAv5PS+vCY6yafLrj9QMdnaq+hNMvCsbRK/JteKv0eo3ThkTTOen2t4="
 }
```
Response body: 

```json
{
    "registerStar": true,
    "status": {
        "address": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE",
        "requestTimestamp": 1540132977,
        "message": "1LRH7zdocBSyagsNAhveKXtQzGS9w4xJFE:1540132977:starRegistry",
        "validationWindow": 249,
        "messageSignature": "valid"
    }
}
```

Response body when error:

```json
{
    "error": "MESSAGE_VALIDATION_FAILED",
    "message": "Signature verification failed"
}
```
Errors: 
INVALID_WALLET_ADDRESS_IN_REQUEST || INVALID_SIGNATURE_IN_REQUEST || NO_PENDING_WALLIDATION_FOR_WALLET || VALIDATION_WINDOW_EXPIRES || MESSAGE_VALIDATION_FAILED

## Built With
* [crypto.js](https://www.npmjs.com/package/crypto-js) - go to cryptography library for node.js
* [leveldb](https://www.npmjs.com/package/level) - simple storage for applications
* [Express.js](http://expressjs.com) - lightweight and fast framework for making robust web services

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 



## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

