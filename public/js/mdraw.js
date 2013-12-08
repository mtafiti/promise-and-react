/**
 *    mDraw - collaborative drawing application
 */

(function (window) {
    //the gfProxy
    var gfproxy;

    //my nickname
    var nick = '';
    var rname = '';

    // holds all our boxes
    var allshapes = [];

    // New, holds the 8 tiny boxes that will be our selection handles
    // the selection handles will be in this order:
    // 0  1  2
    // 3     4
    // 5  6  7
    var selectionHandles = [];

    // Hold canvas information
    var canvas;
    var ctx;
    var WIDTH;
    var HEIGHT;
    var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

    //event types
    var BIRTH = 'BIRTH';
    var MOVE = 'MOVE';
    var DEATH = 'DEATH';

    var isDrag = false;
    var isResizeDrag = false;
    var isDrawing = false;
    var expectResize = -1; // New, will save the # of the selection handle if the mouse is over one.
    var mx, my; // mouse coordinates

    // when set to true, the canvas will redraw everything
    // invalidate() just sets this to false right now
    // we want to call invalidate() whenever we make a change
    var canvasValid = false;

    //current shape type that we want to draw
    var currDrawType;

    //shape properties
    var shapeFill = '#0C69A4';
    var shapeBorderColor = '#0A0A0A';
    var shapeBorderWidth = 2;

    // The node (if any) being selected.
    // multiple objects - an array
    var mySel = [];

    // The selection color and width. Right now we have a red selection with a small width
    var mySelColor = '#CC0000';
    var mySelWidth = 3;
    var mySelBoxColor = 'darkred'; // New for selection boxes
    var mySelBoxSize = 6;


    // since we can drag from anywhere in a node
    // instead of just its x/y corner, we need to save
    // the offset of the mouse when we start dragging.
    // also store the change in x and y mouse values
    var offsetx, offsety, changeInX, changeInY, lastMouseX, lastMouseY;

    // Padding and border style widths for mouse offsets
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

    //added for multi-select
    var isMultiSelecting = false;            // Indicates whether or not the user is drawing a selection rectangle
    var selectionStartX;                // Stores the x coordinate of where the user started drawing the selection rectangle
    var selectionStartY;                // Stores the y coordinate of where the user started drawing the selection rectangle
    var selectionEndX;                  // Stores the x coordinate of the end of the current selection rectangle
    var selectionEndY;                  // Stores the y coordinate of the end of the current selection rectangle


    //nowjs for invocations
    var now;

    // shape object to hold data
    function SelHandle(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.w = 1; // default width and height?
        this.h = 1;
        this.selected = false;
        this.fill = mySelColor; //'#444444';
        this.strokecolor = getRandomColor(); //'#444444';
    }

    /*
     //grouping shapes  - todo: finish implementation
     function Group(shapesToAdd) {
     var maxx = -1, maxy = -1, minx = 9999, miny = 9999;
     shapesToAdd.forEach(function (shape) {
     if (shape.x < minx) minx = shape.x;
     if ((shape.w + shape.x) > maxx) maxx = (shape.w + shape.x);
     if (shape.y < miny) miny = shape.y;
     if ((shape.h + shape.y) > maxy) maxy = (shape.h + shape.y);
     });
     this.base = Object.create(new ShapeObj(minx, miny, (maxx - minx), (maxy - miny)));
     this.type = 'group';
     debugger;
     this.grpid = generateRandomID("GRP-");
     this.fill = '';
     this.selected = true;
     this.x = this.base.x;
     this.y = this.base.y;
     this.w = this.base.w;
     this.h = this.base.h;
     this.shapes = new Array;


     this.add = function (shape) {
     this.shapes.push(shape);
     shape.grpid = this.grpid;
     };

     this.remove = function (shape) {
     for (var i = this.shapes.length; i >= 0; i--) {
     if (this.shapes[i].id === shape.id) {
     this.shapes.splice(i, 1);
     break;
     }
     }
     };

     //add selected shapes to group
     if (shapesToAdd) {

     for (var i = 0; i < shapesToAdd.length; i++) {
     this.add(shapesToAdd[i]);
     //shapesToAdd[i].unselect();
     }
     }

     /*group.mouseDown = function(e){
     group.shapes.forEach(function(shape){  //todo: return values
     shape.MouseDown(e);
     });
     };*/
    /*
     this.mouseMove = function (x, y, e, idx) {
     this.shapes.forEach(function (shape) {
     shape.mouseMove(x, y, e, idx);
     });
     this.base.mouseMove(x, y, e, idx);
     };
     this.mouseUp = function (x, y, e) {

     this.shapes.forEach(function (shape) {
     shape.mouseUp(x, y, e);
     });
     this.base.mouseUp(x, y, e)
     };

     this.draw = function (context) {
     this.shapes.forEach(function (shape) {
     shape.draw(context);
     });
     this.base.draw(context);
     };

     this.isHit = this.base.isHit;
     this.isSelected = this.base.isSelected;
     this.getSelectedHandle = this.base.getSelectedHandle;
     this.resize = function () { //do nothing
     }
     this.select = this.base.select;
     this.unselect = this.base.unselect;
     this.mouseDown = this.base.mouseDown;
     }
     */


    // shape object to hold data
    function ShapeObj(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 1; // default width and height?
        this.h = h || 1;
        this.selected = false;
        this.fill = shapeFill; //'#444444';
        this.strokecolor = shapeBorderColor;
        this.strokewidth = shapeBorderWidth;
        this.angle = 0;

        this.type = 'rect';

        //unique id
        this.shpid = generateRandomID('SHP-');

        //grp id
        this.grpid = '';
        //selection handles for each shape
        this.selectionhandles = new Array();

        for (var i = 0; i < 8; i++) {
            var rect = new SelHandle();
            this.selectionhandles.push(rect);
        }

        //register proxy on this object
        //gfproxy.register(this);

        //groupfn
        addToGroup(this);
    }

    // Shapes 'class'
    ShapeObj.prototype = {
        // each shape is responsible for its own drawing
        // mainDraw() will call this with the normal canvas
        // myDown will call this
        draw: function (context) {
            var i = 0, xi, yi;	//x and y temp vals
            context.fillStyle = this.fill;

            // can skip the drawing of elements that have moved off the screen:
            if (this.x > WIDTH || this.y > HEIGHT) {
                return;
            }
            if (this.x + this.w < 0 || this.y + this.h < 0) {
                return;
            }

            context.strokeStyle = this.strokecolor;
            context.lineWidth = this.strokewidth;
            //possible rotate
            if (this.angle != 0) {
                ctx.save();
                //shape center rotate needs canvas translate
                ctx.translate(this.x + this.w / 2, this.y + this.h / 2); // Translate to centre of shape
                //also change this.x and this.y
                xi = this.x;
                yi = this.y;

                this.x = 0 - (this.w / 2);
                this.y = 0 - (this.h / 2);

                ctx.rotate(this.angle * (Math.PI / 180)); // rotate in radians

            }
            if (this.fill) {
                context.fillRect(this.x, this.y, this.w, this.h);
            }
            //draw default outline
            if (!this.selected) {
                context.strokeRect(this.x, this.y, this.w, this.h);
            }

            // draw selection
            // this is a stroke along the _shape and also 8 new selection handles
            if (this.selected) {

                context.strokeStyle = mySelColor;
                context.lineWidth = mySelWidth;
                context.strokeRect(this.x, this.y, this.w, this.h);

                // draw the boxes

                var half = mySelBoxSize / 2;

                // 0  1  2
                // 3     4
                // 5  6  7

                // top left, middle, right
                if (this.selectionhandles) {
                    this.selectionhandles[0].x = this.x - half;
                    this.selectionhandles[0].y = this.y - half;

                    this.selectionhandles[1].x = this.x + this.w / 2 - half;
                    this.selectionhandles[1].y = this.y - half;

                    this.selectionhandles[2].x = this.x + this.w - half;
                    this.selectionhandles[2].y = this.y - half;

                    //middle left
                    this.selectionhandles[3].x = this.x - half;
                    this.selectionhandles[3].y = this.y + this.h / 2 - half;

                    //middle right
                    this.selectionhandles[4].x = this.x + this.w - half;
                    this.selectionhandles[4].y = this.y + this.h / 2 - half;

                    //bottom left, middle, right
                    this.selectionhandles[6].x = this.x + this.w / 2 - half;
                    this.selectionhandles[6].y = this.y + this.h - half;

                    this.selectionhandles[5].x = this.x - half;
                    this.selectionhandles[5].y = this.y + this.h - half;

                    this.selectionhandles[7].x = this.x + this.w - half;
                    this.selectionhandles[7].y = this.y + this.h - half;


                    context.fillStyle = mySelBoxColor;
                    for (i = 0; i < 8; i++) {
                        var cur = this.selectionhandles[i];
                        context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
                    }
                }
            }

            //if rotate, restore context
            if (this.angle != 0) {
                context.restore();
                this.x = xi;
                this.y = yi;
            }

        }, // end draw
        resize: function (handle, mousex, mousey) {
            var oldx = this.x;
            var oldy = this.y;
            var newx = oldx - mousex;
            var newy = oldy - mousey;
            //keep track of old values
            var oldvals = {x: this.x, y: this.y, w: this.w, h: this.h};

            switch (handle) {
                case 0:
                    this.x = mousex;
                    this.y = mousey;
                    this.w += newx;
                    this.h += newy;
                    break;
                case 1:
                    this.y = mousey;
                    this.h += newy;
                    break;
                case 2:
                    this.y = mousey;
                    this.w = mousex - oldx;
                    this.h += oldy - mousey;
                    break;
                case 3:
                    this.x = mousex;
                    this.w += oldx - mousex;
                    break;
                case 4:
                    this.w = mousex - oldx;
                    break;
                case 5:
                    this.x = mousex;
                    this.w += oldx - mousex;
                    this.h = mousey - oldy;
                    break;
                case 6:
                    this.h = mousey - oldy;
                    break;
                case 7:
                    this.w = mousex - oldx;
                    this.h = mousey - oldy;
                    break;
            }
            //if any value of width or height is -ve
            //set minimum width, height
            if (this.w < 5) {
                this.w = 10;
            }
            if (this.h < 5) {
                this.h = 10;
            }

            //return the changed ranges
            return {x: this.x - oldvals.x,
                y: this.y - oldvals.y,
                w: this.w - oldvals.w,
                h: this.h - oldvals.h};
        },

        rotate: function (mousex, mousey) {
            //calculate the angle btn center of shape
            //and the mouse
            var rel = {x: mousex - this.x, y: mousey - this.y};
            var theta = Math.atan2(rel.y, rel.x);

            //non-negative nos
            //if (theta < 0)
            //   theta += 2 * Math.PI;
            this.angle = 180 * theta / Math.PI;

            invalidate();
        },
        //get the index of the selected handle of this shape, or -1 if none
        getSelectedHandle: function (mx, my) {
            if (this.selectionhandles) {
                for (i = 0, l = this.selectionhandles.length; i < l; i++) {
                    var cur = this.selectionhandles[i];

                    // selection handles will always be rectangles,
                    // so check if we hit this one
                    if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
                        my >= cur.y && my <= cur.y + mySelBoxSize) {
                        //we found a selected handle, return it
                        return i;
                    }
                }
            }
            return -1;
        },
        //get the nearest index of the selected handle of this shape
        getClosestSelectedHandle: function (mx, my) {
            if (this.selectionhandles) {
                var leastDist = 99999, idx = -1;
                for (var i = 0; i < this.selectionhandles.length; i++) {
                    var handle = this.selectionhandles[i];
                    var dist = Math.sqrt((mx - handle.x) * (mx - handle.x) + (my - handle.y) * (my - handle.y));
                    //check least dist, also idx
                    //idx now holds the current nearest selection handle index
                    if (dist < leastDist) {
                        leastDist = dist;
                        idx = i;
                    }
                }
                return idx;
            }
        },
        //is this shape hit?
        isHit: function (mouseX, mouseY) {
            // Determine if the shape was clicked
            var left1 = this.x;
            var right1 = left1 + this.w;
            var top1 = this.y;
            var bottom1 = this.y + this.h;

            if (mouseX >= left1 && mouseX <= right1 && mouseY >= top1 && mouseY <= bottom1) {
                return true;
            } else {
                return false;
            }
        },
        select: function () {
            this.selected = true;
        },
        unselect: function () {
            this.selected = false;
        },
        isSelected: function () {
            return this.selected;
        },
        move: function (x, y) {
            this.x = this.x + x;
            this.y = this.y + y;
            //invalidate the canvas
            invalidate();
        },
        //mouse events
        mouseDown: function (e) {
            this.select();
        },
        mouseMove: function (x, y, e, idx) {
            if (isDrag) {
                this.move(x, y);
                publishDistData('editshape', e, this);
            } else if (isResizeDrag) {
                this.resize(idx, x, y);	//use resize handle as 4th arg
                publishDistData('editshape', e, this);
            }
            invalidate();
        },
        mouseUp: function (x, y, e) {
            //this.selected= false; //disable? if a shape is selected leave handles showing
        }

    };

    /*
     *	Now the definition of the shapes
     */

    //An ellipse
    function Ellipse(x, y, w, h) {

        var ellipse = Object.create(new ShapeObj(x, y, w, h));
        ellipse.type = 'ellipse';
        // draw ellipse function. from:
        // http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas
        function drawEllipse(ctx, thex, they, thew, theh) {
            var kappa = .5522848;
            if (thew <= 2) thew = 4;
            if (theh <= 2) theh = 4;
            ox = (thew / 2) * kappa, // control point offset horizontal
                oy = (theh / 2) * kappa, // control point offset vertical
                xe = thex + thew,           // x-end
                ye = they + theh,           // y-end
                xm = thex + thew / 2,       // x-middle
                ym = they + theh / 2;       // y-middle

            ctx.beginPath();
            ctx.moveTo(thex, ym);
            ctx.bezierCurveTo(thex, ym - oy, xm - ox, they, xm, they);
            ctx.bezierCurveTo(xm + ox, they, xe, ym - oy, xe, ym);
            ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
            ctx.bezierCurveTo(xm - ox, ye, thex, ym + oy, thex, ym);
            ctx.closePath();
            if (ellipse.fill) ctx.fill();	//fill with current color
            ctx.stroke();	//draw
        }

        ellipse.draw = function (context) {
            var i = 0;
            context.fillStyle = ellipse.fill;

            // can skip the drawing of elements that have moved off the screen:
            if (ellipse.x > WIDTH || ellipse.y > HEIGHT) {
                return;
            }
            if (ellipse.x + ellipse.w < 0 || ellipse.y + ellipse.h < 0) {
                return;
            }

            context.strokeStyle = ellipse.strokecolor;
            context.lineWidth = ellipse.strokewidth;

            //context.fillRect(ellipse.x, ellipse.y, ellipse.w, ellipse.h);
            //draw default outline
            if (!ellipse.selected) {
                //context.strokeRect(ellipse.x, ellipse.y, ellipse.w, ellipse.h);
                drawEllipse(context, ellipse.x, ellipse.y, ellipse.w, ellipse.h);
            } else {
                // draw selection
                // this is a stroke along the shape and also 8 new selection handles
                context.strokeStyle = mySelColor;
                context.lineWidth = mySelWidth;
                //context.strokeRect(ellipse.x, ellipse.y, ellipse.w, ellipse.h);
                drawEllipse(context, ellipse.x, ellipse.y, ellipse.w, ellipse.h);

                // draw the boxes

                var half = mySelBoxSize / 2;

                // 0  1  2
                // 3     4
                // 5  6  7

                // top left, middle, right
                ellipse.selectionhandles[0].x = ellipse.x - half;
                ellipse.selectionhandles[0].y = ellipse.y - half;

                ellipse.selectionhandles[1].x = ellipse.x + ellipse.w / 2 - half;
                ellipse.selectionhandles[1].y = ellipse.y - half;

                ellipse.selectionhandles[2].x = ellipse.x + ellipse.w - half;
                ellipse.selectionhandles[2].y = ellipse.y - half;

                //middle left
                ellipse.selectionhandles[3].x = ellipse.x - half;
                ellipse.selectionhandles[3].y = ellipse.y + ellipse.h / 2 - half;

                //middle right
                ellipse.selectionhandles[4].x = ellipse.x + ellipse.w - half;
                ellipse.selectionhandles[4].y = ellipse.y + ellipse.h / 2 - half;

                //bottom left, middle, right
                ellipse.selectionhandles[6].x = ellipse.x + ellipse.w / 2 - half;
                ellipse.selectionhandles[6].y = ellipse.y + ellipse.h - half;

                ellipse.selectionhandles[5].x = ellipse.x - half;
                ellipse.selectionhandles[5].y = ellipse.y + ellipse.h - half;

                ellipse.selectionhandles[7].x = ellipse.x + ellipse.w - half;
                ellipse.selectionhandles[7].y = ellipse.y + ellipse.h - half;


                context.fillStyle = mySelBoxColor;
                for (i = 0; i < 8; i++) {
                    var cur = ellipse.selectionhandles[i];
                    context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
                }
            }
        }; // end draw
        //get the index of the selected handle of ellipse shape, or -1 if none
        ellipse.getSelectedHandle = function (mx, my) {

            for (i = 0, l = ellipse.selectionhandles.length; i < l; i++) {
                var cur = ellipse.selectionhandles[i];

                // selection handles will always be rectangles,
                // so check if we hit ellipse one
                if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
                    my >= cur.y && my <= cur.y + mySelBoxSize) {
                    //we found a selected handle, return it
                    return i;
                }
            }
            return -1;
        };

        return ellipse;
    }

    //A crect
    function CRectangle(x, y, w, h) {

        var crect = Object.create(new ShapeObj(x, y, w, h));
        crect.type = 'crect';
        // draw rect function. from:
        // http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas
        function drawRoundRect(ctx, thex, they, width, height) {
            radius = 9;

            ctx.beginPath();
            ctx.moveTo(thex + radius, they);
            ctx.lineTo(thex + width - radius, they);
            ctx.quadraticCurveTo(thex + width, they, thex + width, they + radius);
            ctx.lineTo(thex + width, they + height - radius);
            ctx.quadraticCurveTo(thex + width, they + height, thex + width - radius, they + height);
            ctx.lineTo(thex + radius, they + height);
            ctx.quadraticCurveTo(thex, they + height, thex, they + height - radius);
            ctx.lineTo(thex, they + radius);
            ctx.quadraticCurveTo(thex, they, thex + radius, they);
            ctx.closePath();
            ctx.stroke();
            if (crect.fill) {
                ctx.fill();
            }
        }

        crect.draw = function (context) {
            var i = 0;
            context.fillStyle = crect.fill;

            // can skip the drawing of elements that have moved off the screen:
            if (crect.x > WIDTH || crect.y > HEIGHT) {
                return;
            }
            if (crect.x + crect.w < 0 || crect.y + crect.h < 0) {
                return;
            }

            context.strokeStyle = crect.strokecolor;
            context.lineWidth = crect.strokewidth;

            //context.fillRect(crect.x, crect.y, crect.w, crect.h);
            //draw default outline
            if (!crect.selected) {
                //context.strokeRect(crect.x, crect.y, crect.w, crect.h);
                drawRoundRect(context, crect.x, crect.y, crect.w, crect.h);
            } else {
                // draw selection
                // this is a stroke along the shape and also 8 new selection handles
                context.strokeStyle = mySelColor;
                context.lineWidth = mySelWidth;
                //context.strokeRect(crect.x, crect.y, crect.w, crect.h);
                drawRoundRect(context, crect.x, crect.y, crect.w, crect.h);

                // draw the boxes

                var half = mySelBoxSize / 2;

                // 0  1  2
                // 3     4
                // 5  6  7

                // top left, middle, right
                crect.selectionhandles[0].x = crect.x - half;
                crect.selectionhandles[0].y = crect.y - half;

                crect.selectionhandles[1].x = crect.x + crect.w / 2 - half;
                crect.selectionhandles[1].y = crect.y - half;

                crect.selectionhandles[2].x = crect.x + crect.w - half;
                crect.selectionhandles[2].y = crect.y - half;

                //middle left
                crect.selectionhandles[3].x = crect.x - half;
                crect.selectionhandles[3].y = crect.y + crect.h / 2 - half;

                //middle right
                crect.selectionhandles[4].x = crect.x + crect.w - half;
                crect.selectionhandles[4].y = crect.y + crect.h / 2 - half;

                //bottom left, middle, right
                crect.selectionhandles[6].x = crect.x + crect.w / 2 - half;
                crect.selectionhandles[6].y = crect.y + crect.h - half;

                crect.selectionhandles[5].x = crect.x - half;
                crect.selectionhandles[5].y = crect.y + crect.h - half;

                crect.selectionhandles[7].x = crect.x + crect.w - half;
                crect.selectionhandles[7].y = crect.y + crect.h - half;


                context.fillStyle = mySelBoxColor;
                for (i = 0; i < 8; i++) {
                    var cur = crect.selectionhandles[i];
                    context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
                }
            }
        }; // end draw
        crect.resize = function (handle) {
            var oldx = crect.x;
            var oldy = crect.y;
            var newx = oldx - mx;	//TODO: global
            var newy = oldy - my;	//TODO: global

            switch (handle) {
                case 0:
                    crect.x = mx;
                    crect.y = my;
                    crect.w += newx;
                    crect.h += newy;
                    break;
                case 1:
                    crect.y = my;
                    crect.h += newy;
                    break;
                case 2:
                    crect.y = my;
                    crect.w = mx - oldx;
                    crect.h += oldy - my;
                    break;
                case 3:
                    crect.x = mx;
                    crect.w += oldx - mx;
                    break;
                case 4:
                    crect.w = mx - oldx;
                    break;
                case 5:
                    crect.x = mx;
                    crect.w += oldx - mx;
                    crect.h = my - oldy;
                    break;
                case 6:
                    crect.h = my - oldy;
                    break;
                case 7:
                    crect.w = mx - oldx;
                    crect.h = my - oldy;
                    break;
            }
            //if any value of width or height is -ve
            //set minimum width, height
            if (crect.w < 5) {
                crect.w = 10;
            }
            if (crect.h < 5) {
                crect.h = 10;
            }
        };
        //get the index of the selected handle of crect shape, or -1 if none
        crect.getSelectedHandle = function (mx, my) {

            for (i = 0, l = crect.selectionhandles.length; i < l; i++) {
                var cur = crect.selectionhandles[i];

                // selection handles will always be rectangles,
                // so check if we hit crect one
                if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
                    my >= cur.y && my <= cur.y + mySelBoxSize) {
                    //we found a selected handle, return it
                    return i;
                }
            }
            return -1;
        };

        return crect;
    }

    //A line, a bit different
    function Line(x, y, w, h) {
        var line = Object.create(new ShapeObj(x, y, w, h));
        line.type = 'line';

        //specialized draw function
        line.draw = function (context) {
            var i = 0;
            context.fillStyle = line.fill;

            // can skip the drawing of elements that have moved off the screen:
            if (line.x > WIDTH || line.y > HEIGHT) {
                return;
            }
            if (line.x + line.w < 0 || line.y + line.h < 0) {
                return;
            }

            context.strokeStyle = line.strokecolor;
            context.lineWidth = line.strokewidth;

            context.beginPath();
            context.moveTo(line.x, line.y);
            context.lineTo(line.x + line.w, line.y + line.h);
            //ctx.fill();
            context.stroke();
            //context.closePath();

            if (!line.selected) {
                return;
            }
            context.strokeStyle = mySelColor;
            context.lineWidth = mySelWidth;
            //context.strokeRect(this.line.x, this.line.y, this.line.w, this.line.h);


            var half = mySelBoxSize / 2;

            //line has its own 2 selection handles, remove the rest
            line.selectionhandles.splice(2, line.selectionhandles.length - 2);
            // 0
            //
            //      1
            line.selectionhandles[0].x = line.x - half;
            line.selectionhandles[0].y = line.y - half;
            line.selectionhandles[1].x = (line.x + line.w) - half;
            line.selectionhandles[1].y = (line.y + line.h) - half;

            context.fillStyle = mySelBoxColor;
            for (i = 0, l = line.selectionhandles.length; i < l; i++) {
                var cur = line.selectionhandles[i];
                context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
            }
        };
        //specialized resize function for lines
        line.resize = function (handle) {
            var oldx = line.x;
            var oldy = line.y;
            var newx = oldx - mx;	//TODO: global
            var newy = oldy - my;	//TODO: global
            //if expected handle is 7, then change to 1
            if (handle > 1) {
                handle = 1;
            }
            switch (handle) {
                case 0:
                    line.x = mx;
                    line.y = my;
                    line.w += newx;
                    line.h += newy;
                    break;
                case 1:
                    line.w = mx - oldx;
                    line.h = my - oldy;
                    //line.w = -newx;
                    //line.h = -newy;
                    break;
            }
        };
        /*
         // helper function to calculate if line was hit */
        function getHitDist(mX, mY) {
            var x1 = line.x;
            var y1 = line.y;
            var x2 = line.x + line.w;
            var y2 = line.y + line.h;

            var delX = line.w;
            var delY = line.h;
            var di = Math.sqrt(delX * delX + delY * delY);
            var ratio = (((mX - x1) * delX + (mY - y1) * delY) / (delX * delX + delY * delY));
            var ret;
            if (ratio * (1 - ratio) < 0) {
                ret = -1;
            }
            else {
                ret = Math.abs(delX * (mY - y1) - delY * (mX - x1)) / di;
            }
            return ret;
        };
        // Determine if the shape was clicked
        line.isHit = function (mouseX, mouseY) {
            var hitdistance = getHitDist(mouseX, mouseY);

            if (hitdistance === -1 || hitdistance > 4) {
                return false;
            } else {
                return true;
            }
        };

        return line; //return line
    }

