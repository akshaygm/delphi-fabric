const util = require('util');
const exec = util.promisify(require('child_process').exec);
exports.systemPrune = async () => {
	const {stdout, stderr} = await exec('docker system prune --force');
	if (stderr) {
		throw stderr;
	}
	return stdout;
};
exports.systemInfo = async () => {
	const {stdout, stderr} = await exec('docker info --format \'{{json .}}\'');
	if (stderr) throw stderr;
	return stdout;
};
exports.swarmWorkerInfo = async () => {
	const {Swarm} = JSON.parse(await exports.systemInfo());
	return Swarm;
};
exports.nodeInspect = async (id) => {
	const {stdout, stderr} = await exec(`docker node inspect ${id}`);
	if (stderr) throw stderr;
	return JSON.parse(stdout)[0];
};
exports.nodeSelf = async (pretty) => {
	const info = await exports.nodeInspect('self');
	if (pretty) {
		const {
			ID, Status, ManagerStatus,
			Description: {Hostname, Platform, Engine: {EngineVersion}},
		} = info;
		return {ID, Hostname, Platform, EngineVersion, Status, ManagerStatus};
	}
	return info;
};
exports.copy = async (containerName, from, to, toContainer) => {
	const cmd = toContainer ? `docker cp ${from} ${containerName}:${to}` : `docker cp ${containerName}:${from} ${to}`;
	const {stdout, stderr} = await exec(cmd);
	if (stderr) throw stderr;
	return stdout;
};
exports.joinToken = async (role = 'manager') => {
	const cmd = `docker swarm join-token ${role} | grep docker`;
	const {stdout, stderr} = await exec(cmd);
	if (stderr) throw stderr;
	return stdout.trim();
};
exports.advertiseAddr = async (fullToken) => {
	if (!fullToken) {
		fullToken = await exports.joinToken();
	}
	const address = fullToken.split(' ')[5];
	const token = fullToken.split(' ')[4];
	const addressSlices = address.split(':');
	return {address: addressSlices[0], token, port: addressSlices[1], AdvertiseAddr: address};
};