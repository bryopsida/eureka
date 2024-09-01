import { getMessageType, getMessageTypeId } from './message-type.mjs'
/**
 * @typedef {Object} EurekaHeader
 * @property {'chacha20-poly1305' | 'aes-256-gcm'} algorithm
 * @property {number} version
 * @property {number} messageLength
 * @property {'BEACON'} messageType
 * @property {number} keyId
 */

/**
 *
 * @param {EurekaHeader} props
 * @returns {Buffer}
 */
export function buildHeader (props) {
  const buffer = Buffer.alloc(32)
  buffer.writeUInt8(props.version, 0)
  buffer.writeUInt8(getMessageTypeId(props.messageType), 1)
  buffer.writeUInt32BE(props.messageLength, 2)
  buffer.writeUInt8(props.algorithm === 'chacha20-poly1305' ? 0 : 1, 6)
  buffer.writeUInt32BE(props.keyId, 7)
  return buffer
}

/**
 *
 * @param {*} buffer
 * @returns {EurekaHeader}
 */
export function decodeHeader (buffer) {
  return {
    version: buffer.readUInt8(0),
    messageType: getMessageType(buffer.readUInt8(1)),
    messageLength: buffer.readUInt32BE(2),
    algorithm: buffer.readUInt8(6) === 0 ? 'chacha20-poly1305' : 'aes-256-gcm',
    keyId: buffer.readUInt32BE(7)
  }
}
