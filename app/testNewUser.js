const helper = require('./helper');
const org = helper.randomOrg('peer');
const swarm = false;
require('../config/caCryptoGen').genUser({userName:'david'}, org, swarm);