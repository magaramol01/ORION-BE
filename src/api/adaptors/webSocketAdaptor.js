"use strict";

const WebSocketIO = require('socket.io');
const sessionHandler = require('../utils/sessionHandler');
const appSettingsModel = require('../models/appSettingsModel');

let Fastify = null;
let IO = null;

let socketPool = {};
let userPool = {};

exports.initWebSocket = function () {
    if (!IO) {
        IO = new WebSocketIO(Fastify.server, {
            path: appSettingsModel.getAppSettingsJsonData().serverSettings.urlPrefix + '/socket.io'
        });

        IO.of(appSettingsModel.getAppSettingsJsonData().serverSettings.urlPrefix + '/socket.io').on("connection", (socket) => {
            const cookies = socket.conn.request.headers.cookie;
            if (!cookies) {
                return;
            }
            const encryptedSessionId = decodeURIComponent(cookies.substring(cookies.search("sessionId") + 10).split(";")[0]);
            const session = sessionHandler.get(encryptedSessionId);

            if (!session)
                console.log("User connected, Session Not Found!");
            else {
                socketPool[socket.id] = {
                    "socketId": socket.id,
                    "userId": session.user.id,
                    "socketSubscriberName": socket.handshake.query.socketSubscriberName,
                    "otherData": JSON.parse(socket.handshake.query.otherData),
                }
            }

            socket.on("disconnect", () => {
                // socket.removeAllListeners('subscribeToDashboard');
                // socket.removeAllListeners('disconnect');
                // IO.removeAllListeners('connection');
                console.log('The client has disconnected!');
                if (session && socket.id && socketPool.hasOwnProperty(socket.id)) {
                    console.log('Disconnected client socket ID is :: ' + socket.id + ' and User ID is :: ' + socketPool[socket.id].userId);
                    delete socketPool[socket.id];
                }
            });
        });
    }

    return IO;
};

exports.getSocketPool = function () {
    return socketPool;
};

exports.getUserPool = function () {
    return userPool;
};

exports.getWebSocket = function () {
    return IO;
};

exports.getServer = function () {
    return Fastify;
};

exports.setServer = function (fastifyServer) {
    Fastify = fastifyServer;
};

exports.emitDataOnSocketId = function (registeredSocketKey, socketId, data) {
    IO.of(appSettingsModel.getAppSettingsJsonData().serverSettings.urlPrefix + '/socket.io').to(socketId).emit(registeredSocketKey, data);
};

exports.emitDataOnSocket = function (registeredSocketKey, data, vesselId) {
    for (let socketId in socketPool) {
        if (!socketPool.hasOwnProperty(socketId)) {
            continue;
        }

        const socketData = socketPool[socketId];
        const socketSubscriberName = socketData.socketSubscriberName;
        const otherData = socketData.otherData;
        const otherDataVesselId = parseInt(otherData.vesselId);

        if (registeredSocketKey === socketSubscriberName && vesselId && otherDataVesselId && vesselId === otherDataVesselId) {
            exports.emitDataOnSocketId(registeredSocketKey, socketId, data);
        }
    }
};

exports.emitDataOnSocketGlobal = function (registeredSocketKey, data, vesselId) {
    for (let socketId in socketPool) {
        if (!socketPool.hasOwnProperty(socketId)) {
            continue;
        }

        const socketData = socketPool[socketId];
        const socketSubscriberName = socketData.socketSubscriberName;

        if (registeredSocketKey === socketSubscriberName && vesselId) {
            exports.emitDataOnSocketId(registeredSocketKey, socketId, data);
        }
    }
};