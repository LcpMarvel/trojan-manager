sudo bash -c "$(wget -O- https://raw.githubusercontent.com/trojan-gfw/trojan-quickstart/master/trojan-quickstart.sh)"

CONFIGPATH=/usr/local/etc/trojan

mv ${CONFIGPATH}/config.json ${CONFIGPATH}/config.json.bk
touch ${CONFIGPATH}/config.json
cat << EOF >> ${CONFIGPATH}/config.json
{{ trojanConfig }}
EOF

adduser --disabled-password --gecos "" trojan
adduser trojan sudo

mkdir /home/trojan/ssl
mv /root/{{ sslKeyName }} /home/trojan/ssl/
mv /root/{{ sslCertName }} /home/trojan/ssl/
chown trojan:trojan ${CONFIGPATH}/config.json
chown -R trojan:trojan /home/trojan/ssl

systemctl enable trojan
systemctl start trojan