//used to easiy initialize a new shape, 
//add it, and invalidate the canvas
    function addShape(x, y, w, h, fill, sel, rectid, type, strokecol, strokew, angle) {
        var rect;
        switch (type) {
            case 'line':
                rect = new Line(x, y, w, h);
                break;
            case 'ellipse':
                rect = new Ellipse(x, y, w, h);
                break;
            case 'crect':
                rect = new CRectangle(x, y, w, h);
                break;
            case 'rect':
            default:
                rect = new ShapeObj(x, y, w, h);
                break;
        }

        //fill
        if (fill === '')
            rect.fill = '';	//transparent fill
        else if (fill) rect.fill = fill;	//arg fill
        else
            rect.fill = shapeFill;	//global fill

        rect.strokecolor = strokecol || shapeBorderColor;
        rect.strokewidth = strokew || shapeBorderWidth;
        //roatation angle
        if (angle)
            rect.angle = angle;

        if (sel) {
            rect.select();
        } else {
            rect.unselect();
        }

        //shape id
        rect.shpid = rectid || rect.shpid;

        allshapes.push(rect);
        invalidate();
        return rect;
    }

    /**
     * function createOn: adds 'on' functionality to an object
     */
    function createOn() {
        //save fact in Facts variable

        //this refers to the shape obj
        return    function (str, fn) {
            if (!this[str]) {
                console.log("draw - property not found: " + str);
                return;
            }
            //if already defined, do nothing.
            if (this[str]["rulefn"])
                return;

            this[str]["rulefn"] = fn;

            gfproxy.registerRule(this[str]);
        };
    }

