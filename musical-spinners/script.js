const INTERP_REPEATS = 4;
const INTERP_STEPS = 7;
const MIN_NOTE = 30;
const MAX_NOTE = 84;
const SAMPLER_NOTES = [['C', 'c'], ['E', 'e'], ['G#', 'gs']];
const SAMPLER_OCTAVES = [2, 3, 4, 5];
const TIME_HUMANIZATION = 0.01;
const MAX_RADIUS = 21;
const CHORD_GRID_MAX_RADIUS = MAX_RADIUS / 3;
const CHORD_GRID_CELL_SIZE = CHORD_GRID_MAX_RADIUS * 4;
const WHEEL_BASE_Z = 1;
const NOTE_HEIGHT = 1;
const BASE_CHORD_GRID_OPACITY = 0.5;
const CHORDS = 'Maj7 m7 m7 Maj7 7 m7 m7b5'.split(' ');
const DEGREES = 'I II III IV V VI VII'.split(' ');
const NOTES = 'C D E F G A B'.split(' ');
const INSTRUMENT_COLORS = [
  { r: 57, g: 173, b: 255 },
  { r: 194, g: 230, b: 255 },
  { r: 59, g: 99, b: 127 },
  { r: 156, g: 184, b: 204 }
];
const MAIN_WHEEL_SHAPE_ALPHA = 0.85;
const DEFAULT_DRUM_PITCH_CLASSES = [
  [36, 35], // bass drum
  [38, 27, 28, 31, 32, 33, 34, 37, 39, 40, 56, 65, 66, 75, 85], // snare drum
  [42, 44, 54, 68, 69, 70, 71, 73, 78, 80], // closed hi-hat
  [46, 67, 72, 74, 79, 81], // open hi-hat
  [45, 29, 41, 61, 64, 84], // low tom
  [48, 47, 60, 63, 77, 86, 87], // mid tom
  [50, 30, 43, 62, 76, 83], // high tom
  [49, 55, 57, 58], // crash cymbal
  [51, 52, 53, 59, 82] // ride cymbal
];
const MODE_NAMES = [
  'Major',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Natural Minor',
  'Locrian'
];

let mode = _.random(CHORDS.length - 1);
let tonic = _.sample(NOTES);
let currentOutput = playNote;

let visEl = document.querySelector('.vis'),
  introEl = document.querySelector('.intro'),
  tonicControlEl = document.querySelector('#tonic-control'),
  modeControlEl = document.querySelector('#mode-control'),
  generateButtonEl = document.querySelector('#generate-button'),
  introControlsEl = document.querySelector('#intro-controls'),
  loadingEl = document.querySelector('#loading'),
  regenLeftEl = document.querySelector('#regen-left'),
  regenRightEl = document.querySelector('#regen-right'),
  settingsCalloutEl = document.querySelector('#settings-callout'),
  halpCalloutEl = document.querySelector('#halp-callout'),
  settingsEl = document.querySelector('#settings'),
  tempoControlEl = document.querySelector('#tempo'),
  tempoValueEl = document.querySelector('#tempo-value'),
  outputEl = document.querySelector('#output'),
  halpEl = document.querySelector('#halp');

modeControlEl.value = '' + mode;
tonicControlEl.value = tonic;

let vae = new mm.MusicVAE(
  'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/multitrack_chords'
);
let Tone = mm.Player.tone;

let reverb = new Tone.Reverb().toMaster();
reverb.wet.value = 0.5;

let drumChain = new Tone.Gain(0.75).connect(reverb);
let drumKit = _.range(0, 41).map(idx =>
  new Tone.Player(`https://cdn.glitch.com/5df003ea-b446-4579-a451-303ec6173249/rimshot${idx + 1}.mp3`).connect(
    new Tone.Panner(Math.random() - 0.5).connect(drumChain)
  )
);

let grottyBellBuffers = [
  loadBuffers('grotty-bell', 'low'),
  loadBuffers('grotty-bell', 'med'),
  loadBuffers('grotty-bell', 'hi')
];
let marimbaBuffers = [
  loadBuffers('marimba7-sustain', 'low'),
  loadBuffers('marimba7-sustain', 'med'),
  loadBuffers('marimba7-sustain', 'hi')
];

let grottyBell1EchoedChain = new Tone.Panner(-0.4)
  .connect(
    new Tone.PingPongDelay('8n.', 0.1).connect(
      new Tone.Gain(0.5).connect(reverb)
    )
  )
  .connect(reverb);
let grottyBell1DryChain = new Tone.Panner(-0.4)
  .connect(new Tone.Gain(0.5).connect(reverb))
  .connect(reverb);
let grottyBell1Echoed = grottyBellBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(grottyBell1EchoedChain)
);
let grottyBell1Dry = grottyBellBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(grottyBell1DryChain)
);

let grottyBell2EchoedChain = new Tone.Panner(0.4)
  .connect(
    new Tone.PingPongDelay('16n.', 0.1).connect(
      new Tone.Gain(0.5).connect(reverb)
    )
  )
  .connect(reverb);
let grottyBell2DryChain = new Tone.Panner(0.4)
  .connect(new Tone.Gain(0.5).connect(reverb))
  .connect(reverb);
let grottyBell2Echoed = grottyBellBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(grottyBell2EchoedChain)
);
let grottyBell2Dry = grottyBellBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(grottyBell2DryChain)
);

let marimba1Chain = new Tone.Panner(0.25).connect(
  new Tone.Gain(0.55).connect(reverb)
);
let marimba1 = marimbaBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(marimba1Chain)
);
let marimba2Chain = new Tone.Panner(-0.25).connect(
  new Tone.Gain(0.55).connect(reverb)
);
let marimba2 = marimbaBuffers.map(bufs =>
  new Tone.Sampler(bufs).connect(marimba2Chain)
);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  45,
  visEl.offsetWidth / visEl.offsetHeight,
  1,
  750
);
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(visEl.offsetWidth, visEl.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
let orbitControls = new THREE.OrbitControls(camera, visEl);
orbitControls.enablePan = false;
orbitControls.enableRotate = false;
orbitControls.enableKeys = false;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 400;
orbitControls.enableDamping = true;
camera.position.set(0, 0, 30);
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.background = new THREE.Color(0x111111);

let light = new THREE.PointLight(0xffffff, 0.5);
light.castShadow = true;
light.position.set(1, 1, 50);
light.lookAt(new THREE.Vector3(0, 0, 0));
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.radius = 10;
scene.add(light);

let light2 = new THREE.PointLight(0xffffff, 0.5);
light2.castShadow = true;
light2.position.set(-1, -1, 50);
light2.lookAt(new THREE.Vector3(0, 0, 0));
light2.shadow.mapSize.width = 2048;
light2.shadow.mapSize.height = 2048;
light2.shadow.radius = 10;
scene.add(light2);

var ambLight = new THREE.AmbientLight(0xffffff);
scene.add(ambLight);

// var helper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(helper);

let baseInstrumentMaterials = INSTRUMENT_COLORS.map(
  ({ r, g, b }) =>
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 1, 1),
      transparent: true,
      opacity: BASE_CHORD_GRID_OPACITY
    })
);

