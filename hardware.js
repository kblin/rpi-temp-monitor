var gpio = require('gpio');

function init(callback) {
    red = gpio.export(17, {direction: 'out', ready: function() {
        yellow = gpio.export(27, {direction: 'out', ready: function() {
            green = gpio.export(22, {direction: 'out', ready: callback});
        }});
    }});
}


function setGreen(callback) {
    console.log('setGreen');
    red.set(0);
    yellow.set(0);
    green.set(callback);
}

function setYellow() {
    console.log('setYellow');
    red.set(0);
    green.set(0);
    yellow.set(callback);
}

function setRed() {
    console.log('setRed');
    yellow.set(0);
    green.set(0);
    red.set(callback);
}

exports.init = init;
exports.setGreen = setGreen;
exports.setYellow = setYellow;
exports.setRed = setRed;
