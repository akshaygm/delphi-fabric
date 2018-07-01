const {randomKeyOf} = require('../common/nodejs/helper');
const {instantiate, upgrade,invoke} = require('../common/nodejs/chaincode');
const logUtil = require('../common/nodejs/logger');

exports.instantiate = async (channel, richPeers, {chaincodeId, chaincodeVersion, args, fcn}) => {
	const logger = logUtil.new('instantiate-Helper');

	const {eventWaitTime} = channel;

	const eventHubs = [];

	for (const peer of richPeers) {
		const eventHub = await peer.eventHubPromise;
		eventHubs.push(eventHub);
	}
	return instantiate(channel, richPeers, eventHubs, {chaincodeId, chaincodeVersion, args, fcn}, eventWaitTime);
};

exports.upgrade = async (channel, richPeers, {chaincodeId, chaincodeVersion, args, fcn}) => {
	const logger = logUtil.new('upgrade-Helper');
	const {eventWaitTime} = channel;
	const eventHubs = [];

	for (const peer of richPeers) {
		const eventHub = await peer.eventHubPromise;
		eventHubs.push(eventHub);
	}
	return upgrade(channel, richPeers, eventHubs, {chaincodeId, chaincodeVersion, args, fcn}, eventWaitTime);
};
exports.invoke = async (channel, richPeers, {chaincodeId, fcn, args}) => {
	const logger = logUtil.new('invoke-Helper');
	const {eventWaitTime} = channel;
	const eventHubs = [];
	for (const peer of richPeers) {
		const eventHub = await peer.eventHubPromise;
		eventHubs.push(eventHub);
	}
	const orderers = channel.getOrderers();
	const orderer = orderers[randomKeyOf(orderers)]
	return invoke(channel, richPeers, eventHubs, {chaincodeId, args, fcn},orderer, eventWaitTime);
};