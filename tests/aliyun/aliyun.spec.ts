import Settings from '../../src/settings'
import Aliyun from '../../src/aliyun/aliyun'

describe('aliyun', () => {
  let aliyun: Aliyun

  beforeEach(() => {
    aliyun = new Aliyun(new Settings())
  })

  it('can list all regions', async () => {
    const spy = jest.spyOn(console, 'table').mockImplementation()

    await aliyun.listRegions()

    expect(spy).toHaveBeenCalled()
  }, 100000000)

  it('can create or get network config', async () => {
    const regionId = 'ap-southeast-5'

    // eslint-disable-next-line @typescript-eslint/dot-notation
    const client = await aliyun['createClientByRegionId'](regionId)
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const { vpcId, securityGroupId, vSwitchId } = await aliyun['createOrGetNetworkConfig'](client, regionId)

    await aliyun.startInstances('ap-southeast-5')
    expect(vpcId).toBeDefined()
    expect(securityGroupId).toBeDefined()
    expect(vSwitchId).toBeDefined()
  }, 100000)
})
