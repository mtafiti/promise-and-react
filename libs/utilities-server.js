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