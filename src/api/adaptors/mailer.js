"use strict";

const mailer = require('nodemailer');
const appSettingsModel = require('../models/appSettingsModel');

const transporter = mailer.createTransport({
    host: "mail.smartshiphub.com",
    port:587,
    secure:false,
    auth: {
        user: appSettingsModel.getAppSettingsJsonData().emailConfig.username,
        pass: appSettingsModel.getAppSettingsJsonData().emailConfig.password
    },
    tls: {rejectUnauthorized: false}
});


const sendEMail = (to, bcc, subject, messageText, reply) => {

    const mailOptions = {
        from: appSettingsModel.getAppSettingsJsonData().emailConfig.username,
        to: to,
        bcc: bcc,
        subject: subject,
        html: messageText
    };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("Email : Username and Password not accepted. Please check your Mail Settings ",error);
                // return error;
            } else {
                console.log('Email sent: ' + info.response);
                // return info.response;

                reply
                    .code(200)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send(JSON.stringify(info.response));
            }
        });


}

module.exports = {
    sendMail: sendEMail
}

