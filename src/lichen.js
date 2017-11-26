/**
 * Infusion Model Component Utilities
 *
 * Utilities for working with, developing, and debugging Infusion model
 * components. This should include helpful routines for inspecting models,
 * testing model relay rules, debugging model listeners, and similar 
 * involved functions.
 */
"use strict";

var lichen = fluid.registerNamespace("lichen");

/**
 * Creates a function taking no parameters to quickly retrieve a live list
 * of component instances for a particular grade name.
 *
 * @param {String} A full grade name. ex. fluid.viewComponent.
 * @return {Function} A function that will look up the components in the running
 * system.
 */
lichen.getFluidComponentLookupFunction = function (gradeName) {
    return function () {
        return fluid.queryIoCSelector(fluid.rootComponent, gradeName);
    };
};

/**
 * List of grades that will have quick lookup functions created for them.
 *
 * Any of these can then be used from the console as:
 *
 * lichen.models();  # Returns the list of live modelComponents in system.
 */
lichen.quickLookupGrades = {
    models: "fluid.modelComponent",
    views: "fluid.viewComponent",
};

fluid.each(lichen.quickLookupGrades, function (gradeName, accessName) {
    lichen[accessName] = lichen.getFluidComponentLookupFunction(gradeName);
});

/**
 * Returns a listing of all kettle routes currently registered in the running
 * application, organized by their `kettle.app`.
 * 
 * @return {Object}
 */
lichen.kettleRoutes = function () {
    var routesTogo = [];
    var kettleApps = fluid.queryIoCSelector(fluid.rootComponent, "kettle.app");
    fluid.each(kettleApps, function (kettleApp) {
        routesTogo.push({
            typeName: kettleApp.typeName,
            id: kettleApp.id,
            requestHandlers: fluid.copy(kettleApp.options.requestHandlers)
        });
    });
    return routesTogo;
};

/**
 * Grade to log diagnostics whenever a handlebars template view renders.
 * This can be useful for tracking the order and timeline of rendering on
 * a page which lots of views.
 */
fluid.defaults("lichen.debug.handlebars.templateAware", {
    listeners: {
        "onMarkupRendered": [
            {
                funcName: "console.log",
                args: ["Lichen: Rendering from ", "{that}.id", "{that}.typeName"]
            } 
        ]
    }
});

/**
 * Grade to attach the handlebars rendering diagnostics to all instances
 * in a running system. Creating an instance of this component will take
 * care of all the work.
 *
 * ```
 * lichen.debug.handlebarsMapper();
 * ```
 */
fluid.defaults("lichen.debug.handlebarsMapper", {
    gradeNames: ["fluid.component", "fluid.resolveRoot"],
    distributeOptions: {
        record: "lichen.debug.handlebars.templateAware",
        target: "{/ gpii.handlebars.templateAware}.options.gradeNames"
    }
});


// TODO Set this up to only run for node.js
module.exports = lichen

// var lichen = require("./node_modules/lichen/src/lichen.js");