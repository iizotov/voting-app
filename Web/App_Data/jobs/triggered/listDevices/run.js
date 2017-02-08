var iotHubConnString;

if(process.env.IoTHubConnectionString) {
	nconf.argv().env().file('./config.json');
	iotHubConnString = process.env.IoTHubConnectionString;
} else {
	nconf.argv().env().file('./config.json');
	iotHubConnString = nconf.get('iotHubConnString');
}

console.log(iotHubConnString);