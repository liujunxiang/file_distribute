var mongo = require('mongodb')
var config = require('../config/config')
var server=new mongo.Server(config.db.host,config.db.port,{auto_reconnect:true })


var db=new mongo.Db( config.db.dbname ,server,{safe:true});
module.exports=db