// initialize our canvas, set draw loop
// then add everything we want to intially exist on the canvas
    function init(n) {
        //store nowjs for invocaitons
        now = n;

        //setup canvas
        canvas = document.getElementById('canv1');
        HEIGHT = canvas.height;
        WIDTH = canvas.width;
        ctx = canvas.getContext('2d');

        //fixes a problem where double clicking causes text to get selected on the canvas
        canvas.onselectstart = function () {
            return false;
        }

        // fixes mouse co-ordinate problems when there's a border or padding
        // see getMouse for more detail
        if (document.defaultView && document.defaultView.getComputedStyle) {
            stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
            stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
            styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
            styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
        }

        // make mainDraw() fire every INTERVAL milliseconds
        setInterval(mainDraw, INTERVAL);

        //show name
        var txt = document.createTextNode((nick || 'Anon') + ' Room: ' + rname);
        document.getElementById('username1').appendChild(txt);

        //default status - selecting mode
        setCurrentDraw('');

        /*canvas.onmousedown = myDown;
         canvas.onmouseup = myUp;
         //canvas.ondblclick = myDblClick;
         canvas.onmousemove = myMove;

         //give canvas shpid for this case
         canvas.shpid = generateRandomID("CNV-");


         // set our events
         var mmoveEe = extractEventE(canvas,'mousedown').mapE(function(md) {
         myDown.call(canvas, md);
         return md;
         });
         var mdownEe = extractEventE(canvas,'mousemove').mapE(function(mm) {
         // Stop the text from getting selected
         myMove.call(canvas, mm);
         return mm;
         });
         var mdropEe = extractEventE(canvas,'mouseup').mapE(function(mu) {
         myUp.call(canvas, mu);
         return mu;
         });
         */
        //init the proxy
        //gfproxy = gfProxyInit(leadersocket);

        //register proxy on this object
        //gfproxy.register(canvas);

        //load reactive toolbar
        loadToolbar();

        //user interactions abstracted as event streams
        initMouseEvents(canvas);

        //starts an auto-save event stream every 5 secs
        //startAutoSaveSessionTimer(10000);

        //for the demo - also touch events
        canvas.addEventListener("touchstart", touchHandler, true);
        canvas.addEventListener("touchmove", touchHandler, true);
        canvas.addEventListener("touchend", touchHandler, true);
        canvas.addEventListener("touchcancel", touchHandler, true);
    }


