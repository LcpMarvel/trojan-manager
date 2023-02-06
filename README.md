# Trojan Manager
在阿里云上自动创建一个抢占式服务器, 安装trojan, 一键完成.

## Why?

>**省 钱**

算个账单, 按照每天花1G流量计算, 几乎每个月30元. 其中流量费用在18元左右, 如果不是经常看视频, 一个月可以压缩到一个月20元.

如下表:

| 地区 | 1核2G 服务器费用/h | 带宽费用/GB | 使用时间 (小时)| 一天费用(元) | 30天总费用
| :---: |  :---:  |  :--:   |  :--: | :--:| :--:|
| 曼谷 | 0.036| 0.590 | 12| 1.02|30.6 |
| 日本| 0.038| 0.60 | 12|1.056| 31.68|


## Usage

```
Usage: trojan-manager up -r <regionId>


Commands:
  trojan-manager up            Create trojan
  trojan-manager start         Start the servers
  trojan-manager stop          Stop the servers, save momey
  trojan-manager down          Destroy trojan
  trojan-manager setup-trojan  set up trojan for a ubuntu server
  trojan-manager bind-host     add domain record
  trojan-manager list          List all regions

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## 准备工作
1. 在阿里云上有账号, 并且充值超过100, 最好能有150块
2. 在阿里云上创建一个用户
   1. 点击右上角的头像
   2. 点击访问控制
   3. 点击 用户 -> 创建用户
   4. 勾选 编程访问
   5. 添加3个权限 AliyunECSFullAccess, AliyunVPCFullAccess 和 AliyunDNSFullAccess
   6. 获取 AccessKeyID 和 AccessKeySecret
3. 在万网注册一个便宜的域名, 8元/年
4. 创建配置文件: `touch ${HOME}/.trojan-manager.json`
5. 安装 `npm install trojan-manager -g`
6. 查看地区 `trojan-manager list`
7. 选择你要的地区然后创建 `trojan-manager up -r ap-southeast-5`
8. 配置你的trojan客户端, 域名和密码在自己的配置文件中, 端口443
9. done

## 配置文件
```json
{
  // AccessKeyID (必填)
  "accessKeyId": "xxxxxxxxxx",
  // AccessKeySecret (必填)
  "accessKeySecret": "xxxxxxxxxx",
  // trojan的域名 (必填)
  "domain": "trojan.xxxxx.fun",
  // trojan的密码 (必填)
  "trojanPassword": "example123",
  // SSL 证书地址 (必填) 万网的域名可以生成免费的SSL, 下载nginx版本即可
  "sslCertPath": "/path/to/xxxx.pem",
  "sslKeyPath": "/path/to/xxxx.key",
  // 带宽大小
  "bandwidth": 100,               
  // 服务器的密码, 不填写系统会生成一个密码          
  "serverPassword": "Lcp8418326!",
}
```
