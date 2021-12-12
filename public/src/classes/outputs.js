/**
 * Output component
 * - Shows state 0 (off) or 1 (on)
 * - Terminal component
 */
class Output extends LabeledComponent {
    constructor(x, y, label) {
        super(x, y, label);
        this.inputs[0] = createInputConnObj(-this.w / 2, 0, false);
    }

    render() {
        super.render(() => {
            const state = this.getInputState(0);

            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            noStroke();
            fill(...app.opts['colour' + state]);
            textSize(35);
            textAlign(CENTER, CENTER);
            text(state, 0, 0);
        });
    }

    eval() { }

    /** @override */
    backtrace(out, subin) {
        if (this.inputs[0].c) {
            return this.inputs[0].c.backtrace(this.inputs[0].ci, subin);
        } else {
            return subin ? '0' : '?';
        }
    }

    /** @override */
    backtraceJS(out) { return this.inputs[0].c ? this.inputs[0].c.backtraceJS(this.inputs[0].ci) : '0'; }
}

Output.hoverInfo = true;
Output.ID = 1;


class Output_4bit extends Component {
    constructor(x, y) {
        super(x, y);
        this.h = 102;
        this.w = 52;

        let outx = -this.w / 2;
        let yspace = this.h / 5;
        let outy = -this.h / 2 + yspace;
        for (let i = 0; i < 4; i++, outy += yspace) {
            this.inputs[i] = createInputConnObj(outx, outy);
        }

        this._segment = new Segment(0, 0);
        this._segment.width = this.w / 1.5;
        this._segment.height = 20;
        this._segment.x = -this._segment.width / 2;
        this._segment.y = -this._segment.height / 2;
        this._segment.roundness = 5;
        this._segment.onColour = color(...app.opts.colour1);

        this.num = 0;
    }

    get name() { return '4-bit output'; }
    get num() { return this._num; }
    set num(v) {
        if (typeof v == 'number' && !isNaN(v)) {
            this._num = v;
            this._segment.value = v;
            this._segment.onColour = color(...app.opts['colour' + (this.num == 0 ? 0 : 1)]);
        }
    }

    /** Get binary inputs */
    getBinary() {
        let bits = this.inputs.map(obj => obj.c.getState(0));
        bits.reverse();
        return bits.join('');
    }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            this._segment.display();
        });
    }

    eval() {
        let num = 0;
        for (let i = 0; i < this.inputs.length; i++) {
            num += this.getInputState(i) * Math.pow(2, i);
        }
        if (num != this.num) this.num = num;
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Value: " + this.num, ` • 0b${this.getBinary()}`, ` • 0x${this.num.toString(16).toUpperCase()}`);
        return arr;
    }
}

Output_4bit.ID = 8;
Output_4bit.hoverInfo = true;


class Output_Nbit extends Component {
    constructor(x, y) {
        super(x, y);
        this.h = 85;
        this._segments = [];
        this._max = 0; // Stores this.getMax() from last this.adjust() call
        this._num = 0;
        this.setInputs(1);
        this.num = 0;
    }

    get name() { return this.inputs.length + "-bit output"; }

    get num() { return this._num; }
    set num(num) {
        num %= this._max + 1;
        this._num = num;

        let length = this._max.toString().length;
        let digits = num.toString().padStart(length, '0');
        let ignoreZero = true;
        for (let i = 0; i < digits.length; i++) {
            if (digits[i] == "0" && ignoreZero && i < digits.length - 1) {
                this._segments[digits.length - 1 - i].on = false;
                this._segments[digits.length - 1 - i].value = 0;
            } else {
                ignoreZero = false;
                this._segments[digits.length - 1 - i].on = true;
                this._segments[digits.length - 1 - i].value = +digits[i];
            }
        }
    }

