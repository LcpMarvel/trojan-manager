import ECS, { type DescribeVSwitchesResponse, type DescribeRegionsResponseBodyRegionsRegion, type DescribeZonesResponseBodyZonesZone, type DescribeInstancesResponseBodyInstancesInstance, type RunInstancesRequest } from '@alicloud/ecs20140526'
import { Config } from '@alicloud/openapi-client'
import Client from 'node-scp'
import { basename } from 'path'
import { sprightly } from 'sprightly'
import { type ConnectConfig } from 'ssh2'
import { ssh, sshExec, uploadFileByContent, waitUtilReady } from './helper'
import type Settings from './settings'

interface NetworkConfig {
  vpcId: string
  securityGroupId: string
  vSwitchId: string
  zoneId: string
}

export default class Aliyun {
  constructor (private readonly settings: Settings) {
  }

  async listRegions (): Promise<void> {
    const regions = await this.fetchRegions()

    if (regions != null && regions !== undefined) {
      console.table(regions)
    }
  }

  async createInstance (regionId: string): Promise<void> {
    const client = await this.createClientByRegionId(regionId)

    const networkConfig = await this.createOrGetNetworkConfig(client, regionId)

    console.log('开始创建服务器')
    const password = this.settings.serverPassword

    const instanceTypes = await this.getInstanceType(client)
    if (instanceTypes.length === 0) {
      throw new Error('找不到便宜的机器了!')
    }

    const instanceId = await (async () => {
      const requestParams: RunInstancesRequest = {
        ...networkConfig,
        regionId,
        imageId: await this.getSystemImageId(client, regionId),
        internetMaxBandwidthOut: this.settings.bandwidth,
        internetChargeType: 'PayByTraffic',
        systemDisk: {
          size: '20',
          category: 'cloud_efficiency',
          toMap () {
            return {}
          }
        },
        spotStrategy: 'SpotAsPriceGo',
        password,
        toMap () {
          return {}
        }
      }

      for (const instanceType of instanceTypes) {
        requestParams.instanceType = instanceType

        try {
          const result = await client.runInstances(requestParams)

          return (result.body.instanceIdSets?.instanceIdSet ?? [])[0]
        } catch (error: any) {
          if (error.code !== 'InvalidResourceType.NotSupported') {
            throw error
          }
        }
      }
    })()

    console.log(`服务器创建完毕, ID: ${instanceId ?? ''}, 等待服务器启动...`)

    let instance: DescribeInstancesResponseBodyInstancesInstance | undefined

    await waitUtilReady(async () => {
      return await client.describeInstances({
        regionId,
        instanceIds: JSON.stringify([instanceId]),
        toMap () {
          return {}
        }
      }).then((res) => {
        const found = (res.body.instances?.instance ?? []).find((item) => {
          return item.status === 'Running'
        })

        instance = found

        return found !== undefined
      })
    })

    console.log('服务器创建成功!')

    await this.setupTrojan({
      host: (instance?.publicIpAddress?.ipAddress ?? [])[0],
      port: 22,
      username: 'root',
      password
    })
  }

  async setupTrojan (connectConfig: ConnectConfig): Promise<void> {
    const conn = await ssh(connectConfig)

    console.log('拷贝 installer.sh')

    const sslKeyPath = `/root/ssl/${basename(this.settings.sslKeyPath)}`
    const sslCertPath = `/root/ssl/${basename(this.settings.sslCertPath)}`

    const scripts = sprightly(`${process.cwd()}/templates/installer.sh`, {
      domain: this.settings.domain,
      email: 'test@gmail.com',
      trojanConfig: sprightly(`${process.cwd()}/templates/trojan.config.json`, {
        password: this.settings.trojanPassword,
        domain: this.settings.domain,
        sslKeyPath,
        sslCertPath
      })
    })

    const uploader = await Client({
      ...connectConfig,
      username: 'root'
    })

    await uploadFileByContent(uploader, scripts)
    await uploader.uploadFile(this.settings.sslCertPath, sslCertPath)
    await uploader.uploadFile(this.settings.sslKeyPath, sslKeyPath)
    uploader.close()

    console.log('执行脚本...')
    await sshExec(conn, 'nohup bash installer.sh > info.log > /dev/null 2>&1 &')

    console.log(`
      安装程序已经在服务器上运行,
      请将域名 ${this.settings.domain} 解析到 ${connectConfig.host ?? ''} 上,
      大约10分钟后, trojan 就绪!

      Address: ${this.settings.domain}
      Port: 443
      Password: ${this.settings.trojanPassword}
    `)
  }

  private async getSystemImageId (client: ECS, regionId: string): Promise<string> {
    const image = await client.describeImages({
      regionId,
      toMap () {
        return {}
      }
    }).then((res) => {
      return (res.body.images?.image ?? []).find((image) => {
        return image.platform === 'Ubuntu'
      })
    })

    if (image === undefined || image == null) {
      throw new Error('找不到系统盘镜像, 请试试其他地区!')
    }

    return image.imageId ?? ''
  }

