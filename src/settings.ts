import { readFileSync } from 'fs'
import { homedir } from 'os'
import { generatePassword } from './helper'

interface Content {
  accessKeyId: string
  accessKeySecret: string
  domain: string
  trojanPassword: string
  sslCertPath: string
  sslKeyPath: string
  zoneId?: string
  bandwidth?: number
  serverPassword?: string
}

export default class Settings implements Content {
  get accessKeyId (): string {
    return this.fetchValue('accessKeyId')
  }

  get accessKeySecret (): string {
    return this.fetchValue('accessKeySecret')
  }

  get domain (): string {
    return this.fetchValue('domain')
  }

  get zoneId (): string | undefined {
    return this.content.zoneId
  }

  get bandwidth (): number {
    return this.content.bandwidth ?? 20
  }

  get serverPassword (): string {
    if (typeof this.content.serverPassword === 'string' && this.content.serverPassword.length > 0) {
      return this.content.serverPassword
    }

    const value = generatePassword()
    console.log(`密码: ${value}`)

    return value
  }

  get trojanPassword (): string {
    return this.fetchValue('trojanPassword')
  }

  get sslKeyPath (): string {
    return this.fetchValue('sslKeyPath')
  }

  get sslCertPath (): string {
    return this.fetchValue('sslCertPath')
  }

  readonly systemImageId = ''

  private readonly content: Content

  constructor () {
    this.content = this.readConfig()
  }

  private fetchValue (key: keyof Content): string {
    const value = this.content[key]

    if (typeof value === 'string' && value.length > 0) {
      return value
    }

    console.log(`${key} 必须在 .trojan-manager.json 中!`)

    throw new Error()
  }

  private readConfig (): Content | never {
    const path = `${homedir()}/.trojan-manager.json`

    let content: string

    try {
      content = readFileSync(path).toString()
    } catch (e) {
      console.log('请在家目录下创建 .trojan-manager.json 文件!')

      throw e
    }

    try {
      return this.parseJSON(content)
    } catch (e) {
      console.log('配置文件格式不正确!')

      throw e
    }
  }

  private parseJSON (text: string): Content | never {
    const json = JSON.parse(text)

    if (typeof json !== 'object') {
      throw new SyntaxError()
    }

    return json
  }
}
