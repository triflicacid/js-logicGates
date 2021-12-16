class Input extends LabeledComponent {
  constructor(x, y, label) {
    super(x, y, label);
    this.outputs[0] = createOutputConnObj(this.w / 2, 0, true);
  }

  /** Toggle state of Input */
  toggle() {
    this.setState(0, this.getState(0) ? 0 : 1);
  }

  /**
   * @param {Function} fn - Optional callback
   */
  render(fn, roundness = 6) {
    super.render(() => {
      fill(200);
      strokeWeight(2);
      stroke(0);
      rect(-this.w / 2, -this.h / 2, this.w, this.h, roundness);

      if (typeof fn == 'function') {
        fn();
      } else {
        fill(...app.opts['colour' + (this.getState(0) ? 1 : 0)]);
        let pad = this.w / 6;
        noStroke();
        rect(-this.w / 2 + pad, -this.h / 2 + pad, this.w - 2 * pad, this.h - 2 * pad, roundness);

        textAlign(CENTER, CENTER);
        fill(200);
        textSize(13);
        text(this.getState(0) ? "On" : "Off", 0, 0);
      }
    });
  }

  /**
   * Called by chain_eval
   */
  eval() { }

  /** @override */
  backtrace(out, subin) {
    return subin ? this.getState(0) : this.label;
  }

  /** @override */
  backtraceJS(out) { return "\"" + this.label + "\""; }
}

class ToggleInput extends Input {
  constructor(x, y, label) {
    super(x, y, label);
  }

  event_mouseup(beenMoved) {
    if (!beenMoved) {
      this.toggle();
      playSound('click');
    }
  }

  toObject() {
    let obj = super.toObject();
    if (obj.d == undefined && this.getState(0) == 1) obj.d = 1;
    return obj;
  }
}

ToggleInput.ID = 0;
ToggleInput.isChangeable = true;
ToggleInput.hoverInfo = true;
ToggleInput.isInput = true;

class PushInput extends Input {
  constructor(x, y, label) {
    super(x, y, label);
  }

  render() {
    super.render(undefined, 17);
  }

  event_mousedown() {
    this.setState(0, 1);
  }
  event_mouseup() {
    this.setState(0, 0);
  }
}

PushInput.ID = 6;
PushInput.isChangeable = true;
PushInput.hoverInfo = true;

class Clock extends Input {
  constructor(x, y, label) {
    super(x, y, label);

    /** How many long before toggle state (ms) ? */
    this._every = 1000;
    this._interval = null;
  }

  get every() { return this._every; }
  set every(v) {
    if (typeof v == 'number' && !isNaN(v)) {
      this._every = v;
    }
  }

  start() {
    if (this._interval) this.stop();
    this._interval = setInterval(() => {
      this.setState(0, this.getState(0) ^ 1);
      // playSound('tick');
    }, this.every);
  }

  isRunning() { return this._interval != null; }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  render() {
    super.render(() => {
      let img = 'img' + (this.getState(0) ? "On" : "Off");
      if (Clock[img]) {
        let s = 2.5;
        let w = 17 * s;
        let h = 10 * s;
        image(Clock[img], -w / 2, -h / 2, w, h);
      }
    });
  }

  eval() {
    // Start clock if not started
    if (!this._interval && !this.isHighlighted) this.start();
  }

  /**
   * Get speed in hertz
   */
  hertz() {
    return round(1000 / this.every, 0.01).toFixed(2);
  }

  event_mouseup(beenMoved) {
    if (!beenMoved) {
      this.isHighlighted ^= 1;
      if (this._interval) this.stop(); else this.start();
      if (this.isHighlighted) {
        menu.clockComponent.open(this);
      }
    }
  }

  getPopupText() {
    return super.getPopupText().concat([`Active: ${this._interval ? "Yes" : "No"}`, `Speed: ${this.hertz()} Hz`]);
  }

  toObject() {
    const obj = super.toObject();
    obj.d = this.every;
    return obj;
  }
}

Clock.min = 100;
Clock.max = 9999;
Clock.isChangeable = true;
Clock.ID = 5;
Clock.isInput = true;

class ConstInput extends Input {
  constructor(x, y, state, label) {
    super(x, y, label);
    this.setState(0, state ? 1 : 0);
  }

  render() {
    super.render(() => {
      noStroke();
      fill(...app.opts['colour' + this.getState(0)]);
      push();
      textSize(35);
      textAlign(CENTER, CENTER);
      textFont(app.font_clacon2);
      text(this.getState(0), 0, 0);
      pop();
    }, 0);
  }

  backtrace() { return this.getState(0); }

