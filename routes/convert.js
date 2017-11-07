var mongoose=require('./mongoose')
var config = require( '../config/config')
var redis_async=require('./redis_async')
var md = require('markdown-js');
function str_2_array ( str )
{
    var arr = new Array()
    for( var i=0 ; i < str.length ;i++)
    {
        arr.push(~~str.charAt(i))
    }
    return arr
}

function array_2_str (arr)
{
    var str='';
    for( var i=0 ; i < arr.length ;i++)
    {
        str+= ''+arr[i]
    }
    return str 
} 
    
    
async function get_user_info( u ,p) 
{
    //console.log( p )
    var res=new Object()
    await mongoose.open()
    let collection_user=await  mongoose.collection(config.db.table.user)
    var user_list=null 
    if( typeof( p) == 'undefined')
    {
         user_list = await  mongoose.select( collection_user,{userid:u })
    }
    else{
         user_list = await  mongoose.select( collection_user,{userid:u,passwd:p })
    }
    //console.log( user_list)
    if(user_list == null  )
    {
        mongoose.close()
        return 
    }
    if( user_list.length != 1)
    {
        console.log( ("user["+u+"],passwd["+p+"] authentic failed" ).red)
        mongoose.close()
        return
    }
   // if( typeof(user_list ))
   // console.log( res )
    res.ulist=user_list[0] 
    let collection_project=await  mongoose.collection(config.db.table.project)
    var detail=new Array()
    let allmembers=await  mongoose.select(collection_project ,{} )
   // console.log(allmembers )
    var u_p=new Array()
    allmembers.forEach(function(val,index,arr){
        var _m=val.members
        _m.forEach(function(val1,index1,arr1){
            if(val1.userid==u )
            {
               u_p.push( {title:val.title , type:val1.type }) 
            }
        }
        )
    })
    res.u_p_rel=u_p
    mongoose.close()
    return res
}

async function get_article_list(  )
{
    await mongoose.open()
    let collection_article=await  mongoose.collection(config.db.table.article)
    let article_list = await mongoose.select(collection_article , {} , {}  , {date:-1} , 10  )
    var arr=[]
    for( var a=0;a< article_list.length;a++)
    {
        var obj=new Object()   
        fileContent=article_list[a].content
        //filehtml =markdown.toHTML(fileContent);
        filehtml=md.makeHtml(fileContent)
        obj.content=filehtml
        obj.title=article_list[a].title
        obj.date=article_list[a].date
        obj.id=article_list[a]._id
        arr.push( obj )
    }
    mongoose.close()
    return arr
}

async function get_user_list( session , excluded)
{
    var exclude=new Object()  
    if( typeof(excluded)  != 'undefined')
    {
        exclude.type=0
    }
    console.log( exclude )
    await mongoose.open()
    let collection_user=await  mongoose.collection(config.db.table.user)
    let docs = await mongoose.select(collection_user,exclude,{_id:0,userid:1} )
    var userlist=new Array()
    for( var i =0 ; i < docs.length ;i++ )
    {
       userlist.push( docs[i].userid)
    }
    mongoose.close()
    let type= await  redis_async.getValue( config.session.sprefix+session)
    var obj=new Object()
    obj.type=type
    obj.userlist=userlist
    return obj
}

async function get_project_list( session )
{
    var obj=new Object()
    let type= await  redis_async.getValue( config.session.sprefix+session)
    arr=str_2_array(type)
    obj.type=arr
    if( arr[0] ==1 || arr[1] ==1 )
    {
        await mongoose.open()
        let collection_user=await  mongoose.collection(config.db.table.project)
        let docs = await mongoose.select(collection_user,{},{_id:1,title:1,type_p:1,type_s:1} )
        obj.project=docs
        obj.issuper=true
        mongoose.close()
    }
    else
    {
        await mongoose.open()
        let collection_user=await  mongoose.collection(config.db.table.project)
        obj.issuper=false
        let userid= await  redis_async.getValue( config.session.prefix+session)
        let docs = await mongoose.select(collection_user,{},{_id:1,title:1,type_p:1,type_s:1,members:1} )
        var res=docs
        docs.forEach(function(val,index,arr){
            bFound=false
            val.members.forEach(function(val1,index1,arr1){
                if( val1.userid == userid)
                {
                    bFound=true
                }
            }
            )
            if( bFound==false )
            {
                res.splice(index,1);
            }
        })
        obj.project=docs
        mongoose.close()
    }
    let _user=await  redis_async.getValue( config.session.prefix+session)
    obj.userid=_user
    return obj
}

