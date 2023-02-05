cp /etc/apt/sources.list /etc/apt/sources.list.bakup

cat << EOF >> /etc/apt/sources.list
deb http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.cloud.aliyuncs.com/ubuntu/ bionic-backports main restricted universe multiverse
EOF

apt-get update

apt-get install trojan -y

mv /etc/trojan/config.json /etc/trojan/config.json.bk
touch /etc/trojan/config.json
cat << EOF >> /etc/trojan/config.json
{{ trojanConfig }}
EOF

# chown -R 644 /root/ssl

systemctl enable trojan
systemctl start trojan