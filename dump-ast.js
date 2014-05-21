/**
 *  Small Utility to dump the Esprima AST for a javascript file.
 *
 */
var esprima = require("esprima"),
    fs = require("fs");

filenames = process.argv.slice(2);
for (idx in filenames) {
    code = fs.readFileSync(filenames[idx], {encoding:"utf8"});
    ast = esprima.parse(code, {  
        loc: true,
        comment: true
    });
    console.log(JSON.stringify(ast,null,4));
}