  private async createOrGetNetworkConfig (client: ECS, regionId: string): Promise<NetworkConfig> {
    const res = await client.describeSecurityGroups({
      regionId,
      securityGroupName: 'trojanCreatedSecurityGroup',
      toMap () {
        return {}
      }
    })

    const result = res.body.securityGroups?.securityGroup

    if ((result != null) && (result !== undefined) && result.length === 0) {
      console.log('创建VPC和安全组')

      const vpcRequestResult = await client.createVpc({
        regionId,
        cidrBlock: '172.16.0.0/24',
        vpcName: 'trojanCreatedVpc',
        toMap () {
          return {}
        }
      })

      const vpcId = vpcRequestResult.body.vpcId
      if (vpcId != null) {
        console.log(`VPC已创建成功, id: ${vpcId}`)

        console.log('等待 VPC 就绪...')
        await waitUtilReady(async () => {
          return await client.describeVpcs({
            regionId,
            vpcId,
            toMap () {
              return {}
            }
          }).then((res) => {
            const found = (res.body.vpcs?.vpc ?? []).find((vpc) => {
              return vpc.status === 'Available'
            })

            return found !== undefined
          })
        })

        const securityGroupId = await this.createSecurityGroup(client, regionId, vpcId)
        const { vSwitchId, zoneId } = await this.createOrGetVSwitch(client, regionId, vpcId)

        return { vpcId, securityGroupId, vSwitchId, zoneId }
      } else {
        throw new Error('创建失败!')
      }
    } else {
      const { vpcId = '', securityGroupId = '' } = (result ?? [])[0]

      const { vSwitchId, zoneId } = await this.createOrGetVSwitch(client, regionId, vpcId)

      return { vpcId, securityGroupId, vSwitchId, zoneId }
    }
  }

  private async createOrGetVSwitch (client: ECS, regionId: string, vpcId: string): Promise<{
    vSwitchId: string
    zoneId: string
  }> {
    const zoneId = await this.getZoneId(client, regionId)

    const queryVSwitches = async (): Promise<DescribeVSwitchesResponse> => {
      return await client.describeVSwitches({
        regionId,
        vpcId,
        zoneId,
        toMap () {
          return {}
        }
      })
    }

    const result = await queryVSwitches()

    if ((result.body.totalCount ?? 0) !== 0) {
      const vSwitch = (result.body.vSwitches?.vSwitch ?? [])[0]

      return {
        vSwitchId: vSwitch.vSwitchId ?? '',
        zoneId: vSwitch.zoneId ?? ''
      }
    }

    console.log('开始创建VSwitch')

    const result2 = await client.createVSwitch({
      regionId,
      cidrBlock: '172.16.0.0/24',
      vpcId,
      zoneId,
      vSwitchName: 'trojanCreatedVSwitch',
      toMap () {
        return {}
      }
    })

    await waitUtilReady(async () => {
      return await queryVSwitches().then((res) => {
        const found = (res.body.vSwitches?.vSwitch ?? []).find((item) => {
          return item.status === 'Available'
        })

        return found !== undefined
      })
    })

    return {
      vSwitchId: result2.body.vSwitchId ?? '',
      zoneId
    }
  }

  private async createSecurityGroup (client: ECS, regionId: string, vpcId: string): Promise<string> {
    console.log('开始创建安全组')
    const result = await client.createSecurityGroup({
      regionId,
      vpcId,
      securityGroupName: 'trojanCreatedSecurityGroup',
      toMap () {
        return {}
      }
    })

    const securityGroupId = result.body.securityGroupId ?? ''

    const authorizeSecurityGroupParams = {
      regionId,
      securityGroupId,
      ipProtocol: 'tcp',
      sourceCidrIp: '0.0.0.0/0',
      toMap () {
        return {}
      }
    }
    const portRanges = [
      '22/22', '80/80', '443/443'
    ]

    console.log('为安全组添加端口')
    await Promise.all(
      portRanges.map(async (portRange) => {
        return await client.authorizeSecurityGroup({
          ...authorizeSecurityGroupParams,
          portRange
        })
      })
    )

    return securityGroupId
  }

  private async fetchZones (client: ECS, regionId: string): Promise<DescribeZonesResponseBodyZonesZone[]> {
    return await client.describeZones({
      regionId,
      toMap () {
        return {}
      }
    }).then((res) => {
      return res.body.zones?.zone ?? []
    })
  }

  private async getInstanceType (client: ECS): Promise<string[]> {
    return await client.describeInstanceTypes({
      cpuArchitecture: 'X86',
      maximumCpuCoreCount: 1,
      maximumMemorySize: 2,
      minimumMemorySize: 1,
      toMap () {
        return {}
      }
    }).then((res) => {
      return (res.body.instanceTypes?.instanceType ?? [])
        .filter((item) => {
          return typeof item.instanceTypeId === 'string' && item.instanceTypeId.length > 0
        })
        .map((item) => {
          return item.instanceTypeId as string
        })
    })
  }

  private createClient (endpoint = 'ecs.aliyuncs.com'): ECS {
    const config = new Config()
    config.accessKeyId = this.settings.accessKeyId
    config.accessKeySecret = this.settings.accessKeySecret
    config.endpoint = endpoint
    config.connectTimeout = 5000
    config.readTimeout = 5000

    return new ECS(config)
  }

  private async createClientByRegionId (regionId: string): Promise<ECS> {
    const regions = await this.fetchRegions()
    const region = regions.find((reg) => reg.regionId === regionId)

    if (region == null) {
      throw new Error('regionId not found')
    }

    return this.createClient(region.regionEndpoint)
  }

  private async fetchRegions (): Promise<DescribeRegionsResponseBodyRegionsRegion[]> {
    return await this.createClient().describeRegions({
      toMap () {
        return {}
      }
    }).then((res) => {
      return res.body.regions?.region ?? []
    })
  }

  private async getZoneId (client: ECS, regionId: string): Promise<string> {
    if (this.settings.zoneId !== undefined) {
      return this.settings.zoneId
    }

    const zones = await this.fetchZones(client, regionId)

    return zones[0].zoneId ?? ''
  }
}
