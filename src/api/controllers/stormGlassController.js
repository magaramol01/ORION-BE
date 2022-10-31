'use strict';

const axios = require('axios');
const appSettingsModel = require('../models/appSettingsModel');
const dateFormat = require('dateformat');
const {Util} = require("../utils/util");

/*
* STORM GLASS CURRENT OR FORECAST WEATHER DATA FETCHING API
* */

const fetchWeatherData = async (lat, lng, packetTime) => {
    const params =
        'waveDirection,' +
        'waveHeight,' +
        'swellDirection,' +
        'swellHeight,' +
        'windSpeed,' +
        'windDirection,' +
        'currentSpeed,' +
        'currentDirection,' +
        'swellPeriod,' +
        'windWaveHeight,' +
        'windWavePeriod';

    const endDateInMillis = new Date(packetTime).setDate(new Date(packetTime).getDate() + 1);
    const startUTC = dateFormat(packetTime, "yyyy-m-dd");
    const endUTC = dateFormat(new Date(endDateInMillis), "yyyy-m-dd");

    const config = {
        headers: {
            'Authorization': appSettingsModel.getAppSettingsJsonData().windyMapConfig.stormGlass.key
        }
    };

    return await asyncGetRequest(appSettingsModel.getAppSettingsJsonData().windyMapConfig.stormGlass.apiUrl + '/weather/point?lat='+ lat + '&lng=' + lng + '&params=' + params + '&start=' + startUTC + '&end=' + endUTC, config);
};

const asyncGetRequest = async (url, config) => {
    Util.printLog("Fetching data from storm glass :: " + url);

    return await axios.get(url, config)
        .then(async (response) => {
            if(appSettingsModel.getAppSettingsJsonData().isRequireWindyLogs){
                console.log("response windy data object is :: ",response.data);
            }
            return await response.data;
        })
        .catch(async (error) => {
            console.log(error);
            return await null;
        });
};

module.exports = {
    fetchWeatherData: fetchWeatherData
};