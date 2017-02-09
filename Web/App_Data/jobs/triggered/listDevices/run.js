var iotHubConnString = '';
var storageAccount = '';
var storageAccountKey = '';
var container = '';
var nconf = require('nconf');
var iothub = require('azure-iothub');
var azure = require('azure-storage');
var output = 'device\r\n';


if(process.env.IoTHubConnectionString) {
	iotHubConnString = process.env.IoTHubConnectionString;
} else {
	nconf.argv().env().file('../../../../config.json');
	iotHubConnString = nconf.get('iotHubConnString');
}

if(process.env.storageAccount) {
	storageAccount = process.env.storageAccount;
} else {
	nconf.argv().env().file('../../../../config.json');
	storageAccount = nconf.get('storageAccount');
}


if(process.env.storageAccountKey) {
	storageAccountKey = process.env.storageAccountKey;
} else {
	nconf.argv().env().file('../../../../config.json');
	storageAccountKey = nconf.get('storageAccountKey');
}

if(process.env.container) {
	container = process.env.container;
} else {
	nconf.argv().env().file('../../../../config.json');
	container = nconf.get('container');
}

console.log(iotHubConnString);
console.log(container);
console.log(storageAccountKey);
console.log(storageAccount);

var registry = iothub.Registry.fromConnectionString(iotHubConnString);
var blobSvc = azure.createBlobService(storageAccount, storageAccountKey);


console.log('**listing devices...');
registry.list(function (err, deviceList) {
	if (err) {
		console.error('Could not connect: ' + err.message);
	} else {
		deviceList.forEach(function (device) {
			var key = device.authentication ? device.authentication.symmetricKey.primaryKey : '<no primary key>';
			console.log(device.deviceId + ': ' + key);
			output = output + device.deviceId + '\n';
		});
	}
	blobSvc.createContainerIfNotExists(container, function(error, result, response){
		if(error){
			console.error('Could not create container ' + container);
			return;
		}
		var today = new Date();
		var path = today.toISOString().slice(0,10).replace(/-/g,"/") + '/' + today.toISOString().slice(11,16).replace(/:/g,"/") + '/devices.csv';
		console.log(path);

		blobSvc.createBlockBlobFromText (container, path, output, function(error, result, response){
			if(error){
				console.error('Could not create blob /' + container + path);
			}
		});
	});


	
});




//need to sort by date joined, filter on enabled and pick 10 and output to azure blob ref table (date partitioned) - need another App Setting for that


