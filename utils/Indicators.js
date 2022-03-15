function mean(values) {
  let result = 0;
  for (let i = 0; i < values.length; i++) {
    result += values[i];
  }
  return result / values.length;
}

function ema(values, period) {
  let result = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    result[i] = mean(values.slice(i - period, i));
  }
  return result;
}

function emaDiff(values, period) {
  return ema(values, period).map((val, i) => {
    if (val) return val - values[i];
    else return null;
  });
}

function priceChange(candle) {
  return (candle.c - candle.o) / candle.o;
}

function priceChanges(candles) {
  let result = [];
  for (let i = 0; i < candles.length; i++) {
    result[i] = priceChange(candles[i]);
  }
  return result;
}

function volumeOscillator(candles, shortLength = 5, longLength = 10) {
  let result = new Array(candles.length).fill(null);

  let emaVolLong = ema(
    candles.map((c) => c.v),
    longLength
  );

  let emaVolShort = ema(
    candles.map((c) => c.v),
    shortLength
  );

  for (let i = 0; i < Math.min(emaVolLong.length, emaVolShort.length); i++) {
    let oscillator =
      (100 *
        (emaVolShort[emaVolShort.length - 1 - i] -
          emaVolLong[emaVolLong.length - 1 - i])) /
      emaVolLong[emaVolLong.length - 1 - i];
    result[i] = oscillator;
  }

  return result;
}

function averagePriceChanges(candles, period) {
  let result = new Array(candles.length).fill(null);

  for (let i = period; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += priceChange(candles[i - j]);
    }
    result[i] += sum / period;
  }

  return result;
}

function averageGains(candles, period) {
  let result = new Array(candles.length).fill(null);

  for (let i = period; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      if (candles[i - j].o < candles[i - j].c) {
        sum += priceChange(candles[i - j]);
      }
    }
    result[i] += sum / period;
  }

  return result;
}

function averageLosses(candles, period) {
  let result = new Array(candles.length).fill(null);

  for (let i = period; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      if (candles[i - j].o > candles[i - j].c) {
        sum += priceChange(candles[i - j]);
      }
    }
    result[i] += sum / period;
  }

  return result;
}

function standardDeviation(candles, period) {
  let result = new Array(candles.length).fill(null);

  for (let i = period; i < candles.length; i++) {
    let array = candles.slice(i - period, i).map((c) => c.c);
    let m = mean(array);
    let squares = array.map((v) => (v - m) ** 2);
    let sumSquares = squares.reduce((prev, cur) => prev + cur, 0);
    let variance = sumSquares / (array.length - 1);
    result[i] = Math.sqrt(variance);
  }

  return result;
}

function rsi(candles, period = 14) {
  let result = new Array(candles.length).fill(null);
  for (let i = period; i < candles.length; i++) {
    result[i] =
      100 / 1 +
      averageGains(candles.slice(i - period, i)).slice(-1)[0] /
        averageLosses(candles.slice(i - period, i)).slice(-1)[0];
  }
  return result;
}
