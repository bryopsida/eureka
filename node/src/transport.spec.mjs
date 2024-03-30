import { fail, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { EurekaServer } from './transport.mjs'

describe('EurekaServer', () => {
  it('should notify listeners when data from peer is received', async () => {
    const identityFunc = (i) => Promise.resolve(i)
    const testMsg = 'Hello other eureka thing!'
    const notCryptoCrypto = {
      encrypt: identityFunc,
      decrypt: identityFunc
    }
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
})
