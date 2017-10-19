var config = require('../config/config')
var redis = require("redis")
var client = redis.createClient(config.redis.port, config.redis.host );
var getValue=function( key  ) {
    return new Promise(function(resolve, reject) {
        client.get(key, function(err, c) {
            if (err) {
                mongodb.close();
                return reject(err);
            }
            resolve(c);
        });
    });
};

async function getV( key )
{
    let data = await getValue( key )
    return data
}

module.exports={ 
get:getV,
getValue:getValue
}