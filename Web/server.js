'use strict';

require('events').EventEmitter.defaultMaxListeners = 0;

const randomWord = require('random-word');

var express = require('express');
var bodyParser = require('body-parser');

var iothub = require('azure-iothub');
var Client = require('azure-iothub').Client;

var nconf = require('nconf');
var iotHubConnString = '';

var Message = require('azure-iot-device').Message;

if(process.env.IoTHubConnectionString) {
	iotHubConnString = process.env.IoTHubConnectionString;
} else {
	nconf.argv().env().file('./config.json');
	iotHubConnString = nconf.get('iotHubConnString');
}
var registry = iothub.Registry.fromConnectionString(iotHubConnString);
var serviceClient = Client.fromConnectionString(iotHubConnString);

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;

var hostName = require('azure-iothub').ConnectionString.parse(iotHubConnString).HostName;

var lastMessage = {};
var app = express();
var port = process.env.PORT || 1337;
app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(bodyParser.json());



app.post('/api/admin', function(req, res) {
    console.log('admin command received: ' + req.body.command + ',' + req.body.deviceMask);
	console.log('**matching devices...');
	res.end();
	registry.list(function (err, deviceList) {
			
			serviceClient.open(function (err) {
				
				if (err) {
					console.error('Could not connect: ' + err.message);
				} else {
					deviceList.forEach(function (device) {
						if(!req.body.deviceMask || device.deviceId.search(req.body.deviceMask) < 0) {
							return;
						}
						var text = '';
						var key = device.authentication ? device.authentication.symmetricKey.primaryKey : '<no primary key>';
						console.log(device.deviceId + ': ' + key);
						var targetDevice = device.deviceId;

						if(req.body.command == 'colour') {
							text = '#'+Math.floor(Math.random()*16777215).toString(16);
						} 
						else if (req.body.command == 'alert') {
							text = '!' + randomWord();
						}
						else if (req.body.command == 'message') {
							text = randomWord();
						}
						else if (req.body.command == 'delete') {
							//no implemetation
						}
						var message = new Message(text);
						message.ack = 'positive';
						message.messageId = "id";
						console.log('Sending message: ' + message.getData());
						serviceClient.send(targetDevice, message, printResultFor('send'));
					});
				}
			});

			

	});
});


app.post('/api/getDevice', function(req, res) {
    console.log('getDevice command received from: ' + req.body.devicehash);
	var device = new iothub.Device(null);
	device.deviceId = req.body.devicehash;
	registry.create(device, function(err, deviceInfo) {
		if (err) {
			registry.get(device.deviceId, function(err, deviceInfo) {
				console.log('retrieving existing identity');
				res.end(deviceInfo.authentication.symmetricKey.primaryKey, clientConnect(req.body.devicehash, deviceInfo.authentication.symmetricKey.primaryKey));
			});

		} else {
			console.log('creating new identity');
			res.end(deviceInfo.authentication.symmetricKey.primaryKey, clientConnect(req.body.devicehash, deviceInfo.authentication.symmetricKey.primaryKey));
		}

	});
});

function clientConnect(id, key) {
		var connectionString = 'HostName=' + hostName + ';DeviceId=' + id + ';SharedAccessKey=' + key;
		var client = clientFromConnectionString(connectionString);
		
		var connectCallback = function () { 
			client.on('message', function (msg) { 
				console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
				client.complete(msg, printResultFor('completed'));
				lastMessage[id] = msg.data;
				console.log('saved last message' + msg.data);
			});
			app.post('/api/vote', function(req, res) {
				console.log('vote command received from: ' + req.body.vote + ',' + req.body.devicehash + ',' + req.body.devicekey);
				//for load testing purposes throw in a for loop
				var message = new Message(JSON.stringify({vote: req.body.vote, device: req.body.devicehash}));
				console.log("Sending message: " + message.getData());
				client.sendEvent(message, printResultFor('send'));
			
				res.end();
			});
		};
		client.open(connectCallback);
};




app.post('/api/c2d', function(req, res) {
	if(lastMessage[req.body.devicehash]) {
		res.end(lastMessage[req.body.devicehash]);
		lastMessage[req.body.devicehash] = null;
	} else {
		//console.log('no new messages');
		res.end();
	}
	
});

function printResultFor(op) {
        return function printResult(err, res) {
            if (err) {
                console.log(op + ' error: ' + err.toString());
            } else {
                console.log(op + ' status: ' + res.constructor.name);
            }
        };
    };
	
function receiveFeedback(err, receiver){
   receiver.on('message', function (msg) {
     console.log('Feedback message:')
     console.log(msg.getData().toString('utf-8'));
   });
 };
 

const server = app.listen(port, function() {
    console.log('app running on port ' + port);
});