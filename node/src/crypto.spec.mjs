import { EurekaCrypto } from './crypto.mjs'
import { describe, it } from 'node:test'
import { ok } from 'node:assert'

const password = 'password'
const salt = 'salt'
const context = Buffer.from('open context')
const PLAIN_TEXT = 'TEST'
const UNAUTHENTICATED_ERROR = 'Unsupported state or unable to authenticate data'

const algorithms = ['chacha20-poly1305', 'aes-256-gcm']
const kdfFunctions = ['scrypt', 'pbkdf2']

describe('EurekaCrypto', () => {
  algorithms.forEach(algorithm => {
    kdfFunctions.forEach(kdfFunction => {
      describe(`decrypt() with algorithm=${algorithm} and kdfFunction=${kdfFunction}`, () => {
        it('should throw when password is wrong', async () => {
          const validCrypto = new EurekaCrypto({
            password,
            salt,
            algorithm,
            kdfFunction
          })
          const crypto = new EurekaCrypto({
            password: 'not password',
            salt,
            algorithm,
            kdfFunction
          })
          let err = null
          try {
            const cipherText = await validCrypto.encrypt(Buffer.from(PLAIN_TEXT), context)
            await crypto.decrypt(cipherText, context)
          } catch (e) {
            err = e
          }
          ok(err != null)
          ok(err instanceof Error)
          ok(err.message === UNAUTHENTICATED_ERROR)
        })
        it('should throw when context is wrong', async () => {
          const crypto = new EurekaCrypto({
            password,
            salt,
            algorithm,
            kdfFunction
          })
          let err = null
          try {
            const cipherText = await crypto.encrypt(Buffer.from(PLAIN_TEXT), context)
            await crypto.decrypt(cipherText, Buffer.from('not context'))
          } catch (e) {
            err = e
          }
          ok(err != null)
          ok(err instanceof Error)
          ok(err.message === UNAUTHENTICATED_ERROR)
        })
        it('should decrypt successfully', async () => {
          const crypto = new EurekaCrypto({
            password,
            salt,
            algorithm,
            kdfFunction
          })
          const cipherText = await crypto.encrypt(Buffer.from(PLAIN_TEXT), context)
          const plainTextBytes = await crypto.decrypt(cipherText, context)
          ok(plainTextBytes.toString() === PLAIN_TEXT)
        })
      })
    })
  })
})
