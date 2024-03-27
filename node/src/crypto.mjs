import { pbkdf2Sync } from 'crypto'

export class EurekaCrypto {
  constructor (props) {
    if (!props.password || props.password == '') throw new Error('props.password must be provided in EurekaCrypto constructor!')
    if (!props.salt || props.salt == '') throw new Error('props.salt must be provided in EurekaCrypto constructor!')
    // take the shared key and run it through pbkdf2
    // use https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    // to set params
    this.key = pbkdf2Sync(props.password, props.salt, 12000000, 32, 'sha256')
  }

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
    throw new Error('Not Implemented')
  }

  async encrypt (plaintext, context) {
    // take the plaintext/payload
    // create a random iv
    // use the context to generate a auth tag
    // encrypt it
    // return cipher text to caller for it to do what it needs to do
    throw new Error('Not Implemented')
  }
}
