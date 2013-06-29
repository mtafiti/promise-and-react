var utilities = require('./libs/utilities-server');

// holds all our boxes
var allshapes;


// shape object to hold data
function SelHandle(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = 1; // default width and height?
    this.h = 1;
    this.selected = false;
    this.fill = '#444444';
    this.strokecolor = '#444444';
}

// shape object to hold data
function ShapeObj(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.selected = false;
    this.fill = '#444444';
    this.strokecolor = '#0A0A0A';
    this.strokewidth = 2;
    this.angle = 0;

    this.type = 'rect';

    //unique id toso: shldnt be like this
    this.shpid = utilities.generateRandomID('SHP-');

    //grp id
    this.grpid = '';
    //selection handles for each shape
    this.selectionhandles = new Array();

    for (var i = 0; i < 8; i++) {
        var rect = new SelHandle();
        this.selectionhandles.push(rect);
    }

}

var initialize = function () {

    allshapes = [];
};

exports.initialize = initialize;