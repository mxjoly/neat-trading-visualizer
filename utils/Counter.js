class Counter {
  constructor(value = 0) {
    this.initialValue = value;
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  increment() {
    this.value++;
  }

  reset() {
    this.value = this.initialValue;
  }
}
