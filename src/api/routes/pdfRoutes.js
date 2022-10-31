//  'use strict';


'use strict';

const PdfController = require("../controllers/pdfController");
const path = require("path");
const multer = require('fastify-multer');
const upload = multer({ dest: path.join(__dirname, "../PDFFiles/", "AllFiles"), }); 

const fastify = require('fastify')()



 
module.exports = async function (fastify, opts) {

// upload pdf file Record ====>

    fastify.post('/uploadReportInfo',{preHandler : upload.single('file')},async function (req, reply) {
        const response = await PdfController.uploadReportInfo(req);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);

        console.log('/uploadReportInfo :: ', reply.getResponseTime());
    });

    
  


//  get one pdf file report ==>
    fastify.get('/getPdfDataById', async function (request,reply){
        const response = await PdfController.getById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getPdfDataById ::', reply.getResponseTime());
    });


// get download pdf ===>
fastify.get('/downloadPdf', async function (request, reply) {
    const response = await PdfController.downloadpdfFile(request,reply);

    reply
        .code(200)
        // .header('Content-Type', 'application/json; charset=utf-8')
        .send(response);

    console.log('/getAllWidgetsParameters :: ', reply.getResponseTime());
});

 // get  all pdf file report  ==>
    fastify.get('/getAllReportData', async function(request,reply){
        const response = await PdfController.getReportData(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/getPdfData ::', reply.getResponseTime());
    });

// delete pdf ==>
    fastify.post('/deletePdfData', async function(request,reply){
        const response = await PdfController.deletepdfFile(request);
        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
            console.log('/deletePdfDataById ::', reply.getResponseTime());
    });


// update pdf file report ==>
    fastify.post('/updatePdfDataById', async function(request,reply){
        const response = await PdfController.updateById(request);

        reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(response);
        console.log('/updatePdfDataById ::', reply.getResponseTime());
    });

   
    
}  




// //  imp pdf  ----->
//  app.post('/upload', async(req, res) => {
//    var {upload} = req.files
//   var data = upload.data
//    console.log(data);
//    const x = await pool.query(`insert into attachment (data, file_name, category) values (${data}, '${upload.name}', 'test')`)
//  Deconstruct x to get response values
//    res.send("OK")
//  });




//  // =============>