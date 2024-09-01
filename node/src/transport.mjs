import { EventEmitter } from 'node:events'
import { createSocket } from 'node:dgram'
import { networkInterfaces } from 'node:os'
import { buildHeader, decodeHeader, getHeaderSize, signHeader, getSignatureSize } from './header.mjs'

export class EurekaServer extends EventEmitter {
  #msgId = 0
  #chunkSize = 1500
  #peerChunks = {}
  #purgeExpiredChunksInterval = null
  #chunkSpacing = 10

  constructor (props) {
    super()
    this.logger = props.logger
    this.crypto = props.crypto
    if (this.crypto == null) {
      throw new Error('EurekaServer constructor requires props.crypto to be set with a compatible crypto class! See EurekaCrypto for compatible example')
    }
    this.type = props.type
    if (this.type == null) {
      this.type = 'udp4'
    }

    this.socket = createSocket({
      type: this.type,
      reuseAddr: true
    })
    this.multicastGroups = props.multicastGroups
    if (this.multicastGroups == null) {
      // default to all on same network segment
      this.multicastGroups = ['224.0.0.1']
    }
    this.interfaces = props.interfaces
    if (this.interfaces == null) {
      this.interfaces = this.buildDefaultInterfaces()
    } else {
      this.validateInterfaces()
    }
    this.interfaceCache = networkInterfaces()
    this.port = props.port
    if (this.port == null) {
      this.port = 51515
    }

    // bind handlers before joining multicast groups
    // bind needs to finish before we join groups
    this.bindHandlers()
    this.socket.bind(this.port, this.addMulticastGroups.bind(this))

    // refresh the interface data every 1 minute
    this.refreshInterfacesTimer = setInterval(this.refreshCachedInterfaces.bind(this), 60000)
    this.#purgeExpiredChunksInterval = setInterval(this.#purgeExpiredChunks.bind(this), 1000)

    if (props.chunkSpacing) {
      this.#chunkSpacing = props.chunkSpacing
    }
  }