//wipes the canvas context
    function clear(c) {
        c.clearRect(0, 0, WIDTH, HEIGHT);
    }

// Main draw loop.
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
    function mainDraw() {
        if (canvasValid == false) {
            clear(ctx);

            // stuff to be drawn in the background all the time

            // draw all boxes
            var l = allshapes.length;

            for (var i = 0; i < l; i++) {
                allshapes[i].draw(ctx); // each shape draws itself
            }

            //can add other things here

            // multi select
            // If the user is drawing a selection rectangle, draw it
            if (isMultiSelecting) {
                drawSelectionRectangle(ctx);
            }
            // end multi select

            canvasValid = true;
        }
    }

//set the current drawing type, ideally called from the toolbar
    function setCurrentDraw(draw) {
        currDrawType = draw.toLowerCase();
        if (currDrawType !== '') {
            isDrawing = true;
            //clear all selected shapes
            clearSelectedBoxes();

        }
        else
            isDrawing = false;

    }

// Happens when the mouse is moving inside the canvas
    function myMove(e) {

        //store some global vars
        getMouse(e);

        //move means we are updating sthng that is selected
        for (var i = 0; i < allshapes.length; i++) {
            var _shape = allshapes[i];
            if (_shape.isSelected()) {
                if (isDrag) {
                    //if shift is pressed, rotate
                    if (e.shiftKey) {
                        _shape.rotate(mx, my);
                    } else {
                        //send info to server
                        var shpargs = {
                            shape: _shape,
                            evtargs: uncircularizeEvt(e), //avoid circular references before serializations
                            deltaX: changeInX,
                            deltaY: changeInY,
                            mousex: mx,
                            mousey: my,
                            handle: _shape.getClosestSelectedHandle(mx, my)
                        };
                        //for dragging, we use deltas. for resizing, actual mouse cooords
                        _shape.mouseMove(shpargs.deltaX, shpargs.deltaY, shpargs.evtargs, shpargs.handle);
                    }
                } else if (isResizeDrag) {
                    //debugger;
                    _shape.mouseMove(mx, my, e, expectResize);
                    break;
                }
            }
        }

        // if there's a selection see if we grabbed one of the selection handles
        if (isAnyBoxSelected() && !isResizeDrag) {

            var selBoxes = getSelectedBoxes();

            //find out selected handle from all objects
            for (var i = 0, l = selBoxes.length; i < l; i++) {
                var cur = selBoxes[i];
                var curhandle = cur.getSelectedHandle(mx, my);
                // 0  1  2
                // 3     4
                // 5  6  7
                if (curhandle !== -1) {
                    // we found one
                    expectResize = curhandle;
                    invalidate();

                    //change cursor - doesnt work in some browsers
                    switch (curhandle) {
                        case 0:
                            this.style.cursor = 'nw-resize';
                            break;
                        case 1:
                            this.style.cursor = 'n-resize';
                            break;
                        case 2:
                            this.style.cursor = 'ne-resize';
                            break;
                        case 3:
                            this.style.cursor = 'w-resize';
                            break;
                        case 4:
                            this.style.cursor = 'e-resize';
                            break;
                        case 5:
                            this.style.cursor = 'sw-resize';
                            break;
                        case 6:
                            this.style.cursor = 's-resize';
                            break;
                        case 7:
                            this.style.cursor = 'se-resize';
                            break;
                    }
                    return;
                }
            }
            // not over a selection shape, return to normal
            isResizeDrag = false;
            //no selection handle hit
            expectResize = -1;
            //return cursor to normal
            this.style.cursor = 'auto';

        } else if (isMultiSelecting) {
            // Update the end coordinates of the selection rectangle
            selectionEndX = mx;
            selectionEndY = my;

            invalidate();
        }
    }

