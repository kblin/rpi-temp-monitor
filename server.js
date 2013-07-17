var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    util = require('util'),
    hw = require('./hardware'),
    sensors = require('./sensors');

function handleAvailable(request, response) {
    var available = sensors.availableSensors();
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify({'sensors': available}));
    response.end();
}

function handleStatus(request, response) {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(sensors.getStatus()));
    response.end();
}


function handleSensor(name, request, response) {
    sensors.readSensor(name, function(values) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(JSON.stringify(values));
        response.end();
    });
}

function setupSensorHandlers(sensor, handlers) {
    handlers['/' + sensor] = function(request, response) {
        handleSensor(sensor, request, response);
    };
}

function start() {
    var handlers = {
        '/': handleStatus,
        '/available': handleAvailable
    };

    var available = sensors.initSensors('/home/pi/sensors.txt');

    for (var name in available) {
        setupSensorHandlers(name, handlers);
    }

    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        var handler = handlers[pathname];
        if (handler === undefined) {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('404 no handler for ' + pathname);
            response.end();
            return;
        }
        handler(request, response);

    }

    hw.setGreen();
    http.createServer(onRequest).listen('8367');
    console.log('server started and listening on port 8367');
}

exports.start = start;
