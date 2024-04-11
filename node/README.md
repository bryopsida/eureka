# Eureka

This is intended to be a minimal, zero dependency library that can be used in other things for peer discovery when multicasting is available.

# How do I use it?

You can either extend or wrap the `Eureka` class.

For example:

``` javascript
import { randomBytes, randomUUID } from 'node:crypto'
import { Eureka } from '@bryopsida/eureka'

const password = randomBytes(32).toString('utf8')
const salt = randomBytes(16).toString('utf8')
const id = randomUUID()

const eureka = new Eureka({
    logger: console,
    crypto: {
        salt,
        password
    },
    messageData: {
        id,
        extraData: [{
            something: 1
        }]
    },
    server: {
        port: 41515
    }
}).on('error', (err) => {
    console.error(err)
}).on('ready', () => {
    console.log('eureka ready')
}).on('message', (msg) => {
    console.log('other processes message: ', msg)
})

process.on('SIGINT', () => {
    eureka?.close()
})
```


# How does the discovery process work?

UDP multicasting is used to send messages to all hosts in the same network segment.

You can adjust the multicast group by setting `opts.server.multicastGroups[]` to the set of multicast groups you would like to use. The default set is `['224.0.0.1']` on port `515151`.

To provide security the messages are encrypted with `ChaCha20-poly1305` using the `IP:PORT` of the sender as the additional authentication data.
