// import dependencies from npm
const Fastify = require('fastify');
const path = require('path');
const AutoLoad = require('fastify-autoload');
const uuidv4 = require('uuid/v4');
const WebSocketAdaptor = require("./api/adaptors/webSocketAdaptor");
const fastifySession = require('fastify-session');
const fastifyCookie = require('fastify-cookie');
const appSettingsModel = require('./api/models/appSettingsModel');
const sh = require('../src/api/utils/sessionHandler');

// const appSettings = require('./config/appSettings');
// const appSettings = require('./api/routes');

// create request ids
const createRequestId = () => uuidv4();

const createServer = (options) => {
    const {logSeverity} = options;
    // create the server
    const server = Fastify({
        ignoreTrailingSlash: true,
        logger: {
            genReqId: createRequestId,
            level: logSeverity
        }
    }).addHook('preValidation', (request, reply,next) => {
        try {
            const url = request.context.config.url;
            console.log("preValidation :: "+url);
            if(true) {
                console.log("preValidation :: Ignor");
                next()
            } else {
                const si = request.cookies.sessionId;
                const s_response = sh.get(si);
                if(!!s_response) {
                    console.log("preValidation :: success ",si);
                    next()
                }
            }
        } catch (err) {
            reply.send(err)
        }
    });

    // register the plugins, routes in this case
    // server.register(AutoLoad, {
    //     dir: path.join(__dirname, 'api', 'routes')
    // });

    const serverName = appSettingsModel.getAppSettingsJsonData().serverSettings.urlPrefix;
    const frontEndServer = "/";

    server.register(require('fastify-cors'), {
        origin: true,
    //    allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization'],
        credentials:true,
        methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
        prefix: serverName
    });
    server.register(require('fastify-multipart'), {prefix: serverName});
    server.register(require('./api/routes/auditTrailRoutes'), {prefix: serverName});
    server.register(require('./api/routes/calculatedExpressionRoutes'), {prefix: serverName});
    server.register(require('./api/routes/causesRoutes'), {prefix: serverName});
    server.register(require('./api/routes/constantParameterRoutes'), {prefix: serverName});
    server.register(require('./api/routes/failureAdvisoriesRoutes'), {prefix: serverName});
    server.register(require('./api/routes/liveStreaming'), {prefix: serverName});
    server.register(require('./api/routes/parameterSourceRoutes'), {prefix: serverName});
    server.register(require('./api/routes/parametersRoutes'), {prefix: serverName});
    server.register(require('./api/routes/root'), {prefix: serverName});
    server.register(require('./api/routes/rtdasRoutes'), {prefix: serverName});
    server.register(require('./api/routes/ruleBlockRoutes'), {prefix: serverName});
    server.register(require('./api/routes/ruleConfigsRoutes'), {prefix: serverName});
    server.register(require('./api/routes/unitsRoutes'), {prefix: serverName});
    server.register(require('./api/routes/userRoutes'), {prefix: serverName});
    server.register(require('./api/routes/triggeredOutcomesHistoryRoutes'), {prefix: serverName});
    server.register(require('./api/routes/triggeredOutcomesTodayRouters'), {prefix: serverName});
    server.register(require('./api/routes/webSocketIORoutes'), {prefix: serverName});
    server.register(require('./api/routes/shipRoutes'), {prefix: serverName});
    server.register(require('./api/routes/shipRouteRoutes'), {prefix: serverName});
    server.register(require('./api/routes/outcomesRoutes'), {prefix: serverName});
    server.register(require('./api/routes/widgetsParametersRoutes'), {prefix: serverName});
    server.register(require('./api/routes/machineRoutes'), {prefix: serverName});
    server.register(require('./api/routes/userWidgetsParametersRoutes'), {prefix: serverName});
    server.register(require('./api/routes/companyRegistrationRoutes'), {prefix: serverName});
    server.register(require('./api/routes/nmeaRoutes'), {prefix: serverName});
    server.register(require('./api/routes/vesselJourneyCounterRoutes'), {prefix: serverName});
    server.register(require('./api/routes/voyageForecastRoutes'), {prefix: serverName});
    server.register(require('./api/routes/rethinkDataInsertionRoute'), {prefix: serverName});
    server.register(require('./api/routes/tokenRouter'), {prefix: serverName});
    server.register(require('./api/routes/mrvNoonReportRoutes'), {prefix: serverName});
    server.register(require('./api/routes/euPortsRoutes'), {prefix: serverName});
    server.register(require('./api/routes/applicationServerStatus'), {prefix: serverName});
    server.register(require('./api/routes/widgetMappingRoutes'), {prefix: serverName});
    server.register(require('./api/routes/parameterCsvRouter'), {prefix: serverName});
    server.register(require('./api/routes/ruleCsvRouter'), {prefix: serverName});
    server.register(require('./api/routes/fleetDashboardRoutes'), {prefix: serverName});
    server.register(require('./api/routes/fleetRoutes'), {prefix: serverName});
    server.register(require('./api/routes/vesselGroupRoutes'), {prefix: serverName});
    server.register(require('./api/routes/pdfRoutes'), {prefix: serverName});

   
    

    server.register(require('fastify-static'), {
        root: path.join(__dirname,'..','..','..','upload/images'),
        prefix: appSettingsModel.getAppSettingsJsonData().serverSettings.urlPrefix + '/logo'
    });

    server.register(fastifyCookie);
    server.register(fastifySession,{
        cookieName: 'sessionId',
        secret: 'Rnq1v1mG4VZlZxMqAXLp9TJCXNAKLbNdhVTFnkn1',
        cookie: {
            secure:false,
            path: frontEndServer,
        },
    });
    // before start
    server.ready(function (err) {
        beforeServerStartUp(server);
    });

    // start the server
    server.listen(appSettingsModel.getAppSettingsJsonData().serverSettings.rePort, "0.0.0.0", (err) => {
        if (err) {
            server.log.error(err);
            console.log(err);
            process.exit(1);
        }
        server.log.info('Server Started');
        WebSocketAdaptor.setServer(server);
        WebSocketAdaptor.initWebSocket();
    });
};

const beforeServerStartUp = (server) => {
    // before startup the server create required database, tables and needed files or data for RULE ENGINE
    server.log.info('Server Initiated');

    const DataAccessAdaptorSingleton = require("./api/adaptors/dataAccessAdaptorSingleton");
    DataAccessAdaptorSingleton.initializeInstance(); // initialize instance

    const RuleExecutionSingletonController = require("./api/controllers/ruleExecutionSingletonController");
    RuleExecutionSingletonController.getInstance(); // initialize instance

    const RTDASPacketDataHolder = require("./api/mappers/rtdasPacketDataHolder");
    RTDASPacketDataHolder.getInstance(); // initialize instance

    const graphUnitData = require("./api/controllers/graphUnitData");
    graphUnitData.getInstance(); // initialize instance

    const ScheduleEmail = require("./api/mappers/scheduleEmail");
    ScheduleEmail.getInstance(); // initialize instance

    const ServerStartupActionsController = require("./api/controllers/serverStartupActionsController");
    ServerStartupActionsController.performServerStartupActions();
};

module.exports = {
    createServer: createServer,
    onServerStartUp: beforeServerStartUp
};
