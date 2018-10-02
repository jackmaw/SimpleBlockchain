const express = require('express');
const router = express.Router();

const { getErrorResponse } = require('../utils/errorsHelper');
const { errorTypes } = require('../constants/errors');


function getRouter(Chain) {
    router
        .get('/:jobId', (req, res) => {
            const blockStatus = Chain.checkBlockStatus(req.params.jobId);

            if (!blockStatus) {
                res.status(404)
                    .json(getErrorResponse(errorTypes.BLOCK_NOT_FOUND_IN_MEMPOOL, ''));

            } else {
                res.status(200).json(blockStatus);
            }
        });

    return router;
}


module.exports = getRouter;

