'use strict';

const appSettingsModel = require('../models/appSettingsModel');
const _ = require("lodash");
const UserController = require("../controllers/UserController");
const ShipController = require("../controllers/ShipController");
const MRVNoonReportModel = require('../models/mrvNoonReportModel');
const CIIStateJsonnew = require('../../../configured_data/Data/CII_new.json')
const {fillMrvReportData} = require('../controllers/mrvNoonReportController')



let allTimestamp = {};
const dateFormat = require('dateformat');
const WidgetsParametersModel = require("../models/widgetsParametersModel");
const UserWidgetsParametersModel = require("../models/userWidgetsParametersModel");
const AudiTrailModel = require("../models/auditTrailModel");
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");
const { Util } = require("../utils/util");
const graphData = require("./graphUnitData");
const parameterScalingMapper = require("../mappers/parameterScalingMapper");
const DashboardStateJson = require("../../../configured_data/Data/newTesting1");
const XpressMEStateJson = require("../../../configured_data/Data/xpress_me");
const AsiaMEStateJson = require("../../../configured_data/Data/asia_me");
const BataviaMEStateJson = require("../../../configured_data/Data/batavia_me.json");
const MainEngineStateJson = require("../../../configured_data/Data/newTesting2");
const MainGaugesStateJson = require("../../../configured_data/Data/newTesting");
const NanjingMEStateJson = require("../../../configured_data/Data/nanjing_me.json");
const SparIndusMEStateJson = require("../../../configured_data/Data/sparIndus.json");
const RealTimeParameterDataHolder = require("../mappers/realTimeParameterDataHolder");
const mrvNoonReportController = require("../controllers/mrvNoonReportController");
const ShipModel = require("../models/shipModel");
const widgetMappingModel = require("../models/widgetMappingModel");
const DigitalAlarmStateJson = require("../../../configured_data/Data/digitalAlarm");
const CompassStateJson = require("../../../configured_data/Data/compass.json");

let allDashboardStateJson = {};
let allMainEngineStateJson = {};
let allMainGaugesStateJson = {};
let allDigitalAlarmStateJson = {};
let allCompassStateJson = {};

const create = async function (request) {
    const widgetsParametersData = request.body;

    const widgetsParametersMappingData = {
        name: widgetsParametersData.name,
        type: widgetsParametersData.type,
        screen: widgetsParametersData.screen,
        socketId: widgetsParametersData.socketId,
        layout: JSON.stringify(widgetsParametersData.layout),
        configuration: JSON.stringify(widgetsParametersData.configuration)
    };

    const result = await WidgetsParametersModel.saveWidgetsParameters(widgetsParametersMappingData);

    if (result.inserted > 0) {
        const auditTrailInfo = Util.getAuditTrailInfo("create", "Widgets Parameters Mapping", widgetsParametersData.name);
        AudiTrailModel.saveAuditTrail({
            userId: request.session.user.id,
            ipAddress: request.ip,
            action: auditTrailInfo.actionMsg,
            description: auditTrailInfo.descMsg
        });

        return "Widgets Parameters Mapping created successfully!!!";
    } else {
        return "Error occurred while creating a Widgets Parameters Mapping!!!";
    }
};

const readById = async function (request) {
    const widgetId = request.query.widgetId;
    return await WidgetsParametersModel.getWidgetParametersById(widgetId);
};

const readAll = async function () {
    //return await WidgetsParametersModel.getWidgetsParameters();
    //return await WidgetsParametersModel.getWidgetsParametersJsonData();
};

const readAllDashboard = async function () {
    //return await WidgetsParametersModel.getWidgetsParametersBySocketId("subscribeToDashboard");
    return DashboardStateJson;
};

