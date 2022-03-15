var nextConnectionNo = 1000;
var populationSize = 50;
var population;
var speed = 60;

var showBest = true; //true if only show the best of the previous generation
var runBest = false; //true if replaying the best ever game

var startDate = new Date('2022', '1', '1', '0', '0', '0');
var endDate = new Date('2022', '1', '4', '0', '0', '0');
var numberTotalBars;
var numberBarsTraining;
var numberBarsTest;
var testPeriod = false; // Test the network on the test period

var candleStartIndex = 51; // Wait to have all the values for the indicators
var candleIndex = candleStartIndex;

var symbol = 'BTCUSDT';
var resolution = '5';
var chart;
var candles = []; // { ot, ct, o, h, l, c, v }

var showBrain = false;

var indicators = {};

var pause = false;

//--------------------------------------------------------------------------------------------------------------------------------------------------

var MIN_WIDTH_CANDLE = 3;
var CANVAS_WIDTH;
var CANVAS_HEIGHT = 720;

let CHART_WIDTH_RATIO = 1; // ratio of the canvas w
let CHART_HEIGHT_RATIO = 0.5; // ratio of the canvas h
let CHART_WIDTH;
let CHART_HEIGHT;
let CHART_X;
let CHART_Y;

//--------------------------------------------------------------------------------------------------------------------------------------------------

function preload() {
  // Load all the candles on the date range
  for (let i = data.length - 1; i >= 0; i--) {
    var { ot, ct } = data[i];
    if (ot >= startDate.getTime() && ct <= endDate.getTime()) {
      candles.push(data[i]);
    } else if (ot > endDate.getTime()) {
      break;
    }
  }

  // Define the duration of training period and test period
  numberTotalBars = candles.length;
  numberBarsTraining = Math.round(numberTotalBars * 0.7);
  numberBarsTest = numberTotalBars - numberBarsTraining;

  // Init the canvas and chart dim
  CANVAS_WIDTH = (numberBarsTraining + numberBarsTest) * MIN_WIDTH_CANDLE;
  CHART_WIDTH = CANVAS_WIDTH;
  CHART_HEIGHT = CANVAS_HEIGHT * CHART_HEIGHT_RATIO;
  CHART_X = 0 + CANVAS_WIDTH * ((1 - CHART_WIDTH_RATIO) / 2);
  CHART_Y = 0 + CANVAS_HEIGHT * ((1 - CHART_HEIGHT_RATIO) / 2);

  // Initialize the indicators

  var closes = candles.map((c) => c.c);
  var volumes = candles.map((c) => c.v);

  indicators.emaDiff21 = emaDiff(closes, 21);
  indicators.emaDiff50 = emaDiff(closes, 50);
  indicators.rsi = rsi(candles, 14);
  indicators.priceChanges = priceChanges(candles);
  indicators.avgPriceChanges = averagePriceChanges(candles, 14);
  indicators.avgGains = averageGains(candles, 14);
  indicators.avgLosses = averageLosses(candles, 14);
  indicators.volumes = volumes;
  indicators.volOsc = volumeOscillator(candles, 5, 10);
  indicators.std14 = standardDeviation(candles, 14);
  indicators.std21 = standardDeviation(candles, 14);
  indicators.std50 = standardDeviation(candles, 14);
}

function setup() {
  window.canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  population = new Population(populationSize);
  chart = new Chart(candles, numberBarsTraining + numberBarsTest);
}

function draw() {
  if (pause) return;

  if (candles.length === 0) return;

  if (candleIndex < numberBarsTraining + numberBarsTest) candleIndex++;

  drawToScreen();

  if (runBest) {
    showBestEverPlayer();
  } else {
    let maxIndex = testPeriod
      ? numberBarsTraining + numberBarsTest
      : numberBarsTraining;

    if (!population.done() && candleIndex < maxIndex) {
      population.updateAlive();
    } else {
      candleIndex = candleStartIndex;
      population.naturalSelection();
    }
  }
}

function showBestEverPlayer() {
  if (!population.bestPlayer.dead) {
    population.bestPlayer.look();
    population.bestPlayer.think();
    population.bestPlayer.update();
    population.bestPlayer.show();
  } else {
    runBest = false;
    population.bestPlayer = population.bestPlayer.cloneForReplay();
  }
}

function drawToScreen() {
  background(33, 33, 33);
  chart.draw();
  drawCandleInfo();
  drawBrain();
  writeInfo();
}

function drawCandleInfo() {
  var startX = 20;
  var startY = 20;
  var size = 14;
  fill('white');
  textAlign(LEFT);
  textSize(size);

  if (candleIndex < candles.length) {
    text(`Open: ${candles[candleIndex].o}`, startX, startY + size * 1);
    text(`Close: ${candles[candleIndex].c}`, startX, startY + size * 3);
    text(`High: ${candles[candleIndex].h}`, startX, startY + size * 5);
    text(`Low: ${candles[candleIndex].l}`, startX, startY + size * 7);
  }
}

function drawBrain() {
  var startX = 100;
  var startY = 20;
  var w = 500;
  var h = 200;

  if (runBest) {
    population.bestPlayer.brain.drawGenome(startX, startY, w, h);
  } else {
    population.players[0].brain.drawGenome(startX, startY, w, h);
  }
}

function writeInfo() {
  fill(200);
  textAlign(LEFT);
  textSize(30);
  if (runBest) {
    text('Score: ' + population.bestPlayer.score, 650, 50);
    text('Gen: ' + population.gen, 1150, 50);
  } else if (showBest) {
    text('Score: ' + population.players[0].score, 650, 50);
    text('Gen: ' + population.gen, 1150, 50);
    text('Species: ' + population.species.length, 50, canvas.height / 2 + 300);
    text(
      'Global Best Score: ' + population.bestScore,
      50,
      canvas.height / 2 + 250
    );
  }
}

function keyPressed() {
  switch (key) {
    case 'S':
      // toggle showBest
      showBest = !showBest;
      break;
    case 'B': // run the best genome
      runBest = !runBest;
      break;
    case 'A': // speed up frame rate
      speed += 10;
      frameRate(speed);
      break;
    case 'Z': // slow down frame rate
      if (speed > 10) {
        speed -= 10;
        frameRate(speed);
      }
      break;
    case 'T': // Test the neural network on the tet period
      testPeriod = !testPeriod;
      break;
    case 'P': // Test the neural network on the tet period
      pause = !pause;
      break;
  }
}
