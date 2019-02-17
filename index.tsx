const tradfri = require('node-tradfri-client');
const audio = require('./aux/pulseaudio/index.tsx');
const fs = require('fs');
let colors = [ 'e50dde', '6026ad', 'e50d29', '51697f' ];
let auth = require('./config.json');
let discovered_light = false;
const groups = {};

const lightbulbs = {};
let client = null;

async function _discover() {
	return await tradfri.discoverGateway();
}

_auth = async () => {
	try {
		const { identity, psk } = await client.authenticate(auth.securityCode);
		console.log(identity + ' ' + psk);
		auth.identity = identity;
		auth.psk = psk;
		fs.writeFile('./config.json', JSON.stringify(auth), (e) => {
			if (e) {
				console.log(e);
			}
		});
	} catch (e) {
		console.log('_auth() error');
		console.log(e);
	}
};

_connect = async (name) => {
	console.log('Connection initiated..');
	client = new tradfri.TradfriClient(name);

	if (!auth.identity || !auth.psk) {
		console.log('Not yet authenticated. Authenticating and saving to file.');
		await _auth(); // To comply with IKEA's requests, the security code must not be stored permanently in your application
	}

	try {
		let connected = await client.connect(auth.identity, auth.psk);
		console.log(`Connected: ${connected}`);
		return;
	} catch (e) {
		console.log('_connect() error:');
		console.log(e);
	}
};

function tradfri_deviceUpdated(device) {
	if (device.type === tradfri.AccessoryTypes.lightbulb) {
		// remember it
		lightbulbs[device.instanceId] = device;
		// console.log("Discovered device!");
		// console.log(device);
	}
	if (device.instanceId === 65537) {
		if (!discovered_light) {
			_toggleLight();
			discovered_light = true;
		}
	}
}

function tradfri_deviceRemoved(instanceId) {
	// clean up
}

function tradfri_groupUpdated(group) {
	// remember it
	groups[group.instanceId] = group;
	if (group.instanceId === 131073) {
		if (!discovered_light) {
			_toggleLight();
		}
		discovered_light = true;
	}
}

// Start
_discover().then(async (res) => {
	console.log(res);
	await _connect(res.addresses[0]);

	// observe devices
	client.on('device updated', tradfri_deviceUpdated).on('device removed', tradfri_deviceRemoved).observeDevices();

	// client
	// .on("group updated", tradfri_groupUpdated)
	// .observeGroupsAndScenes();

	// later...
	// at least after we have actually received the light object
});

const test = [ 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254, 0, 254 ];
const colorwheel = [ '002347', '9c0a0a', 'f29fb8' ];

_toggleLight = async () => {
	// const light_desk = lightbulbs[65536];
	// const light_hall = lightbulbs[65537];
	// let light = light_desk.lightList[0];
	let lights = Object.values(lightbulbs);
	//const group_house = groups[131073];

	while (true) {
		await asyncForEach(colorwheel, async (c) => {
			//let vol = await audio.getVol();
			let operation = {
				color: c,
				dimmer: 100,
				transitionTime: 0
			};
			//light.toggle();
			lights.forEach((l) => {
				client.operateLight(l, operation);
			});

			//const requestSent = client.operateLight(light_desk, operation);
			//const requestSent = await client.operateGroup(group_house, operation, true);
			await delay(200);
		});
	}
};

function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
