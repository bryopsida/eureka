import { EurekaCrypto } from './crypto.mjs'
import { describe, it } from 'node:test'
import { ok } from 'node:assert'

const password = 'password'
const salt = 'salt'
const context = Buffer.from('open context')
const CIPHER_TEXT = ''
const PLAIN_TEXT = 'TEST'

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
    })
    it('should decrypt successfully', async () => {
      const crypto = new EurekaCrypto({
        password,
        salt
      })
      const plainText = await crypto.decrypt(CIPHER_TEXT, context)
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
      const plainText = await crypto.decrypt(cipher, context)
      ok(plainText === PLAIN_TEXT)
    })
  })
})
