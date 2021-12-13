class DataReader extends LabeledComponent {
    constructor(x, y) {
        super(x, y);
        this.h = 102;
        this.w = 52;
        this._data = [0];
        this._ptr = 0;

        let outx = this.w / 2;
        let yspace = this.h / 9;
        let outy = -this.h / 2 + yspace;
        for (let i = 0; i < 8; i++, outy += yspace) {
            this.outputs[i] = createOutputConnObj(outx, outy);
        }

        this.inputs[0] = createInputConnObj(-this.w / 2, 0); // For clock.
    }

    get name() { return "Data Reader"; }

    get num() { return this._data[this._ptr]; }
    set num(n) { return this._data[this._ptr] = n; }

    incPtr() { return this._ptr = (this._ptr + 1) % this._data.length; }

    /** Get binary of this.num */
    getBinary() {
        return this.num.toString(2).padStart(8, '0');
    }

    updateOutputs() {
        const bin = this.getBinary();
        for (let i = 0; i < bin.length; i++) {
            this.setState(i, bin[bin.length - i - 1] == "1", false);
        }
    }

    /** Set data from comma-seperated string of numbers */
    setData(data) {
        this._data = data.split(',').map(n => parseInt(n.trim()) % 256).filter(n => !isNaN(n) && isFinite(n));
        if (this._data.length === 0) this._data.push(0);
        this._ptr = 0;
        this.updateOutputs();
        this.render();
    }

    /** Get data string */
    getData(seperator = ",") {
        return this._data.join(seperator);
    }

    eval() {
        const input = this.getInputState(0);
        if (input) {
            this.incPtr();
            this.updateOutputs();
            this.render();
        }
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
            textSize(30);
            textFont(app.font_clacon2);
            noStroke();
            fill(50, 205, 50);
            text(this._ptr, 0, -15);
            text(this.num.toString(16).toUpperCase().padStart(2, "0"), 0, 15);
            pop();
        });
    }

    event_mouseup(beenMoved) {
        if (!beenMoved) {
            this.isHighlighted ^= 1;
            if (this.isHighlighted) {
                menu.dataReader.open(this);
            }
        }
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Ptr: " + this._ptr);
        arr.push("Data: " + this._data.length);
        arr.push("Value: " + this.num);
        return arr;
    }

    toObject() {
        return { ...super.toObject(), d: this.getData() };
    }
}

DataReader.ID = 13;
DataReader.hoverInfo = true;

class BusIn extends Component {
    constructor(x, y) {
        super(x, y);
        this.h = 85;
        this._num = 0;
        this._max = 0;
        this._maxLength = 0;
        this.outputs.push(createOutputConnObj(0, 0));
        this.setInputs(1);
        this.num = 0;
    }

    get name() { return this.inputs.length + "-bit bus input"; }

    get num() { return this._num; }
    set num(num) {
        this._num = num % (this._max + 1);
        this.setState(0, this._num);
    }

    /**
     * Set a new number of inputs
     * @param {number} n - Number of inputs 
     */
    setInputs(n) {
        if (n < 1 || n > BusIn.max || n == this.inputs.length) return;
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
        this._max = this.getMax();
        this._maxLength = Math.ceil(Math.log(this._max) / Math.log(0x10));
        this.w = 25 + 25 * this._maxLength;
        this.outputs[0].x = this.w / 2;

        let space = this.h / this.inputs.length;
        let y = -this.h / 2 + space / 2;
        let x = -this.w / 2;
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].x = x;
            this.inputs[i].y = y;
            y += space;
        }

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

    getHex() {
        return this.getDecimal().toString(16).toUpperCase().padStart(this._maxLength, "0");
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
            stroke(51);
            fill(0);
            rect(-this.w * (2 / 5), -this.h / 3, this.w * (4 / 5), this.h * (2 / 3), 4);
            push();
            textAlign(CENTER, CENTER);
            textSize(45);
            textFont(app.font_clacon2);
            noStroke();
            fill(50, 205, 50);
            text(this.getHex(), 0, 0);
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

BusIn.ID = 14;
BusIn.hoverInfo = true;
BusIn.max = 16;

class BusOut extends Component {
    constructor(x, y) {
        super(x, y);
        this.h = 85;
        this._num = 0;
        this._max = 2 ** 8;
        this._maxLength = 2;
        this.inputs[0] = createInputConnObj(0, 0);
        this.setOutputs(1);
        this.num = 0;
    }

    get name() { return this.outputs.length + "-bit bus output"; }

    get num() { return this._num; }
    set num(num) {
        this._num = num % (this._max + 1);
        this.updateOutputs();
    }

    /**
     * Set a new number of outputs
     * @param {number} n - Number of outputs 
     */
    setOutputs(n) {
        if (n < 1 || n > BusOut.max || n == this.outputs.length) return;
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
        this._max = this.getMax();
        this._maxLength = Math.ceil(Math.log(this._max) / Math.log(0x10));
        this.w = 25 + 25 * this._maxLength;
        this.inputs[0].x = -this.w / 2;

        let space = this.h / this.outputs.length;
        let y = -this.h / 2 + space / 2;
        let x = this.w / 2;
        for (let i = 0; i < this.outputs.length; i++) {
            this.outputs[i].x = x;
            this.outputs[i].y = y;
            y += space;
        }

        if (this.num != 0) this.num = this.num;
    }

    updateOutputs() {
        const bin = this.getBinary();
        for (let i = 0; i < this.outputs.length; i++) {
            this.setState(i, bin[bin.length - i - 1] === "1" ? 1 : 0);
        }
    }

    getBinary() {
        return this.num.toString(2).padStart(this._max.toString(2).length, '0');
    }

    /** Get maximum value (decimal) */
    getMax() {
        return Math.pow(2, this.outputs.length) - 1;
    }

    getHex() {
        return this.num.toString(16).toUpperCase().padStart(this._maxLength, "0");
    }

    eval() {
        let num = this.getInputState(0);
        if (this.num != num) this.num = num;
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
            text(this.getHex(), 0, 0);
            pop();
        });
    }

    event_mouseup(beenMoved) {
        if (!beenMoved) {
            this.isHighlighted ^= 1;
            if (this.isHighlighted) {
                menu.nBitInput.open(this);
            }
        }
    }

    toObject() {
        let obj = super.toObject();
        obj.d = this.outputs.length;
        return obj;
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Value: " + this.num, ` • 0x${this.num.toString(16).toUpperCase()}`);
        return arr;
    }
}

BusOut.ID = 15;
BusOut.hoverInfo = true;
BusOut.max = 16;