
rm -rf /root/Downloads/sys_1/sql/project.json
/usr/local/mongodb/bin/mongoexport -d db -c project --port=30000  -o /root/Downloads/sys_1/sql/project.json

rm -rf /root/Downloads/sys_1/sql/user.json
/usr/local/mongodb/bin/mongoexport -d db -c user --port=30000  -o /root/Downloads/sys_1/sql/user.json

rm -rf /root/Downloads/sys_1/sql/file.json
/usr/local/mongodb/bin/mongoexport -d db -c file --port=30000  -o /root/Downloads/sys_1/sql/file.json

rm -rf /root/Downloads/sys_1/sql/article.json
/usr/local/mongodb/bin/mongoexport -d db -c article --port=30000  -o /root/Downloads/sys_1/sql/article.json

rm -rf /root/Downloads/sys_1/sql/material.json
/usr/local/mongodb/bin/mongoexport -d db -c material --port=30000  -o /root/Downloads/sys_1/sql/material.json


rm -rf /root/Downloads/sys_1/sql/file.tar.gz
tar -czvf /root/Downloads/sys_1/sql/file.tar.gz /root/Downloads/sys_1/public/resource/

rm -rf /root/Downloads/sys_1/sql/material.tar.gz
tar -czvf /root/Downloads/sys_1/sql/material.tar.gz /root/Downloads/sys_1/public/material/