    /**
     * Set a new number of inputs
     * @param {number} n - Number of inputs 
     */
    setInputs(n) {
        if (n < 1 || n > Output_Nbit.max || n == this.inputs.length) return;
        if (n > this.inputs.length) {
            let lim = n - this.inputs.length;
            for (let i = 0; i < lim; i++) this.inputs.push(createInputConnObj(0, 0));
        } else {
            while (this.inputs.length > n) {
                removeConn(this, true, this.inputs.length - 1);
                this.inputs.pop();
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
        this.w = (Output_Nbit.segw + pad) * segments;
        let x = -this.w / 2 + Output_Nbit.segw / 2 + pad / 2;
        let y = 0;
        for (let i = 0; i < segments; i++) {
            const s = new Segment(0, 0);
            s.width = Output_Nbit.segw;
            s.height = Output_Nbit.segh;
            s.x = x - s.width / 2;
            s.y = -s.height / 2;
            s.roundness = 5;
            s.onColour = color(...app.opts.colour1);
            this._segments.unshift(s);
            x += Output_Nbit.segw + pad;
        }

        let space = this.h / this.inputs.length;
        y = -this.h / 2 + space / 2;
        x = -this.w / 2;
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].x = x;
            this.inputs[i].y = y;
            y += space;
        }

        this._max = this.getMax();
        if (this.num != 0) this.num = this.num;
    }

    /** Get binary inputs */
    getBinary() {
        let bits = this.inputs.map(obj => obj.c.getState(0));
        bits.reverse();
        return bits.join('');
    }

    /** Get maximum value (decimal) */
    getMax() {
        return Math.pow(2, this.inputs.length) - 1;
    }

    /** Calculate decimal value */
    getDecimal() {
        let num = 0;
        for (let i = 0; i < this.inputs.length; i++) {
            num += this.getInputState(i) * Math.pow(2, i);
        }
        return num;
    }

    eval() {
        let num = this.getDecimal();
        if (this.num != num) this.num = num;
    }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            for (let s of this._segments) s.display();
        });
    }

    event_mouseup(beenMoved) {
        if (!beenMoved) {
            this.isHighlighted ^= 1;
            if (this.isHighlighted) {
                menu.nBitOutput.open(this);
            }
        }
    }

    toObject() {
        let obj = super.toObject();
        obj.d = this.inputs.length;
        return obj;
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Value: " + this.num, ` • 0x${this.num.toString(16).toUpperCase()}`);
        return arr;
    }
}

Output_Nbit.ID = 9;
Output_Nbit.hoverInfo = true;
Output_Nbit.segw = 33;
Output_Nbit.segh = 15;
Output_Nbit.max = 16;

class OutputASCII extends Component {
    constructor(x, y) {
        super(x, y);
        this.h = 102;
        this.w = 52;
        this._num = 0;
        this.num = 0;

        let outx = -this.w / 2;
        let yspace = this.h / 9;
        let outy = -this.h / 2 + yspace;
        for (let i = 0; i < 8; i++, outy += yspace) {
            this.inputs[i] = createInputConnObj(outx, outy);
        }
    }

    get name() { return "ASCII output"; }

    get num() { return this._num; }
    set num(num) {
        this._num = num % 256;
    }

    /** Get binary inputs */
    getBinary() {
        let bits = this.inputs.map(obj => obj.c.getState(0));
        bits.reverse();
        return bits.join('');
    }

    /** Calculate decimal value */
    getDecimal() {
        let num = 0;
        for (let i = 0; i < this.inputs.length; i++) {
            num += this.getInputState(i) * Math.pow(2, i);
        }
        return num;
    }

    eval() {
        this.num = this.getDecimal();
    }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);
            stroke(51);
            fill(0);
            rect(-this.w * (2 / 5), -this.h / 3, this.w * (4 / 5), this.h * (2 / 3), 4);
            push();
            textAlign(CENTER, CENTER);
            textSize(45);
            textFont(app.font_clacon2);
            noStroke();
            fill(50, 205, 50);
            text(String.fromCharCode(this.num), 0, 0);
            pop();
        });
    }

    event_mouseup(beenMoved) {
        if (!beenMoved) {
            this.isHighlighted ^= 1;
            if (this.isHighlighted) {
                menu.nBitOutput.open(this);
            }
        }
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Value: " + this.num, ` • 0x${this.num.toString(16).toUpperCase()}`);
        return arr;
    }
}

OutputASCII.ID = 12;
OutputASCII.hoverInfo = true;