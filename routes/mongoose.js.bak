var mongodb=require('./mongo')

var openDB = function() {
    return new Promise(function(resolve, reject) {
        mongodb.open(function(err, db) {
            if (err) {
                mongodb.close();
                return reject(err);
            }
            resolve(db);
        });
    });
};

var collection = function(tablename) {
    return new Promise(function(resolve, reject) {
        mongodb.collection(tablename, function(err, c) {
            if (err) {
                mongodb.close();
                return reject(err);
            }
            resolve(c);
        });
    });
};

var find=function( collection ,cond ,exclude , sortcond , limit ) {
    var sort_cond =new Object()
    if ( typeof(sortcond)  != 'undefined')
    {
        sort_cond=sortcond
    }
    var limit_cond =0
    if ( typeof(limit)  != 'undefined')
    {
        limit_cond=limit
    }
    return new Promise(function(resolve, reject) {
        collection.find(cond,exclude).sort(sort_cond).limit( limit_cond ).toArray( function(err, docs) {
            if (err) {
                mongodb.close();
                return reject(err);
            }
            resolve(docs);
        });
    });
};

var insertData = function(collection ,data ) {
    return new Promise(function(resolve, reject) {
        collection.insert(data, {safe: true}, function(err) {
            mongodb.close();
            if (err) {
                return reject(err);
            }
            resolve(null);
        });
    });
};


var updateData = function(collection ,condtion ,setval) {
    return new Promise(function(resolve, reject) {
        collection.update(condtion,{$set:setval }, function(err) {
            mongodb.close();
            if (err) {
                return reject(err);
            }
            resolve(null);
        });
    });
};


var removeData = function(collection ,data ) {
    return new Promise(function(resolve, reject) {
        collection.remove(data, {safe: true}, function(err) {
            mongodb.close();
            if (err) {
                return reject(err);
            }
            resolve(null);
        });
    });
};

var close=function()
{
    mongodb.close()
}





module.exports=
{
    open:openDB , 
    collection:collection,
    select:find,
    close:close , 
    insert:insertData ,
    remove:removeData ,
    update:updateData 
}

/* sample
async function select_data( table ,cond)
{
    await openDB()
    let c=await  collection(table)
    let data=await  find( c ,cond )
    console.log( data )
    mongodb.close()
    return data
}*/
/*
var data=select_data('user' , {"userid":"a"} )
console.log("11111111111111111")
console.log( data )
*/
/*
(async function () {
    await openDB()
    let c=await  collection('user')
    let data=await  find( c ,{"userid":"a"} )
    console.log(data );
    mongodb.close()
})();
*/