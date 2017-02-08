var iotHubConnString;
var nconf = require('nconf');
var iothub = require('azure-iothub');

if(process.env.IoTHubConnectionString) {
	nconf.argv().env().file('./config.json');
	iotHubConnString = process.env.IoTHubConnectionString;
} else {
	nconf.argv().env().file('./config.json');
	iotHubConnString = nconf.get('iotHubConnString');
}

console.log(iotHubConnString);

var registry = iothub.Registry.fromConnectionString(iotHubConnString);


console.log('**listing devices...');
registry.list(function (err, deviceList) {
	if (err) {
		console.error('Could not connect: ' + err.message);
	} else {
		deviceList.forEach(function (device) {
			var key = device.authentication ? device.authentication.symmetricKey.primaryKey : '<no primary key>';
			console.log(device.deviceId + ': ' + key);
		});
	}
});


