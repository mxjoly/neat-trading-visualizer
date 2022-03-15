function truncate(x, precision) {
  return Math.floor(x * Math.pow(10, precision)) / Math.pow(10, precision);
}

const FEES = 0.0004;

var indicatorInputs = {
  EMA21: true,
  EMA50: true,
  RSI: false,
  PRICE_CHANGE: true,
  AVG_PRICE_CHANGE: true,
  AVG_GAIN: true,
  AVG_LOSS: true,
  VOLUME: true,
  VOLUME_OSC: true,
  STD14: true,
  STD21: true,
  STD50: true,
};

class Player {
  constructor() {
    this.y = (CHART_Y + CHART_HEIGHT) / 2;

    // Infos
    this.initialBalance = 1000;
    this.balance = this.initialBalance;
    this.maxBalance = this.initialBalance;
    this.risk = 1;
    this.position = null;

    // Stats
    this.totalTrades = 0;
    this.winningTrades = 0;

    // Goals
    this.minTradeDuration = 2;
    this.maxTradeDuration = 6;
    this.maxDrawdown = 0.05; // 0.05 %

    this.counter = new Counter();

    // Neat stuffs
    this.fitness = 0;
    this.vision = [];
    this.decision = [];
    this.lifespan = 0;
    this.bestScore = 0;
    this.dead = false;
    this.score = 0; // profit of the trader
    this.gen = 0;

    // Brain
    this.genomeInputs =
      Object.values(indicatorInputs).filter((v) => v !== false).length + 2;
    this.genomeOutputs = 3;
    this.brain = new Genome(this.genomeInputs, this.genomeOutputs);

    // Create manually the connection gene
    for (
      let i = this.brain.inputs;
      i < this.brain.inputs + this.brain.outputs;
      i++
    ) {
      for (let j = 0; j < this.brain.inputs; j++) {
        this.brain.genes.push(
          new connectionGene(
            this.brain.nodes[j],
            this.brain.nodes[i],
            random(),
            nextConnectionNo++
          )
        );
      }
    }
  }

  //---------------------------------------------------------------------------------------------------------------------------------------------------------
  show() {
    let candleWidth = CHART_WIDTH / (numberBarsTraining + numberBarsTest);

    fill('white');
    textSize(16);
    textAlign(CENTER);
    text(
      truncate(this.balance, 2),
      CHART_X + candleIndex * candleWidth,
      CHART_Y + CHART_HEIGHT * 0.8
    );

    noStroke();
    rect(CHART_X + candleIndex * candleWidth, CHART_Y, 1, CHART_HEIGHT);

    this.showPNL();
  }

  showPNL() {
    let candleWidth = CHART_WIDTH / (numberBarsTraining + numberBarsTest);

    if (this.position !== null) {
      let pnl = this.getPositionPNL();
      fill(pnl >= 0 ? 'green' : 'red');

      text(
        `pnl: ${truncate(pnl, 2)}`,
        CHART_X + candleIndex * candleWidth,
        CHART_Y - 20
      );
      text(
        `${this.position.type}!`,
        CHART_X + candleIndex * candleWidth,
        CHART_Y - 40
      );
    }
  }

  move() {}

  update() {
    this.lifespan++;

    // Kill the trader that loses too much money
    if (this.balance < this.initialBalance * 0.9) this.dead = true;

    // Kill the trader that does'n open trades
    if (this.lifespan > numberBarsTraining / 4 && this.totalTrades === 0)
      this.dead = true;

    // Remember the good traders
    if (this.totalTrades > 5) {
      let wr = this.winningTrades / this.totalTrades;
      if (wr > 0.7) {
        this.score *= 2;
      }
    }

    // Check the duration of the trade
    if (this.position && (this.minTradeDuration || this.maxTradeDuration)) {
      this.counter.increment();
      if (
        this.maxTradeDuration &&
        this.counter.getValue() > this.maxTradeDuration
      ) {
        this.close();
        this.counter.reset();
      }
    }

    // Update the score of player
    this.score = truncate(
      this.balance + this.getPositionPNL() - this.initialBalance,
      2
    );

    // Update the max score
    if (this.balance > this.maxBalance) {
      this.maxBalance = this.balance;
    }

    // Kill the traders that have a high drawdown
    if (
      this.maxDrawdown &&
      this.balance <= this.maxBalance * (1 - this.maxDrawdown)
    ) {
      this.dead = true;
    }

    // If we test the neural network on the test period, don't kill it
    if (testPeriod) {
      this.dead = false;
    }
  }

