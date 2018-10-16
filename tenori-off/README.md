# Tenori Off

## What it does:
A music sequencer written in JavaScript which uses Machine Learning to try to match drums to a synth melody you create!

A ✨[Tenori-on](https://en.wikipedia.org/wiki/Tenori-on)✨ is a dope electronic music
instrument sequencer thingie that Yamaha made for a hot minute.  
I love pixels and patterns and generating things out of pixels and patterns, which means
I LOVE the Tenori-on. Since they're rare and
mad [expensive](https://reverb.com/item/11642149-yamaha-tenori-on), I've never seen one,
so I made a JavaScript version of what I think it looks like.

You can change between drums or a synth sound (also using the **D** or **S** keys). The URL also holds the state, so you can send it to a pal to have them listen to your masterpiece. If you hit a bug, refreshing usually makes it go away.

The **Improvise** button will auto generate drums to match your synth using
~*machine learning*~ via [Magenta.js](https://magenta.tensorflow.org/js) and a recurrent neural network. In the browser!!

![gif](https://user-images.githubusercontent.com/1369170/41994031-05b13eea-7a02-11e8-9948-077a0a56b038.gif)

## How to run:
1. Clone the repo
2. `cd musical-spinners`
3. `open index.html`
\

## Dependencies:
### Google Magenta
Magenta is a research project exploring the role of machine learning in the process of creating art and music. Primarily this involves developing new deep learning and reinforcement learning algorithms for generating songs, images, drawings, and other materials. But it's also an exploration in building smart tools and interfaces that allow artists and musicians to extend (not replace!) their processes using these models. Magenta was started by some researchers and engineers from the Google Brain team but many others have contributed significantly to the project. We use TensorFlow and release our models and tools in open source on our GitHub.

### Tone.js
Tone.js is a framework for creating interactive music in the browser. It provides advanced scheduling capabilities, synths and effects, and intuitive musical abstractions built on top of the Web Audio API.