const traversedJsonFileToAddData = async function (jsonObj, vesseldataMap) {
    for (let key in jsonObj) {
        if (!jsonObj.hasOwnProperty(key)) {
            continue;
        }
        let currentObj = jsonObj[key];
        if (key === "widgetData") {
            let widgetId = jsonObj[key]["widgetId"];
            console.log("current widget Id " + widgetId);
            if (!!vesseldataMap.get(widgetId)) {
                const widgetData = vesseldataMap.get(widgetId);
                let valueDisplay = " ";
                if (widgetData["tag"].startsWith('*')) {
                    valueDisplay = widgetData["tag"].replace('*', '');
                } else {
                    valueDisplay = "mapping_@_" + widgetData["tag"];
                }
                jsonObj[key]["caption"] = widgetData["caption"];
                jsonObj[key]["value"] = valueDisplay;
                jsonObj[key]["unit"] = widgetData["unit"];
                jsonObj[key]["precision"] = widgetData["precision"];
                jsonObj[key]["startValue"] = widgetData["startValue"];
                jsonObj[key]["endValue"] = widgetData["endValue"];
                jsonObj[key]["minValue"] = widgetData["minValue"];
                jsonObj[key]["maxValue"] = widgetData["maxValue"];
                jsonObj[key]["lowerBoundValue"] = widgetData["lowerBoundValue"];
                jsonObj[key]["upperBoundValue"] = widgetData["upperBoundValue"];
                jsonObj[key]["hideMinValue"] = widgetData["hideMinValue"];
                jsonObj[key]["hideMaxValue"] = widgetData["hideMaxValue"];
                jsonObj[key]["digitalData"] = widgetData["digitalData"];
            }
        }
        if (currentObj !== null && typeof (currentObj) == "object") {
            await traversedJsonFileToAddData(jsonObj[key], vesseldataMap);
        }
    }
}

const loadAllFilesStateJsonsInMemory = async function () {
    let allWidgetMappingData = widgetMappingModel.getAllWidgetTagMappingJsonData();
    let allvesselData = ShipModel.getAllVesselsData();
    for (let i = 0; i < allvesselData.length; i++) {
        let vesselid = allvesselData[i].id;
        let DashboardStateJsonCopy = _.cloneDeep(DashboardStateJson);
        let MainEngineStateJsonCopy = _.cloneDeep(MainEngineStateJson);
        let MainGaugesStateJsonCopy = _.cloneDeep(MainGaugesStateJson)
        let DigitalAlarmStateJsonCopy=_.cloneDeep(DigitalAlarmStateJson);
        let CompassStateJsonCopy = _.cloneDeep(CompassStateJson);
        if (allWidgetMappingData.hasOwnProperty(vesselid)) {
            await traversedJsonFileToAddData(DashboardStateJsonCopy, allWidgetMappingData[vesselid]);
            allDashboardStateJson[vesselid] = DashboardStateJsonCopy;
            await traversedJsonFileToAddData(MainEngineStateJsonCopy, allWidgetMappingData[vesselid]);
            allMainEngineStateJson[vesselid] = MainEngineStateJsonCopy;
            await traversedJsonFileToAddData(MainGaugesStateJsonCopy, allWidgetMappingData[vesselid]);
            allMainGaugesStateJson[vesselid] = MainGaugesStateJsonCopy;
            await traversedJsonFileToAddData(DigitalAlarmStateJsonCopy,allWidgetMappingData[vesselid]);
            allDigitalAlarmStateJson[vesselid] = DigitalAlarmStateJsonCopy;
            allCompassStateJson[vesselid] = CompassStateJsonCopy;
            
        } else {
            allDashboardStateJson[vesselid] = DashboardStateJsonCopy;
            allMainEngineStateJson[vesselid] = MainEngineStateJsonCopy;
            allMainGaugesStateJson[vesselid] = MainGaugesStateJsonCopy;
            allDigitalAlarmStateJson[vesselid] = DigitalAlarmStateJsonCopy;
            allCompassStateJson[vesselid] = CompassStateJsonCopy;
        }
    }
    console.log(allDashboardStateJson);
}

const getMainEngineStateJsonByVesselId = function (vesselId) {
    return allMainEngineStateJson[vesselId];
}

const setMainEngineStateJsonByVesselId = function (vesselId, MainEngineStateJson) {
    allMainEngineStateJson[vesselId] = MainEngineStateJson;
}

const getMainGaugesStateJsonByVesselId = function (vesselId) {
    return allMainGaugesStateJson[vesselId];
}

const setMainGaugesStateJsonByVesselId = function (vesselId, MainGaugesStateJson) {
    allMainGaugesStateJson[vesselId] = MainGaugesStateJson;
}

