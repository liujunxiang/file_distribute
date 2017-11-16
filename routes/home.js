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
var convert= require('./convert')
var redis_async=require('./redis_async')
var log4js = require('log4js');
var loggerer = log4js.getLogger(__filename.replace(/.*\//g,''));
var mongoose=require('./mongoose')
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

router.get('/:_id', function(req, res, next) {
    session=req.cookies.session
    
    id=mongo.ObjectId( req.params._id )
    loggerer.info( 'id is' + id )
    if( typeof( session) == 'undefined' )
    {
        var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
        var db=new mongo.Db( config.db.dbname ,server,{safe:true});
        db.open( function (_err,db){
           db.collection('article', function (err,collection){
                collection.find({_id:id}).toArray(function(err,docs1){
                    if(docs1.length == 1 )
                    {
                        fileContent=docs1[0].content
                        filehtml=md.makeHtml(fileContent)
                        res.render('home_template'  ,  {
                        title:config.title || 'test'  , 
                        copyright:config.footer.copyright ,
                        head:docs1[0].title,
                        body :filehtml,
                        type:convert.str_2_array("00000") ,
                        pname:''})
                    }
                    return
                }
                )
            })           
        })
        return
    }
    redis.get( config.session.prefix+session  , function( err , value )
        {
            if( err || value == null)
            {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(config.msg.e201  ))
                return 
            }
            else
            {
                var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                db.open( function (_err,db) 
                {
                  if(!_err)
                  {
                        db.collection(config.db.table.user, function (err,collection){
                        var find_condition=new Object()
                        find_condition.userid =value
                        collection.find(find_condition).toArray(function(err,docs){
                            if( err)
                            {
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(config.msg.e202  ))
                                return
                            }
                            console.log(find_condition)
                            if( docs.length >1  )
                            {
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(config.msg.e202  ))
                                return 
                            }
                            var user_type=0
                            if(docs.length == 0 && value ==  config.superuser.user)
                            {
                                user_type=5
                            }
                            else if( docs.length == 1 )
                            {
                                user_type=docs[0].type
                            }
           db.collection('article', function (err,collection){
                collection.find({_id:id}).toArray(function(err,docs1){
                    if(docs1.length == 1 )
                    {
                        fileContent=docs1[0].content
                        filehtml=md.makeHtml(fileContent)
                        redis_async.get( config.session.sprefix+session ).then( function(r)
                        {
                        res.render('home_template'  ,  {
                        title:config.title || 'test'  , 
                        copyright:config.footer.copyright ,
                        head:docs1[0].title,
                        body :filehtml,
                        type:convert.str_2_array( r ) ,
                        pname:''})
                        }
                        )

                    }
                    return
                }
                )
            }) 
                        }
                        )
                     } 
                     ) 
                  }                      
                })
            }
        }   
    )
})


//


//home
router.get('/', function(req, res, next) {
    session=req.cookies.session
 //   console.log(session )
    var forwardedIpsStr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress
    if( typeof( session) == 'undefined')
    {
        loggerer.info(`visitor login {ip} is`  , forwardedIpsStr )
        convert.get_article_list().then(function( r ){
            res.render('home'  ,  {title:config.title || 'test'  , 
            copyright:config.footer.copyright , 
            type:convert.str_2_array("00000"),
            data_publish:JSON.stringify(r )}) 
            return
        })
    }
    else{//
        loggerer.info(`{session} is ,{ip} is `  , session ,forwardedIpsStr)
        convert.get_my_project(session ).then( function(d)
        {
            var pname=''
           if( typeof(d) != 'undefined')
           {
               if( typeof(d.main_title) != 'undefined')
               {
                   // pname=d.main_title
                    pname=''
               }
           }
           else{
               loggerer.error('empty' + session +'   d is' +d +' redirect /login' )
               res.redirect('/login')
               return 
           }
            redis_async.get( config.session.sprefix+session ).then( function(r)
            {
                var type_value = r
                convert.get_article_list().then(function( r ){
                    res.render('home'  ,  {title:config.title || 'test'  , 
                    copyright:config.footer.copyright , 
                    type:convert.str_2_array( type_value ),
                    data_publish:JSON.stringify(r ) ,
                    pname:pname}
                    ) 
                })
            }
            )
        }        
        )
        
    }
});
module.exports = router;
