'use strict';

const _ = require('lodash');
const DashboardStateJson = require("../../../configured_data/Data/newTesting1");
const xpressStateJson = require("../../../configured_data/Data/xpress_me");
const MainEngineStateJson = require("../../../configured_data/Data/newTesting2");
const MainGaugesStateJson = require("../../../configured_data/Data/newTesting");
const nanjingStateJson = require("../../../configured_data/Data/nanjing_me.json");
const bataviaStateJson = require("../../../configured_data/Data/batavia_me.json");
const sparIndusStateJson = require("../../../configured_data/Data/sparIndus.json");
const WidgetsParametersController = require("../controllers/widgetsParametersController");
const ShipController = require("../controllers/shipController");
const UserController = require("../controllers/userController");
const {traverseNestedTillLastNode} = require("../controllers/widgetsParametersController");
const graphData = require("../controllers/graphUnitData");
const {Util} = require("../utils/util");
const appSettingsModel = require('../models/appSettingsModel');
const digitalAlarmStateJson = require("../../../configured_data/Data/digitalAlarm");
const asiaStateJson = require("../../../configured_data/Data/asia_me");

module.exports = async function (fastify, opts) {

    fastify.post('/createWidgetsParameters', async function (request, reply) {
        const response = await WidgetsParametersController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createWidgetsParameters :: ', reply.getResponseTime());
    });

    fastify.get('/getWidgetParametersById:widgetId', async function (request, reply) {
        const response = await WidgetsParametersController.readById(request.query.widgetId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getWidgetParametersById:causeId :: ', reply.getResponseTime());
    });

    fastify.get('/getAllWidgetsParameters', async function (request, reply) {
        const response = await WidgetsParametersController.readAll(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/getAllWidgetsParameters :: ', reply.getResponseTime());
    });

    fastify.get('/getDashboardState:vesselId', async function (request, reply) {
        let dashboardStateJsonStateJsonCopy;
        const shipsData = await UserController.getAllShips(request);
        let requestedDataVesselId = request.query.vesselId;
        let shipavailable = true;
        if(requestedDataVesselId == "null"){
            if(shipsData.length > 0) {
                requestedDataVesselId = Util.getDefaultVesselId(shipsData);
            } else {
                shipavailable = false;
            }
        }
        if(shipavailable) {
            const vesselId = parseInt(requestedDataVesselId);
            const DashboardStateJson = WidgetsParametersController.getDashboardStateJsonByVesselId(vesselId);
            dashboardStateJsonStateJsonCopy = _.cloneDeep(DashboardStateJson);
            traverseNestedTillLastNode(dashboardStateJsonStateJsonCopy, new Map(), vesselId);
        } else {
            dashboardStateJsonStateJsonCopy = _.cloneDeep(DashboardStateJson);
        }
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            dashboardStateJson: dashboardStateJsonStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getXpressMainEngineState:vesselId', async function (request, reply) {
        const xpressStateJsonCopy = _.cloneDeep(xpressStateJson);
        traverseNestedTillLastNode(xpressStateJsonCopy, new Map(), parseInt(request.query.vesselId));

        const shipsData = await UserController.getAllShips(request);
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            xpressStateJson: xpressStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getMainEngineState:vesselId', async function (request, reply) {
        let mainEngineStateJsonStateJsonCopy;
        const shipsData = await UserController.getAllShips(request);
        let requestedDataVesselId = request.query.vesselId;
        let shipavailable = true;
        if(requestedDataVesselId == "null"){
            if(shipsData.length > 0) {
                requestedDataVesselId = Util.getDefaultVesselId(shipsData);
            } else {
                shipavailable = false;
            }
        }
        if(shipavailable) {
            const vesselId = parseInt(requestedDataVesselId);
            const MainEngineStateJson = WidgetsParametersController.getMainEngineStateJsonByVesselId(vesselId);
            mainEngineStateJsonStateJsonCopy = _.cloneDeep(MainEngineStateJson);
            traverseNestedTillLastNode(mainEngineStateJsonStateJsonCopy, new Map(), vesselId);
        } else {
            mainEngineStateJsonStateJsonCopy = _.cloneDeep(MainEngineStateJson);
        }
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            mainEngineStateJson: mainEngineStateJsonStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMainEngineState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getMainGaugesState:vesselId', async function (request, reply) {
        let mainGaugesStateJsonCopy;
        const shipsData = await UserController.getAllShips(request);
        let requestedDataVesselId = request.query.vesselId;
        let shipavailable = true;
        if(requestedDataVesselId == "null"){
            if(shipsData.length > 0) {
                requestedDataVesselId = Util.getDefaultVesselId(shipsData);
            } else {
                shipavailable = false;
            }
        }
        if(shipavailable) {
            const vesselId = parseInt(requestedDataVesselId);
            const MainGaugesStateJson = WidgetsParametersController.getMainGaugesStateJsonByVesselId(vesselId);
            mainGaugesStateJsonCopy = _.cloneDeep(MainGaugesStateJson);
            traverseNestedTillLastNode(mainGaugesStateJsonCopy, new Map(), vesselId);
        } else {
            mainGaugesStateJsonCopy = _.cloneDeep(MainGaugesStateJson);
        }
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            mainGaugesStateJson: mainGaugesStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMainGaugesState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getAsiaMainEngineState:vesselId', async function (request, reply) {
        const asiaStateJsonCopy = _.cloneDeep(asiaStateJson);
        traverseNestedTillLastNode(asiaStateJsonCopy, new Map(), parseInt(request.query.vesselId));

        const shipsData = await UserController.getAllShips(request);
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            asiaStateJson: asiaStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });
    fastify.get('/getBataviaMainEngineState:vesselId', async function (request, reply) {
        const bataviaStateJsonCopy = _.cloneDeep(bataviaStateJson);
        traverseNestedTillLastNode(bataviaStateJsonCopy, new Map(), parseInt(request.query.vesselId));

        const shipsData = await UserController.getAllShips(request);
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            bataviaStateJson: bataviaStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getNanjingMainEngineState:vesselId', async function (request, reply) {
        const nanjingStateJsonCopy = _.cloneDeep(nanjingStateJson);
        traverseNestedTillLastNode(nanjingStateJsonCopy, new Map(), parseInt(request.query.vesselId));

        const shipsData = await UserController.getAllShips(request);
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            nanjingStateJson: nanjingStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getDigitalAlarmState:vesselId', async function (request, reply) {
        let  digitalAlarmStateJsonCopy;
        const shipsData = await UserController.getAllShips(request);
        let requestedDataVesselId = request.query.vesselId;
        let shipavailable = true;
        if(requestedDataVesselId == "null"){
            if(shipsData.length > 0) {
                requestedDataVesselId = Util.getDefaultVesselId(shipsData);
            } else {
                shipavailable = false;
            }
        }
        if(shipavailable) {
            const vesselId = parseInt(requestedDataVesselId);
            const digitalAlarmStateJson = WidgetsParametersController. getDigitalAlarmStateJsonByVesselId(vesselId);
             digitalAlarmStateJsonCopy = _.cloneDeep(digitalAlarmStateJson);
            traverseNestedTillLastNode(digitalAlarmStateJsonCopy, new Map(), vesselId);
        } else {
            digitalAlarmStateJsonCopy = _.cloneDeep(digitalAlarmStateJson);
        }
        const allShipData = await ShipController.getAllData();
        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            digitalAlarmStateJson: digitalAlarmStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getDashboardState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.get('/getSparIndusMainEngineState:vesselId', async function (request, reply) {
        const sparIndusStateJsonCopy = _.cloneDeep(sparIndusStateJson);
        traverseNestedTillLastNode(sparIndusStateJsonCopy, new Map(), parseInt(request.query.vesselId));

        const shipsData = await UserController.getAllShips(request);
        const allShipData = await ShipController.getAllData();

        const response = {
            allVesselTimestamps : WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter : Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter,allShipData),
            sparIndusStateJson: sparIndusStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.printLog("/getMainGaugesState:vesselId served in : " + reply.getResponseTime());
    });

    fastify.post('/getRechartData', async function (request, reply) {
        const vesselId = request.body.vesselId;
        const modbusParameterId = request.body.parameterId;

        let graphUnitData = graphData.getInstance();
        let data = await graphUnitData.getGraphData(vesselId, modbusParameterId);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(data));
    });
    fastify.get('/getCompassState:vesselId', async function (request, reply) {
        let compassJsonStateJsonCopy;
        const shipsData = await UserController.getAllShips(request);
        let requestedDataVesselId = request.query.vesselId;
        let shipavailable = true;
        if (requestedDataVesselId == "null") {
            if (shipsData.length > 0) {
                requestedDataVesselId = Util.getDefaultVesselId(shipsData);
            } else {
                shipavailable = false;
            }
        }
        if (shipavailable) {
            const vesselId = parseInt(requestedDataVesselId);
            const CompassStateJson = WidgetsParametersController.getCompassStateJsonByVesselId(vesselId);
            compassJsonStateJsonCopy = _.cloneDeep(CompassStateJson);
            traverseNestedTillLastNode(compassJsonStateJsonCopy, new Map(), vesselId);
        } else {
            compassJsonStateJsonCopy = _.cloneDeep(CompassStateJson);
        }
        const allShipData = await ShipController.getAllData();
    
        const response = {
            allVesselTimestamps: WidgetsParametersController.getAllVesselLastUpdatedTime,
            fleetDashboardVesselFilter: Util.getFleetFilterData(appSettingsModel.getAppSettingsJsonData().fleetDashboardVesselFilter, allShipData),
            compassStateJson: compassJsonStateJsonCopy,
            shipNameData: shipsData,
            allShipData: allShipData
        };
    
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));
    
        Util.printLog("/getCompassState:vesselId served in : " + reply.getResponseTime());
    });







// * CII ROUTES

fastify.get("/getCIIStatenew:vesselId:type", async (request, reply) => {        
    const response = await WidgetsParametersController.getCIIState(request)
    reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(JSON.stringify(response));

    Util.printLog("/getCIIStatenew:vesselId served in : " + reply.getResponseTime());
})

fastify.get("/getCIIStateByVoyage:vesselId", async (request, reply) => {
    const response = await WidgetsParametersController.getCIIStateByVoyage(request)

    reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(JSON.stringify(response));

    Util.printLog("/getCIIStateByVoyage:vesselId served in : " + reply.getResponseTime());
})
};