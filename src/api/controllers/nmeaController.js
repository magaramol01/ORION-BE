'use strict';

const appSettingsModel = require('../models/appSettingsModel');
const _ = require('lodash');
const dateFormat = require('dateformat');
const VoyageForecastModel = require("../models/voyageForecastModel");
const StormGlassWeatherModel = require("../models/stormGlassWeatherModel");
const ShipController = require("./shipController");

const {fetchVoyageForecastData} = require("./marinTrafficController");
const {fetchWeatherData} = require("./stormGlassController");
const rtdasController = require("../controllers/rtdasController");
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");
const RealTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");
const VesselJourneyCounterModel = require("../models/vesselJourneyCounterModel");
const {Util} = require("../utils/util");
const RTDASController = new rtdasController();

class NMEAController {

    constructor() {
        this.nmeaDataHolder = {};
        this.travelledPathPointPlottingTime = appSettingsModel.getAppSettingsJsonData().windyMapConfig.travelledPathPointPlottingTime;  // time is in minutes
    }

    consumeNMEAData(request) {
        let data = request.body;
        Util.printLog("Data received in consumeNMEAData");

        let nmeaData = {};
        let nmeaDataArr;

        let incomingDataShipName = Object.keys(data)[0];
        incomingDataShipName = Util.getVesselIdentifier(incomingDataShipName);

        nmeaDataArr = Object.values(data)[0];
        nmeaData[incomingDataShipName] = nmeaDataArr;

        // let fileName = dateFormat(Date(), "yyyy-mm-dd-H:MM:ss");
        // Util.writeJsonFile('./AIPLData/' + fileName + '.json', nmeaData);

        request.body = nmeaData;

        RTDASController.consumeRTDASMappingFromJson(request);
    };

    processNMEATypeData(vesselName, vesselId, rtdasPacketData) {
        const incomingDataShipName = vesselName;
        const incomingDataVesselId = vesselId;

        let nmeaRequiredData = {};
        let shouldSave = false;
        let savingFormattedPacketTime;

        if (rtdasPacketData.has("AIVDO_Latitude") && rtdasPacketData.get("AIVDO_Latitude") && rtdasPacketData.has("AIVDO_Longitude") && rtdasPacketData.get("AIVDO_Longitude")) {  // 'GPGLL_1' for vessels Latitude AND 'GPGLL_3' for vessels Longitude
            const packetTimeOriginal = rtdasPacketData.get("Timestamp");
            const packetTime = packetTimeOriginal.split("+")[0];
            const formattedPacketTime = dateFormat(packetTime, Util.getCommonDateFormat());

            const lastTravelledPathTime = this.getLastTravelledPathTime(incomingDataVesselId);
            const timeDiff = this.getDiffBetweenDatesInMinutes(lastTravelledPathTime, formattedPacketTime);

            if (timeDiff > this.travelledPathPointPlottingTime) {
                console.log("red point data saved in "+vesselId);
                shouldSave = true;
                savingFormattedPacketTime = _.cloneDeep(formattedPacketTime);
                this.setLastTravelledPathTime(formattedPacketTime, incomingDataVesselId);

                let GPGLL_1val = rtdasPacketData.get("AIVDO_Latitude");
                nmeaRequiredData["AIVDO_Latitude"] = Util.getScaledValue(GPGLL_1val, incomingDataVesselId, "AIVDO_Latitude","2");
                let GPGLL_2val = rtdasPacketData.get("AIVDO_Latitude_Direction");
                nmeaRequiredData["AIVDO_Latitude_Direction"] = Util.getScaledValue(GPGLL_2val, incomingDataVesselId, "AIVDO_Latitude_Direction","2");
                let GPGLL_3val = rtdasPacketData.get("AIVDO_Longitude");
                nmeaRequiredData["AIVDO_Longitude"] = Util.getScaledValue(GPGLL_3val, incomingDataVesselId, "AIVDO_Longitude","2");
                let GPGLL_4val = rtdasPacketData.get("AIVDO_Longitude_Direction");
                nmeaRequiredData["AIVDO_Longitude_Direction"] = Util.getScaledValue(GPGLL_4val, incomingDataVesselId, "AIVDO_Longitude_Direction","2");
            }

            Util.printLog("PacketTime :: " + packetTimeOriginal + " FormattedPacketTime :: " + formattedPacketTime + " LastTravelledPathTime :: " + lastTravelledPathTime);
        }
        if (rtdasPacketData.has("GPVTG_5") && rtdasPacketData.get("GPVTG_5")) {
            let GPVTG_5val = rtdasPacketData.get("GPVTG_5");
            nmeaRequiredData["GPVTG_5"] = Util.getScaledValue(GPVTG_5val, incomingDataVesselId, "GPVTG_5","2");
            RealTimeParameterDataHolder.setDataByKey(incomingDataVesselId, "GPVTG_5", rtdasPacketData.get("GPVTG_5"));
        }
        if (rtdasPacketData.has("HEHDT_1") && rtdasPacketData.get("HEHDT_1")) {
            let HEHDT_1val = rtdasPacketData.get("HEHDT_1");
            nmeaRequiredData["HEHDT_1"] = Util.getScaledValue(HEHDT_1val, incomingDataVesselId, "HEHDT_1","2");
        } else {
            const prevVesselHeading = RealTimeParameterDataHolder.getDataByKey(incomingDataVesselId, "HEHDT_1");
            if (prevVesselHeading) {
                nmeaRequiredData["HEHDT_1"] = prevVesselHeading;
            }
        }

        if (shouldSave) {
            this.prepareAndSaveWindyMapData(incomingDataShipName, incomingDataVesselId, savingFormattedPacketTime, nmeaRequiredData);
        }
    }

