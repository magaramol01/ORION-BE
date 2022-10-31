'use strict';

const {Util} = require("../utils/util");
const _ = require('lodash');

const reThinkDbDestination = null;
const DataAccessAdaptorSingleton = require("../adaptors/dataAccessAdaptorSingleton");
const StormGlassWeatherModel = require("../models/stormGlassWeatherModel");
const VoyageForecastModel = require("../models/voyageForecastModel");

module.exports = async function (fastify, opts) {

    fastify.get('/moveRethinkData', async function (request, reply) {
        const tableName1 = "voyageForecast";
        const tableName2 = "stormGlassWeather";
        const shipName = "nova-china-express";

        await reThinkDbDestination.connect({
            host: "52.66.22.65",
            port: "28015",
            db: "vessel_1"
        }, async function (err, conn) {
            if (err) {
                console.error("Error occurred while connecting to destination reThinkDb :: " + err);
            } else {
                console.log("Successfully connected to the destination reThink DB!!!");

                let voyageForecastData = await VoyageForecastModel.getVoyageForecastDataByShipName(shipName);
                if (voyageForecastData.length > 0) {
                    voyageForecastData[0].journeyCounter = 1;
                    voyageForecastData[1].journeyCounter = 2;
                }

                const dbResponse1 = await new Promise((resolve, reject) => {
                    /*reThinkDbDestination.table(tableName1)
                        .insert(voyageForecastData)
                        .run(conn, function (err, response) {
                            console.log('Data Inserted Successfully in ' + tableName1, response);
                            resolve(response);
                        });*/
                });

                let stormGlassWeatherData = await StormGlassWeatherModel.getWeatherDataByVesselId(shipName);
                stormGlassWeatherData = stormGlassWeatherData.filter(obj => new Date(obj.packetTs) > new Date("2020-10-24 14:00:00"));   // added this line temporary for demo...
                _.sortBy(stormGlassWeatherData, 'packetTs');

                if (stormGlassWeatherData.length > 0) {
                    for (let i = 0; i < stormGlassWeatherData.length; i++) {
                        stormGlassWeatherData[i].journeyCounter = 2;
                    }
                }

                const dbResponse2 = await new Promise((resolve, reject) => {
                   /* reThinkDbDestination.table(tableName2)
                        .insert(stormGlassWeatherData)
                        .run(conn, function (err, response) {
                            console.log('Data Inserted Successfully in ' + tableName2, response);
                            resolve(response);
                        });*/
                });

            }
        }.bind(this));

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data moved successfully !"));

        Util.printLog("/moveRethinkData served in : " + reply.getResponseTime());
    });

    fastify.get('/updateRethinkData', async function (request, reply) {
        let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
        const tableName1 = "voyageForecast";
        const tableName2 = "stormGlassWeather";
        const shipName = "nova-china-express";

        let voyageForecastData = await VoyageForecastModel.getVoyageForecastDataByShipName(shipName);
        if (voyageForecastData.length > 0) {
            voyageForecastData[0].journeyCounter = 1;
            const dbResponse1 = await new Promise((resolve, reject) => {
                /*DataAccessAdaptor.reThinkDb.table(tableName1)
                    .get(voyageForecastData[0].id).update(voyageForecastData[0])
                    .run(DataAccessAdaptor.connection, function (err, response) {
                        console.log('Data Inserted Successfully', response);
                        resolve(response);
                    });*/
            });

            voyageForecastData[1].journeyCounter = 2;
            const dbResponse2 = await new Promise((resolve, reject) => {
                /*DataAccessAdaptor.reThinkDb.table(tableName1)
                    .get(voyageForecastData[0].id).update(voyageForecastData[0])
                    .run(DataAccessAdaptor.connection, function (err, response) {
                        console.log('Data Inserted Successfully', response);
                        resolve(response);
                    });*/
            });
        }

        let stormGlassWeatherData = await StormGlassWeatherModel.getWeatherDataByVesselId(shipName);
        stormGlassWeatherData = stormGlassWeatherData.filter(obj => new Date(obj.packetTs) > new Date("2020-10-24 14:00:00"));

        if (stormGlassWeatherData.length > 0) {
            for (let i = 0; i < stormGlassWeatherData.length; i++) {
                let row = stormGlassWeatherData[i];

                row.journeyCounter = 2;

                const dbResponse3 = await new Promise((resolve, reject) => {
                    /*DataAccessAdaptor.reThinkDb.table(tableName2)
                        .get(row.id).update(row)
                        .run(DataAccessAdaptor.connection, function (err, response) {
                            console.log('Data Inserted Successfully', response);
                            resolve(response);
                        });*/
                });
            }
        }

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data moved successfully !"));

        Util.printLog("/updateRethinkData served in : " + reply.getResponseTime());
    });

    fastify.get('/handleCurrentLocationData', async function (request, reply) {
        let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
        const tableName2 = "stormGlassWeather";
        const shipName = "nova-china-express";

        let stormGlassWeatherData = await StormGlassWeatherModel.getWeatherDataByVesselIdAndJourneyCounterWithVesselId(shipName, 4);
        _.sortBy(stormGlassWeatherData, 'packetTs');
        stormGlassWeatherData = stormGlassWeatherData.filter(obj => new Date(obj.packetTs) > new Date("2020-11-27 00:50:00"));

        if (stormGlassWeatherData.length > 0) {
            for (let i = 0; i < stormGlassWeatherData.length; i++) {
                let row = stormGlassWeatherData[i];

                row.journeyCounter = 5;

                const dbResponse3 = await new Promise((resolve, reject) => {
                    /*DataAccessAdaptor.reThinkDb.table(tableName2)
                        .get(row.id).update(row)
                        .run(DataAccessAdaptor.connection, function (err, response) {
                            console.log('Data Inserted Successfully', response);
                            resolve(response);
                        });*/
                });
            }
        }

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data moved successfully !"));

        Util.printLog("/handleCurrentLocationData served in : " + reply.getResponseTime());
    });

    fastify.get('/addDataInPostgresql', async function (request, reply) {
        let DataAccessAdaptor = DataAccessAdaptorSingleton.getInstance();
        const windyData = {};

        const travelledDataArr = windyData.stormGlassData.data;
        const vesselId = 3;
        const journeyCounter = 1;

        for (let i = 0; i < travelledDataArr.length; i++) {
            let dbData = travelledDataArr[i];
            dbData.journeyCounter = journeyCounter;
            dbData.vesselId = vesselId;
            delete dbData.shipName;
            delete dbData.id;
            
            if (parseFloat(dbData.lat) > 6.44) {
                StormGlassWeatherModel.insertData(dbData);
            }
        }

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify("Data started adding successfully !"));

        Util.printLog("/addDataInPostgresql served in : " + reply.getResponseTime());
    });

};