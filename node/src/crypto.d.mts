/**
 * @typedef {Object} EurekaCryptoProps
 * @property {string} password
 * @property {string} salt
 * @property {string} algorithm
 * @property {number} keyId
 * @property {'pbkdf2' | 'scrypt'} kdfFunction
 */
export class EurekaCrypto {
    constructor(props: any);
    /**
     * Decrypt the cipher text with the provided context
     * @param {Buffer} ciphertext
     * @param {Buffer} context
     * @returns Buffer
     */
    decrypt(ciphertext: Buffer, context: Buffer): Promise<any>;
    /**
     * Verify the contents signature match
     * @param {Buffer} buffer
     * @param {Buffer} signature
     * @returns {boolean}
     */
    verify(buffer: Buffer, signature: Buffer): boolean;
    /**
     *
     * @param {Buffer} buffer
     * @returns {Buffer} 16 byte signature
     */
    sign(buffer: Buffer): Buffer;
    getAlgorithm(): null;
    getKeyId(): number;
    encrypt(plaintext: any, context: any): Promise<any>;
    #private;
}
export type EurekaCryptoProps = {
    password: string;
    salt: string;
    algorithm: string;
    keyId: number;
    kdfFunction: "pbkdf2" | "scrypt";
};
