'use strict';
const DiUtil = require("../diapi/DiUtil").util;
const UserController = require("../controllers/userController");
const userModel = require("../models/userModel");
const {sendMail} = require("../adaptors/mailer");
const sessionHandler = require('../utils/sessionHandler');
const appSettingsModel = require('../models/appSettingsModel');
const {getUserMappingByUserId} = require("../models/UserMappingModel");
const {Util} = require("../utils/util");
const _ = require('lodash');
const EncryptionDecryptionUtil = require("../utils/EncryptionDecryptionUtil");

module.exports = async function (fastify, opts) {

    fastify.get('/getAllUsers', async function (request, reply) {
        const response = await UserController.readAllUser(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getAllUsers');
    });

    fastify.get('/getUserById', async function (request, reply) {
        const response = await UserController.readById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getUserById');
    });

    fastify.post('/createUser', async function (request, reply) {
        const response = await UserController.create(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.logRequestServeTime(request, reply, '/createUser');
    });


    fastify.get('/getPublishedSheet', async function (request, reply) {
        console.log("user id are :: "+request.session.user.id);
        console.log("user id are :: "+request.session.user.Email);
        let userData = await userModel.getDiData(request.session.user.id);
        await DiUtil.login(userData.u1, EncryptionDecryptionUtil.getEncryptedPassword(userData.p1, userData.p1));
        await DiUtil.generateToken();
        const response = await DiUtil.getPublishedSheets();
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
    });

    fastify.get('/getPublishedSheet2', async function (request, reply) {
        console.log("user id are :: "+request.session.user.id);
        console.log("user id are :: "+request.session.user.Email);
        let userData = await userModel.getDiData(request.session.user.id);
        await DiUtil.login2(userData.u2, EncryptionDecryptionUtil.getEncryptedPassword(userData.p2, userData.p2));
        await DiUtil.generateToken2();
        const response = await DiUtil.getPublishedSheets2();
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
    });

    fastify.post('/validateUser', async function (request, reply) {
        if (!request.body) {
            console.log("User data not received");
            reply.code(400)
        }
        if (!request.session.user) {
            let response = await UserController.validateUser(request);
            console.log("Role of user is ",response.Role);
            if (response.isvalid && ((appSettingsModel.getAppSettingsJsonData().deploymentType === 'shore' && response.Role !== 'Ship User'))) {
                const userMapping = await getUserMappingByUserId(response.id);
                request.session.user = Object.assign(response, userMapping[0]);
                sessionHandler.set(request.session.encryptedSessionId, request.session);
                console.log("New Session set for ",response.Email);
                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(request.session.user);
            } else {
                console.log("User is not valid",JSON.stringify(response));
                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(response)
            }
        } else {
            console.log("Session Fetch for ",request.session.user.Email);
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(request.session.user);
        }
    });

    fastify.post('/validatePrivateRoute', async function (request, reply) {
        if (!request.body || _.isEmpty(request.body)) {
            console.log("User data not received");
            reply.code(400)
        } else {
            if (request.session.user) {
                const userMapping = await getUserMappingByUserId(request.session.user.id);
                request.session.user = Object.assign(request.session.user, userMapping[0]);
                console.log("Session Fetch for ",request.session.user.Email);
                if(!request.body.locationPath) {
                    console.log(`home page`);
                    request.session.user.msg = "redirect default to home page"
                    reply
                        .code(403)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(request.session.user);
                } else if(request.body.locationPath === 'Ships') {
                    let response = await UserController.readIsAllowToCreateShipById(request.session.user.id);
                    if(response.CreateShips) {
                        reply
                            .code(200)
                            .header('Content-Type', 'application/json; charset=utf-8')
                            .send(response);
                    } else {
                        request.session.user.msg = "user is not authorized to visit this page";
                        reply
                            .code(403)
                            .header('Content-Type', 'application/json; charset=utf-8')
                            .send(response);
                    }
                } else if(
                    userMapping[0].ScreenMapping[0] !== "All" &&
                    request.body.locationPath &&
                    userMapping[0].ScreenMapping.indexOf(request.body.locationPath) < 0
                ){
                    console.log(`User is not Authorized to redirect on ${request.body.locationPath} page`);
                    request.session.user.msg = "user is not authorized to visit this page"
                    reply
                        .code(403)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(request.session.user);
                } else {
                    reply
                        .code(200)
                        .header('Content-Type', 'application/json; charset=utf-8')
                        .send(request.session.user);
                }
            } else {
                console.log("User has not logged in");
                reply.code(400)
            }
        }
    });

    fastify.post('/logout', async function (request, reply) {
        if(request.session.user){
            let user = request.session.user.Email;
            sessionHandler.remove(request.session.encryptedSessionId);
            if(!(request.session == null)) {
                request.session = null;
            }
            reply.clearCookie('sessionId');
            reply.clearCookie('io');
            console.log(user," Logged Out.");
            reply.send({isLoggedout:true,msg:'Logout success!'})
            // request.destroySession((err) => {
            //     if (err) {
            //         console.log("Error Occurred While Logging Out ",user);
            //         reply
            //             .status(500)
            //             .send('Internal Server Error')
            //     } else {
            //         console.log(user," Logged Out.");
            //         reply.send({isLoggedout:true,msg:'Logout success!'})
            //     }
            // })
        } else {
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({isLoggedout:false,msg:'User not Logged In'})
        }
    });

    fastify.post('/updatePassword', async function (request, reply) {
        const response = await UserController.updateUserPasswordByEmail(request.body);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/updatePassword');
    });

    fastify.post('/updateUserById', async function (request, reply) {
        const response = await UserController.updateUserById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/updateUserById :: ', reply.getResponseTime());
    });

    fastify.post('/getEmail', async function (request, reply) {
        const response = await UserController.getEmail(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getEmail');
    });

    fastify.post('/addShipNameToSession', async function (request, reply) {
        const response = await UserController.addShipToSession(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        Util.logRequestServeTime(request, reply, '/addShipNameToSession');
    });

    fastify.post('/addVesselDetailsToSession', async function (request, reply) {
        UserController.addVesselDetailsToSession(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send("Selected vessel details are added in session!!!");

        Util.logRequestServeTime(request, reply, '/addVesselDetailsToSession');
    });

    fastify.post('/deleteUserById', async function (request, reply) {
        const response = await UserController.removeById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getEmail :: ', reply.getResponseTime());
    });

    fastify.get('/getEncryptedPassword', async function (request, reply) {
        const pwdStr = request.query.pwd;

        if (pwdStr) {
            const response = EncryptionDecryptionUtil.getEncryptedPassword(pwdStr, pwdStr);

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(response));
        } else {
            reply
                .code(204)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify("No content send for encryption!!!"));
        }
    });

    fastify.get('/creatDefaultUser', async function (request, reply) {
        const response = await UserController.createDefaultUser(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/getUserAccountCreateStatus :: ', reply.getResponseTime());
    });

    fastify.get('/getUserByShipId', async function (request, reply) {
        const response = await UserController.getUserByShipId(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        Util.logRequestServeTime(request, reply, '/getUserByShipId');
    });
};
