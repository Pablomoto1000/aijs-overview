# Musical Spinners


## What it does:
![preview](https://aijs.rocks/static/incredible-spinners-5dc0be795124c28bcd0d228d66e1beb8.gif)

It presents a 7x7 grid of musical measures, which you can move around in freely to play music. Each row in the grid is an interpolation between two measures in the latent space. Each column represents a decoding of the same measure for 7 different chords.

## How to run:
1. Clone the repo
2. `cd musical-spinners`
3. `open index.html`


## Dependencies:
### Google Magenta 
Magenta is a research project exploring the role of machine learning in the process of creating art and music. Primarily this involves developing new deep learning and reinforcement learning algorithms for generating songs, images, drawings, and other materials. But it's also an exploration in building smart tools and interfaces that allow artists and musicians to extend (not replace!) their processes using these models. Magenta was started by some researchers and engineers from the Google Brain team but many others have contributed significantly to the project. We use TensorFlow and release our models and tools in open source on our GitHub.

### Tone.js
Tone.js is a framework for creating interactive music in the browser. It provides advanced scheduling capabilities, synths and effects, and intuitive musical abstractions built on top of the Web Audio API.

## Three.js
Javascript 3D library to create visuals

## JS code:
The index.html contains all the scripts attached to it, the most important is the magenamusic.js which is in charge of generate the tones via neural networks using the tone.js framework.

