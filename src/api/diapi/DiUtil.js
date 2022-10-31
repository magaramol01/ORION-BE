const https = require("https");
const axios = require('axios').default;
const appSettingsModel = require('../models/appSettingsModel');

const DiUtil = (function () {
    let instance;


    const ignoreSSL = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    });
    const BASE_URL = appSettingsModel.getAppSettingsJsonData().diurl1;
    const BASE_URL2 = appSettingsModel.getAppSettingsJsonData().diurl2;
    // const BASE_URL = "https:/localhost:8443/enterprise/diapi/v1";
    const loginUrl = BASE_URL + "/getOrGenerateAPiKey";
    const loginUrl2 = BASE_URL2 + "/getOrGenerateAPiKey";
    const generateToken = BASE_URL + "/generateToken"
    const generateToken2 = BASE_URL2 + "/generateToken"
    const getPublishedSheets = appSettingsModel.getAppSettingsJsonData().dipublishurl1;
    const getPublishedSheets2 = appSettingsModel.getAppSettingsJsonData().dipublishurl2;
    const config={
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
        }};

    function createInstance() {
        const object = new Util();
        return object;
    }

    class Util {

        constructor() {
            this.username = '';
            this.key = '';
            this.token = undefined;
        }


        async login(username, password) {
            const payload = {"username": username, "password": password};
            console.log('login use to di   ', payload);
            console.log('on URL   ', loginUrl);
            await ignoreSSL.post(loginUrl, payload, config).then(response => {
                if (response.data) {
                    if (response.data["status"] === 'success') {
                        const data = response.data["data"]
                        if (data) {
                            this.key = data["key"]
                        }
                    } else {
                        console.log('Response data  ', response.data)
                    }
                }
                console.log('This key   ', this.key);
            }).catch(reason => {
                console.log('reason     ', reason)
            })
        }

        async login2(username, password) {
            const payload = {"username": username, "password": password};
            console.log('login use to di   ', payload);
            await ignoreSSL.post(loginUrl2, payload, config).then(response => {
                if (response.data) {
                    if (response.data["status"] === 'success') {
                        const data = response.data["data"]
                        if (data) {
                            this.key = data["key"]
                        }
                    } else {
                        console.log('Response data  ', response.data)
                    }
                }
                console.log('This key   ', this.key);
            }).catch(reason => {
                console.log('reason     ', reason)
            })
        }


        async generateToken() {
            const payload = {"key": this.key};
            console.log('login use to di   ', payload);
            await ignoreSSL.post(generateToken, payload, config).then(response => {
                console.log(' Response Data    ', response.data);
                if (response.data) {
                    const data = response.data;
                    if (data["status"] === "success") {
                        const resData = data.data;
                        if (resData) {
                            this.token = resData["token"];
                        }
                    }
                }
                console.log("This token   ", this.token);
            }).catch(reason => {
                console.log('reason     ', reason)
            })
        }


        async generateToken2() {
            const payload = {"key": this.key};
            console.log('login use to di   ', payload);
            await ignoreSSL.post(generateToken2, payload, config).then(response => {
                console.log(' Response Data    ', response.data);
                if (response.data) {
                    const data = response.data;
                    if (data["status"] === "success") {
                        const resData = data.data;
                        if (resData) {
                            this.token = resData["token"];
                        }
                    }
                }
                console.log("This token   ", this.token);
            }).catch(reason => {
                console.log('reason     ', reason)
            })
        }

        async getPublishedSheets() {

            const sheets = [];
            if (this.token === undefined) {
                console.log("Token is undefined you need to login before getting published sheets");
                return;
            }
            await ignoreSSL.post(getPublishedSheets + "?token=" + this.token+"&key="+this.key+"&timeout=300000", {},config).then(response => {

                console.log(' Response Data    ', response.data);
                if (response.data) {
                    const data = response.data;

                    if (data["status"] === "success") {
                        console.log('Response data  ', data);

                        if(data["status"] === "success"){
                            let dData = data.data;
                            dData.forEach(x=>{
                                console.log(x)
                                let s = x.sheets;
                                s.forEach(y=>{
                                    sheets.push(y.URL+"&token="+this.token+"&key="+this.key+"&timeout=300000")
                                })
                            })
                        }
                    }
                    sheets.forEach(x=>{
                        console.log('sheet ',x)
                    })
                }


            }).catch(reason => {
                console.log('reason     ', reason)
            })
            return sheets;
        }

        async getPublishedSheets2() {

            const sheets = [];
            if (this.token === undefined) {
                console.log("Token is undefined you need to login before getting published sheets");
                return;
            }
            await ignoreSSL.post(getPublishedSheets2 + "?token=" + this.token+"&key="+this.key+"&timeout=300000", {},config).then(response => {

                console.log(' Response Data    ', response.data);
                if (response.data) {
                    const data = response.data;

                    if (data["status"] === "success") {
                        console.log('Response data  ', data);

                        if(data["status"] === "success"){
                            let dData = data.data;
                            dData.forEach(x=>{
                                console.log(x)
                                let s = x.sheets;
                                s.forEach(y=>{
                                    sheets.push(y.URL+"&token="+this.token+"&key="+this.key+"&timeout=300000")
                                })
                            })
                        }
                    }
                    sheets.forEach(x=>{
                        console.log('sheet ',x)
                    })
                }


            }).catch(reason => {
                console.log('reason     ', reason)
            })
            return sheets;
        }
    }


    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

const instance = DiUtil.getInstance();

module.exports = {
    util: instance,
};
