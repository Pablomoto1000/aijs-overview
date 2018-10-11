Deep Drums


What it does:
![Animation](/assets/deepdrum.gif)

In this interactive demo, I have used Google Magenta's [DrumsRNN](https://github.com/tensorflow/magenta/tree/master/magenta/models/drums_rnn) to generate continuous drum patterns based on your input pattern inside a seed limit. Based on your seed limit, the Deep Recurrent Neural Network will generate continuous rhythm pattern that sounds awesome after you click on regenerate (red) button!

[Demo](https://gogul09.github.io/software/deep-drum)

- You can change the tempo value interactively (even when play button is on).
- Based on your seed limit, the Deep Recurrent Neural Network (DrumsRNN) will generate continuous rhythm pattern that sounds awesome after you click on regenerate (red) button!
- You can vary the temperature to generate weird rhythm patterns too!
- You can play the pattern using play (cyan) button.

YouTube video instructions [here](https://www.youtube.com/watch?v=sjo6UlQONLc).

How to run:
1) Clone the repository from https://github.com/Gogul09/deep-drum
2) Run the index.html file on a browser.

Dependencies:
Magenta Drums RNN
(https://github.com/tensorflow/magenta/tree/master/magenta/models/drums_rnn)

This model applies language modeling to drum track generation using an LSTM. Unlike melodies, drum tracks are polyphonic in the sense that multiple drums can be struck simultaneously. Despite this, we model a drum track as a single sequence of events by a) mapping all of the different MIDI drums onto a smaller number of drum classes, and b) representing each event as a single value representing the set of drum classes that are struck.

JS code:
All the JS code is invoked via script on Index.html, most of the most revelevant functions of the app is on the file
app.js located in the js folder.
