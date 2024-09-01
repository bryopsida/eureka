export function getHeaderSize(): number;
export function getSignatureSize(): number;
/**
 *
 * @param {EurekaHeader} props
 * @returns {Buffer}
 */
export function buildHeader(props: EurekaHeader): Buffer;
/**
 * Sign the contents of the header with the private key
 * @param {Buffer} header
 * @param {EurekaCrypto} crypto
 * @returns {Buffer} signed header
 */
export function signHeader(header: Buffer, crypto: EurekaCrypto): Buffer;
/**
 * Verify the contents of the buffer match the signature
 * @param {Buffer} header
 * @param {EurekaCrypto} crypto
 * @returns {boolean} true if the signature is valid
 */
export function verifyHeader(header: Buffer, crypto: EurekaCrypto): boolean;
/**
 *
 * @param {*} buffer
 * @returns {EurekaHeader}
 */
export function decodeHeader(buffer: any): EurekaHeader;
export type EurekaHeader = {
    algorithm: "chacha20-poly1305" | "aes-256-gcm";
    version: number;
    messageLength: number;
    messageType: "BEACON";
    keyId: number;
    messageId: messageId;
    signature: Buffer;
    chunkSize: number;
    chunkIndex: number;
};
