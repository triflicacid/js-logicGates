class Chip extends Component {
  constructor(name, x, y) {
    super(x, y);
    this._name = name;

    this.lin = []; // Labels for inputs
    this.lout = []; // Labels for outputs
    this.fns = []; // Functions for mapping outputs
  }

  get name() { return this._name; }

  render() {
    super.render(() => {
      stroke(0);
      strokeWeight(1);
      fill(255);
      rect(-this.w / 2, -this.h / 2, this.w, this.h);

      textSize(Chip.nameSize);
      noStroke();
      fill(51);
      textAlign(CENTER, CENTER);
      text(this.name, 0, 0);

      textSize(Chip.labelSize);
      textAlign(LEFT);
      for (let i = 0; i < this.inputs.length; i++) text(this.lin[i], this.inputs[i].x + 5, this.inputs[i].y);
      for (let i = 0; i < this.inputs.length; i++) text(this.lin[i], this.inputs[i].x + 5, this.inputs[i].y);
      for (let i = 0; i < this.outputs.length; i++) text(this.lout[i], this.outputs[i].x - textWidth(this.lout[i]) - 5, this.outputs[i].y);
      for (let i = 0; i < this.outputs.length; i++) text(this.lout[i], this.outputs[i].x - textWidth(this.lout[i]) - 5, this.outputs[i].y);
    });
  }

  eval() {
    const and = (a, b) => LogicGate.data.and.fn(this._getValue(a), this._getValue(b));
    const buffer = a => LogicGate.data.buffer.fn(this._getValue(a));
    const nand = (a, b) => LogicGate.data.nand.fn(this._getValue(a), this._getValue(b));
    const nor = (a, b) => LogicGate.data.nor.fn(this._getValue(a), this._getValue(b));
    const not = a => LogicGate.data.not.fn(this._getValue(a));
    const or = (a, b) => LogicGate.data.or.fn(this._getValue(a), this._getValue(b));
    const xnor = (a, b) => LogicGate.data.xnor.fn(this._getValue(a), this._getValue(b));
    const xor = (a, b) => LogicGate.data.xor.fn(this._getValue(a), this._getValue(b));

    for (let i = 0; i < this.lout.length; i++) {
      try {
        const res = eval(this.fns[i]);
        // console.log(this.lout[i], "=", this.fns[i], "=", res);
        this.setState(i, res);
      } catch (e) {
        console.log("At function ", this.fns[i]);
        throw e;
      }
    }
  }

  /** Get mapped value */
  _getValue(arg) {
    return typeof arg == 'string' ? this.getInputState(this.lin.indexOf(arg)) : arg;
  }

  adjust() {
    textSize(Chip.nameSize);
    this.w = textWidth("aa" + this.name + "aa");

    textSize(Chip.labelSize);
    let maxl = 0;
    for (let lbl of this.lin) if (lbl.length > maxl) maxl = lbl.length;
    this.w += maxl;
    maxl = 0;
    for (let lbl of this.lout) if (lbl.length > maxl) maxl = lbl.length;
    this.w += maxl;
    this.w += 10;

    let space = this.h / this.inputs.length;
    let y = -this.h / 2 + space / 2;
    let x = -this.w / 2;
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].x = x;
      this.inputs[i].y = y;
      y += space;
    }

    space = this.h / this.outputs.length;
    y = -this.h / 2 + space / 2;
    x += this.w;
    for (let i = 0; i < this.outputs.length; i++) {
      this.outputs[i].x = x;
      this.outputs[i].y = y;
      y += space;
    }
  }

  toObject() {
    let obj = super.toObject();
    obj.d = { name: this.name, in: this.lin, out: this.lout, fns: this.fns };
    return obj;
  }

  event_mouseup(beenMoved) {
    if (!beenMoved) {
      menu.saveChip(this);
    }
  }

  backtrace(out, subin) {
    return this._fnToSymbol(this.fns[out], subin);
  }

  backtraceJS(out) {
    return this._fnToFn(this.fns[out]);
  }

  _fnToSymbol(str, subin) {
    const fn = this._getSymbol.bind(this);

    const and = (a, b) => LogicGate.data.and.txt(fn(a, subin), fn(b, subin));
    const buffer = a => LogicGate.data.buffer.txt(fn(a, subin));
    const nand = (a, b) => LogicGate.data.nand.txt(fn(a, subin), fn(b, subin));
    const nor = (a, b) => LogicGate.data.nor.txt(fn(a, subin), fn(b, subin));
    const not = a => LogicGate.data.not.txt(fn(a, subin));
    const or = (a, b) => LogicGate.data.or.txt(fn(a, subin), fn(b, subin));
    const xnor = (a, b) => LogicGate.data.xnor.txt(fn(a, subin), fn(b, subin));
    const xor = (a, b) => LogicGate.data.xor.txt(fn(a, subin), fn(b, subin));
    return "(" + eval(str) + ")";
  }

  _getSymbol(arg, subin) {
    if (typeof arg == 'string') {
      let i = this.lin.indexOf(arg);
      if (i == -1) {
        return "(" + arg + ")";
      } else {
        return this.inputs[i].c ? this.inputs[i].c.backtrace(this.inputs[i].ci, subin) : (subin ? '0' : '?');
      }
    } else {
      return arg;
    }
  }

  _fnToFn(str) {
    const fn = this._getSymbolJS.bind(this);

    const and = (a, b) => `and(${fn(a)}, ${fn(b)})`;
    const buffer = a => fn(a);
    const nand = (a, b) => `nand(${fn(a)}, ${fn(b)})`;
    const nor = (a, b) => `nor(${fn(a)}, ${fn(b)})`;
    const not = a => `not(${fn(a)})`;
    const or = (a, b) => `or${fn(a)}, ${fn(b)})`;
    const xnor = (a, b) => `xnor(${fn(a)}, ${fn(b)})`;
    const xor = (a, b) => `xor(${fn(a)}, ${fn(b)})`;
    return "(" + eval(str) + ")";
  }

  _getSymbolJS(arg) {
    if (typeof arg == 'string') {
      let i = this.lin.indexOf(arg);
      if (i == -1) {
        return "(" + arg + ")";
      } else {
        return this.inputs[i].c ? this.inputs[i].c.backtraceJS(this.inputs[i].ci) : '0';
      }
    } else {
      return arg;
    }
  }

  getPopupText() {
    let arr = super.getPopupText();
    arr.push(`• ${this.inputs.length} input${this.inputs.length == 1 ? '' : 's'}`, `• ${this.outputs.length} output${this.outputs.length == 1 ? '' : 's'}`);
    return arr;
  }

  /**
   * From data generated in menu.export...
   * @param {object} data
   * @param {number} x - X xoordinate
   * @param {number} y - Y xoordinate
   * @return {Chip}
   */
  static fromObject(data, x, y) {
    let obj = new Chip(data.name, x, y);

    for (let i = 0; i < data.in.length; i++) obj.inputs[i] = createInputConnObj(0, 0);
    for (let i = 0; i < data.out.length; i++) obj.outputs[i] = createOutputConnObj(0, 0);

    obj.lin = data.in;
    obj.lout = data.out;
    obj.fns = data.fns;
    obj.adjust();
    return obj;
  }
}

Chip.ID = 10;
Chip.hoverInfo = true;

Chip.nameSize = 15;
Chip.labelSize = 8;