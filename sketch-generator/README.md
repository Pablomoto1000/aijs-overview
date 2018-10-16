# Sketch Generator

## What it does:
<img src="https://github.com/tensorflow/magenta/raw/master/magenta-logo-bg.png" height="75">

A generative recurrent neural network capable of producing sketches of common objects

sketch-rnn is a generative recurrent neural network capable of producing sketches of common objects, with the goal of training a machine to draw and generalize abstract concepts in a manner similar to humans.

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
(https://js.tensorflow.org) implementations and support libraries for Magenta's musical note-based models including MusicVAE, MelodyRNN, DrumsRNN, PerformanceRNN, and ImprovRNN.

### Sketch
Contains [TensorFlow.js](https://js.tensorflow.org) implementations and support libraries for Magenta's sketch models including [SketchRNN](https://goo.gl/magenta/sketchrnn).

## JS code:
Generating a sketch
Below is the essence of how a sketch is generated. In addition to the original paper, a simple tutorial for understanding how RNNs can generate a set of strokes is here.
```
var model;
var dx, dy; // offsets of the pen strokes, in pixels
var pen_down, pen_up, pen_end; // keep track of whether pen is touching paper
var x, y; // absolute coordinates on the screen of where the pen is
var prev_pen = [1, 0, 0]; // group all p0, p1, p2 together
var rnn_state; // store the hidden states of rnn's neurons
var pdf; // store all the parameters of a mixture-density distribution
var temperature = 0.45; // controls the amount of uncertainty of the model
var line_color;
var model_loaded = false;

// loads the TensorFlow.js version of sketch-rnn model, with the "cat" model's weights.
model = new ms.SketchRNN("https://storage.googleapis.com/quickdraw-models/sketchRNN/models/cat.gen.json");
// code that ensures the above line is run before the below lines are run.

function setup() {
  x = windowWidth/2.0;
  y = windowHeight/3.0;
  createCanvas(windowWidth, windowHeight);
  frameRate(60);

  // initialize the scale factor for the model. Bigger -> large outputs
  model.setPixelFactor(3.0);

  // initialize pen's states to zero.
  [dx, dy, pen_down, pen_up, pen_end] = model.zeroInput(); // the pen's states

  // zero out the rnn's initial states
  rnn_state = model.zeroState();

  // define color of line
  line_color = color(random(64, 224), random(64, 224), random(64, 224));
};

function draw() {

  // see if we finished drawing
  if (prev_pen[2] == 1) {
    noLoop(); // stop drawing
    return;
  }

  // using the previous pen states, and hidden state, get next hidden state
  // the below line takes the most CPU power, especially for large models.
  rnn_state = model.update([dx, dy, pen_down, pen_up, pen_end], rnn_state);

  // get the parameters of the probability distribution (pdf) from hidden state
  pdf = model.getPDF(rnn_state, temperature);

  // sample the next pen's states from our probability distribution
  [dx, dy, pen_down, pen_up, pen_end] = model.sample(pdf);

  // only draw on the paper if the pen is touching the paper
  if (prev_pen[0] == 1) {
    stroke(line_color);
    strokeWeight(3.0);
    line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
  }

  // update the absolute coordinates from the offsets
  x += dx;
  y += dy;

  // update the previous pen's state to the current one we just sampled
  prev_pen = [pen_down, pen_up, pen_end];
};
```
