'use strict';

var promise = require('bluebird');

var express = require('express');
var bodyParser = require('body-parser');

var iothub = require('azure-iothub');


var nconf = require('nconf');

nconf.argv().env().file('./config.json');
var iotHubConnString = nconf.get('iotHubConnString');
var registry = iothub.Registry.fromConnectionString(iotHubConnString);

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

var hostName = require('azure-iothub').ConnectionString.parse(iotHubConnString).HostName;

var app = express();
var port = process.env.PORT || 1337;
app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(bodyParser.json());

var completedCallback = function(err, res) {
    if (err) { console.log(err); }
    else { console.log(res); }
};

var res;

app.post('/api/getDevice', function(req, res) {
    console.log('getDevice command received from: ' + req.body.devicehash);
	var device = new iothub.Device(null);
	device.deviceId = req.body.devicehash;
	registry.create(device, function(err, deviceInfo, res2) {
		if (err) {
			registry.get(device.deviceId, function(err, deviceInfo, res3) {
				res.end(deviceInfo.authentication.symmetricKey.primaryKey);
			});
			console.log('getting identity');
		}
	})
});

app.post('/api/getMessages', function(req, res) {
    console.log('getMessages command received from: ' + req.body.devicehash + ',' + req.body.devicekey);
	var deviceKey = req.body.devicekey;
	var device = new iothub.Device(null);
	device.deviceId = req.body.devicehash;

		
	// Code goes here
	
	client.on('message', function (msg) {
		console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
		client.complete(msg, printResultFor('completed'));
	});
	
});

app.post('/api/vote', function(req, res) {
    console.log('vote command received from: ' + req.body.command + ',' + req.body.devicehash + ',' + req.body.devicekey);

	var vote = req.body.command;
	var deviceKey = req.body.devicekey;
	var device = new iothub.Device(null);
	device.deviceId = req.body.devicehash;

	if(!deviceKey) {
		registry.create(device, function(err, deviceInfo, res) {
			if (err) {
				registry.get(device.deviceId, sendMessage);
			}
			if (deviceInfo) {
				sendMessage(err, deviceInfo, res, '', '');	
			}
		})
	} else {
		sendMessage('', '', res, req.body.devicehash, req.body.devicekey); 	
	}
	 

	function sendMessage(err, deviceInfo, res, deviceId, deviceAccessKey) {
		var connectionString = '';
		if (deviceId && deviceAccessKey) {
			connectionString = 'HostName=' + hostName + ';DeviceId=' + deviceId + ';SharedAccessKey=' + deviceAccessKey;
			console.log('Device ID: ' + deviceId);
			console.log('Device key - cached: ' + deviceAccessKey);
		}
		else if (deviceInfo) {
			console.log('Device ID: ' + deviceInfo.deviceId);
			console.log('Device key - retrieved: ' + deviceInfo.authentication.symmetricKey.primaryKey);
			connectionString = 'HostName=' + hostName + ';DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.symmetricKey.primaryKey;
			deviceKey = deviceInfo.authentication.symmetricKey.primaryKey;
		}
		console.log(connectionString);
		var client = clientFromConnectionString(connectionString);
		var message = new Message("{'vote':" + vote + '}');
		console.log("Sending message: " + message.getData());
		client.sendEvent(message, printResultFor('send'));

	 }
	//need to create device identity here
	//console.log('Sending message: ' + data);
	//iotHubClient.send(deviceId, message, printResultFor('send'));
    
    // Helper function to print results in the console
    function printResultFor(op) {
        return function printResult(err, res) {
            if (err) {
                console.log(op + ' error: ' + err.toString());
            } else {
                console.log(op + ' status: ' + res.constructor.name);
            }
        };
    }
	
    res.end();
});

app.listen(port, function() {
    console.log('app running on http://localhost:' + port);
});