    getLastTravelledPathTime(vesselId) {
        const shipData = this.nmeaDataHolder[vesselId];
        if (shipData && shipData.lastTravelledPathTime) {
            return shipData.lastTravelledPathTime;
        }
        const respectedTimeZoneDate = Util.getNewDate();
        this.nmeaDataHolder[vesselId] = {
            lastTravelledPathTime: dateFormat(respectedTimeZoneDate, Util.getCommonDateFormat())
        };
        return this.nmeaDataHolder[vesselId].lastTravelledPathTime;
    }

    setLastTravelledPathTime(lastTravelledPathTime, vesselId) {
        let shipData = this.nmeaDataHolder[vesselId];
        if (!shipData) {
            shipData = {};
            shipData.lastTravelledPathTime = dateFormat(new Date(), Util.getCommonDateFormat());
        } else {
            shipData.lastTravelledPathTime = lastTravelledPathTime;
        }
    }

    async prepareAndSaveWindyMapData(shipName, vesselId, formattedPacketTime, nmeaData) {
        let currentShipMmsi = null; // fetch it from database
        const allShipsData = await ShipController.getAllData();
        for (let k in allShipsData) {
            if (allShipsData.hasOwnProperty(k)) {
                const currentShipData = allShipsData[k];
                if (!currentShipMmsi && shipName === currentShipData.MappingName) {
                    currentShipMmsi = currentShipData.Mmsi;
                    break;
                }
            }
        }

        // Marine Traffic Data Logic
        let voyageForecastData = {};
        // const existingVoyageForecastData = await VoyageForecastModel.getVoyageForecastDataByShipName(shipName);
        // if (existingVoyageForecastData.length < 1) { // TODO : Temp for deployment commented this
        if (false) {
            const voyageForecastResponse = await fetchVoyageForecastData(currentShipMmsi);

            if (voyageForecastResponse != null) {
                voyageForecastData = voyageForecastResponse[0];
                voyageForecastData.vesselId = vesselId;
                voyageForecastData.createdTs = dateFormat(new Date(), Util.getCommonDateFormat());
                voyageForecastData.packetTs = formattedPacketTime;

                VoyageForecastModel.insertData(voyageForecastData);
            }
        }

        // Storm Glass Data Logic
        let currentLocationLat = nmeaData["AIVDO_Latitude"];
        const currentLocationLatDirection = nmeaData["AIVDO_Latitude_Direction"];
        let currentLocationLong = nmeaData["AIVDO_Longitude"];
        const currentLocationLongDirection = nmeaData["AIVDO_Longitude_Direction"];
        const currentSpeedOverGround = nmeaData["GPVTG_5"];
        const currentVesselHeading = nmeaData["HEHDT_1"];

        let correctedLat = this.getCorrectedDataPoint(currentLocationLat, currentLocationLatDirection);
        let correctedLng = this.getCorrectedDataPoint(currentLocationLong, currentLocationLongDirection);

        let currentPacketTimeWeatherData;
        const stormGlassWeatherDataResponse = await fetchWeatherData(correctedLat, correctedLng, formattedPacketTime);
        if (stormGlassWeatherDataResponse != null) {
            const weatherDataHrs = stormGlassWeatherDataResponse.hours;

            let currentPacketTimeMatchingDataIndex = 0;
            for (let i = 0; i < weatherDataHrs.length; i++) {
                const timePacket = weatherDataHrs[i];
                if (dateFormat(timePacket.time.split("+")[0], "yyyy-mm-dd H") === dateFormat(formattedPacketTime, "yyyy-mm-dd H")) {
                    currentPacketTimeMatchingDataIndex = i;
                    break;
                }
            }

            currentPacketTimeWeatherData = weatherDataHrs[currentPacketTimeMatchingDataIndex];
            this.setWeatherDataInRealTimeParameterDataHolder(vesselId, currentPacketTimeWeatherData);
        } else {
            currentPacketTimeWeatherData = {};
        }

        const counter = VesselJourneyCounterModel.getVesselJourneyCounterByVesselId(vesselId);

        let currentLocationWeatherData = {};
        if(currentLocationLat < 0 ) {
            currentLocationLat = -1 * currentLocationLat;
        }
        if(currentLocationLong < 0 ) {
            currentLocationLong = -1 * currentLocationLong;
        }
        currentLocationWeatherData.lat = currentLocationLat;
        currentLocationWeatherData.long = currentLocationLong;
        currentLocationWeatherData.weatherData = JSON.stringify(currentPacketTimeWeatherData);
        currentLocationWeatherData.nmeaData = JSON.stringify({
            "sog": currentSpeedOverGround,
            "vesselHeading": currentVesselHeading,
            "latDirection": currentLocationLatDirection,
            "longDirection": currentLocationLongDirection
        });
        currentLocationWeatherData.vesselId = vesselId;
        currentLocationWeatherData.createdTs = dateFormat(Util.getNewDate(), Util.getCommonDateFormat());
        currentLocationWeatherData.packetTs = formattedPacketTime;
        currentLocationWeatherData.journeyCounter = counter;

        StormGlassWeatherModel.insertData(currentLocationWeatherData);

        WebSocketAdaptor.emitDataOnSocket("subscribeToDashboard", {otherData: {
                "marineTrafficData": voyageForecastData,
                "stormGlassWeatherData": currentLocationWeatherData,
                "shipName": shipName,
                "vesselId": vesselId
            }}, vesselId);

        WebSocketAdaptor.emitDataOnSocket("subscribeToFleetDashboard", {otherData: {
                "marineTrafficData": voyageForecastData,
                "stormGlassWeatherData": currentLocationWeatherData,
                "shipName": shipName,
                "vesselId": vesselId
            }}, vesselId);
             //-------------------Subscribe to Compass -----------------
         WebSocketAdaptor.emitDataOnSocket("subscribeToCompass", {otherData: {
            "marineTrafficData": voyageForecastData,
            "stormGlassWeatherData": currentLocationWeatherData,
            "shipName": shipName,
            "vesselId": vesselId
        }}, vesselId);
            
    }

