class Chart {
  constructor(candles, numberBars) {
    this.candles = candles;
    this.numberBars = numberBars;
  }

  draw() {
    if (this.candles.length > 0) {
      for (let i = 0; i < this.candles.length; i++) {
        this.drawCandlestick(i, this.candles[i]);
      }
    }

    this.drawLabel();
  }

  drawLabel() {
    let candleWidth = CHART_WIDTH / this.numberBars;

    fill('grey');
    textSize(18);
    textAlign(CENTER);

    text(
      `Training Period`,
      CHART_X + (numberBarsTraining * candleWidth) / 2,
      CHART_Y - 50
    );

    text(
      `Test Period`,
      CHART_X +
        numberBarsTraining * candleWidth +
        (numberBarsTest * candleWidth) / 2,
      CHART_Y - 50
    );

    if (numberBarsTest > 0) {
      fill('grey');
      noStroke();
      rect(CHART_X + numberBarsTraining * candleWidth, 0, 1, CANVAS_HEIGHT);
    }
  }

  drawCandlestick(n, candle) {
    let candleWidth = CHART_WIDTH / this.numberBars;
    let maxPrice = max(
      this.candles.map((data) => data.h).slice(-this.numberBars)
    );
    let minPrice = min(
      this.candles.map((data) => data.l).slice(-this.numberBars)
    );
    let deltaPrice = abs(maxPrice - minPrice);
    let tickHeight = CHART_HEIGHT / deltaPrice;

    let yLow = map(candle.l, minPrice, maxPrice, 0, CHART_HEIGHT);
    let yBodyLow = map(
      min(candle.o, candle.c),
      minPrice,
      maxPrice,
      0,
      CHART_HEIGHT
    );

    fill(candle.o <= candle.c ? color('green') : color('red'));
    noStroke();

    rect(
      CHART_X + n * candleWidth + candleWidth / 2,
      CHART_HEIGHT - CHART_Y + yLow,
      1,
      abs(candle.h - candle.l) * tickHeight
    );

    rect(
      CHART_X + n * candleWidth + 1,
      CHART_Y + yBodyLow,
      candleWidth - 1,
      abs(candle.o - candle.c) * tickHeight
    );
  }
}
