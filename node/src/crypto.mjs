import { createDecipheriv, createCipheriv, randomBytes, scryptSync } from 'crypto'

/**
 * Default cryptography class
 */
export class EurekaCrypto {
  constructor (props) {
    if (!props.password || props.password === '') throw new Error('props.password must be provided in EurekaCrypto constructor!')
    if (!props.salt || props.salt === '') throw new Error('props.salt must be provided in EurekaCrypto constructor!')
    // take the shared key and run it through scrypt
    // use https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    // to set params
    // default node params exceed owasp suggestions
    this.key = scryptSync(props.password, props.salt, 32)
  }

  /**
   * Decrypt the cipher text with the provided context
   * @param {Buffer} ciphertext
   * @param {Buffer} context
   * @returns {Buffer}
   */
  async decrypt (ciphertext, context) {
    // ciphertext is the encrypted bits
    // context is what we expect the authTag to be,
    // cipher text should be of the following form
    // auth tag 16 bytes | iv 16 bytes | ciphertext n bytes
    // the auth tag will be set, we will set the expected authentication data
    // then proceed, if integrity has been altered GCM with authentication tag will
    // detect modification
    //
    // once decrypted whatever it is, is handed off to the caller for further vetting
    const AUTH_TAG_START = 0
    const AUTH_TAG_END = 16
    const IV_START = 16
    const IV_END = 28
    const CRYPTO_START = 28
    const authTag = ciphertext.subarray(AUTH_TAG_START, AUTH_TAG_END)
    const iv = ciphertext.subarray(IV_START, IV_END)
    const crypt = ciphertext.subarray(CRYPTO_START)
    const decipher = createDecipheriv('chacha20-poly1305', this.key, iv)
    decipher.setAAD(context, {
      encoding: 'utf8'
    })
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(crypt), decipher.final()])
  }

  /**
   * 
   * @param {BinaryLike} plaintext 
   * @param {BinaryLike} context 
   * @returns {Buffer}
   */
  async encrypt (plaintext, context) {
    // take the plaintext/payload
    // create a random iv
    // use the context to generate a auth tag
    // encrypt it
    // return cipher text to caller for it to do what it needs to do
    const iv = randomBytes(12)
    const cipher = createCipheriv('chacha20-poly1305', this.key, iv)
    cipher.setAAD(context, {
      encoding: 'utf8'
    })
    const rawCrypt = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([tag, iv, rawCrypt])
  }
}
