'use strict';

const CharterPartyFormModel = require("../models/charterPartyFormModel");
const dateFormat = require('dateformat');
const {Util} = require("../utils/util");

const create = async function (request) {
    request.body.timestamp = dateFormat(Util.getNewDate(), Util.getCommonDateFormat());

    const dbCreateResponse = await CharterPartyFormModel.insertData(request.body);
        if(dbCreateResponse) {
            return "Charter Party Data Saved";
        }
        else{
            return "Failed to save Charter Party Data";
        }
}

module.exports = {
    create: create
}