var fs = require('fs');

var sensors = {};

var cache = {};

/* Synchronously load the available sensors */
function loadSensors(sensors_file) {
    if (!fs.existsSync(sensors_file)) {
        throw "No sensors file at : " + sensors_file;
    }

    var lines = String(fs.readFileSync(sensors_file)).split('\n');
    for(var i in lines) {
        if (lines[i].charAt(0) == '#') {
            continue;
        }
        if (lines[i] === '') {
            continue;
        }

        var elements = lines[i].split('\t');
        if (elements.length != 4) {
            throw "Invalid formatting in " + sensors_file;
        }
        sensors[elements[0]] = {'id': elements[1],
                      'warning-temp': elements[2], 'alarm-temp': elements[3]};
    }
    cache.global_alarm = false;
    cache.global_panic = false;
    return sensors;
}

function availableSensors() {
    return Object.keys(sensors);
}

function readSensorHW(name, callback) {
    var sensor = sensors[name];
    if (sensor === undefined) {
        throw "No such sensor: " + name;
    }

    var sensor_path = "/sys/bus/w1/devices/" + sensor.id + "/w1_slave";
    fs.exists(sensor_path, function(exists) {
        if (!exists) {
            throw sensor_path + " doesn't exist";
        }
        fs.readFile(sensor_path, {'encoding': 'utf8'}, function(err, data) {
            if (err) {
                throw err;
            }
            var lines = data.split('\n');
            if (lines.length < 2) {
                throw "Invalid sensor data: " + data;
            }
            if (!lines[0].match(/ YES$/)) {
                callback({'error': 'Failed to read sensor'});
                return;
            }

            var temp_pattern = /t=\d*/;
            var temp_string = temp_pattern.exec(lines[1]);
            if (temp_string === null) {
                callback({'error': 'Failed to read sensor'});
                return;
            }
            temp_string = String(temp_string).substr(2);
            var temp = parseFloat(temp_string) / 1000;
            callback({'temp': temp, 'alarm': false, 'panic': false});
        });
    });
}

function readSensorCache(name, callback) {
    var sensor = cache[name];

    if (sensor === undefined) {
        callback({'error': 'No data available for sensor ' + name});
        return;
    }

    callback(sensor);
}

exports.loadSensors = loadSensors;
exports.availableSensors = availableSensors;
exports.readSensor = readSensorCache;
