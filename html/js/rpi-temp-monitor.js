function Sensor(name) {
    var self = this;
    self.name = name;

    self.state = ko.mapping.fromJS({'temp': '-', 'alarm': false, 'panic': false});

    self.status = ko.computed(function() {
        if (self.state.panic()) {
            return "text-danger";
        }

        if (self.state.alarm()) {
            return "text-warning";
        }

        return "text-success";
    }, self);

    self.update = function() {
        $.getJSON(self.name, function(data) {
            ko.mapping.fromJS(data, self.state);
        });
    };
}

function ViewModel(refresh) {
    var self = this;

    self.refresh = refresh;

    self.global_status = ko.observable('unknown');
    self.global_status_level = ko.computed(function() {
        switch(self.global_status()) {
            case 'ok':
                return "alert-success";
            case 'alarm':
                return "alert-warning";
            case 'panic':
                return "alert-danger";
            default:
                return "alert-info";
        }
    }, self);

    self.sensors = ko.observableArray([]);

    self.update = function() {
        $.getJSON("status", function(data) {
            self.global_status(data.status);
        });
        for (var i in self.sensors()){
            self.sensors()[i].update();
        }
    };

    self.updateSensors = function() {
        $.getJSON("available", function(data) {
            self.sensors.removeAll();

            for (var i in data.sensors) {
                var sensor = new Sensor(data.sensors[i]);
                sensor.update();
                self.sensors.push(sensor);
            }
        });

    };
}
