/**
 *    function getRandomColor - generate random color
 *    @returns a hex string for color
 */
exports.getRandomColor = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
};

/*
 * Checks if an object has ANY user-defined property.
 */

/*
 * Checks if an object has specific property.
 */


/*
 * Checks if an object has ANY user-defined property.
 */
exports.mapBehaviour = (function () {

    function contains(thekey) {
        for (var key in this.hash) {
            if (this.hash.hasOwnProperty(key) && key === thekey) {
                return true;
            }
        }
        return null;
    }

    function isEmpty() {
        for (var key in this.hash) {
            if (this.hash.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    function get(key) {
        if (this.hash.hasOwnProperty(key)) {
            return this.hash[key];
        }
    }

    function add(key, val) {
        if (key)
            this.hash[key] = val;
        //todo: return value?
    }

    function remove(key) {
        if (key && this.hash.hasOwnProperty(key)) {
            delete this.hash[key];
        }
    }

    function forEach(fn) {
        for (var key in this.hash) {
            if (this.hash.hasOwnProperty(key) && !(this[key] instanceof Function)) {
                fn.apply(this, [key, this.hash[key]]);
            }
        }
    }

    function hasOnly(key) {
        return this.contains(key) && (Object.keys(this.hash).length === 1)
    }

    //can be optimized
    function usersOnSameShape(shpid) {
        var retvalue = false;
        this.forEach(function (user, val) {
            if (val.item && val.item === shpid) {
                //check for another user with this shape
                this.forEach(function (user2, val2) {
                    if (val2.item && val2.item === shpid && user2 !== user) {
                        //got another user, quit
                        retvalue = true;
                        return;
                    }
                });
            }
        });
        return retvalue;
    }

    //return
    return function () {
        this.contains = contains;
        this.isEmpty = isEmpty;
        this.add = add;
        this.remove = remove;
        this.get = get;
        //iterate over hash
        this.forEach = forEach;

        //helper functions
        this.hasOnly = hasOnly;
        //if more than one users interaction with a shape
        this.usersOnSameShape = usersOnSameShape;

        //init map
        this.hash = {}
        return this;
    };
})();


/*
 *	utilities.js - helpful functions
 */

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 *	 NB: for a better version for node: https://github.com/broofa/node-uuid
 */
// Private array of chars to use
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

function uuid(len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}

// A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
// by minimizing calls to random()
function uuidFast() {
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
    return uuid.join('');
}

// A more compact, but less performant, RFC4122v4 solution:
function uuidCompact() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 *    function split2
 *    Modified version of string.split that keeps the
 *    delimiters. nb: cuts after the delimiter
 *    @param str: the string
 *    @param delim: the delimiter for the split
 */
function split2(str, delim) {
    if (typeof str !== 'string') {
        return str;
    }
    var re = new RegExp(delim, "gi");
    var newstringreplaced = str.replace(re, delim + "�");
    var newarr = newstringreplaced.split("�");
    //remove null/empty elms
    newarr = newarr.filter(function (item) {
        return (item != null && item !== '' && item != 'undefined');
    });
    return newarr;
}
exports.uuid = uuid;
exports.uuidFast = uuidFast;
exports.uuidCompact = uuidCompact;
exports.split2 = split2;