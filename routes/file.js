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
    if( typeof(session) == 'undefined')
    {
        loggerer.error('session is none')
        res.redirect('/login')
        return 
    }
    
    ( async function(){
        let u= await  redis_async.getValue( config.session.prefix+session)
        loggerer.info( 'loggin user is ' + u)
        let string_type=await  redis_async.getValue( config.session.sprefix+session)
        loggerer.info( 'loggin type is ' + string_type)
        if( string_type == null || string_type == '')
        {
            loggerer.error( 'loggin type is null' )
            mongoose.close()
            return 
        }
        var project_list=null;
        await mongoose.open()
        var value=convert.str_2_array(string_type  )
        if( value[2] == 1 )
        {
            loggerer.info( ' master ')
            loggerer.info( ' switch  ' + config.db.table.project)
            let collection_user=await  mongoose.collection(config.db.table.project)
            let project_list_ = await  mongoose.select( collection_user,{type_p:u } , {_id:0,title:1})
            project_list=project_list_
            loggerer.info( 'project list is:' + JSON.stringify(project_list ))
        }
        var exclude={_id:0,title:1,filename:1,size:1,userid:1,status:1}
        loggerer.info( 'exclude  is:' + JSON.stringify(exclude))
        var cond=new Object()
        cond.status=0
        if(project_list != null )
        {
            
          //  loggerer.info( typeof(project_list) )
            var arr=new Array()
            for( var i=0; i < project_list.length ;i++)
            {
                arr.push( project_list[i].title )
            }
            if( config.public_check == true)
            {
                arr.push('公共课题')
            }
            cond.project={$in:arr}
        }
        loggerer.info( 'cond  is:' + JSON.stringify(cond))
        let collection_file=await  mongoose.collection(config.db.table.file)
        let file_list=await  mongoose.select( collection_file,cond , exclude)
        loggerer.info( 'file_list  is:' + JSON.stringify(file_list))
        
        
        var action_columns = new Array()
        for( var i in file_list[0] )
        {
            var obj =new Object()
            obj.title = i 
            action_columns.push( obj )							
        }
        var action_dataset =  new Array() 
        for( var i = 0 ; i < file_list.length ;i++ )
        {
            b =  json_2_array( file_list[i] )
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
        mongoose.close()
        return 
    })()
} 
)

//
router.post('/check/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        loggerer.error('session is none')
        res.redirect('/login')
        return 
    }
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
    loggerer.info( 'id=' +id +' session=' + session)
    convert.get_file_list( session , ~~id ).then(function(r)
    {
        if( typeof(r) == 'undefined')
        {
            res.redirect('/')
            return 
        }
       // console.log( JSON.stringify (r ) )
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
                                collection.find( cond ).toArray( function(err,docs)
                                {
                                    if(err)
                                    {
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.end(JSON.stringify( {res:201} ))
                                        return 
                                    }
                                    if(docs.length ==1)
                                    {
                                        var file_abs=__dirname+'/../public/'+docs[0].encode_filename
                                        var tmpdir=file_abs.substring( 0,file_abs.lastIndexOf('/')+1 )
                                        console.log(file_abs )
                                        console.log(tmpdir)
                                        if( fs.existsSync( file_abs ) == true )
                                        {
                                            console.log( 'rmfile ==>' + file_abs )
                                            fs.unlinkSync(file_abs) 
                                            console.log( 'rmdir ==>' + tmpdir )
                                            fs.rmdirSync(tmpdir )
                                        }
                                    }
                                    collection.remove( cond   )
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.end(JSON.stringify( config.msg.success ))
                                }
                                )
                                
                                
                                
                                
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
        res.redirect('/login')
        return 
    }
    convert.get_project_list(session).then( function( r) 
    {
        if( typeof(r) == 'undefined')
        {
            res.redirect('/login')
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
    var dir=node_uuid.v1().replace(/[-]/g , ""  ) 
    session=req.cookies.session
    if( typeof(session) == 'undefined')
    {
        loggerer.error( 'session is none')
        res.redirect('/login') 
        return 
    } 
    AVATAR_UPLOAD_FOLDER = '/resource/'
    dir='public' + AVATAR_UPLOAD_FOLDER+dir+'/'
    loggerer.info( 'dir='+dir)
    fs.mkdirSync(dir)
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = dir	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = config.max_upload_size;   //文件大小
    form.parse(req, function(err, fields, files) 
    {     
    var title = fields.title 
    var desc = fields.desc
    var type=fields.type
    
    
    var file_srcname = files.codecsv.name
    var f=dir+file_srcname
    fs.renameSync( files.codecsv.path , f)
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
        if( stat.size > config.max_upload_size )
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
                    res.redirect('/login')
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
                    loggerer.info( 'locate 1')
                    o.project=fields.project
                }
                else
                {
                    loggerer.info( 'locate 1')
                    o.project=r.project 
                }
                convert.insert_file( o).then(function(r)
                {
                   // console.log( ) 
                   loggerer.info('save file ==>' + JSON.stringify(o) )
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
