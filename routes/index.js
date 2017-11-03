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
router.get('/test', function(req, res, next) {
    session=req.cookies.session
    convert.get_file_list( session , 5 ,  {_id:0,title:1,
                           filename:1,size:1,userid:1,status:1,project:1,expire:1,date:1} 
   ).then( function( r ) 
   {
       console.log( r ) 
       res.end('111')
   }
   )
    //
})
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
router.get('/markdown', function(req, res, next) {
    console.log( req.cookies)
    session=req.cookies.session
    redis.get( config.session.sprefix+session  , function( err , value )
    {
       res.render('markdown' ,{ type:convert.str_2_array( value ) ,pname:''}) 
    }
    )
    
})

router.post('/markdown', function(req, res, next) {
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
                            db.collection('article', function (err,collection)
                            {
                                var o=new Object()
                                o.content=req.body.text
                                o.title=req.body.title
                                o.date = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
                                collection.insert( o )
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
})


//
router.get('/markdown/list/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.sprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( 1 )
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                   var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                   db.open( function (_err,db)
                   {
                       if(!_err)
                       {
                           db.collection('article', function (err,collection){
                               collection.find({},{_id:1,title:1}).toArray(function(err,docs)
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
                                        res.render( 'editmarkdown' , 
                                            {user_dataset:JSON.stringify(action_dataset)  , 
                                            user_column:JSON.stringify( action_columns )   ,
                                                type:convert.str_2_array( value ) 
                                                ,title:config.title || 'test' ,
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
               }//endif 
           }
        }
    }
    )
}
)

//
router.post('/markdown/del/', function(req, res, next) {
    
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value ==  5)
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                    var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                    db.open( function (_err,db)
                        {
                            db.collection('article', function (err,collection){
                                var cond;
                                collection.remove( {_id:mongo.ObjectId(req.body._id) } )
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

router.get('/login', function(req, res, next) {
    // res.redirect('/home')
    res.render('login' , {title:config.login.title , login_message:config.login.msg})
});

router.get('/', function(req, res, next) {
     res.redirect('/home')
   // res.render('login' , {title:config.login.title , login_message:config.login.msg})
});

router.get('/visit', function(req, res, next) {
    res.redirect('/home')
})

router.get('/user/list/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.prefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( value ==  config.superuser.user)
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                   var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                   db.open( function (_err,db)
                   {
                       if(!_err)
                       {
                           db.collection(config.db.table.user, function (err,collection){
                               collection.find({},{_id:0}).toArray(function(err,docs)
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
                                        res.render( 'userlist' , 
                                            {user_dataset:JSON.stringify(action_dataset)  , 
                                            user_column:JSON.stringify( action_columns )   ,
                                                type:[1,0,0,0,0],title:config.title || 'test' ,
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
               }//endif 
           }
        }
    }
    )
}
)

router.post('/user/del/', function(req, res, next) {
    
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value ==  5)
               {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                    var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                    db.open( function (_err,db)
                        {
                            db.collection(config.db.table.user, function (err,collection){
                                var cond;
                                collection.remove( {userid:req.body.userid } )
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

router.get('/create/user/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value ==  5)
               {
                   res.render('newcreateuser' , { type:[1,0,0,0,0] ,pname:'' })
               }//endif if( value ==  config.superuser.user)
           }//end if( value != null  && value != '')
        }
    }
    )

} 
)

router.post('/create/user/', function(req, res, next) {
    var data = req.body
    session=req.cookies.session
    redis.get( config.session.prefix+session  , function( err , value ){
        if(!err)
        {
            if( value != null  && value != '')
            {
                if( value ==  config.superuser.user)
                {
                   var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                   var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                   db.open( function (_err,db)
                   {
                       if(!_err)
                       {
                           db.collection(config.db.table.user, function (err,collection){
                               var record = new Object()
                               record.userid=data.userid
                               record.passwd=data.passwd
                               record.type=~~data.type
                               collection.insert(record )
                               res.writeHead(200, {'Content-Type': 'application/json'});
                               res.end(JSON.stringify( config.msg.success ))
                           }
                           )
                           
                       }//endif 
                   }//end db open 
                   )//end end db open 
                }
            }
        }
    }
    )
    
    
}
)


//
router.get('/alteruserpasswd/user/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
        {
            if(!err)
            {
               if( value != null  && value != '')
               {
                   if( ~~value ==  5)
                   {
                       res.render('newalteruserpasswd',{type:5 } )
                   }//endif if( value ==  config.superuser.user)
               }//end if( value != null  && value != '')
            }
        }
    )
} 
)

router.post('/alteruserpasswd/user/', function(req, res, next) {
    session=req.cookies.session
    var data = req.body
    redis.get( config.session.subprefix+session  , function( err , value )
        {
            if(!err)
            {
               if( value != null  && value != '')
               {
                   if( ~~value ==  5)
                   {
                      var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
                       var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                       db.open( function (_err,db)
                       {
                           if(!_err)
                           {
                               db.collection(config.db.table.user, function (err,collection){
                                   //collection.insert(record )
                                   var cond=new Object()
                                   cond.userid = data.userid 
                                   
                                   var setdata=new Object()
                                   setdata.passwd=data.passwd
                                   
                                   collection.update( cond , {$set : setdata } )
                                   res.writeHead(200, {'Content-Type': 'application/json'});
                                   res.end(JSON.stringify( config.msg.success ))
                               }
                               )
                               
                           }//endif 
                       }//end db open 
                       )//end end db open
                   }//endif if( value ==  config.superuser.user)
               }//end if( value != null  && value != '')
            }
        }
    )
    
    
    var data = req.body
    redis.get( config.session.prefix+data.session  , function( err , value ){
        if(!err)
        {
            if( value != null  && value != '')
            {
                if( value ==  config.superuser.user)
                {
 
                }
            }
        }
    }
    )
    
    
}
)

//
//
/*
router.get('/file/check/', function(req, res, next) {
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value <2 || ~~value == 3 )
               {
                   res.end( '1111111' )
                   return
               }
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
                                            type:5,title:config.title || 'test' ,
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
router.post('/file/check/', function(req, res, next) {
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
router.get('/file/visit/:id/', function(req, res, next) {
    id=req.params.id
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if(( value != null  && value != '' ) || typeof( session)=='undefined' )
           {
               var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
               var db=new mongo.Db( config.db.dbname ,server,{safe:true});
               db.open( function (_err,db)
               {
                   if(!_err)
                   {
                       db.collection(config.db.table.file, function (err,collection){
                           collection.find({"type": ~~id ,"status":1},{_id:0,title:1,filename:1,encode_filename:1,userid:1,date:1}).toArray(function(err,docs)
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
                                    var usertype=0
                                    if( typeof( session)!='undefined' )
                                    {
                                        usertype=~~value
                                    }
                                    res.render( 'filevist' , 
                                        {user_dataset:JSON.stringify(action_dataset)  , 
                                        user_column:JSON.stringify( action_columns )   ,
                                            type:value,title:config.title || 'test' ,
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

router.get('/file/list/', function(req, res, next) {
    console.log( req.cookies )
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value <2 || ~~value == 3 )
               {
                   res.end( '1111111' )
                   return
               }
               var server=new mongo.Server( config.db.host,config.db.port,{auto_reconnect:true } )
               var db=new mongo.Db( config.db.dbname ,server,{safe:true});
               db.open( function (_err,db)
               {
                   if(!_err)
                   {
                       db.collection(config.db.table.file, function (err,collection){
                           collection.find({},{_id:0,title:1,
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
                                    res.render( 'filelist' , 
                                        {user_dataset:JSON.stringify(action_dataset)  , 
                                        user_column:JSON.stringify( action_columns )   ,
                                            type:5,title:config.title || 'test' ,
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
router.post('/file/del/', function(req, res, next) {
    console.log( req.body )
    session=req.cookies.session
    redis.get( config.session.subprefix+session  , function( err , value )
    {
        if(!err)
        {
           if( value != null  && value != '')
           {
               if( ~~value >= 2 && ~~value !=3 )
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


router.get('/file/upload/', function(req, res, next) {
    session=req.cookies.session
    redis_async.get( config.session.sprefix+session ).then( function(r)
    {
       res.render('upload',{type:convert.str_2_array( r ) ,pname:'' }   )
    }
    )
} 
)

router.post('/file/upload/', function(req, res, next) {
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
                var host = config.db.host
                var port = config.db.port
                var server=new mongo.Server(host,port,{auto_reconnect:true,connectTimeoutMS:500})
                var db=new mongo.Db( config.db.dbname ,server,{safe:true});
                db.open(
                        function (_err,db) 
                        {
                            if(_err)
                            {
                                fs.unlinkSync(f);
                                res.end(JSON.stringify( {"res":203} ));
                                db.close()
                                return 
                            }
                            db.collection(config.db.table.file , function(err , collection)
                                {
                                    if(err)
                                    {
                                        fs.unlinkSync(f);
                                        res.status(500).json({ error: 'message' })
                                        db.close()
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
                                    redis.get( config.session.prefix+session  , function( err , value )
                                        {
                                            if( !err && value!=null )
                                            {
                                                o.userid=value
                                                collection.insert( o)
                                                res.writeHead(200, {"Content-Type": "application/json"}); 
                                                res.end(JSON.stringify( {"res":200} ));
                                            }
                                            else
                                            {
                                                fs.unlinkSync(f);
                                                res.writeHead(200, {"Content-Type": "application/json"}); 
                                                res.end(JSON.stringify( {"res":202} ));
                                                db.close()
                                                return 
                                            }
                                        }
                                    )
                                }							
                            )
                        }
                    )//end open
            }
            )
        }
    )
    }
)
*/
router.get( '/quit', function(req, res, next) {
    session=req.cookies.session
    console.log(session )
    if( typeof( session ) != 'undefined' )
    {
        redis.del( config.session.prefix+session  )
        redis.del( config.session.subprefix+session  )
        redis.del( config.session.sprefix+session  )
        
    }
    res.clearCookie('session');
    res.redirect( '/login' )
})
module.exports = router;
