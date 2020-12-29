class Input extends LabeledComponent {
  constructor(x, y, label) {
    super(x, y, label);
    this.outputs[0] = createOutputConnObj(this.w / 2, 0, true);
  }

  /** Toggle state of Input */
  toggle() {
    this.setState(0, this.getState(0) ^ 1);
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
        fill(...app.opts['colour' + this.getState(0)]);
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

class ConstInput extends Input {
  constructor(x, y, state, label) {
    super(x, y, label);
    this.setState(0, state ? 1 : 0);
  }

  render() {
    super.render(() => {
      noStroke();
      fill(...app.opts['colour' + this.getState(0)]);
      textSize(35);
      textAlign(CENTER, CENTER);
      text(this.getState(0), 0, 0);
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