  backtraceJS() { return this.getState(0); }

  toObject() {
    let obj = super.toObject();
    obj.d = this.getState(0);
    return obj;
  }
}

ConstInput.ID = 7;
ConstInput.isChangeable = false;
ConstInput.hoverInfo = true;
ConstInput.isInput = true;


class DecimalInput extends LabeledComponent {
  constructor(x, y) {
    super(x, y);
    this.h = 85;
    this._segments = [];
    this._max = 0; // Stores this.getMax() from last this.adjust() call
    this._num = 0;
    this.setOutputs(1);
    this._num = 0;
  }

  get name() { return this.outputs.length + "-bit Input"; }

  get num() { return this._num; }
  set num(num) {
    num %= this._max + 1;
    this._num = num;

    let length = this._max.toString().length;
    let digits = num.toString().padStart(length, '0');
    for (let i = 0; i < digits.length; i++) {
      this._segments[digits.length - 1 - i].value = +digits[i];
    }
    this.updateOutputs();
  }

  /**
   * Set a new number of outputs
   * @param {number} n - Number of inputs 
   */
  setOutputs(n) {
    if (n < 1 || n > DecimalInput.max || n == this.outputs.length) return;
    if (n > this.outputs.length) {
      let lim = n - this.outputs.length;
      for (let i = 0; i < lim; i++) this.outputs.push(createOutputConnObj(0, 0));
    } else {
      while (this.outputs.length > n) {
        removeConn(this, true, this.outputs.length - 1);
        this.outputs.pop();
      }
    }
    this.adjust();
  }

  /**
   * Adjust size, spacing etc...
   */
  adjust() {
    const max = this.getMax();
    const segments = max.toString().length;
    this._segments.length = 0;
    let pad = 20;
    this.w = (DecimalInput.segw + pad) * segments;
    let x = -this.w / 2 + DecimalInput.segw / 2 + pad / 2;
    let y = 0;
    for (let i = 0; i < segments; i++) {
      const s = new Segment(0, 0);
      s.width = DecimalInput.segw;
      s.height = DecimalInput.segh;
      s.x = x - s.width / 2;
      s.y = -s.height / 2;
      s.roundness = 5;
      s.onColour = color(...app.opts.colour1);
      this._segments.unshift(s);
      x += DecimalInput.segw + pad;
    }

    let space = this.h / this.outputs.length;
    y = -this.h / 2 + space / 2;
    x = this.w / 2;
    for (let i = 0; i < this.outputs.length; i++) {
      this.outputs[i].x = x;
      this.outputs[i].y = y;
      y += space;
    }

    this._max = this.getMax();
    if (this.num != 0) this.num = this.num;
  }

  getSegmentValue() {
    let n = 0;
    for (let i = 0; i < this._segments.length; i++)
      n += this._segments[i].toNumber() * Math.pow(10, i);
    return n;
  }

  /** Get maximum value (decimal) */
  getMax() {
    return Math.pow(2, this.outputs.length) - 1;
  }

  getBinary() {
    return this.num.toString(2).padStart(this.outputs.length, '0');
  }

  updateOutputs() {
    const bin = this.getBinary();
    for (let i = 0; i < this.outputs.length; i++) {
      this.setState(i, bin[bin.length - i - 1] === "1" ? 1 : 0);
    }
  }

  eval() { }

  render() {
    super.render(() => {
      fill(200);
      strokeWeight(2);
      stroke(0);
      rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

      for (let s of this._segments) s.display();
    });
  }

  event_mouseup(beenMoved, x, y) {
    if (!beenMoved) {
      let segment;
      x -= this.x;
      y -= this.y;

      for (let s of this._segments) {
        if (x < s.x || x > s.x + s.width || y < s.y || y > s.y + s.height) continue;
        segment = s;
        break;
      }

      if (segment) {
        // Increment value
        let val = (segment.toNumber() + 1) % 10;
        segment.value = val;

        let n = this.getSegmentValue();
        if (n != this.num) this.num = n;
      } else {
        menu.nBitInput.open(this);
      }
    }
  }

  toObject() {
    let obj = super.toObject();
    obj.d = this.getBinary();
    return obj;
  }

  getPopupText() {
    const arr = super.getPopupText();
    arr.push("Value: " + this.num, ` • 0x${this.num.toString(16).toUpperCase()}`);
    return arr;
  }
}

DecimalInput.ID = 11;
DecimalInput.hoverInfo = true;
DecimalInput.segw = 33;
DecimalInput.segh = 15;
DecimalInput.max = 16;
DecimalInput.isInput = true;