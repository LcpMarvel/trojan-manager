import crypto from 'crypto'
import { Client, type ConnectConfig } from 'ssh2'
import { Client as SShClient, type ScpClient, type TScpOptions } from 'node-scp'
import { writeFileSync } from 'fs'

export async function sleep (ms = 5000): Promise<void> { await new Promise(resolve => setTimeout(resolve, ms)) }

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
  let error: any

  for (let i = 0; i < 10; i++) {
    try {
      return await _ssh(connectConfig)
    } catch (err) {
      console.error(err)
      console.log('5s后 重试')

      await sleep(5000)
      error = err
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

      stream.on('close', (code: string) => {
        console.log(`${cmd} 执行完毕!`)
        resolve(code)
      }).on('data', (data: string) => {
        console.log('OUTPUT: ' + data)
      })
      stream.end('ls -l\nexit\n')
    })
  })
}

export async function sshUploader (config: TScpOptions): Promise<ScpClient> {
  let error: any

  for (let i = 0; i < 5; i++) {
    try {
      return await SShClient({
        ...config,
        username: 'root'
      })
    } catch (err) {
      console.error(err)
      console.log('5s后 重试')

      await sleep(5000)
      error = err
    }
  }

  throw error
}

export async function uploadFileByContent (uploader: ScpClient, content: string): Promise<void> {
  const path = '/tmp/installer.sh'
  writeFileSync(path, content)

  await uploader.uploadFile(path, '/root/installer.sh')
}