// Happens when the mouse is clicked in the canvas
    function myDown(e) {
        getMouse(e);

        //publishMouseEvent(e, BIRTH);

        //check if we are over a selection shape
        if (expectResize !== -1) {
            isResizeDrag = true;
            return;
        }

        var l = allshapes.length;

        //loop - check what has been hit
        for (var i = 0; i < l; i++) {
            var _shape = allshapes[i];

            // Determine if the _shape was clicked
            if (_shape.isHit(mx, my) && !isDrawing) {
                // we hit a shape
                // if this shape is not selected then select it only
                // since we are sure this is not a multi select here
                if (!_shape.isSelected()) {
                    clearSelectedBoxes();
                }
                _shape.mouseDown(e);
                isDrag = true;
                invalidate();
                return;
            }
        }

        //we may be drawing a shape now
        if (isDrawing) {
            // for this method width and height determine the starting X and Y, too.
            // are vars in case we wanted to make them args/global for varying sizes
            var width = 2;
            var height = 2;
            var rect = addShape(mx - (width / 2), my - (height / 2), width, height, null, true, null, currDrawType);
            isResizeDrag = true;
            //set dragging handle to 7
            expectResize = 7;	//improvement: for other shapes, it ca be better to get the last handle of shape

            publishDistData('addshape', e, rect);

            return;
        }

        // if code reaches this point,
        // means we have selected nothing
        clearSelectedBoxes();

        //1. we are not drawing anything
        currDrawType = '';
        isDrawing = false;

        //2. and it means we are starting a multi select - default case

        // Indicate that the user is drawing a selection rectangle and
        // update the selection rectangle start and edit coordinates
        isMultiSelecting = true;
        selectionStartX = mx;
        selectionStartY = my;
        selectionEndX = mx;
        selectionEndY = my;

        // invalidate because we might need the selection border to disappear
        invalidate();
    }

    function myUp(e) {
        var i, l;

        //report to midas
        publishMouseEvent(e, DEATH);

        //normalize coordinates relative to canvas
        getMouse(e);

        expectResize = -1;

        // we finished multiselecting by doing a mouse up
        if (isMultiSelecting) {
            // Reset the selection rectangle, makes it disappear
            selectShapesInRectangle();
            isMultiSelecting = false;
            selectionStartX = 0;
            selectionStartY = 0;
            selectionEndX = 0;
            selectionEndY = 0;
        }
        //if we are still drawing shapes after mouseup, deselect all
        if (currDrawType !== '') {
            clearSelectedBoxes();
        }

        //mouse up on which shape?
        for (i = 0, l = allshapes.length; i < l; i++) {
            var _shape = allshapes[i];
            if (_shape.isHit(mx, my)) {
                //unselect it if we were dragging
                _shape.mouseUp(mx, my, e);
                break;
            }
        }

        /* if (isDrag) {
         //report to server end of drag
         now.clientEndDrag(_shape.shpid, function () {
         console.log("..ended drag on client");
         });
         }
         */

        //todo: put in callback?
        isDrag = false;
        isResizeDrag = false;

        //end multi select part
        invalidate();
    }

// adds a new node
    function myDblClick(e) {

        getMouse(e);
        // for this method width and height determine the starting X and Y, too.
        // are vars in case we wanted to make them args/global for varying sizes
        var width = 20;
        var height = 20;
        var rect = addShape(mx - (width / 2), my - (height / 2), width, height, null, true, null, currDrawType);

        publishDistData('addshape', e, rect);
    }

//made this a function if we wanted to 
//add more logic later
    function invalidate() {
        canvasValid = false;
    }

//checks if any _shape is selected
    function isAnyBoxSelected() {
        for (var i = 0; i < allshapes.length; i++) {
            if (allshapes[i].isSelected())
                return true;
        }
        return false;
    }

    /**
     * function clearSelectedBoxes: Clear all selected boxes
     *
     **/
    function clearSelectedBoxes() {

        for (var i = 0; i < allshapes.length; i++) {
            if (allshapes[i].isSelected()) {
                allshapes[i].unselect();
            }
        }
        invalidate();
    }

    /**
     * deleteSelectedBoxes: delete the currently-selected boxes
     */
    function deleteSelectedBoxes(publish) {

        //here we replace selected boxes with nulls - not to mess with indices..
        var idxs = new Array();
        for (var i = 0, l = allshapes.length; i < l; i++) {
            var thebox = allshapes[i];
            if (thebox.isSelected()) {
                //publish action, or not?
                if (publish) publishDistData('delshape', null, {shpid: thebox.shpid});
                allshapes.splice(i, 1, null);	//insert a null val
            }
        }
        //..then remove the nulls
        allshapes = allshapes.filter(function (val) {
            return val !== null;
        });

        invalidate();
    }

    function deleteAllBoxes() {

        //here we replace selected boxes with nulls - not to mess with indices..
        var idxs = new Array();
        for (var i = 0, l = allshapes.length; i < l; i++) {
            var thebox = allshapes[i];
            publishDistData('delshape', null, {shpid: thebox.shpid});
            allshapes.splice(i, 1, null);	//insert a null val
        }
        //..then reset the array
        allshapes = [];
        invalidate();
    }

// Get _shape of id
    function getBox(shpid) {
        for (var i = 0; i < allshapes.length; i++) {
            var _shape = allshapes[i];
            if (_shape.shpid === shpid)
                return _shape;
        }
        return {};	//check
    }

// Get selected boxes
    function getSelectedBoxes() {
        var arr = new Array();
        for (var i = 0; i < allshapes.length; i++) {
            var _shape = allshapes[i];
            if (_shape.isSelected())
                arr.push(_shape);
        }
        return arr;
    }

//select all boxes
    function selectAllBoxes() {
        allshapes.forEach(function (_shape) {
            _shape.select();
        });
        invalidate();
    }

// function getMouse: Sets mx,my to the mouse position relative to the canvas bounds
// unfortunately this can be tricky, we have to worry about padding and borders
    function getMouse(e) {
        var element = canvas, offsetX = 0, offsetY = 0;

        if (element.offsetParent) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        offsetX += stylePaddingLeft;
        offsetY += stylePaddingTop;

        offsetX += styleBorderLeft;
        offsetY += styleBorderTop;

        //calculate the actual x and y mouse co-ordinates
        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        // Calculate the change in mouse position for the last
        // time getMouse was called, useful in mouse move updates
        changeInX = mx - lastMouseX;
        changeInY = my - lastMouseY;

        // Store the current mouseX and mouseY positions
        lastMouseX = mx;
        lastMouseY = my;
    }

    /**  function normalizeMouseXY: helper function to calibrate the mouse x and y
     *    coordinates cross-browser
     *    see *http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
     */
    function normalizeMouseXY(e) {
        var x;
        var y;
        if (e.pageX || e.pageY) {
            x = e.pageX;
            y = e.pageY;
        }
        else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        // x and y contain the mouse position
        return [x, y];
    }