    async getWindyMapData(request, reply) {
        let windyMapData = {};

        const vesselId = parseInt(request.query.vesselId);

        const journeyCounter = VesselJourneyCounterModel.getVesselJourneyCounterByVesselId(vesselId);

        let voyageForecastData = await VoyageForecastModel.getVoyageForecastJsonDataByVesselId(vesselId);
        if (voyageForecastData) {
            windyMapData.marineTrafficData = {
                portToPortData: voyageForecastData
            };
        }

        let stormGlassWeatherData = await StormGlassWeatherModel.getWeatherDataByVesselIdAndJourneyCounterWithVesselId(vesselId, journeyCounter);
        if (stormGlassWeatherData.length > 0) {
            windyMapData.stormGlassData = {
                data: stormGlassWeatherData
            };
            this.setWeatherDataInRealTimeParameterDataHolder(vesselId, stormGlassWeatherData[stormGlassWeatherData.length - 1].weatherData);
        }

        let mapTooltipConfigurationData = appSettingsModel.getAppSettingsJsonData().mapTooltipConfiguration;
        windyMapData.mapTooltipConfiguration = mapTooltipConfigurationData;

        return windyMapData;
    };

    async getAllVesselsWindyMapData() {
        let allVesselsWindyMapData = {};
        const ignoredvessels = appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter;

        let voyageForecastData = VoyageForecastModel.getVoyageForecastJsonData();
        if (voyageForecastData) {
            const allVesselMarinData = Object.values(voyageForecastData);
            const filterMarinData = _.remove(allVesselMarinData,function (o){
                return !ignoredvessels.includes(o.vesselId);
            })
            allVesselsWindyMapData.marineTrafficData = filterMarinData;
        }

        let stormGlassWeatherData = await StormGlassWeatherModel.getAllVesselsLatestWeatherData();
        if (stormGlassWeatherData.length > 0) {
            const allStormGlassWeatherData = stormGlassWeatherData;  //take in new object because of not change memory object
            const filterSormGlassWeatherData = _.remove(allStormGlassWeatherData,function (o){
                return !ignoredvessels.includes(o.vesselId);
            })
            allVesselsWindyMapData.stormGlassData = filterSormGlassWeatherData;
        }

        let mapTooltipConfigurationData = appSettingsModel.getAppSettingsJsonData().mapTooltipConfiguration;
        allVesselsWindyMapData.mapTooltipConfiguration = mapTooltipConfigurationData;

        return allVesselsWindyMapData;
    }

