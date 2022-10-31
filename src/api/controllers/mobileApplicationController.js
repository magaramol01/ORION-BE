'use strict';

/*
* CRUD CONTROLLER
* */
const mobileApplicationModel = require("../models/mobileapplicationModel");


 const getrtdasbyship = async function (id) {
   return  await mobileApplicationModel.getLastRdas(id)
};


module.exports = {
    getrtdasbyship: getrtdasbyship,
};



