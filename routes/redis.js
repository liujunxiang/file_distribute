var config = require('../config/config')
var redis = require("redis")
var client = redis.createClient(config.redis.port, config.redis.host );
module.exports=client