'use strict';

const {sendMail} = require("../adaptors/mailer");
const dateFormat = require('dateformat');
const appSettingsModel = require('../models/appSettingsModel');
const {Util} = require("../../api/utils/util");
const ShipModel = require('../models/shipModel');

let emailSchedulerData = {};

class ScheduleEmail {

    constructor() {
        this.scheduleEmail();
    }

    setEmailSchedulerData(vesselId, timestamp) {
        emailSchedulerData[vesselId] = timestamp;
    }

    validateAndSetEmailSchedulerData(vesselId, timestamp) {  // this will avoid unnecessary sending mail to testing vessels
        if (emailSchedulerData[vesselId]) {
            emailSchedulerData[vesselId] = timestamp;
        }
    }

    scheduleEmail() {
        this.intervalId = setInterval(this.checkTimestamp, appSettingsModel.getAppSettingsJsonData().emailSchedulerTimeout)
    }

    removeInterval() {
        clearInterval(this.intervalId);
    }

    removeEmailSchedulerForVesselId(vesselId) {
        delete emailSchedulerData[vesselId];
    }

    checkTimestamp() {
        if (appSettingsModel.getAppSettingsJsonData().schedulerEmailIDS.isScheduled) {
            const currentTimestamp = Util.getNewDate();

            if (Object.keys(emailSchedulerData).length !== 0) {
                Object.entries(emailSchedulerData).map(([vesselId, dataReceiveTimestamp]) => {

                    let difference = Math.abs(currentTimestamp - dataReceiveTimestamp) / 1000;
                    let minutes = Math.floor(difference / 60) % 60;

                    if (minutes >= 10) {
                        console.log("Checking Timestamp for Email Scheduling");
                        const vesselName = ShipModel.getShipMappingNameById(Number(vesselId));
                        if (!(appSettingsModel.getAppSettingsJsonData().schedulerEmailIDS.ignoreVesselForAlert.includes(vesselName))) {
                            const dataReceiveTimestampForMail = dateFormat(dataReceiveTimestamp, Util.getCommonDateFormat());
                            const subjectInfo = 'Alert: Vessel ' + vesselName + ' Data Not Received';
                            const messageText = 'Dear Sir,<br><br>' +
                                'Vessel ' + vesselName + ' has not been sending data on (52 instance) to Smartship cloud since ' + dataReceiveTimestampForMail + ' (Singapore).<br>' +
                                'Contact your IT team for support.';
                            sendMail(appSettingsModel.getAppSettingsJsonData().schedulerEmailIDS.to, appSettingsModel.getAppSettingsJsonData().schedulerEmailIDS.cc, subjectInfo, messageText, 'jdkk');
                        }
                    }
                })
            }
        }
    }
}

class ScheduleEmailSingleton {

    constructor() {
        if (!ScheduleEmailSingleton.instance) {
            ScheduleEmailSingleton.instance = new ScheduleEmail();
        }
    }

    static getInstance() {
        if (!ScheduleEmailSingleton.instance) {
            ScheduleEmailSingleton.instance = new ScheduleEmail();
        }
        return ScheduleEmailSingleton.instance;
    }

}

module.exports = ScheduleEmailSingleton;