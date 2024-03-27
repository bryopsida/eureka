# Eureka

## What is this?

A simple library to share small bits of information across processes that are on the same multicast network

## How does it work?

The library is provided a pre shared key, this needs to be the same for all members.
Members can have properties set as 'their' properties which they broadcast for other members to discover properties about them.
When the current process receives a message on the multicast group, it decrypts, runs verification and then emits events for the upper
layer to consume.

## How do I use it?

Two implementations will exist, Node.JS, and Golang, the Node.JS will be available in npm, the golang implementation will be available as a gomodule.
