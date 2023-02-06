import Alidns20150109, { type DescribeSubDomainRecordsResponseBodyDomainRecordsRecord } from '@alicloud/alidns20150109'
import { Config } from '@alicloud/openapi-client'
import type Settings from '../settings'

export default class Dns {
  private readonly client: Alidns20150109

  constructor (private readonly settings: Settings) {
    const config = new Config({
      accessKeyId: this.settings.accessKeyId,
      accessKeySecret: this.settings.accessKeySecret
    })

    this.client = new Alidns20150109(
      config
    )
  }

  async bindDomian (host: string): Promise<void> {
    console.log(`将 ${this.settings.domain} 绑定到 ${host}上`)

    const record = await this.findDomainRecord()

    if (record !== undefined) {
      if (record.RR === 'trojan' && record.value === host) {
        return
      }

      await this.updateDomainRecord(host, record.recordId ?? '')
    } else {
      await this.addDomainRecord(host)
    }
  }

  private async findDomainRecord (): Promise<DescribeSubDomainRecordsResponseBodyDomainRecordsRecord | undefined> {
    return await this.client.describeSubDomainRecords({
      subDomain: this.settings.domain,
      toMap () {
        return {}
      }
    }).then((res) => {
      if (Array.isArray(res.body.domainRecords?.record)) {
        return res.body.domainRecords?.record[0]
      }
    })
  }

  private async addDomainRecord (value: string): Promise<void> {
    await this.client.addDomainRecord({
      ...this.domainRecord(value),
      toMap () {
        return {}
      }
    })
  }

  private async updateDomainRecord (value: string, recordId: string): Promise<void> {
    await this.client.updateDomainRecord({
      ...this.domainRecord(value),
      recordId,
      toMap () {
        return {}
      }
    })
  }

  private domainRecord (value: string): Record<string, string | number> {
    return {
      value,
      domainName: this.getDomain(this.settings.domain),
      RR: 'trojan',
      type: 'A',
      TTL: 600,
      priority: 1
    }
  }

  private getDomain (host: string): string {
    return host.replace(/^[^.]+\./g, '')
  }
}
