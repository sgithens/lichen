# Lichen

Development tools for javascript, node, Fluid Infusion, and the GPII.
These are development utilities, and not meant for inclusion in a production system
with external users.

## Install

Clone this repo and then install the npm dependencies.

    git clone git@github.com:sgithens/lichen.git
    cd lichen
    yarn install # or npm

# Useful utilities

Most of the utilities are meant to help inspect and debug a live application, and are best
run from a repl, usually a dev console in Firefox, Chrome, etc, or from a node.js repl.
Most of the methods return JSON or live objects, which will usually be conveniently
collapsable in a browser console.

## Fetching common component grades

It's often convenient to quickly take a glimpse at all of your views, models, or other
grades during development. For some of these common grades, we have short top level
lichen entries to grab them.  The map of them is in `lichen.quickLookupGrades`.

```
lichen.models(); # Returns all the modelComponents
lichen.views(); # Returns all the viewComponents
```

## Inspecting Kettle Endpoints

The `lichen.kettleRoutes` function can be used to return json describing the current HTTP
endpoints being served by kettle components. This will include the current live endpoints,
it does not do an exuastive search through the codebase. It would be prudent to run this
on each configuration of the system to see what is being exposed.

Using the GPII as an example, the endpoints could be examined as follows.

```
# We are in the gpii directory, and have npm installed lichen.
node
> require("./gpii.js"); # Starts the GPII
> var lichen = require("./node_modules/lichen/src/lichen.js");
> lichen.kettleRoutes();
> console.log(JSON.stringify(lichen.kettleRoutes(), null, 4));
```

## Fluid Doc / Tags

To get the javadoc style output page for a particular javascript file
run the following. The first argument is the input file, and the second
argument is the output. Example:

    node fluid-tags.js ../gpii/node_modules/universal/node_modules/infusion/src/framework/core/js/Fluid.js ./Fluid.js.doc.html
