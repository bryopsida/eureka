import EventEmitter from 'node:events'
import { EurekaCrypto } from './crypto.mjs'
import { EurekaServer } from './transport.mjs'

export class Eureka extends EventEmitter {
  constructor (props) {
    super()
  }
}