let mainWheelShapeGroup,
  chordGrid,
  gridGroup,
  shapeHopTween,
  subspace,
  currentChord = Math.floor(CHORDS.length / 2),
  currentVariation = Math.floor(INTERP_STEPS / 2),
  mainWheelShapes = [],
  percussionPlate,
  part,
  destroyChordGrid,
  currentlyPlayingSample,
  userHasInteracted = false,
  initDolly;

orbitControls.update();
visEl.appendChild(renderer.domElement);

document.addEventListener('mousemove', event => {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ((event.clientX - visEl.offsetLeft) / visEl.offsetWidth) * 2 - 1;
  mouse.y = -((event.clientY - visEl.offsetTop) / visEl.offsetHeight) * 2 + 1;
});

function capHeight(v) {
  return Math.min(v, 1);
}

function getChordDegrees(mode) {
  let chords = Tonal.Array.rotate(mode, CHORDS);
  return chords.map((chord, i) => {
    const deg = DEGREES[i];
    return chord[0] === 'm' ? deg.toLowerCase() : deg;
  });
}

function getChords(mode, tonic) {
  let chords = Tonal.Array.rotate(mode, CHORDS);
  let cs = Tonal.Array.rotate(mode, NOTES);
  let intervals = cs.map(Tonal.Distance.interval(cs[0]));
  let scale = intervals.map(Tonal.Distance.transpose(tonic));
  return scale.map((tonic, i) => tonic + chords[i]);
}

function arpeggiate(notes, time) {
  let arpAmt = Math.random() < 0.6 ? Tone.Time('16n').toSeconds() : 0;
  return _.shuffle(notes).map((note, idx) => ({
    note,
    noteTime: idx % 2 === 0 ? time : time + arpAmt
  }));
}

function loadBuffers(instrumentPrefix, velocity) {
  return _.fromPairs(
    _.flatMap(SAMPLER_OCTAVES, octave =>
      _.map(SAMPLER_NOTES, note => [
        note[0] + octave,
        new Tone.Buffer(
          `https://cdn.glitch.com/5df003ea-b446-4579-a451-303ec6173249/${instrumentPrefix}-${velocity ? velocity + '-' : ''}${
            note[1]
          }${octave}.mp3`
        )
      ])
    )
  );
}

function getWorldCoordinate(screenX, screenY) {
  let vector = new THREE.Vector3();
  vector.set(
    (screenX / window.innerWidth) * 2 - 1,
    -(screenY / window.innerHeight) * 2 + 1,
    0.5
  );
  vector.unproject(camera);
  let dir = vector.sub(camera.position).normalize();
  let distance = -camera.position.z / dir.z;
  let position = camera.position.clone().add(dir.multiplyScalar(distance));
  return position;
}

