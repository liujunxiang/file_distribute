module.exports ={
    "title":"",
    "port":"80",
    "sport":444,
    "lock":180,
    "max_upload_size":5000*1024*1024,
    "public_check":true,
    "db":{
        "host":"127.0.0.1",
        "port":"30000",
		"dbname":"db",
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
        "title":"国家重点研发计划项目" , 
        "msg":"国家重点研发计划项目"
    },
    "redis":{
        "host":"127.0.0.1",
        "port":7000
    },
    "session":{
        "prefix":"key_",
        "subprefix":"type_",
        "sprefix":"type_array_",
        "ttl":36000
    },
    "footer":{
        "copyright":"©1996-2016 方太集团 | 浙ICP备05083555号-1" , 
        "ad":"*不跑烟：在方太实验室规定条件下测试，肉眼未见明显的油烟逃逸。\
*还能去果蔬农残：指能有效去除果蔬表面的氧化乐果、乐果等农药残留"
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