  look() {
    // Ema 21 Diff
    var emaDiff21 = indicatorInputs.EMA21
      ? map(
          indicators.emaDiff21[candleIndex],
          min(indicators.emaDiff21.slice(0, numberBarsTraining)),
          max(indicators.emaDiff21.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Ema 50 Diff
    var emaDiff50 = indicatorInputs.EMA50
      ? map(
          indicators.emaDiff50[candleIndex],
          min(indicators.emaDiff50.slice(0, numberBarsTraining)),
          max(indicators.emaDiff50.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // RSI
    var rsi = indicatorInputs.RSI
      ? map(
          indicators.rsi[candleIndex],
          min(indicators.rsi.slice(0, numberBarsTraining)),
          max(indicators.rsi.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Price change
    var priceChange = indicatorInputs.PRICE_CHANGE
      ? map(
          indicators.priceChanges[candleIndex],
          min(indicators.priceChanges.slice(0, numberBarsTraining)),
          max(indicators.priceChanges.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Average price change
    var avgPriceChange = indicatorInputs.AVG_PRICE_CHANGE
      ? map(
          indicators.avgPriceChanges[candleIndex],
          min(indicators.avgPriceChanges.slice(0, numberBarsTraining)),
          max(indicators.avgPriceChanges.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Average gain
    var avgGain = indicatorInputs.AVG_GAIN
      ? map(
          indicators.avgGains[candleIndex],
          min(indicators.avgGains.slice(0, numberBarsTraining)),
          max(indicators.avgGains.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Average loss
    var avgLoss = indicatorInputs.AVG_LOSS
      ? map(
          indicators.avgGains[candleIndex],
          min(indicators.avgGains.slice(0, numberBarsTraining)),
          max(indicators.avgGains.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Trading volume
    var volume = indicatorInputs.VOLUME
      ? map(
          indicators.volumes[candleIndex],
          min(indicators.volumes.slice(0, numberBarsTraining)),
          max(indicators.volumes.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Volume oscillator
    var volOsc = indicatorInputs.VOLUME_OSC
      ? map(
          indicators.volOsc[candleIndex],
          min(indicators.volOsc.slice(0, numberBarsTraining)),
          max(indicators.volOsc.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Standard deviation 14
    var std14 = indicatorInputs.STD14
      ? map(
          indicators.std14[candleIndex],
          min(indicators.std14.slice(0, numberBarsTraining)),
          max(indicators.std14.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Standard deviation 21
    var std21 = indicatorInputs.STD21
      ? map(
          indicators.std21[candleIndex],
          min(indicators.std21.slice(0, numberBarsTraining)),
          max(indicators.std21.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Standard deviation 50
    var std50 = indicatorInputs.STD50
      ? map(
          indicators.std50[candleIndex],
          min(indicators.std50.slice(0, numberBarsTraining)),
          max(indicators.std50.slice(0, numberBarsTraining)),
          0,
          1
        )
      : null;

    // Currently holding
    var holding = this.position ? 1 : 0;

    // Current PNL
    var currentPnl = map(
      this.getPositionPNL(),
      -this.balance,
      this.balance,
      0,
      1
    );

    this.vision = [
      emaDiff21,
      emaDiff50,
      rsi,
      priceChange,
      avgPriceChange,
      avgGain,
      avgLoss,
      volume,
      volOsc,
      std14,
      std21,
      std50,
      holding,
      currentPnl,
    ].filter((v) => v !== null);
  }

  //gets the output of the this.brain then converts them to actions
  think() {
    var max = 0;
    var maxIndex = 0;
    //get the output of the neural network
    this.decision = this.brain.feedForward(this.vision);

    for (var i = 0; i < this.decision.length; i++) {
      if (this.decision[i] > max) {
        max = this.decision[i];
        maxIndex = i;
      }
    }

    if (maxIndex === 0 && this.decision[0] > 0.5) {
      this.long();
    }

    if (maxIndex === 1 && this.decision[1] > 0.5) {
      this.short();
    }

    if (maxIndex === 2 && this.decision[2] > 0.5) {
      if (this.minTradeDuration) {
        if (this.counter.getValue() > this.minTradeDuration) this.close();
      } else {
        this.close();
      }
    }
  }

  long() {
    if (this.position === null) {
      this.position = {
        entryPrice: candles[candleIndex].c,
        type: 'long',
        size: this.risk * this.balance,
      };
      this.balance *= 1 - FEES;
    }
  }

  short() {
    if (this.position === null) {
      this.position = {
        entryPrice: candles[candleIndex].c,
        type: 'short',
        size: this.risk * this.balance,
      };
      this.balance *= 1 - FEES;
    }
  }

  close() {
    if (this.position !== null) {
      let pnl = this.getPositionPNL();
      let pnlWithFees = pnl - this.position.size * FEES;
      this.balance += pnlWithFees;
      this.totalTrades++;
      this.position = null;
      if (pnlWithFees > 0) this.winningTrades++;
    }
  }

  getPositionPNL() {
    if (this.position !== null) {
      let currentPrice = candles[candleIndex].c;
      let { entryPrice, size, type } = this.position;
      let delta = (currentPrice - entryPrice) / entryPrice;
      let pnl = type === 'long' ? delta * size : -delta * size;
      return pnl;
    }
    return 0;
  }

  //returns a clone of this player with the same brian
  clone() {
    var clone = new Player();
    clone.brain = this.brain.clone();
    clone.fitness = this.fitness;
    clone.brain.generateNetwork();
    clone.gen = this.gen;
    clone.bestScore = this.score;
    return clone;
  }

  //since there is some randomness in games sometimes when we want to replay the game we need to remove that randomness
  //this function does that
  cloneForReplay() {
    var clone = new Player();
    clone.brain = this.brain.clone();
    clone.fitness = this.fitness;
    clone.brain.generateNetwork();
    clone.gen = this.gen;
    clone.bestScore = this.score;

    //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<replace
    return clone;
  }

  //fot Genetic algorithm
  calculateFitness() {
    this.fitness = this.balance;
  }

  crossover(parent2) {
    var child = new Player();
    child.brain = this.brain.crossover(parent2.brain);
    child.brain.generateNetwork();
    return child;
  }
}
