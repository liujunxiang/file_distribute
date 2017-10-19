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
var Promise = require('bluebird');
var mongoose=require('./mongoose')
var redis_async=require('./redis_async')
var convert=require('./convert')
router.get('/create/', function(req, res, next) {
    convert.get_user_list(req.cookies.session,true ).then( function(r)
    {
        if( typeof(r)=='undefined' )
        {
            res.redirect('/')
            return 
        }
        res.render('projectcreate' , { type:r.type ,userlist:r.userlist ,pname :''})
    })
} 
)
    
    
router.post('/create/', function(req, res, next) {
    data=req.body;
    session=req.cookies.session;
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
(
    async function () {
    let curent_userid =await  redis_async.get( config.session.prefix+session )
    let curent_usertype=await  redis_async.get( config.session.subprefix+session )
    if(~~curent_usertype < 4 ){ return }
    await mongoose.open()
    let collection_project=await  mongoose.collection(config.db.table.project)
    var record = new Object()
    record.title=data.userid
    record.descp=data.passwd
    record.type_p=data.type_p
    record.type_s=data.type_s
    record.date=sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    record.members=new Array()
    record.members.push( {userid:record.type_p ,type:3})
    record.members.push( {userid:record.type_s ,type:2})
    await  mongoose.insert( collection_project ,record )
    mongoose.close()
    return 
})()
.then( function( r ){
        res.end('111')
    }
)
}
)


//
router.get('/list/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    convert.get_project_list( session ).then( function(r)
    {
        if( typeof(r) == 'undefined' )
        {
            res.redirect('/')
            return
        }
        console.log( JSON.stringify(r).green)
        var docs = r.project
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
        res.render( 'projectlist' , 
            {user_dataset:JSON.stringify(action_dataset)  , 
            user_column:JSON.stringify( action_columns )   ,
                type:r.type,
                title:config.title || 'test' ,
                session:session,
                pname:'',
            } 
        )
    }
    )
}
)


router.get('/listself/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    convert.get_project_list( session ).then( function(r)
    {
        if( typeof(r) == 'undefined' )
        {
            res.redirect('/')
            return
        }
        console.log( JSON.stringify(r).green)
        var docs = r.project
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
        res.render( 'projectlistself' , 
            {user_dataset:JSON.stringify(action_dataset)  , 
            user_column:JSON.stringify( action_columns )   ,
                type:r.type,
                title:config.title || 'test' ,
                session:session,
                pname:'',
                user:r.userid
            } 
        )
    }
    )
}
)

//
router.post('/del/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
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
                            db.collection(config.db.table.project, function (err,collection){
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


router.get('/detail/:id/', function(req, res, next) {
    session=req.cookies.session
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
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
                       db.collection(config.db.table.project, function (err,collection){
                       collection.find({_id:mongo.ObjectId( req.params.id)}).toArray(function(err,docs)
                           {
                               if(docs.length==1 )
                               {
                                   res.render('project_template.ejs' , {
                                       title:config.title || 'test'  , 
                                       copyright:config.footer.copyright ,
                                       project_title:docs[0].title , 
                                       project_descp_content:docs[0].descp ,
                                       type:convert.str_2_array( value ),
                                       pname :''
                                   })
                               }
                           }
                        )
                       }
                       ) 
               }//end db open 
               }
               )//end db.open( function (_err,db)
           }//end if( value != null  && value != '')
        }
    }
    )
}
)


router.get('/member/add', function(req, res, next) {
    session=req.cookies.session;
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    (
    async function () {
    let curent_userid =await  redis_async.get( config.session.prefix+session )
    let curent_usertype=await  redis_async.get( config.session.sprefix+session )
    type_array= convert.str_2_array(curent_usertype )
    //console.log( type_array )
    if(type_array[3] != 1 ){ 
    console.log( "type error".red )
    return }
    await mongoose.open()
    let collection_project=await  mongoose.collection(config.db.table.project)
    //取得当前登录用户所对应的项目的项目经理,秘书
    let data_temp=await  mongoose.select( collection_project ,{"type_s": curent_userid} ,{_id:0,type_s:1,type_p:1,members:1,title:1} ,{} ,1 )
    var user_mask=new Array()
    for( var i =0 ;i < data_temp.length ;i++)
    { 
        user_mask.push( data_temp[i].type_p )
        user_mask.push( data_temp[i].type_s )
        var members=data_temp[i].members
        for( var j=0 ; j <members.length ;j++ )
        {
            user_mask.push( members[j].userid )
        }
    }
    if( data_temp.length != 1 )
    {
        console.log('不允许一个秘书对应多个项目')
        return 
    }
    
    //切换到user表
    let collection_user=await  mongoose.collection(config.db.table.user)
    var cond=new Object()
    cond.userid={$nin:user_mask}
    cond.type=0
    let data=await  mongoose.select( collection_user , cond ,{_id:0,userid:1})
    mongoose.close()
    
    var result=new Object()
    result.curent_userid=curent_userid
    result.curent_usertype=curent_usertype
    result.data=data
    result.type=type_array
    result.t=data_temp[0].title
    return result
})().then( function( r )
    {
        //console.log( r.data)
        var userlist=new Array()
        console.log(r )
        if(typeof(r) != 'undefined'){
            for( var i=0 ;i < r.data.length ;i++)
            {
                userlist.push( r.data[i].userid)
            }
            console.log(userlist )
            res.render('projectmemberadd' , { type:r.type,userlist:userlist,pname:''}) 
        }
        else{ 
            
            res.redirect('/home')
        }  
    }
)
})

