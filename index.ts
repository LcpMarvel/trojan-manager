#!/usr/bin/env node

import yargs from 'yargs'
import Aliyun from './src/aliyun/aliyun'
import Dns from './src/aliyun/dns'
import Settings from './src/settings'

const aliyun = new Aliyun(new Settings())

async function main (): Promise<void> {
  await yargs
    .scriptName('trojan-manager')
    .usage('\nUsage: trojan-manager up -r <regionId> \n')
    .command(
      'up',
      'Create trojan',
      (argv) => {
        return argv.option('r', { alias: 'regionId', type: 'string', demandOption: true })
      },
      async (argv) => {
        await aliyun.createInstance(argv.regionId as string)
      }
    )
    .command(
      'start',
      'Start the servers',
      (argv) => {
        return argv.option('r', { alias: 'regionId', type: 'string' })
      },
      async (argv) => {
        await aliyun.startInstances(argv.regionId as string)
      }
    )
    .command(
      'stop',
      'Stop the servers, save momey',
      (argv) => {
        return argv.option('r', { alias: 'regionId', type: 'string' })
      },
      async (argv) => {
        await aliyun.stopInstances(argv.regionId as string)
      }
    )
    .command(
      'down',
      'Destroy trojan',
      (argv) => {
        return argv.option('r', { alias: 'regionId', type: 'string' })
      },
      async (argv) => {
        await aliyun.destroyInstances(argv.regionId as string)
      }
    )
    .command(
      'setup-trojan',
      'set up trojan for a ubuntu server',
      (argv) => {
        return argv
          .option('h', { alias: 'host', type: 'string', demandOption: true })
          .option('p', { alias: 'password', type: 'string', demandOption: true })
      },
      async (argv) => {
        await aliyun.setupTrojan({
          host: argv.host as string,
          username: 'root',
          password: argv.password as string,
          port: 22
        })
      }
    )
    .command(
      'bind-host',
      'add domain record',
      (argv) => {
        return argv
          .option('h', { alias: 'host', type: 'string', demandOption: true })
      },
      async (argv) => {
        await new Dns(new Settings()).bindDomian(argv.host as string)
      }
    )
    .command(
      'list',
      'List all regions',
      () => {},
      async () => {
        await aliyun.listRegions()
      }
    )
    .demandCommand()
    .help(true)
    .argv
}

main().then(() => {}, () => {})
