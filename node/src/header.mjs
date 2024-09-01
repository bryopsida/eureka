import { getMessageType, getMessageTypeId } from './message-type.mjs'

/**
 * @typedef {Object} EurekaHeader
 * @property {'chacha20-poly1305' | 'aes-256-gcm'} algorithm
 * @property {number} version
 * @property {number} messageLength
 * @property {'BEACON'} messageType
 * @property {number} keyId
 * @property {messageId} messageId
 * @property {Buffer} signature
 */

const HEADER_SIZE = 64
const HEADER_SIZE_WITHOUT_SIGNATURE = HEADER_SIZE - 32

export function getHeaderSize () {
  return HEADER_SIZE
}

export function getSignatureSize () {
  return HEADER_SIZE - HEADER_SIZE_WITHOUT_SIGNATURE
}

/**
 *
 * @param {EurekaHeader} props
 * @returns {Buffer}
 */
export function buildHeader (props) {
  const buffer = Buffer.alloc(HEADER_SIZE)
  buffer.writeUInt8(props.version, 0)
  buffer.writeUInt8(getMessageTypeId(props.messageType), 1)
  buffer.writeUInt32BE(props.messageLength, 2)
  buffer.writeUInt8(props.algorithm === 'chacha20-poly1305' ? 0 : 1, 6)
  buffer.writeUInt32BE(props.keyId, 7)
  buffer.writeUInt32BE(props.messageId, 11)
  return buffer
}

/**
 * Sign the contents of the header with the private key
 * @param {Buffer} header
 * @param {EurekaCrypto} crypto
 * @returns {Buffer} signed header
 */
export function signHeader (header, crypto) {
  const headerContents = header.subarray(0, HEADER_SIZE_WITHOUT_SIGNATURE)
  const signature = crypto.sign(headerContents)
  signature.copy(header, HEADER_SIZE_WITHOUT_SIGNATURE)
  return header
}

/**
 * Verify the contents of the buffer match the signature
 * @param {Buffer} header
 * @param {EurekaCrypto} crypto
 * @returns {boolean} true if the signature is valid
 */
export function verifyHeader (header, crypto) {
  const headerContents = header.subarray(0, HEADER_SIZE_WITHOUT_SIGNATURE)
  const signature = header.subarray(HEADER_SIZE_WITHOUT_SIGNATURE)
  return crypto.verify(headerContents, signature)
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
    keyId: buffer.readUInt32BE(7),
    messageId: buffer.readUInt32BE(11)
  }
}
