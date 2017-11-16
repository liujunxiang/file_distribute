#!/bin/sh
function trace
{
	str=$*"		"
	echo -e -n "\033[32m $str \033[0m"
	echo  -e "\033[42;30m [OK] \033[0m"
}

function failure
{
	str=$*"		"
	echo -e -n "\033[31m $str \033[0m"
	echo -e  "\033[41;30m [ERROR] \033[0m"
	exit 1
}

function warn 
{
	str=$*"		"
	echo -e -n "\033[33m $str \033[0m"
	echo -e  "\033[43;30m [warnning] \033[0m"
}
while true
do
echo "=============================================="

pid=` netstat -antp | grep 7000 | grep LISTEN | grep [0-9]/redis-server | awk '{print $NF}' | sed 's/\/.*//g'`
if [ -z "$pid" ];then
    warn  "服务[TCP端口号:7000	pid:"$pid"]停止...."
    service redisd start
else
    trace "服务[TCP端口号:7000	pid:"$pid"]运行中...."
fi


pid=` netstat -antp | grep 30000 | grep LISTEN | grep [0-9]/mongod | awk '{print $NF}' | sed 's/\/.*//g'`
if [ -z "$pid" ];then
    warn  "服务[TCP端口号:30000	pid:"$pid"]停止...."
    service mongod start
else
    trace "服务[TCP端口号:30000	pid:"$pid"]运行中...."
fi

pid=`netstat -antp | grep node | grep 80 | grep -i listen | awk '{print $7}' | sed 's/\/.*//g'`
if [ -z "$pid" ];then
    warn  "服务[TCP端口号:"$listen_port"	pid:"$pid"]停止...."
    service myweb start
else
    trace "服务[TCP端口号:"$listen_port"	pid:"$pid"]运行中...."	 
fi

sleep 30
exit 0
done
