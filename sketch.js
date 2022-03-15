var nextConnectionNo = 1000;
var populationSize = 500;
var population;
var speed = 60;

var showBest = true; //true if only show the best of the previous generation
var runBest = false; //true if replaying the best ever game

var startDate = new Date('2021', '12', '1', '0', '0', '0');
var endDate = new Date('2022', '3', '1', '0', '0', '0');
var numberTotalBars = 1000;
var numberBarsTraining = Math.round(numberTotalBars * 0.7);
var numberBarsTest = numberTotalBars - numberBarsTraining;
var testPeriod = false; // Test the network on the test period

var candleStartIndex = 51; // Wait to have all the values for the indicators
var candleIndex = candleStartIndex;

var symbol = 'BTCUSDT';
var resolution = '5';
var chart;
var candles = [];

var showBrain = false;

var indicators = {};

//--------------------------------------------------------------------------------------------------------------------------------------------------

var MIN_WIDTH_CANDLE = 3;
var CANVAS_WIDTH = (numberBarsTraining + numberBarsTest) * MIN_WIDTH_CANDLE;
var CANVAS_HEIGHT = 720;

let CHART_WIDTH_RATIO = 1; // ratio of the canvas w
let CHART_HEIGHT_RATIO = 0.5; // ratio of the canvas h
let CHART_WIDTH = CANVAS_WIDTH;
let CHART_HEIGHT = CANVAS_HEIGHT * CHART_HEIGHT_RATIO;
let CHART_X = 0 + CANVAS_WIDTH * ((1 - CHART_WIDTH_RATIO) / 2);
let CHART_Y = 0 + CANVAS_HEIGHT * ((1 - CHART_HEIGHT_RATIO) / 2);

//--------------------------------------------------------------------------------------------------------------------------------------------------

function preload() {
  // let url = `https://finnhub.io/api/v1/crypto/candle?symbol=BINANCE:${symbol}&resolution=${resolution}&from=${
  //   startDate.getTime() / 1000
  // }&to=${endDate.getTime() / 1000}&token=c8l3b0aad3icvur3mbbg`;
  // httpGet(url, 'json', false, (res) => {
  //   let data = JSON.parse(res);
  //   let totalBars = numberBarsTraining + numberBarsTest;
  //   if (data.c.length - totalBars >= 0) {
  //     for (let i = data.c.length - totalBars; i < data.c.length; i++) {
  //       candles.push({
  //         o: data.o[i],
  //         h: data.h[i],
  //         l: data.l[i],
  //         c: data.c[i],
  //         v: data.v[i],
  //       });
  //     }
  //   }
  // });

  candles = data.slice(0, numberTotalBars);
  var closes = candles.map((c) => c.c);
  var volumes = candles.map((c) => c.v);

  indicators.emaDiff21 = emaDiff(closes, 21);
  indicators.emaDiff50 = emaDiff(closes, 50);
  // indicators.rsi = rsi(candles, 14);
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
  drawBrain();
  writeInfo();
}

function drawBrain() {
  var startX = -100;
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
    case ' ':
      // toggle showBest
      showBest = !showBest;
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
    case 'B': // run the best genome
      runBest = !runBest;
      break;
    case 'T': // Test the neural network on the tet period
      testPeriod = !testPeriod;
      break;
  }
}