const getDashboardStateJsonByVesselId = function (vesselId) {
    let checkJson = { ...allDashboardStateJson[vesselId] };
    if (vesselId === 6) //change id according to requested vessle id
    {
        if (checkJson.widget_3.configuration.body.data.carousel1.acc1.noOfGaugesInRow != undefined) {
            checkJson.widget_3.configuration.body.data.carousel1.acc1.noOfGaugesInRow = 5;
        }
        if (checkJson.widget_3.configuration.body.data.carousel1.acc1.gaugesData.gauge6 != undefined) {
            delete checkJson.widget_3.configuration.body.data.carousel1.acc1.gaugesData['gauge6'];
        }
    }
    return checkJson;
}
const setDashboardStateJsonByVesselId = function (vesselId, DashboardJsonData) {
    allDashboardStateJson[vesselId] = DashboardJsonData;
}

const getDigitalAlarmStateJsonByVesselId = function (vesselId) {
    return allDigitalAlarmStateJson[vesselId];
}

const setDigitalAlarmStateJsonByVesselId = function(vesselId,DigitalAlarmStateJson) {
    allDigitalAlarmStateJson[vesselId] = DigitalAlarmStateJson;
}

const readAllXpressME = async function () {
    return XpressMEStateJson;
};
const readAllAsiaME = async function () {
    return AsiaMEStateJson;
};
const readAllbataviaME = async function () {
    return BataviaMEStateJson;
};


const readAllDigitalAlarmME = async function () {
    return DigitalAlarmStateJson;
};

const readAllMainEngine = async function () {
    //return await WidgetsParametersModel.getWidgetsParametersBySocketId("subscribeToMainEngine");
    return MainEngineStateJson;
};

const readAllMainGauges = async function () {
    //return await WidgetsParametersModel.getWidgetsParametersBySocketId("subscribeToMainGauges");
    return MainGaugesStateJson;
};

const readAllNanjingME = async function () {
    return NanjingMEStateJson;
};

const readAllSparIndusME = async function () {
    //return await WidgetsParametersModel.getWidgetsParametersBySocketId("subscribeToMainGauges");
    return SparIndusMEStateJson;
};

