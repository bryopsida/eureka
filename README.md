# Eureka

## What is this?

A simple library to share small bits of information across processes that are on the same multicast network

## How does it work?

The library is provided a pre shared key, this needs to be the same for all members.
Members can have properties set as 'their' properties which they broadcast for other members to discover properties about them.
When the current process receives a message on the multicast group, it decrypts, runs verification and then emits events for the upper
layer to consume.

## What about rotation of the PSK?

TBD, but things may retain knowledge of the previous key for a period of time, and when they see a message from a thing using the old key,
they may send a message using the old key informing the thing to move to the new key, or it may be a out of band process handed by other means.

## How do I use it?

Two implementations will exist, Node.JS, and Golang, the Node.JS will be available in npm, the golang implementation will be available as a gomodule.