  #purgeExpiredChunks () {
    const now = Date.now()
    for (const key in this.#peerChunks) {
      for (const messageId in this.#peerChunks[key]) {
        if (this.#peerChunks[key][messageId].expirationDate < now) {
          delete this.#peerChunks[key][messageId]
        }
      }
    }
  }

  /**
   * Determines the ip family of the server and finds compatible interfaces
   * @returns {string} normalized to ipv4 or ipv6
   */
  getIpFamiliy () {
    return this.type === 'udp4' ? 'ipv4' : 'ipv6'
  }

  /**
   * Check if the iface family type is compatible with the server type
   * @param {*} iface
   * @returns {boolean}
   */
  ipFamiliyMatches (iface) {
    const ipFam = this.getIpFamiliy()
    return ipFam.toLowerCase() === iface.family.toLowerCase()
  }

  /**
   * Refresh the available interfaces, the cached interface list is used to broadcast on all compatible interfaces
   */
  refreshCachedInterfaces () {
    this.interfaceCache = networkInterfaces()
  }

  buildDefaultInterfaces () {
    const ints = networkInterfaces()
    const defaultInts = Object.keys(ints).filter((i) => {
      return !ints[i][0].internal && ints[i].some((iface) => this.ipFamiliyMatches(iface))
    })
    return defaultInts
  }

  validateInterfaces () {
    const nodeInterfaces = networkInterfaces()
    for (const i in this.interfaces) {
      if (i[nodeInterfaces] == null) throw new Error(`Interface ${i} does not exist!`)
      if (i[nodeInterfaces][0].internal) throw new Error(`Interface ${i} is internal!`)
    }
  }

  getIpForInterface (interfaceName) {
    if (this.interfaceCache[interfaceName] == null) throw new Error(`Invalid interface ${interfaceName} provided in getIpForInterface`)
    const iface = this.interfaceCache[interfaceName]
    for (const config of iface) {
      if (this.ipFamiliyMatches(config)) {
        return config.address
      }
    }
    throw new Error(`Interface ${interfaceName} does not have a address for ${this.type}!`)
  }

  bindHandlers () {
    this.socket.on('message', this.messageHandler.bind(this))
    this.socket.on('error', this.errorHandler.bind(this))
    this.socket.on('listening', this.listenHandler.bind(this))
    this.socket.on('close', this.closeHandler.bind(this))
    this.socket.on('connect', this.connectHandler.bind(this))
  }

  removeHandlers () {
    this.socket.removeAllListeners()
  }

  addMulticastGroups () {
    for (const group of this.multicastGroups) {
      if (this.interfaces) {
        for (const iface of this.interfaces) {
          this.socket.addMembership(group, this.getIpForInterface(iface))
        }
      } else {
        this.socket.addMembership(group)
      }
    }
    this.emit('ready')
  }

  connectHandler (msg) {
    if (this.logger) {
      this.logger.info('Connected')
    }
  }

  closeHandler (msg) {
    if (this.logger) {
      this.logger.info('Server closed')
    }
  }

  listenHandler (msg) {
    if (this.logger) {
      this.logger.info('Listening')
    }
  }

  getMessageId () {
    this.#msgId = (this.#msgId + 1) & 0xFFFFFFFF
  }

  #getPeerKey (rinfo) {
    return `${rinfo.address}:${rinfo.port}`
  }

  #appendChunk (key, messageId, chunkIdx, expectedChunks, chunk) {
    if (this.#peerChunks[key] == null) {
      this.#peerChunks[key] = {}
    }
    if (this.#peerChunks[key][messageId] == null) {
      this.#peerChunks[key][messageId] = {
        chunks: new Array(expectedChunks),
        expirationDate: new Date(Date.now() + 30000),
        chunksReceived: 0
      }
    }
    if (this.#peerChunks[key][messageId].chunks[chunkIdx] != null) {
      throw new Error('Chunk already exists')
    }
    this.#peerChunks[key][messageId].chunks[chunkIdx] = chunk
    this.#peerChunks[key][messageId].chunksReceived++
  }

  #isMessageComplete (key, messageId, expectedChunks) {
    if (this.#peerChunks[key] == null) {
      return false
    }
    if (this.#peerChunks[key][messageId] == null) {
      return false
    }
    const chunks = this.#peerChunks[key][messageId].chunksReceived
    return chunks === expectedChunks
  }

  #getCompleteMessage (key, messageId) {
    if (this.#peerChunks[key] == null) {
      throw new Error('No chunks found for key')
    }
    if (this.#peerChunks[key][messageId] == null) {
      throw new Error('Message not found')
    }
    if (this.#peerChunks[key][messageId].chunks == null) {
      throw new Error('No chunks found for message')
    }
    if (!Array.isArray(this.#peerChunks[key][messageId].chunks)) {
      throw new Error('Chunks is not an array')
    }
    return Buffer.concat(this.#peerChunks[key][messageId].chunks)
  }

  async messageHandler (msg, rinfo) {
    try {
      const headerSize = getHeaderSize()
      const headerBuffer = msg.subarray(0, headerSize)
      const endOfHeaderContents = getHeaderSize() - getSignatureSize()
      const headerContents = headerBuffer.subarray(0, endOfHeaderContents)
      const signature = headerBuffer.subarray(endOfHeaderContents)
      // verify the signature before any further processing
      if (!this.crypto.verify(headerContents, signature)) {
        throw new Error('Invalid signature!')
      }
      const header = decodeHeader(headerBuffer)
      if (header.algorithm !== this.crypto.getAlgorithm()) {
        throw new Error('Algorithm mismatch!')
      }
      if (header.keyId !== this.crypto.getKeyId()) {
        throw new Error('Key ID mismatch!')
      }
      const payload = msg.subarray(headerSize)
      const id = header.messageId
      const messageLength = header.messageLength
      const chunkSize = header.chunkSize
      const chunkIndex = header.chunkIndex
      const expectedChunks = Math.ceil(messageLength / chunkSize)
      this.logger?.trace('Received chunk', {
        id,
        chunkIndex,
        expectedChunks,
        rinfo
      })
      if (chunkIndex >= expectedChunks) {
        throw new Error('Invalid chunk index!')
      }
      const key = this.#getPeerKey(rinfo)
      this.#appendChunk(key, id, chunkIndex, expectedChunks, payload)
      if (this.#isMessageComplete(key, id, expectedChunks)) {
        const completeMessage = this.#getCompleteMessage(key, id)
        delete this.#peerChunks[key][id]
        const plainText = await this.crypto.decrypt(completeMessage, Buffer.from(`${rinfo.address}:${rinfo.port}`))
        this.emit('message', plainText)
      }
    } catch (err) {
      this.emit('error', err)
    }
  }

  async sendMessage (msg) {
    try {
      for (const group of this.multicastGroups) {
        for (const iface of this.interfaces) {
          // to control the outgoing multicast interface we set before each call
          // we use the interface cache to fetch the ip so we can create an appropriate context buffer for encryption
          const ip = this.getIpForInterface(iface)
          this.socket.setMulticastInterface(ip)

          const encryptedMessage = await this.crypto.encrypt(msg, Buffer.from(`${ip}:${this.port}`))
          const payLoadAvailablePerChunk = this.#chunkSize - getHeaderSize()
          const chunks = Math.ceil(encryptedMessage.length / payLoadAvailablePerChunk)
          for (let i = 0; i < chunks; i++) {
            const header = {
              version: 0,
              messageType: 'BEACON',
              messageLength: encryptedMessage.length,
              algorithm: this.crypto.getAlgorithm(),
              keyId: this.crypto.getKeyId(),
              messageId: this.getMessageId(),
              chunkSize: payLoadAvailablePerChunk,
              chunkIndex: i
            }
            const headerBuffer = buildHeader(header)
            const signedHeader = signHeader(headerBuffer, this.crypto)
            const chunkPayload = encryptedMessage.subarray(i * payLoadAvailablePerChunk, (i + 1) * payLoadAvailablePerChunk)
            this.socket.send(Buffer.concat([signedHeader, chunkPayload]), this.port, group, (err) => {
              if (err) {
                this.emit('error', err)
              }
            })
            this.logger?.trace('Sent chunk', {
              header
            })
            if (this.#chunkSpacing > 0) {
              this.logger?.trace('Chunk spacing is set, waiting...')
              await new Promise((resolve) => setTimeout(resolve, this.#chunkSpacing))
            }
          }
        }
      }
    } catch (err) {
      this.emit('error', err)
    }
  }

  errorHandler (err) {
    if (this.logger) {
      this.logger.error('Server Error: ', err)
    }
    // bubble up
    this.emit('error', err)
  }

  closeServer () {
    clearInterval(this.refreshInterfacesTimer)
    clearInterval(this.#purgeExpiredChunksInterval)
    this.removeHandlers()
    this.socket.close()
  }
}
