import { EurekaCrypto } from './crypto.mjs'
import { describe, it } from 'node:test'
import { ok } from 'node:assert'

const password = 'password'
const salt = 'salt'
const context = Buffer.from('open context')
const CIPHER_TEXT = Buffer.from('ZyKpbEfx2Suqp3ad5p3HOT2Fvfvm6A0us8rjkxstxrY=', 'base64')
const PLAIN_TEXT = 'TEST'
const UNAUTHENTICATED_ERROR = 'Unsupported state or unable to authenticate data'

describe('EurekaCrypto', () => {
  describe('decrypt()', () => {
    it('should throw when password is wrong', async () => {
      const crypto = new EurekaCrypto({
        password: 'not password',
        salt
      })
      let err = null
      try {
        await crypto.decrypt(CIPHER_TEXT, context)
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
        salt
      })
      let err = null
      try {
        await crypto.decrypt(CIPHER_TEXT, Buffer.from('not context'))
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
        salt
      })
      const plainTextBytes = await crypto.decrypt(CIPHER_TEXT, context)
      const plainText = plainTextBytes.toString('utf8')
      ok(plainText === PLAIN_TEXT)
    })
  })
  describe('encrypt()', () => {
    it('should encrypt something that can be decrypted', async () => {
      const crypto = new EurekaCrypto({
        password,
        salt
      })
      const cipher = await crypto.encrypt(PLAIN_TEXT, context)
      const plainTextBytes = await crypto.decrypt(cipher, context)
      const plainText = plainTextBytes.toString('utf8')
      ok(plainText === PLAIN_TEXT)
    })
  })
})
