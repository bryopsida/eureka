import { EventEmitter } from 'node:events'
import { createSocket } from 'node:dgram'

export class EurekaServer extends EventEmitter {
  constructor (props) {
    super()
    this.logger = props.logger
    this.socket = createSocket({
      type: props.type
    })
    this.multicastGroups = props.multicastGroups
    this.interfaces = props.interfaces
    this.port = props

    // bind handlers before joining multicast groups
      .this.socket.on('message', this.messageHandler.bind(this))
    this.socket.on('error', this.messageHandler.bind(this))
    this.socket.on('listening', this.listenHandler.bind(this))
    this.socket.on('close', this.closeHandler.bind(this))
    this.socket.on('connect', this.connectHandler.bind(this))

    this.socket.bind(this.port)

    this.multicastGroups.forEach((group) => {
      if (this.interfaces) {
        this.interfaces.forEach((i) => {
          this.socket.addMembership(group, i)
        })
      } else {
        this.socket.addMembership(group)
      }
    })
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

  messageHandler (msg, rinfo) {

  }

  sendMessage (msg) {
    for (const group in this.multicastGroups) {
      this.socket.send(msg, this.port, group)
    }
  }

  errorHandler (err) {
    if (this.logger) {
      this.logger.error('Server Error: ', err)
    }
  }
}
