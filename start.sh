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

listen_port="81"
cnt=`netstat -antp | grep node | grep $listen_port  | grep -i listen | wc -l`
if [ $cnt -eq 0 ];then
	trace "启动一个新进程" 
	node ./bin/www &
	sleep 5
fi
while true
do
cnt=`netstat -antp | grep node | grep $listen_port  | grep -i listen | wc -l`
if [ $cnt -eq 0 ];then
	trace "启动一个新进程"
	node ./bin/www &
	sleep 5
else
	pid=`netstat -antp | grep node | grep $listen_port  | grep -i listen | awk '{print $7}' | sed 's/\/.*//g'`
	trace "服务[TCP端口号:"$listen_port"	pid:"$pid"]运行中...."	 
fi
sleep 50
done
