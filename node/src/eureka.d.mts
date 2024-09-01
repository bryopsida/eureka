/**
 * @typedef {Object} EurekaServerProps
 * @property {'udp4' | 'udp6' | undefined} type
 * @property {string[] | undefined} multicastGroups
 * @property {string[] | undefined} interfaces
 * @property {number | undefined} port
 * @property {number | undefined} chunkSize
 * @property {number | undefined} chunkSpacing
 */
/**
 * @typedef {Object} EurekaCryptoProps
 * @property {string} password
 * @property {string} salt
 * @property {'chacha20-poly1305' | 'aes-256-gcm' | undefined} algorithm
 * @property {number | undefined} keyId
 * @property {'scrypt' | 'pbkdf2' | undefined} kdfFunction
 *
 */
/**
 * @typedef {Object} Logger
 * @property {function} log
 * @property {function} info
 * @property {function} error
 * @property {function} warn
 * @property {function} debug
 * @property {function} trace
 */
/**
 * @typedef {Object} EurekaProps
 * @property {EurekaServerProps} server
 * @property {EurekaCryptoProps} crypto
 * @property {Logger} logger
 */
export class Eureka {
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
     * @param {EurekaProps} props
     */
    constructor(props: EurekaProps);
    _ready: boolean;
    messageBroadcastInterval: any;
    messageBroadcastData: any;
    logger: Logger;
    crypto: any;
    server: any;
    broadcastTimer: number;
    /**
     * Broadcast the message to all specified multicast groups
     * @returns {Promise<void>}
     */
    broadcast(): Promise<void>;
    /**
     * Handler for when server is ready, this triggers an immediate
     * broadcast when server is ready instead of waiting for next interval.
     * @returns {void}
     */
    onReady(): void;
    /**
     * Check if the server is ready
     * @returns {boolean} true if the server is ready
     */
    isReady(): boolean;
    /**
     * Handler for all error events, logs and bubbles it up.
     * @param {any} err
     */
    onError(err: any): void;
    /**
     * Handlers for messages, at this layer the message has been authenticated
     * and this is plaintext, message is logged and bubbled up
     * @param {'*'} msg
     */
    onMessage(msg: "*"): void;
    buildCryptoProps(props: any): any;
    buildServerProps(props: any): any;
    validatePropsForEureka(props: any): void;
    validatePropsForCrypto(props: any): void;
    validatePropsForServer(_props: any): void;
    /**
     * Call into the logger object if provided, follows console interface behavior
     * @param {('log'|'info'|'error'|'warn'|'debug'|'trace')} level
     * @param {any} msg
     */
    log(level: ("log" | "info" | "error" | "warn" | "debug" | "trace"), msg: any): void;
    /**
     * Stop sending messages and clean up the resources created,
     * This is a destructive call, you will need to remake a Eureka instance
     * after calling this. It is intended to be called on exit.
     */
    close(): void;
    /**
     * Set the broadcast data, it's expected that this is a model obj/instance
     * as it is serialized and converted to a buffer. This will be sent on next interval.
     * @param {any} data
     */
    setBroadcastData(data: any): void;
    /**
     * Send a one time custom message
     * @param {any} msg
     * @returns {Promise<void>}
     */
    sendMessage(msg: any): Promise<void>;
}
export type EurekaServerProps = {
    type: "udp4" | "udp6" | undefined;
    multicastGroups: string[] | undefined;
    interfaces: string[] | undefined;
    port: number | undefined;
    chunkSize: number | undefined;
    chunkSpacing: number | undefined;
};
export type EurekaCryptoProps = {
    password: string;
    salt: string;
    algorithm: "chacha20-poly1305" | "aes-256-gcm" | undefined;
    keyId: number | undefined;
    kdfFunction: "scrypt" | "pbkdf2" | undefined;
};
export type Logger = {
    log: Function;
    info: Function;
    error: Function;
    warn: Function;
    debug: Function;
    trace: Function;
};
export type EurekaProps = {
    server: EurekaServerProps;
    crypto: EurekaCryptoProps;
    logger: Logger;
};
