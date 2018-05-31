const {createChannel} = require('./create-channel');
const {joinChannel} = require('./join-channel');

const helper = require('./helper');
const logger = require('../common/nodejs/logger').new('testChannel');
const configtxlator = require('../common/nodejs/configtxlator');
const {homeResolve} = require('../common/nodejs/path');
const channelName = 'allchannel';

const globalConfig = require('../config/orgs.json');
const {TLS} = globalConfig;
const channelConfig = globalConfig.channels[channelName];

const channelConfigFile = `${homeResolve(globalConfig.docker.volumes.CONFIGTX.dir)}/${channelConfig.file}`;
const joinAllfcn = async () => {


	for (const orgName in  channelConfig.orgs) {
		const {peerIndexes} = channelConfig.orgs[orgName];
		const peers = helper.newPeers(peerIndexes, orgName);

		const client = await helper.getOrgAdmin(orgName);

		const channel = helper.prepareChannel(channelName, client);
		const loopJoinChannel = async () => {
			try {
				return await joinChannel(channel, peers);
			} catch (err) {
				if (err.toString().includes('Invalid results returned ::NOT_FOUND')
					|| err.toString().includes('SERVICE_UNAVAILABLE')) {
					logger.warn('loopJoinChannel...');
					await new Promise(resolve => {
						setTimeout(() => {
							resolve(loopJoinChannel());
						}, 1000);
					});
				}
				else throw err;
			}
		};
		await loopJoinChannel();
	}

};
const task = async () => {
	const client = await helper.getOrgAdmin('BU.Delphi.com');
	const ordererUrl = `${TLS ? 'grpcs' : 'grpc'}://localhost:7050`;
	logger.info({ordererUrl});
	try {
		await createChannel(client, channelName, channelConfigFile, ['BU.Delphi.com', 'ENG.Delphi.com'], ordererUrl);
		await joinAllfcn();
	} catch (err) {
		if (err.toString().includes('Error: BAD_REQUEST') ||
			(err.status && err.status.includes('BAD_REQUEST'))) {
			//existing swallow
			await joinAllfcn();
		} else throw err;
	}
	const channel = helper.prepareChannel(channelName, client);
	try {
		const {original_config} = await configtxlator.getChannelConfigReadable(channel);
		const fs = require('fs');
		fs.writeFileSync(`${channelName}.json`, original_config);
	} catch (e) {
		logger.error(e);
	}

};
task();




