import { fail, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { EurekaServer } from './transport.mjs'
import { randomBytes } from 'node:crypto'

describe('EurekaServer', () => {
  const notCryptoCrypto = {
    encrypt: (plainText) => Promise.resolve(Buffer.from(plainText)),
    decrypt: (buffer) => Promise.resolve(buffer.toString('utf8')),
    getAlgorithm: () => 'chacha20-poly1305',
    getKeyId: () => 0,
    sign: () => Buffer.from(randomBytes(32)),
    verify: () => true
  }

  it('should notify listeners when data from peer is received', async () => {
    const testMsg = 'Hello other eureka thing!'
    const errors = []
    const instance1 = new EurekaServer({
      crypto: notCryptoCrypto
    }).on('ready', () => {
      console.log('instance1 ready')
    }).on('error', (err) => errors.push(err))
    const instance2 = new EurekaServer({
      crypto: notCryptoCrypto
    }).on('ready', () => {
      console.log('instance2 ready')
    }).on('error', (err) => errors.push(err))
    try {
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(reject, 10000)
        instance2.on('message', (data) => {
          clearTimeout(timeout)
          resolve(data)
        })
        setTimeout(() => {
          instance1.sendMessage(testMsg)
        }, 1000)
      })
      ok(errors.length === 0)
      ok(result.toString('utf8') === testMsg)
    } catch (err) {
      fail(err)
    } finally {
      instance1.closeServer()
      instance2.closeServer()
    }
  })
  it('should handle large messages', async () => {
    const testMsg = randomBytes(1024 * 1024).toString('utf8')
    const errors = []
    const instance1 = new EurekaServer({
      crypto: notCryptoCrypto,
      server: {
        port: 12345
      }
    }).on('ready', () => {
      console.log('instance1 ready')
    }).on('error', (err) => errors.push(err))
    const instance2 = new EurekaServer({
      crypto: notCryptoCrypto,
      server: {
        port: 12345
      }
    }).on('ready', () => {
      console.log('instance2 ready')
    }).on('error', (err) => errors.push(err))
    try {
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(reject, 60000)
        instance2.on('message', (data) => {
          clearTimeout(timeout)
          resolve(data)
        })
        setTimeout(() => {
          instance1.sendMessage(testMsg)
        }, 1000)
      })
      ok(errors.length === 0)
      ok(result.toString('utf8') === testMsg)
    } catch (err) {
      fail(err)
    } finally {
      instance1.closeServer()
      instance2.closeServer()
    }
  })
})
