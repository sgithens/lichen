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
 * Inspect the running infusion system and tally the number of instantiated
 * components by type name.
 *
 * @return {Object} Returns a hash of integers keyed by Fluid typeNames.
 */
lichen.componentFrequencies = function () {
    // TODO Is this the correct way to get all the current components in the
    // system?  Does this include sub-components?
    var comps = fluid.queryIoCSelector(fluid.rootComponent, "");
    var frequencies = {};
    fluid.each(comps, function (comp) {
        if (frequencies[comp.typeName]) {
            frequencies[comp.typeName] += 1;
        }
        else {
            frequencies[comp.typeName] = 1;
        }
    });
    return frequencies;
};

/**
 * Computes a graph for the current infusion environment. Each node consists
 * of an id and information for a fluid.modelComponent. Each edge between
 * nodes consists of the id, segs, and other metadata for a model relay rule.
 *
 * The output will look like:
 *
 * {
 *   "modelID-1": {
 *     // There may be other metadata here
 *     edges: {
 *       "listener-ID": {
 *         headSegs: ["",""],
 *         tailSegs: ["",""],
 *         tailCompId: "modelID-2"
 *       },
 *       "listender-ID2": {etc}
 *     }
 *   }
 *   "modelID-2": {}
 * }
 *
 * Note: Currently using the graph theory terms head and tail, but should maybe
 * use source and target, as long as it's clear which node(s) they are referring to.
 * Also perhaps, we could squash bi-directional modelRelay rules.
 *
 * Note: Currently there isn't quite enough inspectable information to fully
 * generate this.
 * @return {Object}
 */
lichen.computeModelRelayGraph = function () {
    var graph = {};
    var models = lichen.models();
    fluid.each(models, function (model) {
        var curNode = {
            id: model.id,
            typeName: model.typeName,
            edges: {}
        };
        fluid.each(model.applier.listeners.sortedListeners, function (listener) {
            if (listener.isRelay) {
                curNode.edges[listener.listenerId] = {
                    headSegs: listener.segs,
                    tailSegs: ["Buried-in", "listener", "Closure:fluid.registerDirectChangeRelay", "targetSegs"],
                    tailCompId: ["Buried-in", "listener", "Closure:fluid.registerDirectChangeRelay", "target", "id"],
                    tailTypeName: ["Buried-in", "listener", "Closure:fluid.registerDirectChangeRelay", "target", "typeName"]
                };
            }
        });
        graph[model.id] = curNode;
    });
    return graph;
};

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