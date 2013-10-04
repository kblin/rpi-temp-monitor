/* mockup hardware interface for testing */
function init(callback) {
    console.log("fake hardware.init()");
    callback();
}

function set(color) {
    console.log("Set color " + color);
}

function setGreen() {
    set("green");
}
function setYellow() {
    set("yellow");
}
function setRed() {
    set("red");
}

exports.init = init;
exports.setGreen = setGreen;
exports.setYellow = setYellow;
exports.setRed = setRed;
