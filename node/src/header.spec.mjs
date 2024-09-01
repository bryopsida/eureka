import { describe, it } from 'node:test'
import { buildHeader, decodeHeader, getHeaderSize } from './header.mjs'
import { strict as assert } from 'assert'

describe('Header Encoding and Decoding', () => {
  const testCases = [
    {
      props: {
        version: 1,
        messageType: 'BEACON',
        messageId: 123,
        messageLength: 100,
        algorithm: 'chacha20-poly1305',
        keyId: 12345,
        chunkSize: 1500,
        chunkIndex: 9999
      }
    },
    {
      props: {
        version: 2,
        messageType: 'BEACON',
        messageLength: 200,
        messageId: 555,
        algorithm: 'aes-256-gcm',
        keyId: 67890,
        chunkSize: 1400,
        chunkIndex: 2
      }
    },
    {
      props: {
        version: 3,
        messageId: 321,
        messageType: 'BEACON',
        messageLength: 300,
        algorithm: 'chacha20-poly1305',
        keyId: 54321,
        chunkSize: 1200,
        chunkIndex: 3
      }
    }
  ]

  testCases.forEach(({ props }, index) => {
    it(`should correctly encode and decode header for test case ${index + 1}`, () => {
      const encodedBuffer = buildHeader(props)
      const decodedHeader = decodeHeader(encodedBuffer)
      assert.ok(encodedBuffer instanceof Buffer)
      assert.ok(encodedBuffer.length === getHeaderSize())
      assert.strictEqual(decodedHeader.version, props.version)
      assert.strictEqual(decodedHeader.messageType, props.messageType)
      assert.strictEqual(decodedHeader.messageLength, props.messageLength)
      assert.strictEqual(decodedHeader.messageId, props.messageId)
      assert.strictEqual(decodedHeader.algorithm, props.algorithm)
      assert.strictEqual(decodedHeader.keyId, props.keyId)
      assert.strictEqual(decodedHeader.chunkSize, props.chunkSize)
      assert.strictEqual(decodedHeader.chunkIndex, props.chunkIndex)
    })
  })
})
