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

function handleFile(request, response) {
    var pathname = url.parse(request.url).pathname;
    if (pathname === '/') {
        pathname = "/index.html";
    }

    pathname = "html" + pathname;
    fs.exists(pathname, function(exists) {
        if (exists) {
            response.writeHead(200, {'Content-Type': getMimeType(pathname)});
            fs.createReadStream(pathname).pipe(response);
        } else {
            response.writeHead(440, {'Content-Type': 'text/plain'});
            response.write('Error 440: File not found');
            response.end();
        }
    });
}

function getMimeType(name) {
    var extension = name.split('.').pop();
    switch(extension) {
        case 'html':
            return 'text/html';
        case 'js':
            return 'text/javascript';
        case 'css':
            return 'text/css';
        default:
            return 'text/plain';
    }
}

function start() {
    var handlers = {
        '/status': handleStatus,
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
            handler = handleFile;
        }
        handler(request, response);

    }

    hw.setGreen();
    http.createServer(onRequest).listen('8367');
    console.log('server started and listening on port 8367');
}

exports.start = start;
