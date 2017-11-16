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
var redis_async=require('./redis_async')
var convert=require('./convert')
var mongoose=require('./mongoose')
var log4js = require('log4js');
var loggerer = log4js.getLogger(__filename.replace(/.*\//g,''));
router.get('/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        loggerer.error('session is none')
        res.redirect('/login')
        return 
    }
    ( async function(){
        let string_type=await  redis_async.getValue( config.session.sprefix+session)
        loggerer.info( 'loggin type is ' + string_type)
        if( string_type == null || string_type == '')
        {
            loggerer.error( 'loggin type is null' )
            return 
        }
        
        
        var value=convert.str_2_array(string_type  )
        
        
        if( value[0] != 1 &&  value[1] != 1)
        {
            loggerer.error( 'right error' )
            return 
        }
        res.render( 'material' , { 
        type:value,
        pname:'' ,
        } ) 
    })()
}
)



var download=function( req ,dir ,maxFieldsSize=2097152,encoding='utf-8' ,keepExtension=true  ) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = encoding;		//设置编辑
    form.uploadDir = dir	 //设置上传目录
    form.keepExtensions = keepExtension;	 //保留后缀
    form.maxFieldsSize = maxFieldsSize;   //文件大小
    return new Promise(function(resolve, reject) {
        form.parse( req , function(err, result) {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

router.post('/', function(req, res, next) {
    //var =node_uuid.v1().replace(/[-]/g , ""  ) 
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        loggerer.error( 'session is none')
        res.redirect('/login') 
        return 
    } 
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = 'public/material/'	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = config.max_upload_size;   //文件大小
    form.parse(req, function(err, fields, files) {
        var title = fields.title
        var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
        var db=new mongo.Db( config.db.dbname ,server,{safe:true});
        db.open( function (_err,db){
            if(!_err)
            {
                db.collection('material', function (err,collection){
                    if(!err)
                    {
                        var o=new Object()
                        o.title=title
                        o.key=node_uuid.v1().replace(/[-]/g , ""  ) 
                        o.url=files.codecsv.path.replace(/public/,'')
                        collection.insert( o )
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify( config.msg.success ))
                    }
                })
            }
        })
    })
}
)

router.get('/list/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        loggerer.error( 'session is none')
        res.redirect('/login') 
        return 
    }
    ( async function(){
        let string_type=await  redis_async.getValue( config.session.sprefix+session)
        loggerer.info( 'loggin type is ' + string_type)
        if( string_type == null || string_type == '')
        {
            loggerer.error( 'loggin type is null' )
            return 
        }
        var value=convert.str_2_array(string_type  )
        if( value[0] != 1 &&  value[1] != 1)
        {
            loggerer.error( 'right error' )
            return 
        }
        
        await mongoose.open()
        let collection_material=await  mongoose.collection('material')
      //  loggerer.info( config.db.table.article)
        let piclist = await  mongoose.select( collection_material,{} ,{_id:0,key:0})
        mongoose.close()
        var action_columns = new Array()	
        for( var i in piclist[0] )
        {
            var obj =new Object()
            obj.title = i 
            action_columns.push( obj )							
        }

        var action_dataset =  new Array() 
        for( var i = 0 ; i < piclist.length ;i++ )
        {
            b =  json_2_array( piclist[i] )
            action_dataset.push(b )
        }
  
        res.render( 'materiallist' , { 
        user_dataset:JSON.stringify(action_dataset)  ,
        user_column:JSON.stringify( action_columns )   ,
        title:config.title || 'test' ,
        type:value,
        pname:'' 
        } ) 
    })()    
}
)
module.exports = router;