function isInOverlays(evt) {
  let el = evt.target;
  while (el) {
    if (el.classList.contains('modal') || el.classList.contains('callout')) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function positionChordGridToCurrent(
  chord,
  variation,
  previousChord = null,
  previousVariation = null,
  movePos = true,
  fadeShape = true
) {
  let shape = chordGrid[variation][chord];
  if (movePos) {
    new TWEEN.Tween(gridGroup.position)
      .to({ x: -shape.pt.x, y: -shape.pt.y }, 500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    // "hop" to the next position
    if (shapeHopTween) shapeHopTween.stop();
    gridGroup.position.z = 0;
    shapeHopTween = new TWEEN.Tween(gridGroup.position)
      .to({ z: -7.5 }, 250)
      .easing(TWEEN.Easing.Quadratic.Out)
      .repeat(1)
      .yoyo(true)
      .start();
  }
  if (fadeShape) {
    shape.faders = [];
    shape.group.traverse(node => {
      if (node.material) {
        shape.faders.push(
          new TWEEN.Tween(node.material)
            .to({ opacity: 0 }, 500)
            .delay(100)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
        );
      }
    });
  }
  if (_.isNumber(previousChord) && _.isNumber(previousVariation)) {
    let prevShape = chordGrid[previousVariation][previousChord];
    if (prevShape.faders) {
      prevShape.faders.forEach(f => f.stop());
    }
    prevShape.group.traverse(node => {
      if (node.material) {
        new TWEEN.Tween(node.material)
          .to({ opacity: BASE_CHORD_GRID_OPACITY }, 500)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
      }
    });
  }
}

function buildChordShape(
  seq,
  maxRadius = MAX_RADIUS / 3,
  color = false,
  attachToNotes = false
) {
  let slices = seqToSlices(seq);
  let seqGroup = new THREE.Group();
  let largestRadius = 0;
  for (let note of seq.notes.filter(isIncludedNote)) {
    let { relHeight, startAngle, angleWidth } = slices.get(note);
    let noteGeom = new THREE.CircleGeometry(
      capHeight(relHeight) * maxRadius,
      Math.floor(angleWidth * 10),
      startAngle,
      angleWidth
    );
    let material = baseInstrumentMaterials[note.instrument].clone();
    if (color) {
      let { r, g, b } = INSTRUMENT_COLORS[note.instrument];
      material.color.setRGB(r / 255, g / 255, b / 255);
    }
    let shape = new THREE.Mesh(noteGeom, material);
    shape.rotation.z = -Math.PI / 2;
    shape.position.z = note.baseZ / 10;
    seqGroup.add(shape);
    largestRadius = Math.max(capHeight(relHeight) * maxRadius, largestRadius);
    if (attachToNotes) {
      note.shape = shape;
    }
  }
  return { group: seqGroup, radius: largestRadius };
}

function buildChordGrid(subspace, onChange) {
  let closestChord, closestVariation;

  gridGroup = new THREE.Group();
  chordGrid = [];

  let dragLastAt;

  for (let variation = 0; variation < subspace.length; variation++) {
    let varShapes = [];
    chordGrid.push(varShapes);
    for (let chord = 0; chord < CHORDS.length; chord++) {
      let seq = subspace[variation][chord];
      let shape = buildChordShape(seq, CHORD_GRID_MAX_RADIUS);
      shape.pt = new THREE.Vector3(
        variation * CHORD_GRID_CELL_SIZE,
        -chord * CHORD_GRID_CELL_SIZE,
        0
      );
      shape.group.position.x = shape.pt.x;
      shape.group.position.y = shape.pt.y;
      varShapes.push(shape);
      gridGroup.add(shape.group);
    }
  }
  scene.add(gridGroup);

  function onKeyDown(evt) {
    if (evt.metaKey) return;
    let newChord = currentChord,
      newVariation = currentVariation;
    if (evt.keyCode === 38 && currentChord > 0) {
      newChord = currentChord - 1;
    } else if (evt.keyCode === 40 && currentChord < CHORDS.length - 1) {
      newChord = currentChord + 1;
    } else if (evt.keyCode === 37 && currentVariation > 0) {
      newVariation = currentVariation - 1;
    } else if (evt.keyCode === 39 && currentVariation < subspace.length - 1) {
      newVariation = currentVariation + 1;
    } else if (evt.key === 'q') {
      newVariation = 0;
    } else if (evt.key === 'w') {
      newVariation = 1;
    } else if (evt.key === 'e') {
      newVariation = 2;
    } else if (evt.key === 'r') {
      newVariation = 3;
    } else if (evt.key === 't') {
      newVariation = 4;
    } else if (evt.key === 'y') {
      newVariation = 5;
    } else if (evt.key === 'u') {
      newVariation = 6;
    } else if (evt.key === '1') {
      newChord = 0;
    } else if (evt.key === '2') {
      newChord = 1;
    } else if (evt.key === '3') {
      newChord = 2;
    } else if (evt.key === '4') {
      newChord = 3;
    } else if (evt.key === '5') {
      newChord = 4;
    } else if (evt.key === '6') {
      newChord = 5;
    } else if (evt.key === '7') {
      newChord = 6;
    }
    if (newChord !== currentChord || newVariation !== currentVariation) {
      let previousChord = currentChord;
      let previousVariation = currentVariation;
      onChange(newVariation, newChord);
      positionChordGridToCurrent(
        currentChord,
        currentVariation,
        previousChord,
        previousVariation
      );
      evt.preventDefault();
    }
    userHasInteracted = true;
    settingsCalloutEl.classList.add('visible');
    halpCalloutEl.classList.add('visible');
    if (initDolly) initDolly.stop();
  }

  function onMouseDown(evt) {
    if (isInOverlays(evt)) return;
    dragLastAt = getWorldCoordinate(evt.clientX, evt.clientY);
    userHasInteracted = true;
    settingsCalloutEl.classList.add('visible');
    halpCalloutEl.classList.add('visible');
    if (initDolly) initDolly.stop();
    evt.preventDefault();
  }

  function onMouseMove(evt) {
    if (isInOverlays(evt)) return;
    let mouseNowAt = getWorldCoordinate(evt.clientX, evt.clientY);
    let mouseRelGrid = mouseNowAt.clone().sub(gridGroup.position);

    // Find the chord closest to the mouse position
    let minDist = Number.MAX_VALUE,
      newClosestChord,
      newClosestVr;
    for (let vr = 0; vr < chordGrid.length; vr++) {
      for (let chord = 0; chord < chordGrid[vr].length; chord++) {
        let dist = Math.abs(
          chordGrid[vr][chord].group.position.clone().distanceTo(mouseRelGrid)
        );
        if (dist < CHORD_GRID_CELL_SIZE / 2 && dist < minDist) {
          minDist = dist;
          newClosestChord = chord;
          newClosestVr = vr;
        }
      }
    }
    if (newClosestChord !== closestChord || newClosestVr !== closestVariation) {
      let closestScreenPosTop, closestScreenPosBottom;
      if (_.isNumber(newClosestChord) && _.isNumber(newClosestVr)) {
        let shape = chordGrid[newClosestVr][newClosestChord];
        shape.group.traverse(s => {
          if (s.material) {
            new TWEEN.Tween(s.material)
              .to({ opacity: 0.9 }, 100)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start();
          }
        });
        new TWEEN.Tween(shape.group.scale)
          .to({ x: 1.2, y: 1.2 }, 100)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
        closestScreenPosTop = shape.group.getWorldPosition().clone();
        closestScreenPosTop.y += shape.radius;
        closestScreenPosTop.project(camera);
        closestScreenPosBottom = shape.group.getWorldPosition().clone();
        closestScreenPosBottom.y -= shape.radius;
        closestScreenPosBottom.project(camera);
      }
      if (_.isNumber(closestChord) && _.isNumber(closestVariation)) {
        chordGrid[closestVariation][closestChord].group.traverse(s => {
          if (s.material) {
            new TWEEN.Tween(s.material)
              .to({ opacity: BASE_CHORD_GRID_OPACITY }, 100)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start();
          }
        });
        new TWEEN.Tween(chordGrid[closestVariation][closestChord].group.scale)
          .to({ x: 1, y: 1 }, 100)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
      }
      closestChord = newClosestChord;
      closestVariation = newClosestVr;
    }

    // If dragging, handle pan
    if (dragLastAt) {
      // Translate the grid based on how much has been dragged
      let diff = mouseNowAt.clone().sub(dragLastAt);
      gridGroup.position.add(diff);
      dragLastAt = mouseNowAt;

      // Find the seq now closest to the center
      let minLen = Number.MAX_VALUE,
        minChord,
        minVr;
      for (let vr = 0; vr < chordGrid.length; vr++) {
        for (let chord = 0; chord < chordGrid[vr].length; chord++) {
          let len = chordGrid[vr][chord].group.position
            .clone()
            .add(gridGroup.position)
            .length();
          if (len < minLen) {
            minLen = len;
            minChord = chord;
            minVr = vr;
          }
        }
      }

      // Switch seqs if they're different now
      if (minChord !== currentChord || minVr !== currentVariation) {
        let previousChord = currentChord;
        let previousVariation = currentVariation;
        onChange(minVr, minChord);
        positionChordGridToCurrent(
          currentChord,
          currentVariation,
          previousChord,
          previousVariation,
          false
        );
      }
    }
  }

  function onMouseUp(evt) {
    if (isInOverlays(evt)) return;
    dragLastAt = null;
    if (_.isNumber(closestChord) && _.isNumber(closestVariation)) {
      let previousChord = currentChord;
      let previousVariation = currentVariation;
      onChange(closestVariation, closestChord);
      positionChordGridToCurrent(
        currentChord,
        currentVariation,
        previousChord,
        previousVariation
      );
      evt.preventDefault();
      return;
    }
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

function seqToEvents(seq) {
  let quarter = Tone.TransportTime('4n').toSeconds();
  return _.toPairs(
    _.groupBy(
      seq.notes.map(note => ({
        origNote: note,
        time: (note.quantizedStartStep / 24) * quarter
      })),
      'time'
    )
  ).map(([time, notes]) => [time, notes.map(n => n.origNote)]);
}

function seqToSlices(seq) {
  let notes = seq.notes.filter(isIncludedNote);
  let slices = new Map();
  for (let note of _.sortBy(notes, 'quantizedStartStep', 'quantizedEndStep')) {
    let relStart = note.quantizedStartStep / seq.totalQuantizedSteps;
    let relEnd = note.quantizedEndStep / seq.totalQuantizedSteps;
    let relHeight = 1 - (note.pitch - MIN_NOTE) / (MAX_NOTE - MIN_NOTE);
    let startAngle = (1 - relEnd) * Math.PI * 2 + Math.PI / 2;
    let angleWidth = (relEnd - relStart) * Math.PI * 2 - 0.02;
    slices.set(note, { relHeight, startAngle, angleWidth });
  }
  return slices;
}

// Turn a note sequence into a playable Tone.js Part
function makePart(seq) {
  let quarter = Tone.TransportTime('4n').toSeconds();
  let part = new Tone.Part((time, notes) => {
    let notesByInstrumentGroup = _.groupBy(notes, n => n.instrument % 2);
    _.forEach(notesByInstrumentGroup, notes => {
      for (let { note, noteTime } of arpeggiate(notes, time)) {
        currentOutput(note, noteTime, quarter);
      }
    });
  }, seqToEvents(seq));

  part.loop = true;
  part.loopStart = 0;
  part.loopEnd = (seq.totalQuantizedSteps / 24) * quarter;
  return part;
}

function stackNotes(seq, baseZ = WHEEL_BASE_Z, noteHeight = NOTE_HEIGHT) {
  let notes = seq.notes.filter(isIncludedNote);
  // Stack notes to obtain zs
  let stackedNotes = [];
  for (let note of _.sortBy(notes, 'pitch')) {
    let stack = stackedNotes.filter(
      n =>
        note.quantizedEndStep > n.quantizedStartStep &&
        n.quantizedEndStep > note.quantizedStartStep
    );
    if (stack.length) {
      let maxZ = _.max(stack.map(n => n.baseZ));
      note.baseZ = maxZ + noteHeight;
    } else {
      note.baseZ = baseZ;
    }
    stackedNotes.push(note);
  }
  let maxZ = _.max(notes.map(n => n.baseZ));
  if (maxZ > 10) {
    for (let note of notes) {
      note.baseZ /= 2;
    }
  }
}

function isIncludedNote(note) {
  return !note.isDrum && note.instrument < 4;
}

function generateSample(mode, tonic, sampleSeqs) {
  let sourceSeq = _.sample(sampleSeqs);
  let chord = getChords(mode, tonic)[0];
  return vae.encode([sourceSeq], [sourceSeq.chord]).then(z => {
    return vae
      .decode(z, null, [chord])
      .then(results => ({ seq: results[0], z }));
  });
}

function defer(value) {
  return new Promise(res => setTimeout(() => res(value), 16));
}

function generateSubspace(samples, mode, tonic) {
  generateButtonEl.disabled = true;
  generateButtonEl.textContent = 'Generating 0%';
  let currentStep = 0;
  let totalSteps = CHORDS.length + 1;

  function reportStep(value) {
    currentStep++;
    let pct = Math.round((currentStep / totalSteps) * 100);
    generateButtonEl.textContent = `Generating ${pct}%`;
    return value;
  }

  let chords = getChords(mode, tonic);
  let disposables = [];
  return defer()
    .then(() => {
      let z = mm.tf.concat(samples.map(s => s.z));
      disposables.push(z);
      disposables = disposables.concat(samples.map(s => s.z));
      return mm.tf.tidy(() => vae.getInterpolatedZs(z, INTERP_STEPS));
    })
    .then(reportStep)
    .then(defer)
    .then(interpolatedZs => {
      disposables = disposables.concat(interpolatedZs);
      let all = [];
      let res = Promise.resolve();
      for (let chord of chords) {
        res = res.then(() =>
          vae
            .decode(interpolatedZs, 0.2, [chord])
            .then(seqs => all.push(seqs))
            .then(reportStep)
            .then(defer)
            .then(res)
        );
      }
      return res.then(() => all);
    })
    .then(all => {
      disposables.forEach(z => z.dispose());
      return all;
    });
}

function playNote(note, time, quarter = Tone.TransportTime('4n').toSeconds()) {
  let humanizedTime = time + Math.random() * TIME_HUMANIZATION;
  let freq = new Tone.Frequency(note.pitch, 'midi');
  let durationSteps = note.quantizedEndStep - note.quantizedStartStep;
  let duration = (durationSteps / 24) * quarter;
  let velocity = note.velocity / 128;

  if (!note.isDrum) {
    if (note.quantizedStartStep > 0 && Math.random() < 0.1) return;
    if (note.instrument === 0) {
      let instr = Math.random() < 0.45 ? grottyBell1Echoed : grottyBell1Dry;
      let velocityIndex = Math.floor(velocity * instr.length);
      instr[velocityIndex].triggerAttackRelease(freq, duration, humanizedTime);
    } else if (note.instrument === 1) {
      let tFreq = Math.random() < 0.8 ? freq.transpose(-12) : freq;
      let velocityIndex = Math.floor(velocity * marimba1.length);
      marimba1[velocityIndex].triggerAttack(tFreq, humanizedTime);
    } else if (note.instrument === 2) {
      let tFreq = Math.random() < 0.8 ? freq.transpose(12) : freq;
      let instr = Math.random() < 0.65 ? grottyBell2Echoed : grottyBell2Dry;
      let velocityIndex = Math.floor(velocity * instr.length);
      instr[velocityIndex].triggerAttackRelease(tFreq, duration, humanizedTime);
    } else if (note.instrument === 3) {
      let velocityIndex = Math.floor(velocity * marimba2.length);
      marimba2[velocityIndex].triggerAttack(freq, humanizedTime);
    }
    Tone.Draw.schedule(() => animatePlay(note, quarter), humanizedTime);
  } else {
    let thirtySecond = Tone.Time('32n').toSeconds();
    let sixteenth = Tone.Time('16n').toSeconds();
    let dottedSixteenth = Tone.Time('16n.').toSeconds();
    let eighth = Tone.Time('8n').toSeconds();
    let dottedEighth = Tone.Time('8n.').toSeconds();
    if (!note.drum) {
      note.drum = _.sample(drumKit);
    }
    let times = [humanizedTime];
    if (Math.random() < 0.075) {
      times[0] += eighth;
    } else if (Math.random() < 0.075) {
      times[0] += sixteenth;
    } else if (Math.random() < 0.075) {
      times[0] += dottedEighth;
    } else if (Math.random() < 0.075) {
      times.push(humanizedTime + eighth);
    } else if (Math.random() < 0.075) {
      times.push(humanizedTime + sixteenth);
    } else if (Math.random() < 0.075) {
      times.push(humanizedTime + thirtySecond);
    } else if (Math.random() < 0.03) {
      times.push(humanizedTime + dottedSixteenth);
      times.push(humanizedTime + dottedSixteenth * 2);
    }
    if (Math.random() < 0.1) {
      times.length = 0;
    }
    note.drum.playbackRate =
      Math.random() < 0.4 ? _.random(1.5, 4) : _.random(0.1, 0.7);
    for (let time of times) {
      note.drum.start(time).stop(time + sixteenth);
      Tone.Draw.schedule(() => animatePercussion(quarter), time);
    }
  }
}

function playMidiNote(output) {
  return function(note, time, quarter = Tone.TransportTime('4n').toSeconds()) {
    let delay = (Tone.context.currentTime - time) * 1000;
    let freq = new Tone.Frequency(note.pitch, 'midi');
    let durationSteps = note.quantizedEndStep - note.quantizedStartStep;
    let duration = (durationSteps / 24) * quarter;
    let velocity = note.velocity / 128;
    let channel;
    if (!note.isDrum) {
      channel = note.instrument + 1;
      Tone.Draw.schedule(() => animatePlay(note, quarter), time);
    } else {
      channel = 7;
      Tone.Draw.schedule(() => animatePercussion(quarter), time);
    }
    output.playNote(freq.toMidi(), channel, {
      duration: duration * 1000,
      time: WebMidi.time + delay,
      velocity
    });
  };
}

function animatePlay(note, quarter) {
  if (!note.shape) return;
  let steps = note.quantizedEndStep - note.quantizedStartStep;
  let dur = (steps / 24) * quarter;
  //let dur = quarter / 4;
  let { r, g, b } = INSTRUMENT_COLORS[note.instrument];
  note.shape.material.color.setRGB(1, 1, 1);
  new TWEEN.Tween(note.shape.material.color)
    .to({ r: r / 255, g: g / 255, b: b / 255 }, dur * 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
  note.shape.scale.set(1.05, 1.05, 1);
  new TWEEN.Tween(note.shape.scale)
    .to({ x: 1, y: 1, z: 1 }, dur * 2 * 1000)
    .easing(TWEEN.Easing.Elastic.Out)
    .start();
}

function animatePercussion(quarter) {
  if (percussionPlate) {
    percussionPlate.material.opacity = 0.2;
    let dur = quarter / 2;
    new TWEEN.Tween(percussionPlate.material)
      .to({ opacity: 0 }, dur * 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
}

function animateChordSwitch(
  shapes,
  percussionPlate,
  seq,
  fromVariation,
  fromChord,
  toVariation,
  toChord
) {
  let fromMorphTarget = fromVariation * DEGREES.length + fromChord;
  let toMorphTarget = toVariation * DEGREES.length + toChord;
  let orphanShapes = new Set(shapes);
  for (let note of seq.notes) {
    if (note.shape) {
      // Animate to z-position
      new TWEEN.Tween(note.shape.position)
        .to({ z: note.baseZ }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
      // Fade in in case was previously not shown
      new TWEEN.Tween(note.shape.material)
        .to({ opacity: MAIN_WHEEL_SHAPE_ALPHA }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
      // Remove from orphan shapes - we only want those with no currently associated note left there
      orphanShapes.delete(note.shape);
    }
  }

  // Morph into new shapes
  for (let shape of shapes) {
    new TWEEN.Tween(shape.morphTargetInfluences)
      .to({ [fromMorphTarget]: 0, [toMorphTarget]: 1 }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }
  // Fade out orphan shapes
  for (let shape of orphanShapes) {
    new TWEEN.Tween(shape.material)
      .to({ opacity: 0 }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
    new TWEEN.Tween(shape.position)
      .to({ z: -1 }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }
  // Morph percussion plate (size)
  new TWEEN.Tween(percussionPlate.morphTargetInfluences)
    .to({ [fromMorphTarget]: 0, [toMorphTarget]: 1 }, 500)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();
}

// Take the full interpolation subspace and return all the Three.js shapes
// that represent it - different interpolations stored as different
// morph targets of the shapes.
function buildMainWheel(subspace) {
  // Initialize geometries for maximal amount of notes, per instrument.
  let allNoteGeometries = _.range(4).map(() => []);
  for (let i = 0; i < subspace.length; i++) {
    for (let j = 0; j < subspace[i].length; j++) {
      let notes = subspace[i][j].notes.filter(isIncludedNote);
      let notesByInstrument = _.groupBy(notes, 'instrument');
      _.forEach(notesByInstrument, (notes, instrument) => {
        while (allNoteGeometries[instrument].length < notes.length) {
          allNoteGeometries[instrument].push(
            new THREE.CylinderGeometry(1, 1, 3, 32, 1, false, 0, 1)
          );
        }
      });
    }
  }

  // Blank geometry to use for unpopulated notes
  let blankGeom = new THREE.CylinderGeometry(1, 1, 3, 32, 1, false, 0, 1);

  // Populate morph targets for each geometry, per interpolation & chord.
  let notesPerGeometry = new Map();
  for (let i = 0; i < subspace.length; i++) {
    for (let j = 0; j < subspace[i].length; j++) {
      // Clone of geometry data structure for this chord-interpolation
      let noteGeometries = allNoteGeometries.map(_.clone);

      // Consume geometries and populate morph targets for every note.
      let seq = subspace[i][j];
      let slices = seqToSlices(seq);
      let notes = seq.notes.filter(isIncludedNote);
      let notesByInstrument = _.groupBy(notes, 'instrument');
      _.forEach(notesByInstrument, (notes, instrument) => {
        for (let note of notes) {
          let { relHeight, startAngle, angleWidth } = slices.get(note);
          let geometry = noteGeometries[instrument].shift();
          let morphGeom = new THREE.CylinderGeometry(
            capHeight(relHeight) * MAX_RADIUS + 0.1,
            capHeight(relHeight) * MAX_RADIUS,
            NOTE_HEIGHT,
            32,
            1,
            false,
            startAngle,
            angleWidth
          );
          geometry.morphTargets.push({
            name: `${i}-${j}`,
            vertices: morphGeom.vertices
          });
          if (!notesPerGeometry.has(geometry)) {
            notesPerGeometry.set(geometry, []);
          }
          notesPerGeometry.get(geometry).push(note);
        }
      });

      // Add morph targets for blank notes for anything still left.
      for (let instrGeoms of noteGeometries) {
        for (let geom of instrGeoms) {
          geom.morphTargets.push({
            name: `${i}-${j}`,
            vertices: blankGeom.clone().vertices
          });
        }
      }
    }
  }

  // Create shapes from all geometries thus built
  let shapes = [];
  for (
    let instrument = 0;
    instrument < allNoteGeometries.length;
    instrument++
  ) {
    let { r, g, b } = INSTRUMENT_COLORS[instrument];
    for (let geom of allNoteGeometries[instrument]) {
      let material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r / 255, g / 255, b / 255),
        transparent: true,
        opacity: MAIN_WHEEL_SHAPE_ALPHA,
        morphTargets: true
      });
      let shape = new THREE.Mesh(geom, material);
      shape.castShadow = true;
      shape.receiveShadow = true;
      shape.rotateX(Math.PI / 2);
      shape.updateMorphTargets();
      shape.morphTargetInfluences[
        Math.floor((CHORDS.length * INTERP_STEPS) / 2)
      ] = 1;
      shape.position.z = notesPerGeometry.get(geom)[0].baseZ;
      shapes.push(shape);

      for (let note of notesPerGeometry.get(geom)) {
        note.shape = shape;
      }
    }
  }
  return shapes;
}

function buildPercussionPlate(subspace) {
  let baseGeometry = new THREE.CircleGeometry(0.1, 64);
  for (let i = 0; i < subspace.length; i++) {
    for (let j = 0; j < subspace[i].length; j++) {
      let seq = subspace[i][j];
      let slices = seqToSlices(seq);
      let maxHeight = _.max(Array.from(slices.values()).map(s => s.relHeight));
      let geometry = new THREE.CircleGeometry(
        capHeight(maxHeight) * MAX_RADIUS + 2,
        64
      );
      baseGeometry.morphTargets.push({
        name: `${i}-${j}`,
        vertices: geometry.vertices
      });
    }
  }
  let material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    morphTargets: true,
    transparent: true,
    opacity: 0
  });
  let plate = new THREE.Mesh(baseGeometry, material);
  plate.position.z = -2;
  plate.updateMorphTargets();
  plate.morphTargetInfluences[
    Math.floor((CHORDS.length * INTERP_STEPS) / 2)
  ] = 1;
  return plate;
}

function switchChordVariation(newChord, newVariation, doPosition = false) {
  let prevVariation = currentVariation;
  let prevChord = currentChord;
  currentVariation = newVariation;
  currentChord = newChord;
  part.removeAll();
  for (let [t, notes] of seqToEvents(
    subspace[currentVariation][currentChord]
  )) {
    part.add(t, notes);
  }
  animateChordSwitch(
    mainWheelShapes,
    percussionPlate,
    subspace[currentVariation][currentChord],
    prevVariation,
    prevChord,
    currentVariation,
    currentChord
  );
  if (doPosition) {
    positionChordGridToCurrent(
      currentChord,
      currentVariation,
      prevChord,
      prevVariation,
      true
    );
  }
}

// Animate the transition from the intro screen to the built chord grid
function animateChordGridBuild(seedShapes) {
  let middleVr = Math.floor(INTERP_STEPS / 2);
  let middleChord = Math.floor(CHORDS.length / 2);
  let maxVrSteps = middleVr;
  let stepTime = 200;
  let staggerTime = 150;
  let allTweens = [];

  // Animate the seed shapes out first
  for (let seedShape of seedShapes) {
    new TWEEN.Tween(seedShape.position)
      .to({ x: 0, y: 0 }, 500)
      .easing(TWEEN.Easing.Back.In)
      .start();
    seedShape.traverse(node => {
      if (node.material) {
        new TWEEN.Tween(node.material)
          .to({ opacity: 0 }, 500)
          .delay(500)
          .easing(TWEEN.Easing.Quadratic.In)
          .start();
      }
    });
  }

  // Animate the entry of each chord in the chord grid
  for (let vr = 0; vr < chordGrid.length; vr++) {
    for (let chord = 0; chord < chordGrid[vr].length; chord++) {
      let vrSteps = Math.abs(vr - middleVr);
      let vrSign = Math.sign(vr - middleVr);
      let chordSteps = Math.abs(chord - middleChord);
      let chordSign = Math.sign(chord - middleChord);
      let delayToChords =
        (maxVrSteps - vrSteps) * stepTime +
        (maxVrSteps - vrSteps + 1) * staggerTime;
      let { group, pt } = chordGrid[vr][chord];
      group.position.x = middleVr * CHORD_GRID_CELL_SIZE;
      group.position.y = -middleChord * CHORD_GRID_CELL_SIZE;
      let tween;
      for (let vrStep = 1; vrStep <= vrSteps; vrStep++) {
        let nextTween = new TWEEN.Tween(group.position)
          .to(
            {
              x: (middleVr + vrStep * vrSign) * CHORD_GRID_CELL_SIZE,
              y: -middleChord * CHORD_GRID_CELL_SIZE
            },
            stepTime
          )
          .delay(staggerTime)
          .easing(TWEEN.Easing.Quadratic.InOut);
        tween ? tween.chain(nextTween) : nextTween.delay(1000).start();
        tween = nextTween;
      }
      for (let chordStep = 1; chordStep <= chordSteps; chordStep++) {
        let nextTween = new TWEEN.Tween(group.position)
          .to(
            {
              x: pt.x,
              y: -(middleChord + chordStep * chordSign) * CHORD_GRID_CELL_SIZE
            },
            stepTime
          )
          .easing(TWEEN.Easing.Quadratic.InOut);
        tween
          ? tween.chain(nextTween.delay(delayToChords))
          : nextTween.delay(1000 + delayToChords - staggerTime).start();
        tween = nextTween;
        delayToChords = staggerTime;
      }
      tween && allTweens.push(tween);
    }
  }

  // Animate camera zoom out
  let zoomOutOne = new TWEEN.Tween(camera.position)
    .to(
      { z: 250, y: /*-5*/ 0 },
      (middleVr * stepTime + middleChord * stepTime) * 1.2
    )
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
  allTweens.push(zoomOutOne);

  let introFadePromise = new Promise(res => {
    introEl.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 500,
      easing: 'ease-in'
    }).onfinish = () => {
      introEl.style.display = 'none';
      res();
    };
  });
  let allTweenPromises = allTweens.map(t => new Promise(r => t.onComplete(r)));
  return Promise.all(allTweenPromises.concat([introFadePromise]));
}

// Manipulate camera and current chord variation to showcase the app
function runIntroSequence() {
  initDolly = new TWEEN.Tween(camera.position)
    .to({ z: 80 }, Tone.Time('4m').toMilliseconds())
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
  switchChordVariation(0, 3, true);
  Tone.Transport.scheduleOnce(() => {
    if (userHasInteracted) return;
    switchChordVariation(3, 3, true);
    Tone.Transport.scheduleOnce(() => {
      if (userHasInteracted) return;
      switchChordVariation(5, 2, true);
      Tone.Transport.scheduleOnce(() => {
        if (userHasInteracted) return;
        switchChordVariation(6, 4, true);
        Tone.Transport.scheduleOnce(() => {
          if (userHasInteracted) return;
          switchChordVariation(0, 3, true);
          setTimeout(() => {
            halpCalloutEl.classList.add('visible');
            settingsCalloutEl.classList.add('visible');
          }, 1000);
        }, '+2n');
      }, '+2n');
    }, '+1m');
  }, '+2m');
  // lol ^
}

function prepareSampleSeq(sample, relX) {
  let coord = getWorldCoordinate(
    window.innerWidth * relX,
    window.innerHeight / 2
  );

  let slices = seqToSlices(sample.seq);
  let maxHeight = _.max(Array.from(slices.values()).map(s => s.relHeight));
  let plateGeometry = new THREE.CircleGeometry(
    (capHeight(maxHeight) * MAX_RADIUS) / 3,
    32
  );
  let plateMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0
  });
  let plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.position.x = coord.x;

  stackNotes(sample.seq);
  let chordShape = buildChordShape(sample.seq, MAX_RADIUS / 3, true, true);
  chordShape.group.position.x = coord.x;

  chordShape.group.scale.set(0, 0, 1);
  new TWEEN.Tween(chordShape.group.scale)
    .to({ x: 1, y: 1, z: 1 }, 500)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  scene.add(plate);
  scene.add(chordShape.group);

  return { sample, shape: chordShape, percussionPlate: plate };
}

function disposeSampleSeq(sample) {
  return new Promise(res =>
    new TWEEN.Tween(sample.shape.group.scale)
      .to({ x: 0, y: 0, z: 1 }, 250)
      .easing(TWEEN.Easing.Cubic.In)
      .start()
      .onComplete(() => {
        sample.shape.group.traverse(node => {
          if (node.geometry) node.geometry.dispose();
          if (node.material) node.material.dispose();
        });
        scene.remove(sample.shape.group);
        sample.percussionPlate.material.dispose();
        sample.percussionPlate.geometry.dispose();
        scene.remove(sample.percussionPlate);
        res();
      })
  );
}

function populateHelpKeyInfo() {
  let names = getChords(mode, tonic);
  let degrees = getChordDegrees(mode, tonic);
  document.querySelector('#halp-current-tonic').textContent = tonic;
  document.querySelector('#halp-current-mode').textContent = MODE_NAMES[mode];
  document.querySelector('#halp-current-chords').textContent = names
    .map((chordName, idx) => `${chordName} (${degrees[idx]})`)
    .join(', ');
}

// Main render loop
function render(time) {
  raycaster.setFromCamera(mouse, camera);
  TWEEN.update(time);
  if (mainWheelShapeGroup && part) {
    mainWheelShapeGroup.rotation.z = part.progress * Math.PI * 2;
  } else if (currentlyPlayingSample && part) {
    currentlyPlayingSample.shape.group.rotation.z = part.progress * Math.PI * 2;
  }
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function loadJSONSamples() {
  return fetch('https://cdn.glitch.com/5df003ea-b446-4579-a451-303ec6173249/samples.json')
    .then(res => res.json())
    .then(res => {
      document.querySelector('#loading-samples').classList.add('done');
      return res;
    });
}

function waitForBuffers() {
  return new Promise(res => Tone.Buffer.on('load', res)).then(() =>
    document.querySelector('#loading-buffers').classList.add('done')
  );
}

function generateReverb() {
  return reverb.generate();
}

function initializeVae() {
  return vae
    .initialize()
    .then(() => document.querySelector('#loading-vae').classList.add('done'));
}

Promise.all([
  loadJSONSamples(),
  waitForBuffers(),
  generateReverb(),
  initializeVae()
])
  .then(([sampleSeqs]) => {
    Promise.all([
      generateSample(0, 'C', sampleSeqs),
      generateSample(0, 'C', sampleSeqs)
    ]).then(([initialSampleLeft, initialSampleRight]) => {
      document.querySelector('#loading-seed-spinners').classList.add('done');
      setTimeout(() => {
        loadingEl.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 500,
          easing: 'ease-out',
          fill: 'forwards'
        });
        introControlsEl.classList.add('loaded');
      }, 500);
      let leftChordSample = prepareSampleSeq(initialSampleLeft, 0.35);
      let rightChordSample = prepareSampleSeq(initialSampleRight, 0.65);

      regenLeftEl.addEventListener('click', () => {
        if (currentlyPlayingSample === leftChordSample) {
          part.stop();
          part = null;
          currentlyPlayingSample = null;
        }
        generateSample(0, 'C', sampleSeqs).then(sample => {
          disposeSampleSeq(leftChordSample).then(() => {
            leftChordSample = prepareSampleSeq(sample, 0.35);
            requestAnimationFrame(introIntersectionCheck);
          });
        });
      });
      regenRightEl.addEventListener('click', () => {
        if (currentlyPlayingSample === rightChordSample) {
          part.stop();
          part = null;
          currentlyPlayingSample = null;
        }
        generateSample(0, 'C', sampleSeqs).then(sample => {
          disposeSampleSeq(rightChordSample).then(() => {
            rightChordSample = prepareSampleSeq(sample, 0.65);
            requestAnimationFrame(introIntersectionCheck);
          });
        });
      });

      function toggleIntroSeq(sample, intersections) {
        if (intersections.length && currentlyPlayingSample !== sample) {
          if (part) part.stop();
          part = makePart(sample.sample.seq);
          part.start();
          currentlyPlayingSample = sample;
          percussionPlate = sample.percussionPlate;
        } else if (
          intersections.length === 0 &&
          currentlyPlayingSample === sample
        ) {
          part.stop();
          part = null;
          currentlyPlayingSample = null;
          percussionPlate = null;
        }
      }

      function introIntersectionCheck() {
        let intersectsLeft = raycaster.intersectObjects([
          leftChordSample.percussionPlate
        ]);
        toggleIntroSeq(leftChordSample, intersectsLeft);
        let intersectsRight = raycaster.intersectObjects([
          rightChordSample.percussionPlate
        ]);
        toggleIntroSeq(rightChordSample, intersectsRight);
      }

      setTimeout(() =>
        document.addEventListener('mousemove', introIntersectionCheck)
      );

      generateButtonEl.addEventListener('click', () => {
        document.removeEventListener('mousemove', introIntersectionCheck);
        if (part) {
          part.stop();
        }
        for (let shape of mainWheelShapes) {
          shape.geometry.dispose();
          shape.material.dispose();
        }
        if (mainWheelShapeGroup) {
          scene.remove(mainWheelShapeGroup);
        }
        mainWheelShapes = [];
        mainWheelShapeGroup = null;
        if (destroyChordGrid) {
          destroyChordGrid();
        }

        mode = +modeControlEl.value;
        tonic = tonicControlEl.value;
        populateHelpKeyInfo();

        setTimeout(
          () =>
            generateSubspace(
              [leftChordSample.sample, rightChordSample.sample],
              mode,
              tonic
            ).then(all => {
              subspace = [];
              for (let i = 0; i < INTERP_STEPS; i++) {
                let interp = [];
                for (let j = 0; j < DEGREES.length; j++) {
                  stackNotes(all[j][i]);
                  interp.push(all[j][i]);
                }
                subspace.push(interp);
              }

              destroyChordGrid = buildChordGrid(
                subspace,
                (newVariation, newChord) =>
                  switchChordVariation(newChord, newVariation)
              );
              positionChordGridToCurrent(
                currentChord,
                currentVariation,
                null,
                null,
                true,
                false
              );

              document.body.classList.add('playing');
              animateChordGridBuild([
                leftChordSample.shape.group,
                rightChordSample.shape.group
              ]).then(() => {
                mainWheelShapes = buildMainWheel(subspace);
                percussionPlate = buildPercussionPlate(subspace);
                mainWheelShapeGroup = new THREE.Group();
                mainWheelShapes.forEach(shape =>
                  mainWheelShapeGroup.add(shape)
                );
                scene.add(percussionPlate);
                scene.add(mainWheelShapeGroup);
                positionChordGridToCurrent(currentChord, currentVariation);

                part = makePart(subspace[currentVariation][currentChord]);
                setTimeout(() => {
                  part.start();
                  runIntroSequence();
                });
              });
            }),
          200
        );
      });
    });
  })
  .catch(err => console.error(err));

tempoControlEl.addEventListener('input', evt => {
  Tone.Transport.bpm.value = +evt.target.value;
  tempoValueEl.textContent = evt.target.value;
});
WebMidi.enable(err => {
  function onOutputsChanged() {
    let outputs = [{ id: 'internal', name: 'Internal Synth' }];
    if (!err) {
      outputs = outputs.concat(WebMidi.outputs);
    }
    while (outputEl.firstChild) {
      outputEl.firstChild.remove();
    }
    outputs.forEach(({ id, name }, idx) => {
      let optionEl = document.createElement('option');
      optionEl.value = id;
      optionEl.textContent = name;
      optionEl.checked = idx === 0;
      outputEl.appendChild(optionEl);
    });
  }
  outputEl.addEventListener('change', () => {
    if (outputEl.value === 'internal') {
      console.log('output to internal');
      currentOutput = playNote;
    } else {
      let output = WebMidi.getOutputById(outputEl.value);
      console.log('output to', output);
      currentOutput = playMidiNote(output);
    }
  });
  if (!err) {
    WebMidi.addListener('connected', onOutputsChanged);
    WebMidi.addListener('disconnected', onOutputsChanged);
  }
  onOutputsChanged();
});

settingsCalloutEl.addEventListener('click', evt => {
  settingsEl.classList.toggle('open');
  if (settingsEl.classList.contains('open')) {
    document.body.classList.remove('playing');
  } else {
    document.body.classList.add('playing');
  }
  halpEl.classList.remove('open');
  evt.stopPropagation();
});
halpCalloutEl.addEventListener('click', evt => {
  halpEl.classList.toggle('open');
  if (halpEl.classList.contains('open')) {
    document.body.classList.remove('playing');
  } else {
    document.body.classList.add('playing');
  }
  settingsEl.classList.remove('open');
  evt.stopPropagation();
});
visEl.addEventListener('click', () => {
  if (halpEl.classList.contains('open')) {
    halpEl.classList.remove('open');
    document.body.classList.add('playing');
  }
  if (settingsEl.classList.contains('open')) {
    settingsEl.classList.remove('open');
    document.body.classList.add('playing');
  }
});
document.addEventListener('keyup', e => {
  if (e.keyCode === 27) {
    halpEl.classList.remove('open');
    settingsEl.classList.remove('open');
    document.body.classList.add('playing');
  }
});

Tone.Transport.start();
Tone.Transport.bpm.value = 65;
