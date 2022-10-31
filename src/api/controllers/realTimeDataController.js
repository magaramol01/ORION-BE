'use strict';

const dateFormat = require('dateformat');
const _ = require('lodash');
const {Util} = require("../utils/util");

const RealTimeDataModel = require("../models/realTimeDataModel");
const RealTimeOneDayDataModel = require("../models/realTimeOneDayDataModel");
const RealTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");

const saveRTDASPackets = function (rtdasRealTimeDataArr, vesselId) {
    const receivedDataPacketsTime = Util.getNewDate();
    const formattedReceivedDataPacketsTime = dateFormat(receivedDataPacketsTime, Util.getCommonDateFormat());
    let stormGlassDataPacketTime;

    let dbObject = {};

    const currentPacket = _.cloneDeep(rtdasRealTimeDataArr);
    const packetTime = currentPacket.get("Timestamp");
    const formattedPacketTime = packetTime.replace(/T/, ' ').replace(/\..+/, '');

    dbObject["timeReceived"] = formattedReceivedDataPacketsTime;
    dbObject["vessel"] = vesselId;
    dbObject["packetTime"] = formattedPacketTime;

    currentPacket.delete("Timestamp");
    dbObject["packetData"] = JSON.stringify(Util.convertMapToJsonObj(rtdasRealTimeDataArr));

    if (currentPacket) {
        RealTimeDataModel.save(dbObject);
        RealTimeOneDayDataModel.save(dbObject);
    } else {
        return "Current packet data can not be store!!!";
    }

    if (currentPacket.has("AIVDO_Latitude") && currentPacket.get("AIVDO_Latitude") && currentPacket.has("AIVDO_Longitude") && currentPacket.get("AIVDO_Longitude")) {
        stormGlassDataPacketTime = _.cloneDeep(formattedPacketTime);
    }

    if (vesselId && stormGlassDataPacketTime) {
        saveStormGlassDataInPacketFormat(vesselId, formattedReceivedDataPacketsTime, stormGlassDataPacketTime);
    }

};

const saveStormGlassDataInPacketFormat = function (vesselId, timeReceived, formattedPacketTime) {
    const vesselData = RealTimeParameterDataHolder.getAllDataByVesselId(vesselId);

    if (vesselData && Object.keys(vesselData).length > 0) {
        const packetData = {
            "stormGlassWaveDirection": vesselData["stormGlassWaveDirection"],
            "stormGlassWaveHeight": vesselData["stormGlassWaveHeight"],
            "stormGlassSwellDirection": vesselData["stormGlassSwellDirection"],
            "stormGlassSwellHeight": vesselData["stormGlassSwellHeight"],
            "stormGlassWindSpeed": vesselData["stormGlassWindSpeed"],
            "stormGlassWindDirection": vesselData["stormGlassWindDirection"],
            "stormGlassCurrentSpeed": vesselData["stormGlassCurrentSpeed"],
            "stormGlassCurrentDirection": vesselData["stormGlassCurrentDirection"],
            "stormGlassSwellPeriod": vesselData["stormGlassSwellPeriod"],
            "stormGlassWindWaveHeight": vesselData["stormGlassWindWaveHeight"],
            "stormGlassWindWavePeriod": vesselData["stormGlassWindWavePeriod"]
        };

        if (packetData) {
            let dbObject = {};

            dbObject["timeReceived"] = timeReceived;
            dbObject["vessel"] = vesselId;
            dbObject["packetTime"] = formattedPacketTime;
            dbObject["packetData"] = JSON.stringify(packetData);

            RealTimeDataModel.save(dbObject);
            RealTimeOneDayDataModel.save(dbObject);
        } else {
            return "Storm Glass packet data can not be store!!!";
        }
    }

};

module.exports = {
    saveRTDASPackets: saveRTDASPackets
};