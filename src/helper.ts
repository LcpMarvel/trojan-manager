import crypto from 'crypto'
import { Client, type ConnectConfig } from 'ssh2'
import { type ScpClient } from 'node-scp'
import { writeFileSync } from 'fs'

const sleep = async (ms = 5000): Promise<void> => { await new Promise(resolve => setTimeout(resolve, ms)) }

export async function waitUtilReady (handler: () => Promise<boolean>): Promise<void> {
  await sleep()

  while (!await handler()) {
    await sleep()
  }
}

export function generatePassword (): string {
  const length = 20
  const wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@'

  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('')
}

export async function _ssh (connectConfig: ConnectConfig): Promise<Client> {
  return await new Promise((resolve, reject) => {
    const conn = new Client()

    conn
      .on('ready', () => {
        resolve(conn)
      })
      .on('error', error => {
        reject(error)
      })
      .connect(connectConfig)
  })
}

export async function ssh (connectConfig: ConnectConfig): Promise<Client> {
  let times = 0
  let error: any

  while (times < 10) {
    times += 1

    try {
      return await _ssh(connectConfig)
    } catch (err) {
      console.error(err)
      await sleep(5000)
      error = err

      console.log('reconnecting...')
    }
  }

  throw error
}

export async function sshExec (conn: Client, cmd: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    conn.exec(cmd, (error, stream) => {
      if (error !== undefined) {
        reject(error)
      }

      stream.pipe(process.stdout)
      stream.stderr.pipe(process.stderr)

      stream.on('close', (code: string) => {
        console.log(`${cmd} 执行完毕!`)
        resolve(code)

        conn.end()
      }).on('data', (data: string) => {
        console.log('OUTPUT: ' + data)
      })
      stream.end('ls -l\nexit\n')
    })
  })
}

export async function uploadFileByContent (uploader: ScpClient, content: string): Promise<void> {
  const path = '/tmp/installer.sh'
  writeFileSync(path, content)

  await uploader.uploadFile(path, '/root/installer.sh')
}
