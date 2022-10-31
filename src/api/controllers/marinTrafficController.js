'use strict';

const axios = require('axios');
const appSettingsModel = require('../models/appSettingsModel');

/*
* VOYAGE FORECAST API USE
* */

const fetchVoyageForecastData = async function (mmsiId) {
    const url = appSettingsModel.getAppSettingsJsonData().windyMapConfig.marineTraffic.apiUrl +
        + appSettingsModel.getAppSettingsJsonData().windyMapConfig.marineTraffic.key + "/"
        + "mmsi:" + mmsiId + "/"
        + "msgtype:extended/"
        + "protocol:jsono";

    return asyncPost(url, {});
};

const asyncPost = async (url, payload) => {
    try {
        const response = await axios.post(url, payload);
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        } else {
            console.log(response.error);
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = {
    fetchVoyageForecastData: fetchVoyageForecastData
};