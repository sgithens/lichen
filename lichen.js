(function () {
  "use strict";

  var express = require('express'),
      app = express(),
      fs = require('fs'),
      fluid = require("infusion"),
      lichen = fluid.registerNamespace("lichen");
  
  app.set('view engine', 'me2');
  
  // http://stackoverflow.com/questions/9920208/expressjs-raw-body/9930715#9930715
  app.use(function(req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function() {
      req.rawBody = data;
      next();
    });
  });
  
  app.get('/edit', function(req, res) {
    var fileToEdit = req.query["file"];
    var editContent = fs.readFileSync(fileToEdit);
    res.render('edit', {
      filePath: fileToEdit,
      editContent: editContent
    });
  });
  
  app.post('/edit', function(req, res) {
    var fileToEdit = req.query["file"];
    console.log(fileToEdit);
    fs.writeFileSync(fileToEdit, req.rawBody);
  });
  
  app.use('/static', express.static(__dirname + '/static'));
  
  app.listen(3000);

})();