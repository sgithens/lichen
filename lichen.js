// var static = require('node-static');
// 
// var fileServer = new static.Server('/');
// 
// require('http').createServer(function (req, res) {
// 
//     req.addListener('end',function () {
//         console.log("SWG URL: "+req.url);
//         if (req.url.indexOf("/static") == 0) {
//             fileServer.serve(req, res);
//         }
//         //#else if ({
// 
//         //#}
//         else {
//             res.writeHead(200, {'Content-Type': 'text/plain'});
//             res.end('Hello Lichen\n');
//         }
//     }).resume();
// 
// }).listen(8089);

var express = require('express');
var app = express();
var fs = require('fs');

app.set('view engine', 'me2');

// http://stackoverflow.com/questions/9920208/expressjs-raw-body/9930715#9930715
app.use(function(req, res, next) {
    console.log("Use it!");
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        console.log("AACK_orig!"); 
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
    });
    console.log("I wonder...");
    console.log(data);
});

app.get('/edit', function(req, res) {
    var editContent = fs.readFileSync(__dirname + '/lichen.js');
    res.render('edit', {editContent: editContent});
});

app.post('/edit', function(req, res) {
    console.log("What the!");
    console.log(req.rawBody);
});

app.use('/static', express.static(__dirname + '/static'));
//app.use(express.bodyParser());

app.listen(3000);
