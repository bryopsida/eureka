import EventEmitter from 'node:events'
import { EurekaCrypto } from './crypto.mjs'
import { EurekaServer } from './transport.mjs'

  /**
   * @type EurekaServerOptions
   */

  /**
   * @type EurekaCryptoOptions
   */

  /**
   * 
   * @type EurekaOptions
   * @property {EurekaServerOptions} server options for server module
   * @property {EurekaCryptoOptions} crypto options for crypto module
   * @property {number} broadcastInterval time between message broadcasts in milliseconds
   * @property {any} messageData the message that will be broadcast at the set interval, must be serializable.
   */
export class Eureka extends EventEmitter {

  /**
   * Create a Eurkea instance, this intended to facilitate discovery of
   * other instances and share information between instances in a secure way.
   * Authenticated encryption is used to ensure integrity of the messages.
   *
   * Additional authentication data is used to bind the encrypted payloads
   * to the IP sending the data. Meaning if the data is tampered with and/or relayed
   * through another box, the authenticated encryption will fail.
   *
   * This is intended to be a core library that can be re-used by another piece
   * that applies more opinions on the structure of the messages and actions
   * on receipt of messages.
   *
   * This is intended to be used on devices in the same network segment and visible to each other at L2.
   *
   * You must provided a shared salt and password, how this is fetched/seeded is left up to the upper layer.
   * Additionally, rotation of the shared key material is also left to the upper layer.
   * Currently rotation must happen all at once. In the future a keyset with keys that can be aged out for seemless
   * rotation may be supported.
   *
   * You must provide the message payload that will be broadcast (by default every minute).
   *
   * You may override the crypto object used to protect and authenticate the payloads, to do so provide
   * props.crypto.instance. If you do not the, a default crypto instance will be created which uses Scrypt and ChaCha20
   *
   * @param {EurekaOptions} props
   */
  constructor (props) {
    super()
    this._ready = false

    this.validatePropsForServer(props)
    this.validatePropsForEureka(props)

    this.messageBroadcastInterval = props.broadcastInterval ?? 60000
    this.messageBroadcastData = Buffer.from(JSON.stringify(props.messageData))
    this.logger = props.logger

    if (props.crypto && props.crypto.instance) {
      this.crypto = props.crypto.instance
    } else {
      this.validatePropsForCrypto(props)
      this.crypto = new EurekaCrypto(this.buildCryptoProps(props))
    }

    this.server = new EurekaServer(this.buildServerProps(props))
      .on('message', this.onMessage.bind(this))
      .on('error', this.onError.bind(this))
      .on('ready', this.onReady.bind(this))

    this.broadcastTimer = setInterval(this.broadcast.bind(this), this.messageBroadcastInterval)
  }

  /**
   * Broadcast the message to all specified multicast groups
   * @returns {Promise<void>}
   */
  async broadcast () {
    try {
      this.log('info', 'Sending Broadcast')
      await this.server.sendMessage(this.messageBroadcastData)
    } catch (err) {
      this.onError(err)
    }
  }

  /**
   * Handler for when server is ready, this triggers an immediate
   * broadcast when server is ready instead of waiting for next interval.
   * @returns {void}
   */
  onReady () {
    this._ready = true
    this.log('info', 'Server is ready to receive messages')
    // trigger immediate startup broadcast
    this.broadcast()
    // bubble up to consumers
    this.emit('ready')
  }

  /**
   * Check if the server is ready
   * @returns {boolean} true if the server is ready
   */
  isReady () {
    return this._ready
  }

  /**
   * Handler for all error events, logs and bubbles it up.
   * @param {any} err
   */
  onError (err) {
    // filter crypto errors and fire unauthenticated message recv event instead
    if (err && err.message === 'Unsupported state or unable to authenticate data') {
      this.log('warn', 'Message arrived that failed authentication', err)
      this.emit('unauthMessage', err)
    } else {
      this.log('error', err)
      this.emit('error', err)
    }
  }

  /**
   * Handlers for messages, at this layer the message has been authenticated
   * and this is plaintext, message is logged and bubbled up
   * @param {'*'} msg
   */
  onMessage (msg) {
    this.log('trace', msg)
    try {
      // expect a buffer
      // expect a buffer of JSON UTF8 Data
      this.emit('message', JSON.parse(msg.toString('utf8')))
    } catch (err) {
      this.onError(err)
    }
  }

  buildCryptoProps (props) {
    return { ...props.crypto, ...{ logger: this.logger } }
  }

  buildServerProps (props) {
    const opts = props.server ?? {}
    return {
      ...opts,
      ...{
        crypto: this.crypto,
        logger: this.logger
      }
    }
  }

  validatePropsForEureka (props) {
    if (!props.messageData) throw new Error('props.messageData must be provided! This is the broadcast data sent to other clients.')
  }

  validatePropsForCrypto (props) {
    if (!props.crypto.salt) throw new Error('props.crypto.salt must be provided!')
    if (!props.crypto.password) throw new Error('props.crypto.password must be provided!')
  }

  validatePropsForServer (_props) {
    // server can default everything, just a placeholder
  }

  /**
   * Call into the logger object if provided, follows console interface behavior
   * @param {('log'|'info'|'error'|'warn'|'debug'|'trace')} level
   * @param {any} msg
   */
  log (level, msg) {
    if (this.logger) {
      this.logger[level](msg)
    }
  }

  /**
   * Stop sending messages and clean up the resources created,
   * This is a destructive call, you will need to remake a Eureka instance
   * after calling this. It is intended to be called on exit.
   */
  close () {
    try {
      clearInterval(this.broadcastTimer)
      this.server.closeServer()
    } catch (err) {
      this.onError(err)
      throw err
    }
  }

  /**
   * Set the broadcast data, it's expected that this is a model obj/instance
   * as it is serialized and converted to a buffer. This will be sent on next interval.
   * @param {any} data
   */
  setBroadcastData (data) {
    try {
      const newData = Buffer.from(JSON.stringify(data))
      this.messageBroadcastData = newData
    } catch (err) {
      this.onError(err)
    }
  }

  /**
   * Send a one time custom message
   * @param {any} msg
   * @returns {Promise<void>}
   */
  async sendMessage (msg) {
    const data = Buffer.from(JSON.stringify(msg))
    try {
      await this.server.sendMessage(data)
    } catch (err) {
      this.onError(err)
      // since this is also invoked, re-throw
      // we want the 'error' event to capture everything but also support
      // throwing to caller in cases where method is expected to be direct called
      // by consumers
      throw err
    }
  }
}
