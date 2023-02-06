import Dns from '../../src/aliyun/dns'
import Settings from '../../src/settings'

describe('DNS', () => {
  let dns: Dns
  const host = '147.139.175.174'

  beforeEach(() => {
    dns = new Dns(new Settings())
  })

  it('can check the domain record', async () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const found = await dns['findDomainRecord']()

    expect(found?.value).toBe(host)
  }, 40000)

  it('can bind domian', async () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    await dns.bindDomian(host)

    // eslint-disable-next-line @typescript-eslint/dot-notation
    const found = await dns['findDomainRecord']()

    expect(found?.value).toBe(host)
  }, 40000)
})
