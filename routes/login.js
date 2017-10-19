var express = require('express');
var config = require( '../config/config')
var router = express.Router();
var node_uuid=require('node-uuid')
var redis = require( './redis')
var mongo = require('mongodb')
var colors=require('colors')
var util=require('util')
var formidable = require('formidable')
var fs=require( 'fs')
var sd = require('silly-datetime');
var markdown = require('markdown');
var md = require('markdown-js');
var convert=require('./convert')
/* GET home page. */
json_2_array=function ( obj )
{
        var a= new Array()
        for( var i  in obj )
        {
            a.push( obj[i] )
        }
        return a 
}




router.post( '/' ,function(req, res, next) 
{
    var a = new Object()
    a.res=200
    a.session=node_uuid.v4().replace(/[-]/g , ""  ) 
    u = req.body.user
    p = req.body.passwd 
    var result=[0,0,0,0,0]
    if(u == config.superuser.user && p == config.superuser.passwd  )
    {
        result[0]=1
        redis.set( config.session.prefix+a.session , u  )
        redis.set( config.session.subprefix+a.session , 5 )
        redis.set( config.session.sprefix+a.session , convert.array_2_str(result)  )
        //console.log( config.session.subprefix+a.session )
        redis.expire(config.session.prefix+a.session , config.session.ttl  )
        redis.expire(config.session.subprefix+a.session , config.session.ttl  )
        redis.expire(config.session.sprefix+a.session , config.session.ttl  )
        res.cookie( 'session' ,a.session )
        var str="cookie setting"+ a.session+"\n" + "session key is"+ config.session.prefix+a.session +"\n"
        +"type key is "+config.session.subprefix+a.session + "\n" + " type is 5\n" 
        console.log( (config.session.subprefix+a.session).green+' ==> ' + convert.array_2_str(result).red.underline )
        res.end( '1' )
        return
    }
    else
    {
        convert.get_user_info(u , p ).then(function( r )
        {
            if( typeof( r) == 'undefined')
            {
                console.log( r)
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(config.msg.e201  ))
                return 
            }
            console.log( JSON.stringify(r))
            if(~~r.ulist.type == 1 )
            {
                result[1]=1
            }
            var u_p_rel=r.u_p_rel
            for( var i =0 ;i < u_p_rel.length ;i++)
            {
                var ele=u_p_rel[i]
               if ( ele.type == 3)
               {
                   result[2]=1
               }
               if ( ele.type == 2)
               {
                   result[3]=1
               }
               if ( ele.type == 1)
               {
                   result[4]=1
               }
            }
            redis.set( config.session.prefix+a.session , u  )
            redis.set( config.session.subprefix+a.session , 5 )
            redis.set( config.session.sprefix+a.session , convert.array_2_str(result)  )
            //console.log( config.session.subprefix+a.session )
            redis.expire(config.session.prefix+a.session , config.session.ttl  )
            redis.expire(config.session.subprefix+a.session , config.session.ttl  )
            redis.expire(config.session.sprefix+a.session , config.session.ttl  )
            res.cookie( 'session' ,a.session )
            var str="cookie setting"+ a.session+"\n" + "session key is "+ config.session.sprefix+a.session +"\n"
            +"type key is "+config.session.subprefix+a.session + "\n" + " type is 5\n" 
            console.log( (config.session.subprefix+a.session).green+' ==> ' + convert.array_2_str(result).red.underline )
            res.end(JSON.stringify( a ))
            return
        })
    }
} 
)
module.exports = router;
