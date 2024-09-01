import { describe, it } from 'node:test'
import { buildHeader, decodeHeader } from './header.mjs'
import { strict as assert } from 'assert'

describe('Header Encoding and Decoding', () => {
  const testCases = [
    {
      props: {
        version: 1,
        messageType: 'BEACON',
        messageLength: 100,
        algorithm: 'chacha20-poly1305',
        keyId: 12345
      }
    },
    {
      props: {
        version: 2,
        messageType: 'BEACON',
        messageLength: 200,
        algorithm: 'aes-256-gcm',
        keyId: 67890
      }
    },
    {
      props: {
        version: 3,
        messageType: 'BEACON',
        messageLength: 300,
        algorithm: 'chacha20-poly1305',
        keyId: 54321
      }
    }
  ]

  testCases.forEach(({ props }, index) => {
    it(`should correctly encode and decode header for test case ${index + 1}`, () => {
      const encodedBuffer = buildHeader(props)
      const decodedHeader = decodeHeader(encodedBuffer)
      assert.ok(encodedBuffer instanceof Buffer)
      assert.ok(encodedBuffer.length === 32)
      assert.strictEqual(decodedHeader.version, props.version)
      assert.strictEqual(decodedHeader.messageType, props.messageType)
      assert.strictEqual(decodedHeader.messageLength, props.messageLength)
      assert.strictEqual(decodedHeader.algorithm, props.algorithm)
      assert.strictEqual(decodedHeader.keyId, props.keyId)
    })
  })
})
