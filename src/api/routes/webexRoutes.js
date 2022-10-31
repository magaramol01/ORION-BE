'use strict';

const webexController = require("../controllers/webexController");
const multer = require('fastify-multer');
const {sendMail} = require("../adaptors/mailer");

const path = require('path');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../../../upload/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

module.exports = async function (fastify, opts) {

    fastify.get('/getMeetings', async function (request, reply) {
        const response = await webexController.getMeetings(request);

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);

        console.log('/getMeetings :: ', reply.getResponseTime());
    });

    fastify.post('/saveWebexMeeting', async function (request, reply) {
        const response = await webexController.saveWebexMeeting(request.body);

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);

        console.log('/saveWebexMeeting :: ', reply.getResponseTime());
    });

    // fastify.post('/updateMeetingStatus', async function (request, reply) {
    //     const response = await webexController.updateMeetingStatus(request.body);
    //
    //     reply
    //         .code(200)
    //         .header('Content-Type', 'application/json; charset=utf-8')
    //         .send(response);
    //
    //     console.log('/updateMeetingStatus :: ', reply.getResponseTime());
    // });

    // fastify.post('/sendMailNotification', async function (request, reply) {
    //    sendMail(request.body,"",)
    //
    //     reply
    //         .code(200)
    //         .header('Content-Type', 'application/json; charset=utf-8')
    //         .send(response);
    //
    //     console.log('/sendMailNotification :: ', reply.getResponseTime());
    // });

    fastify.post('/userLogin', async function (request, reply) {

        const response = await webexController.webexUserAuthentication(request);
        if (response === "Invalid parameters passed." || response === "invalid user name or password unable to authenticate." || response == "server error.") {
            if(response == "server error.") {
                let invalidResponse = {
                    statusCode: 500,
                    message: response
                };

                reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            } else {
                let invalidResponse = {
                    statusCode: 503,
                    message: response
                };

                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
        } else {
            let validResponse = {
                statusCode : 200,
                data : response
            }

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(validResponse));
        }
        console.log('/userLogin :: ', reply.getResponseTime());
    });

    fastify.post('/getUsers', async function (request, reply) {

        const response = await webexController.webxVesselsAndUsers(request);

        if( response == "invalid device id" || response == "Invalid Token") {
            if(response == "Invalid Token") {
                let invalidResponse = {
                    message: "Invalid Token, generate new for this user.",
                    statusCode: 501
                };
                reply
                    .code(501)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));

            }
            if(response == "invalid device id") {
                let invalidResponse = {
                    statusCode: 505,
                    message: "invalid device id ,please login again."
                };
                reply
                    .code(505)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));

            }
        } else {
            let validResponse = {
                statusCode : 200,
                data : response
            }
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(validResponse));

        }
        console.log('/getUsers :: ', reply.getResponseTime());
    });

    fastify.post('/scheduleMeeting', async function (request, reply) {

        const response = await webexController.scheduleMeeting(request);

        if (response === "invalid token." || response === "account meet token expired." || response === "start and end date is invalid." || response === "meeting scheduled but error occured while inserting data in db" || response === "meeting not schedule" || response === "invalid device id") {

            if(response === "invalid token." || response === "account meet token expired.") {
                let invalidResponse = {
                    statusCode: 501,
                    message: response
                };

                reply
                    .code(501)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "start and end date is invalid.") {
                let invalidResponse = {
                    statusCode: 503,
                    message: "start and end date is invalid."
                };

                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "meeting scheduled but error occured while inserting data in db") {
                let invalidResponse = {
                    statusCode: 500,
                    message: "server Error."
                };

                reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "meeting not schedule") {
                let invalidResponse = {
                    statusCode: 504,
                    message: response
                };

                reply
                    .code(504)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "invalid device id") {
                let invalidResponse = {
                    statusCode: 505,
                    message: "invalid device id ,please login again."
                };

                reply
                    .code(505)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
        } else {
            let validResponse = {
                statusCode: 200,
                message: "meeting schedule successfully !!",
                meetingId : response
            };
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(validResponse));
        }
        console.log('/scheduleMeeting :: ', reply.getResponseTime());
    });

    fastify.post('/addMedia', {preHandler : upload.single('file')},async function (request, reply) {

        const Response = await webexController.uploadMeetingFile(request);

        if(Response == "media description not present." || Response == "token not present." ||Response == "File not uploaded." || Response == "token not valid." || Response == "server error." || Response == "invalid meeting id." || Response == "deviceid not present." || Response == "invalid device id") {
            if(Response == "media description not present." || Response == "token not present." || Response == "File not uploaded." || Response == "deviceid not present."){
                let InValidResponse = {
                    statusCode: 502,
                    message: Response,
                }

                reply
                    .code(502)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(InValidResponse);
            }
            if(Response == "invalid device id") {
                let invalidResponse = {
                    statusCode: 505,
                    message: "invalid device id ,please login again."
                };
                reply
                    .code(505)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));

            }
            if(Response == "token not valid." || Response == "invalid meeting id.") {
                let InValidResponse = {
                    statusCode: 503,
                    message: Response,
                }

                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(InValidResponse);
            }
            if(Response == "server error.") {
                let InValidResponse = {
                    statusCode: 500,
                    message: "server error.",
                }

                reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(InValidResponse);
            }
        }else {
            let validResponse = {
                statusCode: 200,
                message: "meeting file upload successfully.",
                mediaId : Response
            }

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(validResponse);
        }
        console.log('/addMedia :: ', reply.getResponseTime());
    });

    fastify.post('/myMeetings', async function (request, reply) {

        const Response = await webexController.getAllMyMeetings(request);

        if( Response == "invalid device id" || Response == "token ,deviceid ,status required." || Response == "token not valid.") {
            if(Response == "token ,deviceid ,status required.") {
                let validResponse = {
                    statusCode: 501,
                    message: Response,
                }

                reply
                    .code(501)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(validResponse);
            }
            if(Response == "invalid device id") {
                let invalidResponse = {
                    statusCode: 505,
                    message: "invalid device id ,please login again."
                };
                reply
                    .code(505)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));

            }
            if(Response == "token not valid.") {
                let invalidResponse = {
                    statusCode: 503,
                    message: "invalid token."
                };
                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));

            }
        } else {
            let validResponse = {
                statusCode: 200,
                message: "all meetings data, scheduled by specific user.",
                data : Response
            }

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(validResponse);
        }
        console.log('/myMeetings :: ', reply.getResponseTime());
    })

    fastify.post('/downloadMedia', async function (request, reply) {

        const Response = await webexController.downloadMedia(request,reply);

        if(Response == "mediaid information not present." || Response == "invalid input.") {
            if(Response == "invalid input.") {
                let inValidResponse = {
                    statusCode: 502,
                    message: "media id required",
                }

                reply
                    .code(502)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(inValidResponse);
            }
            if(Response == "mediaid information not present.") {
                let inValidResponse = {
                    statusCode: 503,
                    message: Response,
                }

                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(inValidResponse);
            }
        } else {

            reply
                .code(200)
                .header('Content-Type', Response.mediaType)
                .send(Response.streamData);
        }
        console.log('/downloadMedia :: ', reply.getResponseTime());
    });

    fastify.post('/updateMeeting', async function (request, reply) {

        const response = await webexController.updateMeeting(request);

        if (response === "Invalid Token." || response === "account meet token expired." || response === "start and end date is invalid." || response == "meetingid, token, deviceid and status required." || response === "meeting scheduled but error occured while inserting data in db" || response === "meeting not schedule" || response === "invalid device id") {

            if(response === "Invalid Token." || response === "account meet token expired.") {
                let invalidResponse = {
                    statusCode: 501,
                    message: response
                };

                reply
                    .code(501)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "start and end date is invalid." || response == "meetingid, token, deviceid and status required.") {
                let invalidResponse = {
                    statusCode: 503,
                    message: response
                };

                reply
                    .code(503)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "Server Error.") {
                let invalidResponse = {
                    statusCode: 500,
                    message: "Server Error."
                };

                reply
                    .code(500)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "meeting not schedule") {
                let invalidResponse = {
                    statusCode: 504,
                    message: response
                };

                reply
                    .code(504)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
            if(response === "invalid device id") {
                let invalidResponse = {
                    statusCode: 505,
                    message: "invalid device id ,please login again."
                };

                reply
                    .code(505)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(invalidResponse));
            }
        } else {
            let validResponse = {
                statusCode: 200,
                message: "meeting update successfully !!",
                meetingId : response
            };
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(JSON.stringify(validResponse));
        }
        console.log('/updateMeeting :: ', reply.getResponseTime());
    });

    fastify.get('/getMediaArray', async function (request, reply) {

        const Response = await webexController.getMediaArray(request);

            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(Response);
    })
};
