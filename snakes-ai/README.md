# Sketch Generator

## What it does:
It has 2 modes of play Snake

### Evolution
Our goal here is to evolve an artificial intelligence that learns to play the snake game by itself. To do this, we will create a population of neural networks, where each one gets to control a snake in the classic snake game. Each neural net receives inputs about food distance and angle, as well as potential obstacles (it has no information about other snakes and their food).

However, the snakes don't get told what to do with this information. At the start you will therefore see that the snakes have no idea how to play the game. At the end of each generation, when all snakes reached a score, a genetic algorithm selects snakes for reproduction. It will favor those, that performed better than their peers, by achieving a higher score. For every spot in the population, two snakes will be selected to leave an offspring. The child inherits one half of each parents characteristics and is subject to some random mutations.

Through this evolutionary process there will before long, emerge a snake that sees a pattern in the data and learns to interpret it. From there on, evolution takes its course...

### Webcam Snake
Play the snake game, using your webcam and neural networks for image recognition! This program takes use of Googles Tensorflow port for Javascript (tfjs). It is based on the Pacman example from the tutorial section.

## How to play:
1. Take one or more images for each direction, by clicking on the areas on the right.
2. Press Train to train the neural net on your images.
3. Press Start to play!

## How does it work?
Each frame, the current webcam view goes into to a pretrained neural network model called mobilenet. Mobilenet was trained on millions of images. The output of mobilenet is then given into our neural net (which just trained on your example images). For the final output, our network makes a prediction about which category of your example images, it thinks, it is currently seeing. The snake then moves in the direction linked to the predicted category.
## How to run:
1. Clone the repo
2. `cd sketch-generator`
3. `yarn install`
4. `yarn build`
5. `yarn bundle`
6. `yarn run-demos`
7. `open http://127.0.0.1:8080`

## Dependencies:
### TensorFlow.js
(https://js.tensorflow.org) An open source machine learning library for research and production.
