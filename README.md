# Lichen

Development tools for javascript, node, Fluid Infusion, and the GPII
There is a lot of cleanup and improvement going on here.  This code is still
pretty rough.

## Install

Clone this repo and then install the npm dependencies.

    git clone git@github.com:sgithens/lichen.git
    cd lichen
    npm install

## Fluid Doc / Tags

To get the javadoc style output page for a particular javascript file
run the following. The first argument is the input file, and the second 
argument is the output. Example:

    node fluid-tags.js ../gpii/node_modules/universal/node_modules/infusion/src/framework/core/js/Fluid.js ./Fluid.js.doc.html 
