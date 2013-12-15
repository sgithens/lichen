/**
 * Dumps fluid components as ctags files
 *
 * The below are the arguments that gedits source code browser uses:
 * -nu --fields=fiKlmnsSzt -f - /home/sgithens/code/gpii/node_modules/universal/gpii/node_modules/deviceReporter/src/DeviceReporter.js
 */
(function () {

var fluid = require("infusion"),
    esprima = require("esprima"),
    fs = require("fs"),
    _ = require("underscore"),
    util = require("util"),
    mu = require("mu2"),
    lichen = fluid.registerNamespace("lichen");

var tags = [];
var addTag = function(items) {
    console.log(items.join("\t"));
};

lichen.astTypes = {
    VARIABLE: "variable",
    FUNCTION: "function",
    FLUID_DEFAULTS: "fluid defaults",
    FLUID_DEMANDS: "fluid demands"
};

/**
 * Can be passed to lichen.doAstNode in order to generate ctags style output
 * of the source file.
 */
lichen.fluidTagsMaker = function(info) {
    addTag([info.name, info.filename, info.linenum+";\"", 
        "kind:"+lichen.astTypes[info.type],"line:"+info.linenum,
        "language:JavaScript"]);
};

lichen.jsonAstExplorer = function(info) {
    var nodes = [];

};

/**
 * For a node from an esprima parser ast, determines the full dotted name for 
 * variable, or function, or whatever. ie. The function could be called
 * 'makeit', but is scoped out fully as 'org.stuff.tools.makeit'. 
 */
lichen.getDottedName = function(astnode) {
    if (astnode.type === "MemberExpression") {
        return lichen.getDottedName(astnode.object) + "." + astnode.property.name;
    } 
    else if (astnode.type === "Identifier") {
        return astnode.name;
    }
};

/**
 * From the esprima parse, get the doc comment if there is one (else empty 
 * string), for the function or thing that starts on the line passed in.
 */
lichen.getAstDocComment = function(ast, functionLine) {
    var togo = "";
    // TODO: Cache this eventually or something
    for (var i in ast.comments) {
        var c = ast.comments[i];
        if (c.type === "Block" && c.loc.end.line === functionLine-1) {
            togo = c.value.replace(/\n\s*\*/g, "\n").replace(/^\s*\*/g,"");
        }
    }
    return togo;
};

lichen.getSourceLines = function(start, end, info) {
    togo = "";
    for (var i = start-1; i < end; i++) {
        togo += info.lines[i] + "\n";
    }
    return togo;
};

/**
 * lichen.doAstNode takes an esprima ast node and calls a supplied function
 * with it.  The payload javascript hash will have the following keys.
 *
 * node => the raw ast node 
 * name => the name of the variable, function, etc
 * filename => source file name
 * linenum => line number in the source file 
 * type => The type of thing (function, variable, etc) as described in 
 *         lichen.astTypes
 *
 */
lichen.doAstNode = function(func, ast, info, depth, rootAst) {
    var payload = {
        node: ast,
        filename: info.filename
    };
    if (ast && ast.type && ast.type === "VariableDeclarator") {
        func(_.extend(payload, { 
            name: ast.id.name, 
            linenum: ast.id.loc.start.line,
            type: lichen.astTypes.VARIABLE,
            doc: lichen.getAstDocComment(rootAst, ast.id.loc.start.line),
            source: ""
        }));
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "CallExpression" &&
            ast.expression.callee.type === "MemberExpression" &&
            ast.expression.callee.computed === false &&
            ast.expression.callee.object.name === "fluid" &&
            ast.expression.callee.property.name === "defaults") {
        var start = ast.expression.callee.object.loc.start.line;
        var end = ast.expression.callee.object.loc.end.line;
        func(_.extend(payload, { 
            name: ast.expression.arguments[0].value, 
            linenum: start,
            type: lichen.astTypes.FLUID_DEFAULTS,
            doc: lichen.getAstDocComment(rootAst, start),
            source: lichen.getSourceLines(start, end, info)
        }));
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "CallExpression" &&
            ast.expression.callee.type === "MemberExpression" &&
            ast.expression.callee.computed === false &&
            ast.expression.callee.object.name === "fluid" &&
            ast.expression.callee.property.name === "demands") {
        var start = ast.expression.callee.object.loc.start.line;
        var end = ast.expression.callee.object.loc.end.line;
        func(_.extend(payload, { 
            name: ast.expression.arguments[0].value,
            linenum: start,
            type: lichen.astTypes.FLUID_DEMANDS,
            doc: lichen.getAstDocComment(rootAst, start),
            source: lichen.getSourceLines(start, end, info)
        }));
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "AssignmentExpression" &&
            ast.expression.operator === "=" &&
            ast.expression.right.type === "FunctionExpression") {
        var start = ast.expression.loc.start.line;
        var end = ast.expression.loc.end.line;
        func(_.extend(payload, { 
            name: lichen.getDottedName(ast.expression.left),
            linenum: ast.expression.loc.start.line,
            type: lichen.astTypes.FUNCTION,
            doc: lichen.getAstDocComment(rootAst, ast.expression.loc.start.line),
            source: lichen.getSourceLines(start, end, info)
        }));
    }
    if (typeof(ast) === 'object') {
        for (i in ast) {
            lichen.doAstNode(func, ast[i], info, depth+1, rootAst);
        }
    }
};

var analyzeFluidSourcefile = function(filename, astfunc) {
    var path = filename.split("/");
    var info = {filename:path[path.length-1]};
    code = fs.readFileSync(filename, {encoding:"utf8"});
    info.lines = code.split('\n');
    ast = esprima.parse(code, {  
        loc: true,
        comment: true,
        raw: true
    });
    
    var nodes = [];
    var visiter = function(info) {
        nodes.push(info);
    }
    lichen.doAstNode(visiter, ast, info, 1, ast);

    var out = _.findWhere(nodes, {name: "fluid.setLogging"});
    //console.log(out);
    var start = out.node.loc.start.line;
    var end = out.node.loc.end.line;
    //console.log(out.node.loc.start.line + " : " + out.node.loc.end.line);
    console.log(out);
    //console.log(fluid.prettyPrintJSON(out));
    mu.root = __dirname + "/views";
    
    var muc = {
        "defaults": _.where(nodes, {type: lichen.astTypes.FLUID_DEFAULTS}),
        "demands": _.where(nodes, {type: lichen.astTypes.FLUID_DEMANDS}),
        "functions": _.where(nodes, {type: lichen.astTypes.FUNCTION})
    }
    var stream = mu.compileAndRender("fluiddoc.me2", muc);
    var filestream = fs.createWriteStream("./doc.html");
 
    util.pump(stream, filestream);
    
};

filenames = process.argv.slice(2);
for (idx in filenames) {
    if (filenames[idx].indexOf("-") !== 0) {
        analyzeFluidSourcefile(filenames[idx], lichen.fluidTagsMaker);
    }
}

})();