// Multi select function to draw the multi-select rectangle
    function drawSelectionRectangle(context) {
        context.strokeStyle = "rgb(200,0,0)";

        // Figure out the top left corner of the rectangle
        var x = Math.min(selectionStartX, selectionEndX);
        var y = Math.min(selectionStartY, selectionEndY);

        // Calculate the width and height of the rectangle
        var width = Math.abs(selectionEndX - selectionStartX);
        var height = Math.abs(selectionEndY - selectionStartY);

        //save stroke width
        var sw = context.lineWidth;

        context.lineWidth = 1;
        // Draw the rectangle
        context.strokeRect(x, y, width, height);

        //restore stroke width
        context.lineWidth = sw;
    }

// See if _shape is in the user dragged rectangle
    function selectShapesInRectangle() {

        // Get the bounds of the drawn rectangle
        var selectionTop = Math.min(selectionStartY, selectionEndY);
        var selectionBottom = Math.max(selectionStartY, selectionEndY);
        var selectionLeft = Math.min(selectionStartX, selectionEndX);
        var selectionRight = Math.max(selectionStartX, selectionEndX);

        var selshapes = []; 	//selected shapes

        // Loop through all the boxes and select if it lies within the
        // bounds of the rectangle
        for (var i = 0; i < allshapes.length; i++) {
            var _shape = allshapes[i];

            var boxTop = _shape.y;
            var boxBottom = _shape.y + _shape.h;
            var boxLeft = _shape.x;
            var boxRight = _shape.x + _shape.w;

            if (boxTop >= selectionTop && boxBottom <= selectionBottom && boxLeft >= selectionLeft && boxRight <= selectionRight) {
                //add to selected shapes array
                selshapes.push(_shape);
                _shape.select()
            }
        }
    }

    /*
     function groupShapes - groups the selected shapes (unused)
     */
    /*
     function groupShapes() {

     //here we check if more than one shapes are selected
     //so we group them
     var grp = new Group(getSelectedBoxes());
     allshapes.push(grp);
     //remove other shapes
     for (var i = 0; i < allshapes.length; i++) {
     if (allshapes[i].isSelected())
     allshapes.splice(i, 1);
     }
     }
     */

    function publishDistData(evtType, e, data, state) {
        //avoid circular references before serialization
        var eventOptions = uncircularizeEvt(e);

        //calculate the relative x,y
        var mxy = normalizeMouseXY(eventOptions);
        if (data.shape) {
            console.info("published data for shape: ");
            console.dir(data.shape.shpid);
        }

        publishChange({ shape: data || {}, eventType: evtType, mouseevt: eventOptions, mousexy: mxy});
    }

// Process the distributed event received
// param: data - the mouse, event type and shape data
    function processDistData(data) {
        var _mx, _my;

        if (data.mouseevt) {
            //more testing needed -
            //different browsers report different values
            _mx = data.mousexy[0];
            _my = data.mousexy[1];
        }

        switch (data.eventType) {
            case 'addshape':
            {
                // for this method width and height determine the starting X and Y, too.
                var width = 20;		//can make these a parameter in UI
                var height = 20;
                var rect = addShape(_mx - (width / 2), _my - (height / 2), width, height, data.shape.fill, false, data.shape.shpid, data.shape.type, data.shape.strokecolor, data.shape.strokewidth);
            }
                break;
            case 'editshape':
            {
                //look for this shape
                var found = false;

                for (var i = 0; i < allshapes.length; i++) {
                    var _shape = allshapes[i];
                    if (_shape.shpid === data.shape.shpid) {
                        _shape.x = data.shape.x;
                        _shape.y = data.shape.y;
                        _shape.w = data.shape.w;
                        _shape.h = data.shape.h;
                        _shape.fill = data.shape.fill;
                        _shape.strokewidth = data.shape.strokewidth;
                        _shape.strokewidth = data.shape.strokewidth;
                        _shape.angle = data.shape.angle;
                        found = true;
                        break;
                    }
                }
                //if the shape is not there, create it. again, this should not be necessary
                //was added due to inconsistencies with socket.io/faye
                if (!found) {
                    //TODO - send type?
                    var rect = addShape(data.shape.x, data.shape.y, data.shape.w, data.shape.h, data.shape.fill, false, data.shape.shpid, data.shape.type, data.shape.strokecolor, data.shape.strokewidth, data.shape.angle);
                    console.info("added a shape that was not there" + data.shape.shpid);
                }
                //	invalidate the canvas!
                invalidate();
            }
                break;
            case 'delshape':
            {
                //do the same to delete the boxes
                var j;
                for (j = 0, l = allshapes.length; j < l; j++) {
                    var _shape = allshapes[j];
                    if (_shape.shpid === data.shape.shpid) {
                        allshapes.splice(j, 1);
                        invalidate();
                        break;
                    }
                }
            }
                break;
            case 'editshapeprops':
            {
                var thebox = getBox(data.shape.shpid);
                if (thebox) {
                    thebox.fill = data.shape.fill;
                    thebox.strokecolor = data.shape.strokecolor;
                    thebox.strokewidth = data.shape.strokewidth;
                    invalidate();
                }
            }
                break;
        }
    }

    /**
     * function collabDrag: handle the collab drag event
     * @param data: The set of arguments for the event
     **/
    function collabDrag(data) {

        //application logic - handle dist resize event
        var evtdata;
        //get the data of the other participant <- maybe shld remove this part
        for (var i = 0; i < data.length; i++) {

            var evtdata = data[i];
            if (!evtdata)
                continue;
            //can check if update is for this device. maybe.
            var box = getBox(evtdata.oid);
            if (!box) {
                continue;
            }

            //calculations for dist resize based on selection handle
            var right = box.x + box.w;
            var bottom = box.y + box.h;


            //check if the mouse is within the bounds of shape,
            //(note; also allow if it passes by an offset)
            var offset = 50;
            //determine if the mouse is within the bounds of the shape
            //if (mx >= (box.x - offset) && mx <= (right + offset)
            //	&& my >= (box.y-offset) && my <= (bottom + offset)) {
            //set the status todo: find a better way to set them..
            //isDrag = false;
            //isResizeDrag = true;
            isDistResize = true;

            var idx = evtdata.args.idx;
            var myx = evtdata.args.__evtx;
            var myy = evtdata.args.__evty;

            //console.info(">> resize index for collab drag is: " + idx);

            //resize shape
            box.resize(idx, myx, myy);
            invalidate();
            //}
        }
    }

    /**
     * publish each gesture. gtype is either BIRTH, MOVE or DEATH
     */
    function publishMouseEvent(e, gtype) {
        //calculate the relative x,y
        var mxy = normalizeMouseXY(e);
        //publish
        publishGesture({x: mxy[0], y: mxy[1], type: gtype});

    }

//-------------- shape properties -------------------------------------

// change the fill color of selected shapes or next shapes
    function changeFill(col) {
        shapeFill = col;
        var selboxes = getSelectedBoxes();
        if (selboxes.length > 0) {
            for (var i = 0; i < selboxes.length; i++) {
                var _shape = selboxes[i];
                _shape.fill = col;
                //distribute
                publishDistData('editshapeprops', null, {shpid: _shape.shpid, fill: _shape.fill, strokecolor: _shape.strokecolor, strokewidth: _shape.strokewidth});
            }
            invalidate();
        }
    }

// change the border color of selected shapes or next shapes
    function changeBorderColor(col) {
        shapeBorderColor = col;
        var selboxes = getSelectedBoxes();
        if (selboxes.length > 0) {
            for (var i = 0; i < selboxes.length; i++) {
                var _shape = selboxes[i];
                _shape.strokecolor = col;
                //distribute
                publishDistData('editshapeprops', null, {shpid: _shape.shpid, fill: _shape.fill, strokecolor: _shape.strokecolor, strokewidth: _shape.strokewidth});
            }
            invalidate();
        }
    }

//change the border width of selected shape/next shapes
    function changeBorderWidth(width) {
        switch (width) {
            case 'thick':
                shapeBorderWidth = 4;
                break;
            case 'medium':
                shapeBorderWidth = 3;
                break;
            case 'thin':
            default:
                shapeBorderWidth = 2;
                break;
        }
        var selboxes = getSelectedBoxes();
        if (selboxes.length > 0) {
            for (var i = 0; i < selboxes.length; i++) {
                var _shape = selboxes[i];
                _shape.strokewidth = shapeBorderWidth;
                //distribute
                publishDistData('editshapeprops', null, {shpid: _shape.shpid, fill: _shape.fill, strokecolor: _shape.strokecolor, strokewidth: _shape.strokewidth});
            }
            invalidate();
        }
    }

