const Logger = require('./common/nodejs/logger');
const {port} = require('./app/config.json');

const helper = require('./app/helper.js');

const Query = require('./common/nodejs/query');
const {app, server} = require('./common/nodejs/express/baseApp').run(port);



app.get('/', (req, res, next) => {
	res.send('pong from davids server');
});

const {wsServerBuilder} = require('./express/webSocketCommon');
const wsApp = require('./wsApp');
const onMessage = wsApp.handle;
const onMessageError = wsApp.onError;
const wss = wsServerBuilder(server, onMessage, onMessageError);


const errorCodeMap = require('./express/errorCodeMap.js');
const errorSyntaxHandle = (err, res) => {
	const status = errorCodeMap.get(err);
	res.status(status);
	res.send(err.toString());
};


//hardCode section
const channelName = 'allchannel';
const peerIndex = 0;


//Query for Channel Information
//NOTE: blockchain is summary for all channel and chaincode
app.get('/query/chain', async (req, res) => {
	const logger = Logger.new('GET blockchain Info');
	const orgName = helper.randomOrg('peer');
	logger.debug({orgName, peerIndex, channelName});

	try {
		const client = await helper.getOrgAdmin(orgName);
		const channel = helper.prepareChannel(channelName, client);
		const peer = helper.newPeers([peerIndex], orgName)[0];
		const message = await Query.chain(peer, channel);
		res.send(message.pretty);
	} catch (err) {
		errorSyntaxHandle(err, res);
	}


});
