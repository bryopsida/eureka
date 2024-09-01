import { createDecipheriv, createCipheriv, randomBytes, scryptSync, pbkdf2Sync, getFips, createHmac } from 'crypto'

/**
 * @typedef {Object} EurekaCryptoProps
 * @property {string} password
 * @property {string} salt
 * @property {string} algorithm
 * @property {number} keyId
 * @property {'pbkdf2' | 'scrypt'} kdfFunction
 */

export class EurekaCrypto {
  #algorithm = null
  #key = null
  #isFips = false

  constructor (props) {
    if (!props.password || props.password === '') throw new Error('props.password must be provided in EurekaCrypto constructor!')
    if (!props.salt || props.salt === '') throw new Error('props.salt must be provided in EurekaCrypto constructor!')
    this.#isFips = getFips()

    if ((props.kdfFunction === 'scrypt' || props.kdfFunction == null) && !this.#isFips) {
      this.#key = this.#deriveScryptKey(props.password, props.salt)
    } else {
      this.#key = this.#derivePbkdf2Key(props.password, props.salt)
    }
    if ((props.algorithm === 'chacha20-poly1305' || props.algorithm == null) && !this.#isFips) {
      this.#algorithm = 'chacha20-poly1305'
    } else {
      this.#algorithm = 'aes-256-gcm'
    }
  }

  #deriveScryptKey (password, salt) {
    // take the shared key and run it through scrypt
    // use https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    // to set params
    // default node params exceed owasp suggestions
    return scryptSync(password, salt, 32)
  }

  #derivePbkdf2Key (password, salt) {
    // take the shared key and run it through pbkdf2
    // use https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    return pbkdf2Sync(password, salt, 310000, 32, 'sha256')
  }

  /**
   * Decrypt the cipher text with the provided context
   * @param {Buffer} ciphertext
   * @param {Buffer} context
   * @returns Buffer
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
    const AUTH_TAG_START = this.#getAuthTagStart()
    const AUTH_TAG_END = this.#getAuthTagEnd()
    const IV_START = this.#getIvStart()
    const IV_END = this.#getIvEnd()
    const CRYPTO_START = this.#getCryptoStart()
    const authTag = ciphertext.subarray(AUTH_TAG_START, AUTH_TAG_END)
    const iv = ciphertext.subarray(IV_START, IV_END)
    const crypt = ciphertext.subarray(CRYPTO_START)
    const decipher = createDecipheriv(this.getAlgorithm(), this.#key, iv)
    decipher.setAAD(context, {
      encoding: 'utf8'
    })
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(crypt), decipher.final()])
  }

  /**
   * Verify the contents signature match
   * @param {Buffer} buffer
   * @param {Buffer} signature
   * @returns {boolean}
   */
  verify (buffer, signature) {
    // verify the signature
    // return true if valid
    // return false if invalid
    const hmac = createHmac('sha256', this.#key)
    hmac.update(buffer)
    const hmacDigest = hmac.digest()
    return hmacDigest.equals(signature)
  }

  /**
   *
   * @param {Buffer} buffer
   * @returns {Buffer} 16 byte signature
   */
  sign (buffer) {
    // sign the buffer
    // return the signature
    const hmac = createHmac('sha256', this.#key)
    hmac.update(buffer)
    return hmac.digest()
  }

  #getIvLength () {
    switch (this.#algorithm) {
      case 'chacha20-poly1305':
        return 12
      case 'aes-256-gcm':
        return 16
      default:
        throw new Error('Unsupported algorithm')
    }
  }

  #getAuthTagStart () {
    return 0
  }

  #getAuthTagEnd () {
    return 16
  }

  #getIvStart () {
    return 16
  }

  #getIvEnd () {
    switch (this.#algorithm) {
      case 'chacha20-poly1305':
        return 28
      case 'aes-256-gcm':
        return 32
      default:
        throw new Error('Unsupported algorithm')
    }
  }

  #getCryptoStart () {
    switch (this.#algorithm) {
      case 'chacha20-poly1305':
        return 28
      case 'aes-256-gcm':
        return 32
      default:
        throw new Error('Unsupported algorithm')
    }
  }

  getAlgorithm () {
    return this.#algorithm
  }

  getKeyId () {
    return 0
  }

  async encrypt (plaintext, context) {
    // take the plaintext/payload
    // create a random iv
    // use the context to generate a auth tag
    // encrypt it
    // return cipher text to caller for it to do what it needs to do
    const iv = randomBytes(this.#getIvLength())
    const cipher = createCipheriv(this.getAlgorithm(), this.#key, iv)
    cipher.setAAD(context, {
      encoding: 'utf8'
    })
    const rawCrypt = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([tag, iv, rawCrypt])
  }
}
