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
    handlebars = require("handlebars"),
    argparse = require("argparse"),
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

// To distinguish api vs unsupported functions etc etc.
lichen.apiStatus = {
    API: "api",
    UNSUPPORTED: "unsupported"
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
lichen.getAstDocComment = function(ast, functionLine, info) {
    var togo = "";

    // There is sometimes whitespace/blank lines between a doc comment and it's
    // corresponding function, so we'll walk back any blank lines and check 
    // those.
    var commentLine = functionLine-1;
    while (togo === "") {
        // TODO: Cache/Hash this eventually, rather than loop through each time.
        for (var i in ast.comments) {
            var c = ast.comments[i];
            if (c.type === "Block" && c.loc.end.line === commentLine) {
                // Handle the cases for * at the beginning of a line
                togo = c.value.replace(/\n\s*\*/g, "\n").replace(/^\s*\*/g,"");
                // Handle the case for a * left over from a **/ at the end.
                togo = togo.replace(/ \*$/, "");
            }
            else if (c.type === "Line" && c.loc.end.line === commentLine) {
                togo = c.value;
            }
        }
        // If we didn't find a comment, and the line we thought it would be 
        // on is all whitespace, see if we can go up a line, otherwise quit.
        if (togo === "" && /^\s*$/.test(info.lines[commentLine-1])) {
            if (commentLine-1 >= 0) {
                commentLine--;
            }
            else {
                break;
            }
        }
        else {
            break;
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
            doc: lichen.getAstDocComment(rootAst, ast.id.loc.start.line, info),
            source: "",
            status: lichen.apiStatus.UNSUPPORTED
        }));
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "CallExpression" &&
            ast.expression.callee.type === "MemberExpression" &&
            ast.expression.callee.computed === false &&
            ast.expression.callee.object.name === "fluid" &&
            ast.expression.callee.property.name === "defaults") {
        var start = ast.expression.loc.start.line;
        var end = ast.expression.loc.end.line;
        func(_.extend(payload, { 
            name: ast.expression.arguments[0].value, 
            linenum: start,
            type: lichen.astTypes.FLUID_DEFAULTS,
            doc: lichen.getAstDocComment(rootAst, start, info),
            source: lichen.getSourceLines(start, end, info),
            status: lichen.apiStatus.API
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
            doc: lichen.getAstDocComment(rootAst, start, info),
            source: lichen.getSourceLines(start, end, info),
            status: lichen.apiStatus.API
        }));
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "AssignmentExpression" &&
            ast.expression.operator === "=" &&
            ast.expression.right.type === "FunctionExpression") {
        var start = ast.expression.loc.start.line;
        var end = ast.expression.loc.end.line;
        var curnode = _.extend(payload, { 
            name: lichen.getDottedName(ast.expression.left),
            linenum: ast.expression.loc.start.line,
            type: lichen.astTypes.FUNCTION,
            doc: lichen.getAstDocComment(rootAst, ast.expression.loc.start.line, info),
            source: lichen.getSourceLines(start, end, info)
        });
        if (/non-api/i.test(curnode.doc)) {
            curnode.status = lichen.apiStatus.UNSUPPORTED;
        }
        else {
            curnode.status = lichen.apiStatus.API;
        }
        func(curnode);
    }
    if (typeof(ast) === 'object') {
        for (i in ast) {
            lichen.doAstNode(func, ast[i], info, depth+1, rootAst);
        }
    }
};

var analyzeFluidSourcefile = function(filename, outfile, astfunc, options) {
    if (!options) options = {};
    var theme = options.theme || 'fluiddoc-codemirror';

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

    var prepobj = function(nodes, search) {
        var togo = _.where(nodes, search);
        togo = _.sortBy(togo, function(n) { return n.name; });
        return togo;
    };

    var context = {
        "defaults": prepobj(nodes, {type: lichen.astTypes.FLUID_DEFAULTS}),
        "demands": prepobj(nodes, {type: lichen.astTypes.FLUID_DEMANDS}),
        "functions": prepobj(nodes, {
            type: lichen.astTypes.FUNCTION,
            status: lichen.apiStatus.API
        })
    }
    if (options.nonapi) {
        context["non-api-functions"] = prepobj(nodes, {
            type: lichen.astTypes.FUNCTION,
            status: lichen.apiStatus.UNSUPPORTED
        });
    }
    var sourceTemplateFile = theme + ".hbs";
    var functionDocTemplateFile = theme + "-function.hbs";
    var source = fs.readFileSync(__dirname + "/views/" + sourceTemplateFile, {encoding: 'utf8'}); 
    var functionDocSrc = fs.readFileSync(__dirname + "/views/" + functionDocTemplateFile, 
        {encoding: 'utf8'}); 
    var template = handlebars.compile(source);
    handlebars.registerPartial("functionDoc", functionDocSrc);
    var result = template(context);
    fs.writeFile(outfile, result);
};

var parser = new argparse.ArgumentParser({
    addHelp: true,
    description: "Doc utilities for Fluid and Javascript"
});
parser.addArgument(
    ['--nonapi'],
    {
        help: "Include non-api functions",
        nargs: 0
    }
);
parser.addArgument(
    ['--theme'],
    {
        help: "Use an option theme, ex. --theme plaincode",
        nargs: 1
    }
);
parser.addArgument(
    ['inputfile']
);
parser.addArgument(
    ['outputfile']
);
var args = parser.parseArgs();

analyzeFluidSourcefile(args.inputfile, args.outputfile, lichen.fluidTagsMaker, args);
})();