async function get_my_project_bysession( session ) 
{
    let u= await  redis_async.getValue( config.session.prefix+session)
    console.log(config.session.prefix+session + '==>' +u  )
    if( u == null)
    {
        return 
    }
    var res=new Object()
    res.user=u
    await mongoose.open()
    let collection_user=await  mongoose.collection(config.db.table.user)
    let user_list = await  mongoose.select( collection_user,{userid:u })
    if(user_list.length != 1 )
    {
        mongoose.close()
        console.log(222222)
        return 
    }
    res.ulist=user_list[0] 
    let collection_project=await  mongoose.collection(config.db.table.project)
    var detail=new Array()
    let allmembers=await  mongoose.select(collection_project ,{} )
    var u_p=new Array()
    allmembers.forEach(function(val,index,arr){
        var _m=val.members
        _m.forEach(function(val1,index1,arr1){
            if(val1.userid==u )
            {
               u_p.push( {title:val.title , type:val1.type }) 
               if(val1.type == 2 )
               {
                   res.main_title=val.title
               }
            }
        }
        )
    })
    res.u_p_rel=u_p
    let s_type= await  redis_async.getValue( config.session.sprefix+session)
    res.type=s_type
    mongoose.close()
    return res
}


async function get_file_list( session , level  ,excludes )
{
    //console.log( session )
    //console.log( level )
    //level 1-3 4 5
    var exclude={_id:0,title:1,filename:1,encode_filename:1,userid:1,date:1}
    if( typeof(excludes ) != 'undefined')
    {
        exclude = excludes
    }
    let type= await  redis_async.getValue( config.session.sprefix+session)
    let user= await  redis_async.getValue( config.session.prefix+session)
    await mongoose.open()
    let c_f=await  mongoose.collection(config.db.table.project)
    let allmembers=await  mongoose.select(c_f)
    var condition=new Object()
    switch( level)
    {
        case 1:
        condition.type=0
        condition.status=1
        break;
        case 2:
        var title_array=new Array()
        allmembers.forEach(function(val,index,arr){
            var _m=val.members
            _m.forEach(function(val1,index1,arr1){
                if(val1.userid == user )
                {
                    title_array.push( val.title)
                }
        })})
        condition.type=1
        condition.project={$in : title_array }
        condition.status=1
        break;
        case 3://保密
        var title_array=new Array()
        allmembers.forEach(function(val,index,arr){
            var _m=val.members
            _m.forEach(function(val1,index1,arr1){
                if(val1.userid == user && ( val1.type== 2 || val1.type== 3 ))
                {
                    title_array.push( val.title)
                }
        })})
        condition.project={$in : title_array }
        condition.status=1
        condition.type=2
        break;
        case 4:
        condition.status=0
        break;
        case 5:
        type_arr=str_2_array(type)
        if(type_arr.length != 0 )
        {
            if( type_arr[3] == 1  )//项目秘书
            {
                allmembers.forEach(function(val,index,arr){
                    var _m=val.members
                    _m.forEach(function(val1,index1,arr1){
                        if(val1.userid == user && val1.type == 2 )
                        {
                            condition.project=val.title
                        }
                })})
            }
        }
        break;
        default:
        mongoose.close()
        return 
    }
   // console.log( JSON.stringify(condition))
    
    let c_file=await  mongoose.collection(config.db.table.file)
    let data=await  mongoose.select(c_file ,condition , exclude )
    mongoose.close()
    //console.log(data )
   // console.log(111)
   // console.log(data)
   // console.log(222)
    var res=new Object()
    res.data = data
    //console.log(222)
    if( typeof(session) == 'undefined')
    {
        res.type =[0,0,0,0,0]
    }
    else
    {
        res.type = str_2_array(type)
    }
    res.user = user
    return res
}

async function get_my_main_project( session ) 
{
    var d=new Object()
    let type= await  redis_async.getValue( config.session.sprefix+session )
    let user= await  redis_async.getValue( config.session.prefix+session )
    d.type=str_2_array( type )
    d.user=user
    console.log(d.type )
    if (d.type[0] !=1 && d.type[1] !=1)
    {
        console.log( 11)
        await mongoose.open()
        console.log( 22)
        let c_f=await  mongoose.collection(config.db.table.project)
        let data=await  mongoose.select(c_f ,{type_s: user } ,{_id:0 ,title:1} )
        if( data.length < 1)
        {
            mongoose.close()
            return 
        }
        d.project=data[0].title
        mongoose.close()
    }
    return d 
}

async function insert_file( data ) 
{
    await mongoose.open()
    let c_f=await  mongoose.collection(config.db.table.file)
    await  mongoose.insert(c_f ,data)
    mongoose.close()
    return 'OK'
}

module.exports={
    get_user_info:get_user_info,
    get_article_list:get_article_list,
    get_my_project:get_my_project_bysession,
    get_user_list:get_user_list,
    get_project_list:get_project_list,
    get_file_list:get_file_list,
    get_my_main_project:get_my_main_project,
    insert_file:insert_file,
    array_2_str:array_2_str , 
    str_2_array:str_2_array
}
