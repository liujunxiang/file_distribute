module.exports ={
    "title":"",
    "port":"81",
    "db":{
        "host":"127.0.0.1",
        "port":"27017",
		"dbname":"sys",
        "table":{
            "user":"user" , 
            "project":"project" , 
            "file":"file",
            "member":"member" , 
            "article":"article"
        }
    },
    "superuser":{
        "user":"admin",
        "passwd":"admin" 
    },
    "login":{
        "title":"xxx" , 
        "msg":"xxx"
    },
    "redis":{
        "host":"127.0.0.1",
        "port":6379
    },
    "session":{
        "prefix":"key_",
        "subprefix":"type_",
        "sprefix":"type_array_",
        "ttl":36000
    },
    "footer":{
        "copyright":"xxxx" , 
        "ad":"xxxxx"
    },
    "msg":{
        "success":{
            "res":200
        },
        "e201":{
            "res":201,
            "msg":"111111"
        },
        "e202":{
            "res":202,
            "msg":"22222"
        },
        "e203":{
            "res":203,
            "msg":"33333"
        },
    },
}
