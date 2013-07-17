var fs = require('fs'),
    hw = require('./hardware');

var sensors = {};

var cache = {};

var calming = false;

function calmDown() {
    cache.global_alarm = false;
    cache.global_panic = false;
    calming = false;
    hw.setGreen();
}

function handleAlarm() {
    hw.setYellow();
    if (!calming) {
        setTimeout(calmDown, 600000);
        calming = true;
    }
}

function handlePanic() {
    hw.setRed();
    if (!calming) {
        setTimeout(calmDown, 600000);
        calming = true;
    }
}


function updateSensorCache() {
    var all_sensors = availableSensors();
    function next(todo_list) {
        var curr = todo_list.shift();
        if (curr === undefined) {
            setTimeout(function(){updateSensorCache();}, 5000);
            if (cache.global_panic) {
                handlePanic();
                return;
            }
            if (cache.global_alarm) {
                handleAlarm();
            }
            return;
        }
        readSensorHW(curr, function() {next(todo_list);});
    }
    next(all_sensors);
}


/* Synchronously load the available sensors */
function initSensors(sensors_file) {
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
                      'alarm_temp': elements[2], 'panic_temp': elements[3]};
    }
    cache.global_alarm = false;
    cache.global_panic = false;
    updateSensorCache();
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
                console.log('Checksum error reading sensor ' + name);
                cache[name] = undefined;
                callback();
                return;
            }

            var temp_pattern = /t=\d*/;
            var temp_string = temp_pattern.exec(lines[1]);
            if (temp_string === null) {
                console.log('Parsing error reading sensor ' + name);
                cache[name] = undefined;
                callback();
                return;
            }
            temp_string = String(temp_string).substr(2);
            var temp = parseFloat(temp_string) / 1000;

            var panic = temp > sensor.panic_temp ? true: false;
            var alarm = temp > sensor.warning_temp ? true: false;
            cache.global_panic |= panic;
            cache.global_alarm |= alarm;

            cache[name] = {'temp': temp, 'alarm': alarm, 'panic': panic};
            callback();
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

exports.initSensors = initSensors;
exports.availableSensors = availableSensors;
exports.readSensor = readSensorCache;
