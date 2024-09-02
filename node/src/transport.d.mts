export class EurekaServer {
    constructor(props: any);
    logger: any;
    crypto: any;
    type: any;
    socket: any;
    multicastGroups: any;
    interfaces: any;
    interfaceCache: any;
    port: any;
    refreshInterfacesTimer: number;
    /**
     * Determines the ip family of the server and finds compatible interfaces
     * @returns {string} normalized to ipv4 or ipv6
     */
    getIpFamiliy(): string;
    /**
     * Check if the iface family type is compatible with the server type
     * @param {*} iface
     * @returns {boolean}
     */
    ipFamiliyMatches(iface: any): boolean;
    /**
     * Refresh the available interfaces, the cached interface list is used to broadcast on all compatible interfaces
     */
    refreshCachedInterfaces(): void;
    buildDefaultInterfaces(): string[];
    validateInterfaces(): void;
    getIpForInterface(interfaceName: any): any;
    bindHandlers(): void;
    removeHandlers(): void;
    addMulticastGroups(): void;
    connectHandler(msg: any): void;
    closeHandler(msg: any): void;
    listenHandler(msg: any): void;
    getMessageId(): void;
    messageHandler(msg: any, rinfo: any): Promise<void>;
    sendMessage(msg: any): Promise<void>;
    errorHandler(err: any): void;
    closeServer(): void;
    #private;
}
