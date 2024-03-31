import { ok, fail } from 'node:assert'
import { describe, it } from 'node:test'
import { Eureka } from './eureka.mjs'

function awaitReady (instance) {
  return new Promise((resolve, reject) => {
    // if it's already ready, immediately resolve
    if (instance.isReady()) return resolve()
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for ready'))
    }, 3500)
    instance.on('ready', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

async function awaitMessage (instance) {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for message'))
    }, 10000)
    instance.on('message', (msg) => {
      clearTimeout(timeout)
      resolve(msg)
    })
  })
}

async function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('Eureka', () => {
  it('should emit peer-data event when peer data is processed', async () => {
    const password = 'password'
    const salt = 'salt'
    const eureka1Data = {
      instance: 1
    }
    const eureka2Data = {
      instance: 2
    }

    const testMessage1 = {
      test: 1
    }

    const testMessage2 = {
      test: 2
    }

    const errors = []

    let eureka1 = null
    let eureka2 = null

    try {
      eureka1 = new Eureka({
        logger: console,
        crypto: {
          password,
          salt
        },
        messageData: eureka1Data,
        server: {
          port: 41515
        }
      }).on('error', (err) => errors.push(err))
        .on('ready', () => {
          console.log('eureka1 ready')
        })

      eureka2 = new Eureka({
        logger: console,
        crypto: {
          password,
          salt
        },
        messageData: eureka2Data,
        server: {
          port: 41515
        }
      }).on('error', (err) => errors.push(err))
        .on('ready', () => {
          console.log('eureka2 ready')
        })

      await Promise.all([
        awaitReady(eureka1),
        awaitReady(eureka2)
      ])
      // instances are ready, they shuld already be firing broadcasts
      // we want to verify two things, broadcast works, adhoc sends should work too
      // to avoid catching the first fire up broadcasts lets give it 2 seconds
      await sleep(2000)

      // lets verify instance2 gets a message from instance1 adhoc
      const result1Prom = awaitMessage(eureka2)
      await eureka1.sendMessage(testMessage1)
      const result1 = await result1Prom
      ok(result1.test === 1)

      // give it a moment to settle
      await sleep(2000)

      // lets verify instance1 gets a message from instance2 adhoc
      const result2Prom = awaitMessage(eureka1)
      await eureka2.sendMessage(testMessage2)
      const result2 = await result2Prom
      ok(result2.test === 2)

      // give it a moment to settle
      await sleep(2000)

      // lets verify instance1 gets broadcasts from instance2
      const broadcast2Prom = awaitMessage(eureka1)
      await eureka2.broadcast()
      const broadcast2result = await broadcast2Prom
      ok(broadcast2result.instance === eureka2Data.instance)

      // give it a moment to settle
      await sleep(2000)

      // lets verify instance2 gets broadcasts from instance1
      const broadcast1Prom = awaitMessage(eureka2)
      await eureka1.broadcast()
      const broadcast1result = await broadcast1Prom
      ok(broadcast1result.instance === eureka1Data.instance)

      // at the end of this, there should be 0 errors
      ok(errors.length === 0)
    } catch (err) {
      fail(err)
    } finally {
      eureka1?.close()
      eureka2?.close()
    }
  })
})
