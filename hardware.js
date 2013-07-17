var fs = require('fs'),
    chld = require('child_process'),
    red, yellow, green;

function gpio_export(pin, direction, callback) {
    function done () {
        fs.writeFile('/sys/class/gpio/gpio' + pin + '/direction', direction,
                     callback);
    }
    fs.exists('/sys/class/gpio/gpio' + pin, function(exists) {
        if (!exists) {
            chld.execFile('gpio-admin', ['export', pin],
                function(error, stdout, stderr) {
                    if(error) {
                        throw error;
                    }
                    done();
                });
            return;
        }
        done();
    });
    return pin;
}

function set(pin, value) {
    var val = value ? '1': '0';
    fs.writeFile('/sys/class/gpio/gpio' + pin + '/value', val,
        function(err){
            if (err) {
                throw err;
            }
    });
}

function init(callback) {
    red = gpio_export(17, 'out', function() {
        yellow = gpio_export(27, 'out', function() {
            green = gpio_export(22, 'out', function() {
                if (typeof callback === 'function') {
                    callback();
                }
            });
        });
    });
}


function setGreen() {
    set(red, 0);
    set(yellow, 0);
    set(green, 1);
}

function setYellow() {
    set(red, 0);
    set(yellow, 1);
    set(green, 0);
}

function setRed() {
    set(red, 1);
    set(yellow, 0);
    set(green, 0);
}

exports.init = init;
exports.setGreen = setGreen;
exports.setYellow = setYellow;
exports.setRed = setRed;