const prepareDashboardData = async function (liveParametersData, vesselId) {
    const socketPool = WebSocketAdaptor.getSocketPool();

    allTimestamp[vesselId] = liveParametersData.get("Timestamp");

    const xpressMEJsonDataMainEngine = _.cloneDeep(await readAllXpressME());
    const asiaMEJsonDataMainEngine = _.cloneDeep(await readAllAsiaME());
    const digitalAlarmJsonData = _.cloneDeep(await allDigitalAlarmStateJson[vesselId]);
    const widgetsParametersJsonDataDashboard = _.cloneDeep(await allDashboardStateJson[vesselId]);
    const widgetsParametersJsonDataMainEngine = _.cloneDeep(await allMainEngineStateJson[vesselId]);
    const widgetsParametersJsonDataMainGauges = _.cloneDeep(await allMainGaugesStateJson[vesselId]);
    const nanjingMEJsonDataMainEngine = _.cloneDeep(await readAllNanjingME());
    const bataviaMEJsonDataMainEngine = _.cloneDeep(await readAllbataviaME());
    const sparIndusMEJsonDataMainEngine = _.cloneDeep(await readAllSparIndusME());


    traverseNestedTillLastNode(widgetsParametersJsonDataDashboard, liveParametersData, vesselId);
    traverseNestedTillLastNode(xpressMEJsonDataMainEngine, liveParametersData, vesselId);
    traverseNestedTillLastNode(asiaMEJsonDataMainEngine, liveParametersData, vesselId);
    traverseNestedTillLastNode(digitalAlarmJsonData, liveParametersData, vesselId);
    traverseNestedTillLastNode(widgetsParametersJsonDataMainEngine, liveParametersData, vesselId);
    traverseNestedTillLastNode(widgetsParametersJsonDataMainGauges, liveParametersData, vesselId);
    traverseNestedTillLastNode(nanjingMEJsonDataMainEngine, liveParametersData, vesselId);
    traverseNestedTillLastNode(bataviaMEJsonDataMainEngine, liveParametersData, vesselId);
    traverseNestedTillLastNode(sparIndusMEJsonDataMainEngine, liveParametersData, vesselId);

    for (let socketId in socketPool) {
        const socketData = socketPool[socketId];
        const userId = socketData.userId;
        const socketSubscriberName = socketData.socketSubscriberName;
        const otherData = socketData.otherData;
        const otherDataVesselName = otherData.shipName;
        const otherDataVesselId = parseInt(otherData.vesselId);

        if (appSettingsModel.getAppSettingsJsonData().deploymentType === "shore") {
            if (vesselId && otherDataVesselId && vesselId !== otherDataVesselId) {
                continue;
            }
        }

        if (socketSubscriberName === "subscribeToDashboard") {
            // let userDashboardCount = await UserWidgetsParametersModel.getCountByUserAndSocketId(userId, "subscribeToDashboard");
            // if (userDashboardCount) {
            if (false) {
                let userWidgetsDashboard = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToDashboard");
                traverseNestedTillLastNode(userWidgetsDashboard, liveParametersData, vesselId);

                for (let widget in widgetsParametersJsonDataDashboard) {
                    Object.keys(userWidgetsDashboard)
                }

                WebSocketAdaptor.emitDataOnSocketId("subscribeToDashboard", socketId, userWidgetsDashboard);
            } else {
                widgetsParametersJsonDataDashboard["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToDashboard", socketId, widgetsParametersJsonDataDashboard);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToMainEngine") {
            // let userMECount = await UserWidgetsParametersModel.getCountByUserAndSocketId(userId, "subscribeToMainEngine");
            // if (userMECount) {
            if (false) {
                let userWidgetsMainEngine = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToMainEngine");
                traverseNestedTillLastNode(userWidgetsMainEngine, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToMainEngine", socketId, userWidgetsMainEngine);
            } else {
                widgetsParametersJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToMainEngine", socketId, widgetsParametersJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToXpressMainEngine") {
            if (false) {
                let userWidgetsMainEngine = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToMainEngine");
                traverseNestedTillLastNode(userWidgetsMainEngine, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToXpressMainEngine", socketId, userWidgetsMainEngine);
            } else {
                xpressMEJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToXpressMainEngine", socketId, xpressMEJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }

        } else if (socketSubscriberName === "subscribeToBataviaMainEngine") {
            if (false) {
                let userWidgetsMainEngine = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToMainEngine");
                traverseNestedTillLastNode(userWidgetsMainEngine, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToBataviaMainEngine", socketId, userWidgetsMainEngine);
            } else {
                bataviaMEJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToBataviaMainEngine", socketId, bataviaMEJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToAsiaMainEngine") {
            if (false) {
                let userWidgetsMainEngine = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToMainEngine");
                traverseNestedTillLastNode(userWidgetsMainEngine, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToAsiaMainEngine", socketId, userWidgetsMainEngine);
            } else {
                asiaMEJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToAsiaMainEngine", socketId, asiaMEJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToDigitalAlarmME") {
            if (false) {
                let userWidgetsMainEngine = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToDigitalAlarmScreen");
                traverseNestedTillLastNode(userWidgetsMainEngine, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToDigitalAlarmME", socketId, digitalAlarmJsonData);
            } else {
                WebSocketAdaptor.emitDataOnSocketId("subscribeToDigitalAlarmME", socketId, digitalAlarmJsonData);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToMainGauges") {
            // let userMGCount = await UserWidgetsParametersModel.getCountByUserAndSocketId(userId, "subscribeToMainGauges");
            // if (userMGCount) {
            if (false) {
                let userWidgetsMainGauges = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToMainGauges");
                traverseNestedTillLastNode(userWidgetsMainGauges, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToMainGauges", socketId, userWidgetsMainGauges);
            } else {
                widgetsParametersJsonDataMainGauges["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToMainGauges", socketId, widgetsParametersJsonDataMainGauges);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToNanjingME") {
            // let userMGCount = await UserWidgetsParametersModel.getCountByUserAndSocketId(userId, "subscribeToMainGauges");
            // if (userMGCount) {
            if (false) {
                let userWidgetsMainGauges = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToNanjingME");
                traverseNestedTillLastNode(userWidgetsMainGauges, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToNanjingME", socketId, userWidgetsMainGauges);
            } else {
                nanjingMEJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToNanjingME", socketId, nanjingMEJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        } else if (socketSubscriberName === "subscribeToSparIndusME") {
            // let userMGCount = await UserWidgetsParametersModel.getCountByUserAndSocketId(userId, "subscribeToMainGauges");
            // if (userMGCount) {
            if (false) {
                let userWidgetsMainGauges = await UserWidgetsParametersModel.getWidgetsParametersByUserAndSocketId(userId, "subscribeToSparIndusME");
                traverseNestedTillLastNode(userWidgetsMainGauges, liveParametersData, vesselId);
                WebSocketAdaptor.emitDataOnSocketId("subscribeToSparIndusME", socketId, userWidgetsMainGauges);
            } else {
                sparIndusMEJsonDataMainEngine["updatedTime"] = allTimestamp;
                WebSocketAdaptor.emitDataOnSocketId("subscribeToSparIndusME", socketId, sparIndusMEJsonDataMainEngine);
                console.log("Data sent on socket for ::" + vesselId);
                console.log("Socket vessel name :: " + otherDataVesselName);
            }
        }
    }
};

const traverseNestedTillLastNode = function (jsonObj, liveParametersData, vesselId) {
    for (let key in jsonObj) {
        if (!jsonObj.hasOwnProperty(key)) {
            continue;
        }

        let currentObj = jsonObj[key];

        handleWidgetSpecificData(jsonObj, liveParametersData, vesselId, key);
        if (key === "widgetData") {
            jsonObj["widgetData"]["modbusParameterIdentifier"] = _.cloneDeep(currentObj.value).replace('mapping_@_', '');
        }

        if (currentObj !== null && typeof (currentObj) == "object") {
            // going one step down in the object tree
            traverseNestedTillLastNode(jsonObj[key], liveParametersData, vesselId);
        } else {
            if (typeof currentObj === "string" && currentObj.startsWith("mapping_@_")) {
                const liveParameterMappingKey = currentObj.replace('mapping_@_', '');
                if (liveParametersData.has(liveParameterMappingKey)) {
                    let val = liveParametersData.get(liveParameterMappingKey);
                    let valWithScaling = Util.getScaledValue(val, vesselId, liveParameterMappingKey, jsonObj.precision);
                    /* if (Number.isInteger(parseFloat(val))) {
                        val = parseFloat(val).toFixed(0);
                    }*/
                    jsonObj[key] = valWithScaling;
                    RealTimeParameterDataHolder.setDataByKey(vesselId, liveParameterMappingKey, valWithScaling);
                } else {
                    if (!!liveParameterMappingKey) {
                        const prevVal = RealTimeParameterDataHolder.getDataByKey(vesselId, liveParameterMappingKey);
                        if(appSettingsModel.getAppSettingsJsonData().digitalTags.includes(liveParameterMappingKey)) {
                            jsonObj[key] = prevVal ? prevVal : "";
                        } else if(appSettingsModel.getAppSettingsJsonData().xpressNoonTags.includes(liveParameterMappingKey)) {
                            const mrvData = mrvNoonReportController.getMrvData(vesselId);
                            if(mrvData.hasOwnProperty(liveParameterMappingKey)) {
                                jsonObj[key] = prevVal ? prevVal : mrvData[liveParameterMappingKey];
                            } else {
                                jsonObj[key] = "0";
                            }
                        } else {
                            jsonObj[key] = prevVal ? prevVal : "0";
                        }
                    } else {
                        jsonObj[key] = null;
                    }
                }
            }
        }
    }
};

// const handleWidgetSpecificData = function (jsonObj, liveParametersData, vesselId, key) {
//     let graphUnitData = graphData.getInstance();
//     let currentObj = jsonObj[key];

//     if ((key === 'widget_3' || currentObj.type === "dash_home_3_carousel") && liveParametersData && liveParametersData.size > 0) {
//         const liveParametersDataTimestamp = liveParametersData.get("Timestamp");

//         const carousel1GaugesData = currentObj.configuration.body.data.carousel1.acc1.gaugesData;
//         _.map(carousel1GaugesData, gaugeData => {
//             if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
//                 let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
//                 const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
//                 graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier));
//             }
//         });

//         const carouse21GaugesData = currentObj.configuration.body.data.carousel2.acc2.gaugesData;
//         _.map(carouse21GaugesData, gaugeData => {
//             if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
//                 let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
//                 const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
//                 graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier));
//             }
//         });
//     }

//     if ((key === 'widget_4.1' || key === 'widget_4.2' || key === 'widget_4.3' || currentObj.type === "gauges_home_gauges_stripe") && liveParametersData && liveParametersData.size > 0) {
//         const liveParametersDataTimestamp = liveParametersData.get("Timestamp");

//         const gaugesStrip = currentObj.configuration.body.data.gaugesData;
//         _.map(gaugesStrip, gaugeData => {
//             if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
//                 let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
//                 const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
//                 graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier));
//             }
//         });
//     }
// };
const handleWidgetSpecificData =async function (jsonObj, liveParametersData, vesselId, key) {
    let graphUnitData = graphData.getInstance();
    let currentObj = jsonObj[key];

    if (key === 'widget_3' && currentObj.type === 'dash_home_3_carousel') { // && liveParametersData && liveParametersData.size > 0
        const liveParametersDataTimestamp = liveParametersData.get("Timestamp");
        const carousel1GaugesData = currentObj.configuration.body.data.carousel1.acc1.gaugesData;
        _.map(carousel1GaugesData, gaugeData => {
            if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
                let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
        });

        if (currentObj.configuration.body.data.carousel2) {
            const carouse21GaugesData = currentObj.configuration.body.data.carousel2.acc2.gaugesData;
            _.map(carouse21GaugesData, gaugeData => {
                if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
                    let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
                    const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                    graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
                }
            });
        }

        const reChartsData = currentObj.configuration.body.data.carousel1.acc1.reChartsData;
        _.map(reChartsData, rechart => {
            if (rechart.widgetData.caption === "AE Fuel Cons. Rate" || rechart.widgetData.caption === "Speed Thru Water") {
                let valueCopy = _.cloneDeep(rechart.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), rechart.widgetData.caption);
            }
        });


        /* Nawroz ___ 16-02-2022 */
        const carousels = currentObj.configuration.body.data;
        const carousel1TableData = carousels.carousel1.acc1.tableData;
        const table1 = carousel1TableData.table1;
        const table3 = carousel1TableData.table3;
        const table1Group1Data = table1.group1.data;
        const table3Group1Data = table3.group1.data;
        const table1Row1Data = table1Group1Data.row1.colData.col1;
        const table3Row1Data = table3Group1Data.row3.colData.col1;

        if (table1Row1Data.widgetData.caption === "ME RPM") {
            let valueCopy = _.cloneDeep(table1Row1Data.widgetData.value);
            const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
            graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);

        };
        if (table3Row1Data.widgetData.caption === "Shaft Power") {
            let valueCopy = _.cloneDeep(table3Row1Data.widgetData.value);
            const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
            graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);

        };
        /* ended__Nawroz___ */

    }

    if ((key === 'widget_4.1' || key === 'widget_4.2' || key === 'widget_4.3' || currentObj.type === "gauges_home_gauges_stripe") && liveParametersData && liveParametersData.size > 0) {
        const liveParametersDataTimestamp = liveParametersData.get("Timestamp");
        const gaugesStrip = currentObj.configuration.body.data.gaugesData;
        _.map(gaugesStrip, gaugeData => {
            if (gaugeData.widgetData.widgetName === "Semi Circular Gauge Widget") {
                let valueCopy = _.cloneDeep(gaugeData.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
        });
    }
    // *_____Yogesh Chavan Multi line graph values____*
    if (key === 'widget_1' && currentObj.type === 'dash_home_information_carousel') {
        const liveParametersDataTimestamp = liveParametersData.get("Timestamp");
        const carousel1Data = currentObj.configuration.body.data.carousel1;
        if (carousel1Data.group1.caption === 'Fuel') {
            const group1Data = carousel1Data.group1.data.row1.colData.col1.widgetData;

            if (group1Data.caption === 'ME Fuel Cons. Rate') {
                let valueCopy = _.cloneDeep(group1Data.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
        }

        if (carousel1Data.group2.caption === 'Navigation') {
            const widgetData = carousel1Data.group2.data.row5.colData.col1.widgetData;
            if (widgetData.caption === "Rel. Wind Speed") {
                let valueCopy = _.cloneDeep(widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
            const widgetDataRWD = carousel1Data.group2.data.row5.colData.col2.widgetData;
            if (widgetDataRWD.caption === "Rel. Wind Direction") {
                let valueCopy = _.cloneDeep(widgetDataRWD.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
            const widgetDataVH = carousel1Data.group2.data.row6.colData.col1.widgetData;
            if (widgetDataVH.caption === "Vessel Heading") {
                let valueCopy = _.cloneDeep(widgetDataVH.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
            const widgetDataSTW = carousel1Data.group2.data.row6.colData.col2.widgetData;
            if (widgetDataSTW.caption === "Speed Thru Water") {
                let valueCopy = _.cloneDeep(widgetDataSTW.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }

        }

        const carousel2Data = currentObj.configuration.body.data.carousel2;
       

        // }
        if (carousel2Data.group2.caption === 'Navigation') {
            let stormGlassWeatherData = await StormGlassWeatherModel.getWeatherLatestDataByVesselID(vesselId);//getStomGlassLastestData(vesselId);
            if (stormGlassWeatherData != undefined || stormGlassWeatherData.length>0) {
                const widgetData = carousel2Data.group2.data.row6.colData.col1.widgetData;
                if (widgetData.caption === "Current Speed") {
                    // let valueCopy = _.cloneDeep(widgetData.value);
                    // const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');

                    graphUnitData.setGraphData(vesselId, "stormGlassCurrentSpeed", liveParametersDataTimestamp, stormGlassWeatherData.currentSpeed.sg, null);
                    // graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
                }
            }
            const widgetDataCSD = carousel2Data.group2.data.row6.colData.col2.widgetData;
            if (widgetDataCSD.caption === "Current Direction") {
                graphUnitData.setGraphData(vesselId, "stormGlassCurrentDirection", liveParametersDataTimestamp, stormGlassWeatherData.currentDirection.sg, null);
            }
        }
        /* Nawroz___16-02-2022_______ */
        const carousel13Data = currentObj.configuration.body.data.carousel3;
        if (carousel13Data.group1.caption === "Fuel-Draft") {
            const widgetData = carousel13Data.group1.data.row3.colData.col1;
            if (widgetData.widgetData.caption === "Mean Draft") {
                let valueCopy = _.cloneDeep(widgetData.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
            const widgetDataRow1 = carousel13Data.group1.data.row1.colData.col1;
            if (widgetDataRow1.widgetData.caption === "ME Fuel Eff.") {
                let valueCopy = _.cloneDeep(widgetDataRow1.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
            const widgetDataRow2 = carousel13Data.group1.data.row2.colData.col1;
            if (widgetDataRow2.widgetData.caption === "ME Est. Engine Load") {
                let valueCopy = _.cloneDeep(widgetDataRow2.widgetData.value);
                const modbusParameterIdentifier = valueCopy.replace('mapping_@_', '');
                graphUnitData.setGraphData(vesselId, modbusParameterIdentifier, liveParametersDataTimestamp, liveParametersData.get(modbusParameterIdentifier), null);
            }
        };
        /* Ended__nawroz__ */

    }
    
};

/* Code By: Yogesh chavan
   Created At: 30/12/2021
   TasK:SSH-11 Task-25
   desc: get & set compass json by vessel id
*/
const getCompassStateJsonByVesselId = function (vesselId) {
    return allCompassStateJson[vesselId];
}

const setCompassStateJsonByVesselId = function (vesselId, Com) {
    allCompassStateJson[vesselId] = CompassStateJson;
}

const getStomGlassLastestData = async function (vesselId) {
    return await StormGlassWeatherModel.getWeatherLatestDataByVesselID(vesselId);
};
//--------------------End----------------

// * CII CONTROLLERS * //
const getCIIState = async (request) => {
    const shipsData = await UserController.getAllShips(request);
    const allShipData = await ShipController.getAllData();
    let vesselId = request.query.vesselId;
    const type = request.query.type;
    // const selectedVoyage =
    if (vesselId == "null") {
        if (shipsData.length > 0) {
            vesselId = Util.getDefaultVesselId(shipsData);
        }
    }
    vesselId = parseInt(vesselId);
    let mrvReportData = new Map();
    let voyagesFilterArrObj = {}
    let voyagesFilterArr = [];
    let latestVoyage;
    let latestVoyageScr;
    let latestVoyageDestination;

    const voyagesData = await MRVNoonReportModel.getVoyages(vesselId);
    const latestVoyageLaden = voyagesData.rows.find((voyage) => voyage.Voyage.includes("L"));
    
    for (let i = 0; i < voyagesData.rows.length; i++) {
        let record = voyagesData.rows[i];

        mrvNoonReportController.prepareVoyageData(record, voyagesFilterArr);
        if (latestVoyageLaden.Voyage === record.Voyage) {
            voyagesFilterArr[i]["isLatest"] = true;
            latestVoyage = record.Voyage;
            latestVoyageScr = record.Scr;
            latestVoyageDestination = record.Destination;
        }
    }


    if (voyagesFilterArr.length > 0) {
        const mrvDataForFirstCarousel = await MRVNoonReportModel.getMRVReportData(vesselId);
        const mrvData = await MRVNoonReportModel.getMRVReportDataByVoyage(vesselId, latestVoyage, latestVoyageScr, latestVoyageDestination);
        mrvReportData = await mrvNoonReportController.getAndPrepareMRVReportData(mrvData, "All", mrvDataForFirstCarousel, type);
        mrvReportData.set("voyagesFilter", voyagesFilterArr);
    }

    const ciiStateJsonCopy = _.cloneDeep(CIIStateJsonnew);
    fillMrvReportData(ciiStateJsonCopy, mrvReportData, vesselId);

    return {
        fleetDashboardVesselFilter: Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter, allShipData),
        ciiStateJson: ciiStateJsonCopy,
        shipNameData: shipsData,
        allShipData: allShipData,
        modbusTrackerData: {
            isMachineryDataReceived: true,
            isNMEADataReceived: true
        }
    };
}

const getCIIStateByVoyage = async (request) => {
    const vesselId = parseInt(request.query.vesselId);
    const voyageStr = request.query.voyage;
    const voyageStrArr = voyageStr.split(" From [ ");
    const voyageId = voyageStrArr[0];
    const source = voyageStrArr[1].split(" ] To [ ")[0];
    const destination = voyageStrArr[1].split(" ] To [ ")[1].split(" ]")[0];
    const mrvDataForFirstCarousel = await MRVNoonReportModel.getMRVReportData(vesselId);
    const mrvData = await MRVNoonReportModel.getMRVReportDataByVoyage(vesselId, voyageId, source, destination);
    const mrvReportData = await mrvNoonReportController.getAndPrepareMRVReportData(mrvData,  "ByVoyage", mrvDataForFirstCarousel);

    const ciiStateJsonCopy = _.cloneDeep(CIIStateJsonnew);
    fillMrvReportData(ciiStateJsonCopy, mrvReportData, parseInt(vesselId));

    return {
        ciiStateJson: ciiStateJsonCopy
    };
}


// * CII CONTROLLERS END* //

module.exports = {
    create: create,
    readById: readById,
    readAll: readAll,
    prepareDashboardData: prepareDashboardData,
    traverseNestedTillLastNode: traverseNestedTillLastNode,
    traversedJsonFileToAddData: traversedJsonFileToAddData,
    loadAllFilesStateJsonsInMemory: loadAllFilesStateJsonsInMemory,
    getDashboardStateJsonByVesselId: getDashboardStateJsonByVesselId,
    setDashboardStateJsonByVesselId: setDashboardStateJsonByVesselId,
    getMainEngineStateJsonByVesselId: getMainEngineStateJsonByVesselId,
    setMainEngineStateJsonByVesselId: setMainEngineStateJsonByVesselId,
    getMainGaugesStateJsonByVesselId: getMainGaugesStateJsonByVesselId,
    setMainGaugesStateJsonByVesselId: setMainGaugesStateJsonByVesselId,
    getAllVesselLastUpdatedTime: allTimestamp,
    getDigitalAlarmStateJsonByVesselId: getDigitalAlarmStateJsonByVesselId,
    setDigitalAlarmStateJsonByVesselId:  setDigitalAlarmStateJsonByVesselId,
    getCompassStateJsonByVesselId: getCompassStateJsonByVesselId,
    setCompassStateJsonByVesselId: setCompassStateJsonByVesselId,
    getStomGlassLastestData: getStomGlassLastestData,
    getCIIState: getCIIState,
    getCIIStateByVoyage: getCIIStateByVoyage,
};