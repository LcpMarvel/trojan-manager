import os from 'os'
import fs from 'fs'
import Settings from '../src/settings'

describe('Settings', () => {
  beforeEach(() => {
    jest.spyOn(os, 'homedir').mockReturnValue(`${process.cwd()}/tests/fixtures`)
  })

  it('should read the file from home directory', () => {
    const settings = new Settings()

    expect(settings.accessKeyId).toStrictEqual('ACCESS_KEY_ID')
    expect(settings.accessKeySecret).toStrictEqual('ACCESS_KEY_SECRET')
  })

  it('should give error message if setting file does not exist', () => {
    jest.spyOn(os, 'homedir').mockReturnValue(`${process.cwd()}/tests`)

    const spy = jest.spyOn(console, 'log').mockImplementation()

    try {
      // eslint-disable-next-line no-new
      new Settings()
    } catch (e) {}

    expect(spy).toHaveBeenCalledWith('请在家目录下创建 .trojan-manager.json 文件!')
  })

  it('should give error message if settings file does not valid', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('abc')

    const spy = jest.spyOn(console, 'log').mockImplementation()

    try {
      // eslint-disable-next-line no-new
      new Settings()
    } catch (e) {}

    expect(spy).toHaveBeenCalledWith('配置文件格式不正确!')
  })

  it('should give error message if key does not exist', () => {
    const mockValue = JSON.stringify({
      accessKeyId: 'ACCESS_KEY_ID'
    })

    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockValue)
    const spy = jest.spyOn(console, 'log').mockImplementation()

    const settings = new Settings()
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      settings.accessKeySecret
    } catch (e) {}

    expect(spy).toHaveBeenCalledWith('accessKeySecret 必须在 .trojan-manager.json 中!')
  })
})