router.post('/member/create', function(req, res, next) {
    session=req.cookies.session;
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    (
        async function () {
        let curent_userid =await  redis_async.get( config.session.prefix+session )
        let curent_usertype=await  redis_async.get( config.session.sprefix+session )
        type_array= convert.str_2_array(curent_usertype )
        if(type_array[3] != 1 ){ 
        console.log( "type error".red )
        return }
        console.log(curent_userid )
        await mongoose.open()
        let collection_project=await  mongoose.collection(config.db.table.project)
        let data_temp=await  mongoose.select( collection_project ,{"type_s": curent_userid} ,{_id:0 ,members:1})
        if(data_temp.length != 1 )
        {
            return 
        }
        if(data_temp[0].members.length <2  )
        {
            return 
        }
        data_temp[0].members.push( {userid:req.body.userid ,type:1}  )
        //console.log( JSON.stringify (data_temp ) )
        await  mongoose.update( collection_project ,
        {"type_s": curent_userid},
            {members:data_temp[0].members }
        )
        mongoose.close()
        return 
})().then( function( r )
    {
        res.end('111')
    }
)
   
})


router.get('/member/list', function(req, res, next) {
    session=req.cookies.session;
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    (
        async function () {
        let curent_userid =await  redis_async.get( config.session.prefix+session )
        let curent_usertype=await  redis_async.get( config.session.sprefix+session )
        type_array= convert.str_2_array(curent_usertype )
        console.log( type_array )
        if(type_array[3] != 1 ){ 
        console.log( "type error".red )
        return }
        await mongoose.open()
        let collection_project=await  mongoose.collection(config.db.table.project)
        let data_temp=await  mongoose.select( collection_project ,{"type_s": curent_userid} ,{_id:0 ,members:1,title:1})
        if(data_temp.length != 1 )
        {
            return 
        }
        if(data_temp[0].members.length <2  )
        {
            return 
        }
        mongoose.close()
        var data=new Object()
        data.members=data_temp[0].members
        data.type=type_array
        data.t=data_temp[0].title
        return data
})().then( function( d )
    {
        var r=d.members
        var action_columns = new Array()	
        for( var i in r[0] )
        {
            var obj =new Object()
            obj.title = i 
            action_columns.push( obj )							
        }
        var action_dataset =  new Array() 
        for( var i = 0 ; i < r.length ;i++ )
        {
            b =  json_2_array( r[i] )
            action_dataset.push(b )
        }
        res.render( 'projectmemberlist' , 
        {user_dataset:JSON.stringify(action_dataset)  , 
        user_column:JSON.stringify( action_columns )   ,
        type:d.type,title:config.title || 'test' ,
        pname:''
        } 
        )
    }
    //d.t+'的'
)
})



router.post('/member/del/', function(req, res, next) {
    session=req.cookies.session;
    if( typeof(session ) == 'undefined')
    {
        res.redirect('/')
        return
    }
    (
        async function () {
        let curent_userid =await  redis_async.get( config.session.prefix+session )
        let curent_usertype=await  redis_async.get( config.session.sprefix+session )
        type_array= convert.str_2_array(curent_usertype )
        console.log( type_array )
        if(type_array[3] != 1 ){ 
        console.log( "type error".red )
        return }
        await mongoose.open()
        let collection_project=await  mongoose.collection(config.db.table.project)
        let data_temp=await  mongoose.select( collection_project ,{"type_s": curent_userid} ,{_id:0 ,members:1})
        if(data_temp.length != 1 )
        {
            return 
        }
        if(data_temp[0].members.length <2  )
        {
            return 
        }
        
        var array=data_temp[0].members
        for( var i =0 ;i < array.length;i++)
        {
            if( array[i].userid == req.body.userid)
            {
                array.splice(i ,1 )
            }
        }
        console.log( req.body.userid )
        console.log( JSON.stringify (array ) )
        await  mongoose.update( collection_project ,
        {"type_s": curent_userid},
            {members:array }
        )
        mongoose.close()
        return 
})().then( function( r )
    {
        res.end('111')
    }
)
   
})

module.exports = router;
