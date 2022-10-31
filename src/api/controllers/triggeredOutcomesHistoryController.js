'use strict';

/*
* CRUD CONTROLLER
* */
const historyModel = require('../models/triggeredOutcomesHistoryModel');

const removeById = async function (historyId) {
    const result = await historyModel.deleteHistoryById(historyId);
    if (result > 0) {
        return "History deleted successfully!!!";
    } else {
        return "Error occurred while deleting a History!!!";
    }
};

module.exports = {
    removeById: removeById
};