    getDiffBetweenDatesInMinutes(startDate, endDate) {
        let diff = new Date(endDate).getTime() - new Date(startDate).getTime();
        return (diff / 60000);
    }

    setWeatherDataInRealTimeParameterDataHolder(vesselId, weatherData) {
        const stormGlassWaveDirection = weatherData.waveDirection ? weatherData.waveDirection.sg : "";
        const stormGlassWaveHeight = weatherData.waveHeight ? weatherData.waveHeight.sg : "";
        const stormGlassSwellDirection = weatherData.swellDirection ? weatherData.swellDirection.sg : "";
        const stormGlassSwellHeight = weatherData.swellHeight ? weatherData.swellHeight.sg : "";
        const stormGlassWindSpeed = weatherData.windSpeed ? weatherData.windSpeed.sg : "";
        const stormGlassWindDirection = weatherData.windDirection ? weatherData.windDirection.sg : "";
        const stormGlassCurrentSpeed = weatherData.currentSpeed ? weatherData.currentSpeed.sg : "";
        const stormGlassCurrentDirection = weatherData.currentDirection ? weatherData.currentDirection.sg : "";
        const stormGlassSwellPeriod = weatherData.swellPeriod ? weatherData.swellPeriod.sg : "";
        const stormGlassWindWaveHeight = weatherData.windWaveHeight ? weatherData.windWaveHeight.sg : "";
        const stormGlassWindWavePeriod = weatherData.windWavePeriod ? weatherData.windWavePeriod.sg : "";

        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWaveDirection", stormGlassWaveDirection);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWaveHeight", stormGlassWaveHeight);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassSwellDirection", stormGlassSwellDirection);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassSwellHeight", stormGlassSwellHeight);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWindSpeed", stormGlassWindSpeed);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWindDirection", stormGlassWindDirection);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassCurrentSpeed", stormGlassCurrentSpeed);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassCurrentDirection", stormGlassCurrentDirection);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassSwellPeriod", stormGlassSwellPeriod);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWindWaveHeight", stormGlassWindWaveHeight);
        RealTimeParameterDataHolder.setDataByKey(vesselId, "stormGlassWindWavePeriod", stormGlassWindWavePeriod);
    }

    getCorrectedDataPoint(dataPoint, dataPointDirection) {
        if (dataPoint && dataPointDirection && (dataPointDirection.toLowerCase() === "s" || dataPointDirection.toLowerCase() === "w")) {
            return "-" + dataPoint;
        }
        return dataPoint;
    };

}

class NMEAControllerSingleton {

    constructor() {
        if (!NMEAControllerSingleton.instance) {
            NMEAControllerSingleton.instance = new NMEAController();
        }
    }

    static getInstance() {
        if (!NMEAControllerSingleton.instance) {
            NMEAControllerSingleton.instance = new NMEAController();
        }
        return NMEAControllerSingleton.instance;
    }
}

module.exports = NMEAControllerSingleton;