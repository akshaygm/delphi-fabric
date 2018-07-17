const helper = require('./app/helper');
const {invoke} = require('./app/chaincodeHelper');
const logger = require('./common/nodejs/logger').new('wsApp');
const {reducer} = require('./common/nodejs/chaincode');
const chaincodeId = 'trade';


const orgExchange = 'Exchange';
const orgMerchant = 'Merchant';
const orgConsumer = 'Consumer';
const TypeMap = {
	'c': orgConsumer,
	'm': orgMerchant,
	'e': orgExchange,
};
const channelName = 'allchannel';
const peerIndexes = [0];
const ClientUtil = require('./common/nodejs/client');
const getClient = async (user) => {
	const client = ClientUtil.new();
	await client.setUserContext(user, true);
	return client;
};
const {genUser} = require('./config/caCryptoGen');
const getUser = async ({Name}, org) => {
	return genUser({userName: Name}, org, false);
};
exports.handle = async (data, ws) => {
	const {fcn, ID} = data;
	if (!fcn) throw Error('fcn is required');
	if (!ID) throw Error('ID is required');
	const {Name, Type} = ID;
	const maxNameLength = 55;
	if (typeof Name !== 'string') {
		throw Error(`invalid type of ID.Name: ${typeof Name}`);
	} else if (Name.length > maxNameLength) {
		throw Error(`length of Name exceed limit Max:${maxNameLength},Current: ${Name.lenght}`);
	}

	if (typeof Type !== 'string' || !TypeMap[Type]) {
		throw Error(`invalid ID.type: ${Type}`);
	}
	const org = TypeMap[Type];
	let {args = []} = data;
	if (!Array.isArray(args)) {
		args = JSON.parse(args);
	}
	args = [JSON.stringify({Name: `${Name}@${org}`, Type})].concat(args);
	logger.debug({args});
	const user = await getUser({Name}, org);
	const client = await getClient(user);
	const channel = helper.prepareChannel(channelName, client, true);
	const peers = helper.newPeers(peerIndexes, org);
	ws.send(JSON.stringify({payload: {fcn, args}, status: 200, state: 'ready'}));
	const {txEventResponses, proposalResponses} = await invoke(channel, peers, {chaincodeId, fcn, args}, user);
	const resp = reducer({txEventResponses, proposalResponses}).responses[0];
	ws.send(JSON.stringify({payload: resp, status: 200, state: 'finished'}));
};
const errMap = require('./express/errorCodeMap');
exports.onError = async (err, ws) => {
	const status = errMap.get(err);
	ws.send(JSON.stringify({payload: err.toString(), status, state: 'error'}));
};