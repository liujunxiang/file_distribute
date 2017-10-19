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

//

router.get('/check/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.sprefix+session  , function( err , values )
    {
        if(!err)
        {
           if( values != null  && values != '')
           {
               var value=convert.str_2_array(values  )
               var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
               var db=new mongo.Db( config.db.dbname ,server,{safe:true});
               db.open( function (_err,db)
               {
                   if(!_err)
                   {
                       db.collection(config.db.table.file, function (err,collection){
                           collection.find({status:0},{_id:0,title:1,
                           filename:1,size:1,userid:1,status:1}).toArray(function(err,docs)
                               {
                                    var action_columns = new Array()	
                                    for( var i in docs[0] )
                                    {
                                        var obj =new Object()
                                        obj.title = i 
                                        action_columns.push( obj )							
                                    }

                                    var action_dataset =  new Array() 
                                    for( var i = 0 ; i < docs.length ;i++ )
                                    {
                                        b =  json_2_array( docs[i] )
                                        action_dataset.push(b )
                                    }
                                    res.render( 'filecheck' , 
                                        {user_dataset:JSON.stringify(action_dataset)  , 
                                        user_column:JSON.stringify( action_columns )   ,
                                            type:value,
                                            pname:'' , 
                                            title:config.title || 'test' ,
                                            session:session
                                        } 
                                    )
                               }
                               )
                       }
                       )
                   }//endif 
               }//end db open 
               )
           }
        }
    }
    )
} 
)

//
router.post('/check/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value >=4 )
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                    var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                    db.open( function (_err,db)
                        {
                            db.collection(config.db.table.file, function (err,collection){
                                var cond=req.body
                                cond.size=~~cond.size
                                console.log( cond )
                                //collection.remove( cond  )
                                collection.update(cond ,{$set:{ status:1} } )
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify( config.msg.success ))
                            }
                            )
                        }
                    )
               }//endif if( value ==  config.superuser.user)
           }//end if( value != null  && value != '')
        }
    }
    )
}
)
//
router.get('/visit/:id/', function(req, res, next) {
    id=req.params.id
    session=req.cookies.session
    convert.get_file_list( session , ~~id ).then(function(r)
    {
        if( typeof(r) == 'undefined')
        {
            res.direct('/')
            return 
        }
        console.log( JSON.stringify (r ) )
        var docs=r.data 
        var action_columns = new Array()	
        for( var i in docs[0] )
        {
            var obj =new Object()
            obj.title = i 
            action_columns.push( obj )							
        }

        var action_dataset =  new Array() 
        for( var i = 0 ; i < docs.length ;i++ )
        {
            b =  json_2_array( docs[i] )
            action_dataset.push(b )
        }
        res.render( 'filevist' , 
            {user_dataset:JSON.stringify(action_dataset)  , 
            user_column:JSON.stringify( action_columns )   ,
                type:r.type,
                title:config.title || 'test' ,
                session:session,
                pname:''
            } 
        )
    }
    )
} 
)

//

router.get('/baklist/', function(req, res, next) {
    console.log( req.cookies )
    session=req.cookies.session
    redis.get( config.session.sprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
               var db=new mongo.Db( config.db.dbname ,server,{safe:true});
               db.open( function (_err,db)
               {
                   if(!_err)
                   {
                       db.collection(config.db.table.file, function (err,collection){
                           collection.find({},{_id:0,title:1,
                           filename:1,size:1,userid:1,status:1,project:1,expire:1,date:1}).toArray(function(err,docs)
                               {
                                    var action_columns = new Array()	
                                    for( var i in docs[0] )
                                    {
                                        var obj =new Object()
                                        obj.title = i 
                                        action_columns.push( obj )							
                                    }

                                    var action_dataset =  new Array() 
                                    for( var i = 0 ; i < docs.length ;i++ )
                                    {
                                        b =  json_2_array( docs[i] )
                                        action_dataset.push(b )
                                    }
                                    res.render( 'filelist' , 
                                        {user_dataset:JSON.stringify(action_dataset)  , 
                                        user_column:JSON.stringify( action_columns )   ,
                                            type:convert.str_2_array(value), 
                                            title:config.title || 'test' ,
                                            session:session,
                                            pname:''
                                        } 
                                    )
                               }
                               )
                       }
                       )
                   }//endif 
               }//end db open 
               )
           }
        }
    }
    )
} 
)


