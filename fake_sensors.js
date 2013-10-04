/* Fake sensors module for testing */

var fs = require('fs'),
    hw = require('./fake_hardware');

var sensors = {};
var cache = {};

var FAKE_SENSORS_FILE = 'fake_sensors.txt';

function parse_sensors(data) {
    cache.global_panic = false;
    cache.global_alarm = false;

    var lines = String(data).split('\n');
    for (var i in lines) {
        // Skip comment lines
        if (lines[i].charAt(0) == '#') {
            continue;
        }
        // skip empty lines
        if (lines[i] === '') {
            continue;
        }

        var elements = lines[i].split('\t');
        var name = elements[0];
        var alarm_temp = elements[1];
        var panic_temp = elements[2];
        var temp = elements[3];

        var alarm = temp > alarm_temp ? true: false;
        var panic = temp > panic_temp ? true: false;

        cache.global_panic |= panic;
        cache.global_alarm |= alarm;

        sensors[name] = { 'alarm_temp': alarm_temp, 'panic_temp': panic_temp };
        cache[name] = { 'temp': temp, 'alarm': alarm, 'panic': panic };
    }
}

function initSensors() {
    if (!fs.existsSync(FAKE_SENSORS_FILE)) {
        throw 'Fake sensors file not found';
    }
    var data = fs.readFileSync(FAKE_SENSORS_FILE);
    parse_sensors(data);
    return sensors;
}

function availableSensors() {
    return Object.keys(sensors);
}

function readSensor(name, callback) {
    function file_read(err, data) {
        if (err) {
            throw err;
        }
        parse_sensors(data);

        var sensor = cache[name];

        if ( sensor === undefined ) {
            callback({'error': 'No data available for sensor ' + name});
            return;
        }

        callback(sensor);
    }

    fs.readFile(FAKE_SENSORS_FILE, file_read);
}

function getStatus() {
    var data = fs.readFileSync(FAKE_SENSORS_FILE);
    parse_sensors(data);

    if (cache.global_panic) {
        return {'status': 'panic'};
    }

    if (cache.global_alarm) {
        return {'status': 'alarm'};
    }

    return {'status': 'ok'};
}

exports.initSensors = initSensors;
exports.availableSensors = availableSensors;
exports.readSensor = readSensor;
exports.getStatus = getStatus;
