'use strict';

/*
* IMP: Purely class created for holding unique data form each modbus parameter identifier
* Data will gets hold in this class for after some time frequency and saved in DB after that
* */

const appSettingsModel = require('../models/appSettingsModel');
const cron = require('node-cron');

const RealTimeDataController = require("../controllers/realTimeDataController");

let RTDASPacketDataHolderClassInst = null;

exports.getInstance = function () {
    if (!RTDASPacketDataHolderClassInst) {
        RTDASPacketDataHolderClassInst = new RTDASPacketDataHolderSingleton();
    }
    return RTDASPacketDataHolderClassInst;
};

exports.initializeInstance = function () {
    if (!RTDASPacketDataHolderClassInst) {
        RTDASPacketDataHolderClassInst = new RTDASPacketDataHolderSingleton();
    }
};

class RTDASPacketDataHolderSingleton {

    constructor() {
        this.packetDataHolder = new Map();
        this.packetSavingFrequency = appSettingsModel.getAppSettingsJsonData().packetSavingFrequency;   // value in seconds
        this.scheduleDataForSaving();
    }

    scheduleDataForSaving() {
        cron.schedule(this.packetSavingFrequency, this.onScheduleDataForSaving.bind(this));
    }

    onScheduleDataForSaving() {
        const allVesselsData = this.packetDataHolder;
        allVesselsData.forEach(function (individualVesselData, vesselId) {
            RealTimeDataController.saveRTDASPackets(individualVesselData, vesselId);
        });
    }

    processAndSetDataInHolder(packetData, vesselId) {
        let latestTimestamp;

        let currentVesselAllPacketData = this.getVesselAllPacketData(vesselId);
        for (let packet in packetData) {
            let tagsData = packetData[packet];
            if (tagsData) {
                for (let tag in tagsData) {
                    if (tag) {
                        let tagValue = tagsData[tag];
                        if (tagValue || tagValue === true || tagValue === false) {
                            if (tagValue === "NaN") {
                                currentVesselAllPacketData.set(tag, 0);
                            } else if (tagValue === true) {
                                currentVesselAllPacketData.set(tag, 'true');
                            } else if (tagValue === false){
                                currentVesselAllPacketData.set(tag, 'false');
                            } else {
                                currentVesselAllPacketData.set(tag, tagValue);
                            }

                            if (tag === "Timestamp") {
                                try {
                                    if (!latestTimestamp) {
                                        latestTimestamp = tagValue
                                    } else {
                                        let prevTimestamp = new Date(latestTimestamp).getTime();
                                        let currentTimestamp = new Date(tagValue).getTime();
                                        if (prevTimestamp < currentTimestamp) {
                                            latestTimestamp = tagValue;
                                        }
                                    }
                                } catch (e) {

                                }
                            }
                        } else {
                            if( tagValue == 0 ) {//tag data not present in currentvesselallpacketdata
                                currentVesselAllPacketData.set(tag, tagValue);
                            }
                        }
                    }
                }
            }
        }

        if (latestTimestamp) {
            currentVesselAllPacketData.set("Timestamp", latestTimestamp);
        }
    }

    setDataInHolder(key, value, vesselId) {
        let currentVesselAllPacketData = this.getVesselAllPacketData(vesselId);
        if (key && (value || value === true || value === false)) {
            currentVesselAllPacketData.set(key, value);
        }
    }

    getDataFromHolder(key, vesselId) {
        let val = "";
        let currentVesselAllPacketData = this.getVesselAllPacketData(vesselId);
        if (key && currentVesselAllPacketData.has(key)) {
            val = currentVesselAllPacketData.get(key);
        }
        return val;
    }

    getVesselAllPacketData(vesselId) {
        let allVesselPacketData = this.packetDataHolder;
        if (!allVesselPacketData.has(vesselId)) {
            allVesselPacketData.set(vesselId, new Map());
        }
        return allVesselPacketData.get(vesselId);
    }

}