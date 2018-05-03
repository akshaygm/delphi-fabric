const express = require('express');
const router = express.Router();
const logger = require('../app/util/logger').new('http-chaincode');
const helper = require('../app/helper.js');
const invalid = require('./formValid').invalid();

const errorHandle = (err, res) => {
	const errorCodeMap = require('./errorCodeMap.json');

	let status = 500;
	for (let errorMessage in errorCodeMap) {
		if (err.toString().includes(errorMessage)) {
			status = errorCodeMap[errorMessage];
			break;
		}
	}
	res.status(status).json({error: err.toString()});

};
const {reducer} = require('../app/util/chaincode');
router.post('/invoke', (req, res) => {
	const {chaincodeId, fcn, args: argsString, orgName, peerIndex, channelName} = req.body;
	const {invoke} = require('../app/invoke-chaincode.js');

	logger.debug('==================== INVOKE CHAINCODE ==================');
	const args = argsString ? JSON.parse(argsString) : [];
	logger.debug({chaincodeId, fcn, args, orgName, peerIndex, channelName});
	const invalidPeer = invalid.peer({peerIndex, orgName});
	if (invalidPeer) return errorHandle(invalidPeer, res);

	const invalidChannelName = invalid.channelName({channelName});
	if (invalidChannelName) return errorHandle(invalidChannelName, res);

	const invalidArgs = invalid.args({args});
	if (invalidArgs) return errorHandle(invalidArgs, res);

	helper.getOrgAdmin(orgName).then((client) => {
		const channel = helper.prepareChannel(channelName, client);
		const peers = helper.newPeers([peerIndex], orgName);
		return invoke(channel, peers, {
			chaincodeId, fcn,
			args
		}).then((message) => {
			const data = reducer(message);
			res.json({data: data.responses});

		}).catch(err => {
			logger.error(err);
			const {proposalResponses} = err;
			if (proposalResponses) {
				errorHandle(proposalResponses, res);
			} else {
				errorHandle(err, res);
			}
		});
	});

});
router.post('/instantiate', (req, res) => {
	const {instantiate} = require('../app/instantiate-chaincode');
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');

	const {chaincodeId, chaincodeVersion, channelName, fcn, args: argsString, peerIndex, orgName} = req.body;

	logger.debug({channelName, chaincodeId, chaincodeVersion, fcn, argsString, peerIndex, orgName});
	const args = argsString ? JSON.parse(argsString) : [];

	const invalidChannelName = invalid.channelName({channelName});
	if (invalidChannelName) return errorHandle(invalidChannelName, res);

	const invalidArgs = invalid.args({args});
	if (invalidArgs) return errorHandle(invalidArgs, res);

	let peers = undefined;
	if (orgName && peerIndex) {
		const invalidPeer = invalid.peer({orgName, peerIndex});
		if (invalidPeer) return errorHandle(invalidPeer, res);
		peers = helper.newPeers([peerIndex], orgName);
	}
	return helper.getOrgAdmin(orgName).then((client) => {
		const channel = helper.prepareChannel(channelName, client);
		return instantiate(channel, peers, {
			chaincodeId, chaincodeVersion, fcn,
			args
		}).then((_) => {
			logger.debug(_);
			res.json({data: 'instantiate request has been processed successfully '});
		}).catch(err => {
			const {proposalResponses} = err;
			if (proposalResponses) {
				errorHandle(proposalResponses, res);
			} else {
				errorHandle(err, res);
			}
		});
	});
});
router.post('/upgrade', (req, res) => {
	const {upgrade} = require('../app/instantiate-chaincode');
	logger.debug('==================== upgrade CHAINCODE ==================');

	const {chaincodeId, chaincodeVersion, channelName, fcn, args: argsString, peerIndex, orgName} = req.body;
	const args = argsString ? JSON.parse(argsString) : [];
	logger.debug({channelName, chaincodeId, chaincodeVersion, fcn, args, peerIndex, orgName});
	const invalidChannelName = invalid.channelName({channelName});
	if (invalidChannelName) return errorHandle(invalidChannelName, res);

	const invalidArgs = invalid.args({args});
	if (invalidArgs) return errorHandle(invalidArgs, res);

	let peers = undefined;
	if (orgName && peerIndex) {
		const invalidPeer = invalid.peer({orgName, peerIndex});
		if (invalidPeer) return errorHandle(invalidPeer, res);
		peers = helper.newPeers([peerIndex], orgName);
	}
	helper.getOrgAdmin(orgName).then((client) => {
		const channel = helper.prepareChannel(channelName, client);
		return upgrade(channel, peers, {
			chaincodeId, chaincodeVersion, fcn,
			args
		}).then((_) => {
			logger.debug(_);
			res.json({data: 'upgrade request has been processed successfully '});
		}).catch(err => {
			const {proposalResponses} = err;
			if (proposalResponses) {
				errorHandle(proposalResponses, res);
			} else {
				errorHandle(err, res);
			}
		});
	});
});
module.exports = router;