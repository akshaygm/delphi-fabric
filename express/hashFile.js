const express = require('express');
const router = express.Router();
const logger = require('../app/util/logger').new('hash record');
const Request = require('request');


const fs = require('fs');

const helper = require('../app/helper.js');
const invalid = require('./formValid').invalid();
const { reducer } = require('../app/util/chaincode');
const { invoke } = require('../app/invoke-chaincode.js');

const channelName = 'allChannel';
const chaincodeId = 'hashChaincode';
const TKOrgName = 'TK.Teeking.com'
const globalConfig = require('../config/orgs.json');
const TKMSP = globalConfig.orgs['TK.Teeking.com'].MSP.id

const successHandle = (data, res) => {
	res.json({ result: true, data });
}
const errorHandle = (err, res) => {
	const errorCodeMap = require('./errorCodeMap.json');

	let status = 500;
	for (const errorMessage in errorCodeMap) {
		if (err.toString().includes(errorMessage)) {
			status = errorCodeMap[errorMessage];
			break;
		}
	}
	res.status(status).json({ result: false, error: err.toString() });

};
const paramChecker = ({ key, orgName, args }) => {
	const invalidChannelName = invalid.channelName({ channelName });
	if (invalidChannelName) throw invalidChannelName;
	if (!key) throw `id is ${key}`;
	if (!orgName) throw `org is ${orgName}`;
	const invalidPeer = invalid.peer({ peerIndex, orgName });
	if (invalidPeer) throw invalidPeer;
	const invalidArgs = invalid.args({ args });
	if (invalidArgs) throw invalidArgs;
}

const peerIndex = 0;

router.post('/write', async (req, res) => {
	const { key, hash } = req.body;

	const { org: orgName } = req.body;
	logger.debug('write', { key, hash, orgName });

	try {
		const fcn = 'write';
		const args = [key, hash];
		paramChecker({ key, orgName, args })
		logger.debug({ chaincodeId, fcn, orgName, peerIndex, channelName });
		const client = await helper.getOrgAdmin(orgName)
		const channel = helper.prepareChannel(channelName, client);
		const peers = helper.newPeers([peerIndex], orgName);
		const message = await invoke(channel, peers, {
			chaincodeId, fcn,
			args
		})
		const data = reducer(message);
		successHandle(data.responses, res);

	} catch (err) {
		logger.error(err);
		const { proposalResponses } = err;
		if (proposalResponses) {
			errorHandle(proposalResponses, res);
		} else {
			errorHandle(err, res);
		}
	}

});
router.post('/delete', async (req, res) => {
	const { key, org: orgName } = req.body;
	logger.debug('delete', { key, orgName });

	try {
		const fcn = 'delete';
		const args = [key];
		paramChecker({ key, orgName, args })

		logger.debug({ chaincodeId, fcn, orgName, peerIndex, channelName });
		const client = await helper.getOrgAdmin(orgName)
		const channel = helper.prepareChannel(channelName, client);
		const peers = helper.newPeers([peerIndex], orgName);
		const message = await invoke(channel, peers, {
			chaincodeId, fcn,
			args
		})
		const data = reducer(message);
		successHandle(data.responses, res);

	} catch (err) {
		logger.error(err);
		const { proposalResponses } = err;
		if (proposalResponses) {
			errorHandle(proposalResponses, res);
		} else {
			errorHandle(err, res);
		}
	}
});
router.post('/read', async (req, res) => {
	const { key, org: orgName } = req.body;
	logger.debug('read', { key, orgName });

	try {
		const fcn = 'read';

		const args = [key];
		paramChecker({ key, orgName, args })
		if (orgName === TKOrgName) {
			args.push(req.body.delegatedMSP ? req.body.delegatedMSP : TKMSP);
		}
		logger.debug({ chaincodeId, fcn, orgName, peerIndex, channelName });

		const client = await helper.getOrgAdmin(orgName)
		const channel = helper.prepareChannel(channelName, client);
		const peers = helper.newPeers([peerIndex], orgName);
		const message = await invoke(channel, peers, {
			chaincodeId, fcn,
			args
		})
		const data = reducer(message);
		successHandle(data.responses, res);
	} catch (err) {
		logger.error(err);
		const { proposalResponses } = err;
		if (proposalResponses) {
			errorHandle(proposalResponses, res);
		} else {
			errorHandle(err, res);
		}
	}
});

router.post('/worldState', async (req, res) => {

	const {  org: orgName } = req.body;
	const fcn = 'worldStates';

	const args = [];

	try {
		const client = await helper.getOrgAdmin(orgName)
		const channel = helper.prepareChannel(channelName, client);
		const peers = helper.newPeers([peerIndex], orgName);
		const message = await invoke(channel, peers, {
			chaincodeId, fcn,
			args
		})
		const data = reducer(message);
		successHandle(JSON.parse(data.responses), res);
	} catch (err) {
		logger.error(err);
		const { proposalResponses } = err;
		if (proposalResponses) {
			errorHandle(proposalResponses, res);
		} else {
			errorHandle(err, res);
		}
	}

});

module.exports = router;
