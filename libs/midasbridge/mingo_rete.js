/**
 * mingo rete. unfinished.
 */

var signs = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative'
};

/* representation of a token to be passed around. data is an object with 'type' and 'value' attributes */
function Token(sign, data) {

    /* modifiers */
    this.getSign = function () {
        return sign;
    };
    this.getData = function () {
        return data;
    };
    this.getType = function () {
        return data['type'];
    };
    this.getValue = function () {
        return data['value'];
    };
    this.toString = function () {
        return 'token:' + this.getType().toLowerCase() + ' value:' + this.getValue().toLowerCase();
    };
}

/*  creates a filter, takes a predicate function and makes a canPass
 function that applies the filter
 */
function createFilter(predicate) {
    return {
        canPass: function (token) {
            return predicate(token);
        }
    };

}

/* makes a memory object, represented as key-value pairs */
function NodeMemory() {
    this.store = {};

    /* insert into the memory a new token */
    this.insert = function (token) {
        this.store[token.toString()] = data;
    };

    this.remove = function (token) {
        if (this.contains(token)) {
            delete this.store[token.toString()];
        }
    };
    this.contains = function (token) {
        var thekey = token.toString();
        for (var key in this.store) {
            if (this.store.hasOwnProperty(key) && key === thekey) {
                return true;
            }
        }
        return false;
    };
}

/* creates an alpha node */
function Node(boolTest) {

    var children = [];

    this.addChild = function (child) {
        children.push(child);
    };
    /*  creates a filter, takes a predicate function and makes a canPass
     function that applies the filter
     */
    this.canPass = function (token) {
        return boolTest(token);
    };

    this.receive = function (token) {
        //do nothing for this generic type
    };

    this.send = function (token) {
        if (this.canPass(token)) {
            children.forEach(function (child) {
                child.receive(token);
            });
        }
    };
}

/* creates a beta node with test */
function BetaNodeOr(leftNode, rightNode) {

    this.leftMemory = new NodeMemory();
    this.rightMemory = new NodeMemory();

    this.leftSend = function (token) {
        //check if left memory has the token
        if (token.getSign() === signs.POSITIVE) {
            this.leftMemory.add(token);
            if (!this.rightMemory.contains(token)) {
                this.send(token);
            }
        } else {
            this.rightMemory.remove(token);
            if (!this.leftMemory.contains(token)) {
                this.send(token);
            }
        }
    };


    this.rightSend = function (token) {
        //check if left memory has the token
        if (token.getSign() === signs.POSITIVE) {
            this.rightMemory.add(token);
            if (!this.leftMemory.contains(token)) {
                this.send(token);
            }
        } else {
            this.leftMemory.remove(token);
            if (!this.rightMemory.contains(token)) {
                this.send(token);
            }
        }
    };

    var leftNodeSend = leftNode.send;
    leftNode.send = function (token) {
        leftNodeSend(token);
        this.leftSend(token);
    };

    var rightNodeSend = rightNode.send;
    rightNode.send = function (token) {
        rightNodeSend(token);
        this.rightSend(token);
    };

}

/* creates a beta node with test */
function BetaNodeAnd(leftNode, rightNode) {

    this.leftMemory = new NodeMemory();
    this.rightMemory = new NodeMemory();

    this.leftSend = function (token) {
        //check if left memory has the token
        if (token.getSign() === signs.POSITIVE) {
            this.leftMemory.add(token);
            if (this.rightMemory.contains(token)) {
                this.send(token);
            }
        } else {
            this.rightMemory.remove(token);
            if (this.leftMemory.contains(token)) {
                this.send(token);
            }
        }
    };


    this.rightSend = function (token) {
        //check if left memory has the token
        if (token.getSign() === signs.POSITIVE) {
            this.rightMemory.add(token);
            if (this.leftMemory.contains(token)) {
                this.send(token);
            }
        } else {
            this.leftMemory.remove(token);
            if (this.rightMemory.contains(token)) {
                this.send(token);
            }
        }
    };

    var leftNodeSend = leftNode.send;
    leftNode.send = function (token) {
        leftNodeSend(token);
        this.leftSend(token);
    };

    var rightNodeSend = rightNode.send;
    rightNode.send = function (token) {
        rightNodeSend(token);
        this.rightSend(token);
    };


}
