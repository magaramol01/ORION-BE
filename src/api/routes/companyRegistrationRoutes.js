'use strict';

const CompanyRegistrationController = require('../controllers/companyRegistrationController');
const fs = require('fs');
const path = require('path');

module.exports = async function (fastify, opts) {
    fastify.post('/createCompanyEntry', async function (request, reply) {
        const response = await CompanyRegistrationController.insert(request);
        let dir = path.join(__dirname, '..', '..','..', 'upload/images/');
        /* create directory */
        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err)
                console.log(err);
        });

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(response));

        console.log('/createCompanyEntry :: ', reply.getResponseTime());
    });

    fastify.get('/getAllCompanyEntry', async function (request, reply) {
        const response = await CompanyRegistrationController.getAllData(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getAllCompanyEntry ::', reply.getResponseTime());
    });

    fastify.post('/getCompanyEntryByID', async function (request, reply) {
        const response = await CompanyRegistrationController.getDataByID(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getCompanyEntryByEmail ::', reply.getResponseTime());
    });


    fastify.post('/deleteCompanyEntry', async function (request, reply) {
        const response = await CompanyRegistrationController.removeByEmail(request);
        let companyData = [];
        if(response.isSuccess){
            companyData = await CompanyRegistrationController.getAllData(request);
        }
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(JSON.stringify(companyData));

        console.log('/deleteCompanyEntry :: ', reply.getResponseTime());
    });

    fastify.post('/updateCompanyDataById', async function (request, reply) {
        const response = await CompanyRegistrationController.updateById(request);
        let dir = path.join(__dirname, '..', '..','..', 'upload/images/');
        /* create directory */
        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err)
                console.log(err);
        });

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/updateCompanyDataById ::', reply.getResponseTime());
    });

    fastify.post('/uploadFile', async function (req, reply) {
        let response = "";
        let data = req.body.file;   //base64 of image
        let dir = path.join(__dirname, '..', '..','..', 'upload/images/');
        /* create directory */
        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err)
                console.log(err);
        });
        let filepath = path.join(__dirname, '..', '..','..', 'upload/images/')+req.body.fileName;
        let base64Image = data.split(';base64,').pop();  //remove prefix from base64

        /* convert base64 to original file and write file into folder created */
        fs.writeFile(filepath, base64Image, {encoding: 'base64'}, function (err) {
            if (err) {
                response = err;
                console.log(err);
            } else {
                response = "Company Logo Uploaded Successfully !!!"
            }
            reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send(response);
            console.log('/uploadFile ::', reply.getResponseTime());
        });
    });

};