//----------------- session stuff ------------------------------
//save the session to the server. a room is a session - as per reqs
    function saveSession() {
        //ajax call
        //remote call for rooms
        //clone shapes
        var boxes3 = allshapes.map(function (_shape) {
            return {x: _shape.x, y: _shape.y, w: _shape.w, h: _shape.h, fill: _shape.fill,
                shpid: _shape.shpid, type: _shape.type, strokecolor: _shape.strokecolor, strokewidth: _shape.strokewidth};
        });
        //stringify
        var boxesJson = JSON.stringify(boxes3);
        //remote save
        remoteCall("ajax", "request=savesession&rname=" + rname + "&data=" + boxesJson, function (reply) {
            var result = JSON.parse(reply.rooms);
            if (result.success === true) {
                console.log("Session data saved successfully");
            } else {
                console.log("A problem occurred when saving");
            }
        });
    }

    function loadSession() {
        //ajax call
        remoteCall("ajax", "request=loadsession&rname=" + getQueryString('room'), function (reply) {
            var result = JSON.parse(reply.rooms);
            if (result.success === true && result.data !== '') {
                loadShapesFromJson(result.data);
                console.log("Session data loaded successfully");
            } else {
                //do sthng
            }
        });
    }


    function loadShapesFromJson(json) {

        var objects = JSON.parse(json);
        objects.forEach(function (obj) {
            var rect = addShape(obj.x, obj.y, obj.w, obj.h, obj.fill,
                false, obj.shpid, obj.type, obj.strokecolor, obj.strokewidth);

        });
    }

    //auto-saves the room data after a period of time
    function startAutoSaveSessionTimer(timer) {
        var autoSave = timerE(timer || 5000);
        var savedTime = autoSave.mapE(function (val) {
            if (allshapes.length > 0)
                saveSession();
        });
    }

    function setNames(roomname, nickname) {
        rname = roomname || '';
        nick = nickname || '';
    }

