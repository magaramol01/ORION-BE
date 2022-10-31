'use strict';

const fs = require('fs');

const serverPath = './../appSettings2.json';
const localPath = __dirname + '/../../config/appSettings.json';
const filePath = serverPath;

let file = fs.readFileSync(filePath);
let appSettingsJsonData = JSON.parse(file);

fs.watchFile(filePath, function (curr, prev) {
    const previousEmailSchedulerTimeOut = appSettingsJsonData.emailSchedulerTimeout;

    file = fs.readFileSync(filePath);
    appSettingsJsonData = JSON.parse(file);

    const newEmailSchedulerTimeOut = appSettingsJsonData.emailSchedulerTimeout;

    if (previousEmailSchedulerTimeOut !== newEmailSchedulerTimeOut) {
        const scheduleEmail = require('../mappers/scheduleEmail');
        let se = scheduleEmail.getInstance();
        se.removeInterval();
        se.scheduleEmail()
    }
});

exports.getAppSettingsJsonData = function () {
    return appSettingsJsonData;
};