router.get('/list/', function(req, res, next) {
    session=req.cookies.session
    convert.get_file_list( session , 5 ,  {_id:0,title:1,
                           filename:1,size:1,userid:1,status:1,project:1,expire:1,date:1} 
   ).then( function( r ) 
   {
        var docs=r.data
        var action_columns = new Array()	
        for( var i in docs[0] )
        {
            var obj =new Object()
            obj.title = i 
            action_columns.push( obj )							
        }

        var action_dataset =  new Array() 
        for( var i = 0 ; i < docs.length ;i++ )
        {
            b =  json_2_array( docs[i] )
            action_dataset.push(b )
        }
       res.render( 'filelist' , 
            {user_dataset:JSON.stringify(action_dataset)  , 
            user_column:JSON.stringify( action_columns )   ,
                type:r.type, 
                title:config.title || 'test' ,
                session:session,
                pname:''
            } 
        )
   }
   )
} 
)
//
router.post('/del/', function(req, res, next) {
    console.log( req.body )
    session=req.cookies.session
    redis.get( config.session.sprefix+session  , function( err , values )
    {
        if(!err)
        {
            console.log(values) 
           if( values != null  && values != '')
           {
               value=convert.str_2_array( values )
               console.log(value) 
               if( value[3] == 1 || value[0] == 1 || value[2] == 1 )
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                    var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                    db.open( function (_err,db)
                        {
                            db.collection(config.db.table.file, function (err,collection){
                                var cond=req.body
                                cond.size=~~cond.size
                                console.log(cond )
                                collection.remove( cond  )
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify( config.msg.success ))
                            }
                            )
                        }
                    )
               }//endif if( value ==  config.superuser.user)
           }//end if( value != null  && value != '')
        }
    }
    )
}
)


router.get('/upload/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        res.redirect('/')
        return 
    }
    convert.get_project_list(session).then( function( r) 
    {
        if( typeof(r) == 'undefined')
        {
            res.redirect('/')
            return 
        }
      //  console.log( JSON.stringify(r))
        res.render( 'fileupload' , { 
        type:r.type,pname:'' ,
        issuper:r.issuper,
        projectlist:r.project
        } )
    }
    )
} 
)

router.post('/upload/', function(req, res, next) {
    session=req.cookies.session
    AVATAR_UPLOAD_FOLDER = '/resource/'
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = 'public' + AVATAR_UPLOAD_FOLDER;	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
    form.parse(req, function(err, fields, files) 
    {     
    var title = fields.title 
    var desc = fields.desc
    var type=fields.type
    var f=files.codecsv.path
    var file_srcname = files.codecsv.name
    fs.exists(f , function(exists) {
        if( !exists )
        {
            res.end({"res":201})
            return 
        }
        fd=fs.openSync( f , "r")
        var stat=null
        if( fd > 0)
        {
            stat=fs.fstatSync(fd)
            fs.closeSync(fd )
        }
        if( stat.size > 20*1024*1024 )
        {
            res.writeHead(200, {"Content-Type": "application/json"}); 
            res.end( JSON.stringify({"res":201}))
            fs.unlinkSync(f);                    
            return 
        }
        convert.get_my_main_project(session ).then( function(r)
            {
                if( typeof( r) == 'undefined')
                {
                    res.redirect('/')
                    return 
                }
                var o = new Object( )
                o.title = title
                o.desc = desc 
                o.filename = file_srcname 
                o.encode_filename = f.replace(/public\//g,'')
                o.date = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
                o.type=~~type
                o.size=stat.size
                o.status=0
                o.userid=r.user
                o.expire=~~fields.expire
                if(typeof( fields.project ) != 'undefined' &&( r.type[0] == 1 || r.type[0] == 1 ))
                {
                    o.project=fields.project
                }
                else
                {
                    o.project=r.project 
                }
                convert.insert_file( o).then(function(r)
                {
                    console.log( JSON.stringify(o)) 
                    res.writeHead(200, {"Content-Type": "application/json"}); 
                    res.end(JSON.stringify( {"res":200} ));
                }
                )      
            }
        )
    }
    )
    }
    )
    }
)
module.exports = router;