// ------------------ Utility functions -------------------
    /**
     generateRandomID: Utility function to generate random IDs
     @param: start - an optional starting string for the id
     */
    function generateRandomID(start) {
        //array of xters to use
        var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

        if (!start)
            start = "SHP-";

        var chars = CHARS, uuid = new Array(36), rnd = 0, r;
        for (var i = 0; i < 36; i++) {
            if (i == 8 || i == 13 || i == 18 || i == 23) {
                uuid[i] = '-';
            } else if (i == 14) {
                uuid[i] = '4';
            } else {
                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }

        return start + uuid.join('');
    }

    /**
     * function rule:
     * @param rulestr -
     */
    function rule(name, rulestr) {
        return {'rulename': name, rule: rulestr};
    }

    /**
     *    function getRandomColor - generate random color
     *    @returns a hex string for color
     */
    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    }

    /**
     *    Object.create - prototypal inheritance.
     *    From: http://javascript.crockford.com/prototypal.html
     *    @param o: the object
     */
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {
            }

            F.prototype = o;
            return new F();
        };
    }
    /**
     *    ajax remote POST call
     *    @param url: the url
     *    @param args: the args to send
     *    @param responseCallback    the callback fn
     */
    function remoteCall(url, args, responseCallback) {
        http = new XMLHttpRequest();
        http.open("POST", url, true);

        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        //http.setRequestHeader("Content-length", args.length);
        //http.setRequestHeader("Connection", "close");


        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                if (http.status === 200) {
                    var response = JSON.parse(http.responseText);
                    responseCallback(response);
                } else {
                    console.log("Error", http.statusText);
                }

            }
            ;
        };
        http.send(args);
    }

    /*
     changes for the experiment
     */
    /*
     *	function loadToolbar - register toolbar clicks
     */
    function loadToolbar() {
        $('#selectallshapes').click(selectAllBoxes);
        $('#deleteallshapes').click(deleteAllShapes);
        $('#deleteshapes').click(deleteSelectedBoxes);
        //$('#groupshapes').click(groupShapes);
        $('#savesession').click(saveSession);
        $('#drawellipses').click(function () {
            setCurrentDraw('ellipse');
        });
        $('#drawcrects').click(function () {
            setCurrentDraw('crect');
        });
        $('#drawrects').click(function () {
            setCurrentDraw('rect');
        });
        $('#drawlines').click(function () {
            setCurrentDraw('line');
        });
        $('#selectshapes').click(function () {
            setCurrentDraw('');
        });
        $('#home').click(function () {
            location.href = 'index.html';
        });

        $('#fillcolor').change(function () {
            changeFill($('#fillcolor').val());
        });


        $('#bordercolor').change(function () {
            changeBorderColor($('#bordercolor').val());
        });

        $('#borderwidth').change(function () {
            changeBorderWidth($('#borderwidth').val());
        });

        /* //save after every 10 secs or explicit save
         // caused too many spurious saves
         var saveE = mergeE(saveClickE,
         timerE(10000));
         saveE.mapE(function(val){ saveSession(); })
         */

    }

    function initMouseEvents(canvas) {
        canvas.onmousedown = myDown;
        canvas.onmouseup = myUp;
        //canvas.ondblclick = myDblClick;
        canvas.onmousemove = myMove;
        //give canvas shpid for this case
        canvas.shpid = "C1";

    }

    //touchhandler
    function touchHandler(event) {
        var touches = event.changedTouches,
            first = touches[0],
            type = "";
        switch (event.type) {
            case "touchstart":
                type = "mousedown";
                break;
            case "touchmove":
                type = "mousemove";
                break;
            case "touchend":
                type = "mouseup";
                break;
            default:
                return;
        }

        //initMouseEvent(type, canBubble, cancelable, view, clickCount,
        //           screenX, screenY, clientX, clientY, ctrlKey,
        //           altKey, shiftKey, metaKey, button, relatedTarget);

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }

    function addToGroup(obj) {

        //extracts the names of the function in a rule, in order to intercept
        var extractFunctionNames = function (rulestr) {

            var functionDenoter = "function";

            var indices = getIndicesOf(functionDenoter, rulestr, false); //chanage this if "function" changes
            var fnnames = indices.map(function (i) {
                var reststr = rulestr.substring(i + functionDenoter.length + 2);
                var item = reststr.substring(0, reststr.indexOf('"'));
                return item;
            });
            return arrayUnique(fnnames);
        };

        var createOn = function () {
            //save fact in Facts variable

            //this refers to the shape obj
            return    function (str, fn) {
                if (!this[str]) {
                    console.log("draw - property not found: " + str);
                    return;
                }
                //if already defined, do nothing.
                if (this[str]["rulefn"])
                    return;

                this[str]["rulefn"] = fn;
                //register rule in server
                now.createRule(this[str].rulename, this[str].rule, function (response) {
                    console.log(response.msg);
                });

                //create a new now method for handling composed interactions
                now[this[str].rulename] = this[str]["rulefn"];

                var fnNames = extractFunctionNames(this[str].rule);

                var self = this;
                if (fnNames) {
                    fnNames.forEach(function (item) {
                        groupfn(item, self, self[str]["rulefn"]);
                    });
                    //gfproxy.registerRule(this[str]);
                }
            };
        };

        //creates a new groupobject
        var GroupObject = function (obj, seq) {
            //extend this object with the rule object passed as seq
            Object.extend(obj, seq);

            obj.on = createOn.call(obj);

            return obj;
        };


        /* var groupShape = GroupObject(obj, {
         //the rule to assert to midas for this grp. note: \ is string newline in js
            startRule: rule("startRule",
                '(Invoked (function "mouseDown") (dev ?d1) (args ?a1) (time ?on1))	' +
                    '(Invoked (function "mouseDown") (dev ?d2) (args ?a2)(time ?on2)) ' +
                    '(test (neq ?d1 ?d2))' +
                    '(test (time:within ?on1 ?on2 1500))' +   //!!
                    '(not (startDM (dev1 ?d1) (time ?on1)))' +
                    '(not (and (Invoked (function "mouseUp") (dev ?d1) (args ?a3) (time ?on3)) ' +
                    '(test (time:before ?on2 ?on3)))) ' +
                    '=> ' +
                    '(printout t "startDM1 asserted" crlf) ' +
                    '(assert (startDM (dev1 ?d1) (dev2 ?d2) (time ?on1) (args ?a1))) ' +
                    '(call (args ?a1  ?a2))'),
            bodyRule: rule("bodyRule",
                '(startDM (dev1 ?d1) (dev2 ?d2) (time ?t1)) ' +
                    '(not (or (and (endDM (dev1 ?d1) (dev2 ?d2) (time ?t2)) (test (time:before ?t1 ?t2)) ) ' +
         '(and (endDM (dev1 ?d2) (dev2 ?d1) (time ?t3)) (test (time:before ?t1 ?t3))) )) ' + //no endDm after startDm
         '(Invoked (function "mouseMove") (args ?a) (time ?ton) (dev ?dm)) ' +
                    '(test (or (eq ?dm ?d1) (eq ?dm ?d2))) ' +
                    '=> ' +
                    '(printout t "startDM1 asserted" crlf) ' +
                    '(assert (bodyDM (dev1 ?d1) (dev2 ?d2) (args ?a))) ' +
                    '(call (args ?a))'),
            endRule: rule("endRule",
                '(startDM (dev1 ?d1) (dev2 ?d2) (time ?don) ) ' +
                    '(Invoked (function "mouseUp") (dev ?dx) (args ?a) (time ?on1)) ' +
                    '(test (or (eq ?dx ?d1) (eq ?dx ?d2))) ' +
                    '(not (and (endDM (dev1 ?d1) (dev2 ?d2) (time ?dend))' +
         '(or (test (time:before ?don ?dend)) (eq ?don ?dend)) )) ' +
         '=> ' +
                    '(printout t "endDM asserted" crlf) ' +
                    '(assert (endDM (dev1 ?d1) (dev2 ?d2) (time ?on1) (args ?a))) ' +
                    '(call (args ?a))')
         });*/
        var groupShape = GroupObject(obj, {
            starRule: rule("startRule", [
                [Invoked, "inv1", "inv1.function == 'mouseDown' " , {args: "args1", dev: "dev1", time: "time1"}],
                [Invoked, "inv2", "inv2.function == 'mouseDown' " , {args: "args2", dev: "dev2", time: "time2"}],
                ["not", "dev1 == dev2"],
                ["(time1 - time2) <= 1500"],
                ["not", StartDM, "start1", "start1.dev1 == dev1 && start1.time == time1"],
                ["not", Invoked , "inv3", "inv3.function == 'mouseUp' " , {args: "args3", dev: "dev3", time: "time3"}],
                ["not", " time2 < time3"]
            ]),
            bodyRule: rule("bodyRule", [
                [StartDM, "start1", "", {dev1: "dev1Start", dev2: "dev2Start", time: "timeStart"}],
                [Invoked, "inv1", "inv1.function == 'mouseMove' " , {args: "argsMove", dev: "devMove", time: "timeMove"}],
                ["not",
                    ["or",
                        [EndDM, "enddm1", "enddm1.dev1 == dev1Start && enddm2.dev2 == dev2Start && timeStart < timeMove "],
                        [EndDM, "enddm2", "enddm2.dev1 == dev2Start && enddm2.dev2 == dev1Start && timeStart < timeMove "]
                    ]
                ]
            ]),
            endRule: rule("endRule", [
                [StartDM, "start1", "", {dev1: "dev1Start", dev2: "dev2Start", time: "timeStart"}],
                [Invoked, "inv1", "inv1.function == 'mouseUp' " , {args: "argsUp", dev: "devUp", time: "timeUp"}],
                ["or",
                    ["devMove == dev1Start"],
                    ["devMove == dev2Start"]
                ],
                ["not",
                    ["and",
                        [EndDM, "end1", "", {dev1: "dev1End", dev2: "dev2End", time: "timeEnd"}],
                        ["or",
                            ["dev1Start < dev1End"],
                            ["dev1Start == devEnd"]
                        ]
                    ],
                    [EndDM, "enddm1", "enddm1.dev1 == dev1Start && enddm2.dev2 == dev2Start && timeStart < timeMove "],
                    [EndDM, "enddm2", "enddm2.dev1 == dev2Start && enddm2.dev2 == dev1Start && timeStart < timeMove "]
                ]
            ])

        });

        //add on constructs
        //obj.on = createOn.call(obj);

        //register composed event handlers
        groupShape.on("startRule", function (data) {

            console.log("Collab function for startRule called. data: ");
            console.dir(data);

            //note: to call normal function we probably have to use
            //setTimeout('myfunction()',0,); or, eval
            //since we are not in the global scope
        });
        groupShape.on("bodyRule", function (data) {
            console.log("Collab function for bodyRule called. data: ");
            console.dir(data);
            collabDrag(data);
        });
        groupShape.on("endRule", function (data) {
            console.log("Collab function for endRule called. data: ");
            console.dir(data);
        });
        /*groupShape.on("endRule2", function(data){
         console.log("Collab function FAILED. data: ");
         console.dir(data);
         });*/


        function rule(name, lhsArray) {
            return {'rulename': name, rule: lhsArray};
        }

    }

    function groupfn(fn, obj, grpfn) {
        var func = obj[fn];
        //function param names
        var fnparams = getFunctionParams(func);
        //for context

        var self = obj;

        obj[fn] = function (evt) {
            //store arguments
            var fnargs = {};
            //first format args with their params
            var params = {};

            for (var i = 0, l = arguments.length; i < l; i++) {
                //first check if param is defined - js allows fn calling for unnamed args
                if (!fnparams[i]) {
                    //if not, create new param name for this arg
                    fnparams[i] = 'arg_' + i;
                }
                //limitation: need to remove or format event object in the event args for serialization
                //to avoid circular dependencies
                if (isEvent(arguments[i])) {
                    var e = arguments[i];
                    //use this to avoid cyclic event object unsupported by JSON
                    var basicEventOpts = {
                        pointerX: e.pointerX,
                        pointerY: e.pointerY,
                        pageX: e.pageX,
                        pageY: e.pageY,
                        screenX: e.screenX,
                        screenY: e.screenY,
                        button: e.button,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        shiftKey: e.shiftKey,
                        metaKey: e.metaKey,
                        bubbles: e.bubbles,
                        cancelable: e.cancelable
                    };
                    //get the normalized x and y values from event object
                    var xy = [mx, my];// normalizeMouseXY(basicEventOpts);

                    //add to params - make distinct if there exists an x or y parameter
                    fnargs['__evtx'] = xy[0];
                    fnargs['__evty'] = xy[1];

                    fnargs[fnparams[i]] = basicEventOpts;
                } else {
                    //also strips out whitespace
                    fnargs[fnparams[i]] = arguments[i];
                }
            }

            var fnmarshall = {
                fnname: fn,
                receiver: obj.shpid,  //in this case its the shape that is the receiver
                args: fnargs
            };
            //get the event
            now.clientEvent(fn, fnparams, fnmarshall, function (res) {
                if (res.isComposed) {    //composed event
                    console.log("Composite event detected.");
                    if (grpfn) {
                        grpfn.apply(obj, res.args)
                    }
                } else {   //normal event
                    var args = [];
                    //get res args as array to pass to fn.apply
                    if (res.fnargs.args) {
                        //remove api-injected keys before calling fn
                        var temp = Object.keys(res.fnargs.args).filter(function (key) {
                            return key.indexOf("__") === -1;
                        });
                        args = temp.map(function (key) {
                            return res.fnargs.args[key];
                        });
                    }
                    func.apply(self, args);
                    //collabDrag(res.args);

                    //Array.prototype.slice.call(arguments).concat()
                }
            });

        };
    }

// -------------- external functions -------------------------

//init();
    window.initApp = init;
    window.processDistData = processDistData;
    window.setCurrentDraw = setCurrentDraw;
    window.changeFill = changeFill;
    window.changeBorderColor = changeBorderColor;
    window.changeBorderWidth = changeBorderWidth;
    window.deleteShapes = deleteSelectedBoxes;
    window.deleteAllShapes = deleteAllBoxes;
    window.selectAllBoxes = selectAllBoxes;
    window.saveSession = saveSession;
    window.loadSession = loadSession;
    window.setNames = setNames;
})(window);