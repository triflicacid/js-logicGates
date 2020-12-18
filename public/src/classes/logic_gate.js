class LogicGate extends Component {
    constructor(type, x, y) {
        super(x, y);
        if (!LogicGate.data.hasOwnProperty(type)) throw new Error(`Invalid logic gate type: ${type}`);
        this._type = type;

        this.w = LogicGate.data[type].w;
        this.h = LogicGate.data[type].h;

        // Adjust coordinates of I/O
        const ho2 = this.h / 2;
        const wo2 = this.w / 2;

        for (let coord of LogicGate.data[type].inputs)
            this.inputs.push(createInputConnObj(coord[0] - wo2, coord[1] - ho2));
        this.outputs[0] = createOutputConnObj(LogicGate.data[type].output[0] - wo2, LogicGate.data[type].output[1] - ho2);
    }

    get type() { return this._type; }
    get symbol() { return LogicGate.data[this._type].symbol; }
    get name() { return `LogicGate(${this._type})`; }

    /**
     * Update component state
     */
    eval() {
        const a = this.getInputState(0);
        if (this.inputs.length == 1) {
            this.state = LogicGate.data[this._type].fn(a) ? 1 : 0;
        } else {
            const b = this.getInputState(1);
            this.state = LogicGate.data[this._type].fn(a, b) ? 1 : 0;
        }
    }

    render() {
        super.render(() => {
            noFill();
            
            if (LogicGate.data[this._type].img) {
                image(LogicGate.data[this._type].img, -this.w / 2, -this.h / 2);
            } else {
                fill(17);
                rect(-this.w / 2, -this.h / 2, this.w, this.h);
                textSize(12);
                noStroke();
                fill(245);
                textAlign(CENTER);
                text(this._type, 0, 0);
            }
        });
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr[0][1] = `Logic Gate (${this._type})`;

        const equation = this.inputs.length == 1 ? (this.symbol + "A") : ("A" + this.symbol + "B");
        arr.push(["Rep", equation]);
        return arr;
    }

    /** @override */
    backtrace(subin) {
        const unknown = subin ? (Component.StyledAlgebra ? getHTMLState(0) : '0') : (Component.StyledAlgebra ? getHTMLUnknown() : '?');

        let str;
        const a = this.inputs[0].c ? this.inputs[0].c.backtrace(subin) : unknown;
        if (this.inputs.length == 1) {
            str = this.symbol + a;
        } else {
            const b = this.inputs[1].c ? this.inputs[1].c.backtrace(subin) : unknown;
            str = a + this.symbol + b;
        }
        return "(" + str + ")";
    }
}

const initLogicGateData = () => {
    // Info for logic gates
    LogicGate.data = {
        buffer: { w: 60, h: 46, fn: a => a, inputs: [[0, 23]], output: [59, 23], symbol: '' },
        not: { w: 61, h: 46, fn: a => !a, inputs: [[0, 23]], output: [60, 23], symbol: '¬' },
        and: { w: 61, h: 43, fn: (a, b) => a && b, inputs: [[0, 11], [0, 31]], output: [60, 21], symbol: '⋅' },
        or: { w: 61, h: 50, fn: (a, b) => a || b, inputs: [[0, 15], [0, 34]], output: [60, 25], symbol: '+' },
        xor: { w: 64, h: 50, fn: (a, b) => (a && !b) || (!a && b), inputs: [[0, 15], [0, 34]], output: [63, 25], symbol: '⊕' },

        // nor: { symbol: '&darr;' },
        // nand: { symbol: '&uarr;' },
        // xnor: { symbol: '&#8857;' },
    };

    for (const gate in LogicGate.data) {
        if (LogicGate.data.hasOwnProperty(gate)) {
            LogicGate.data[gate].img = loadImage(`./img/${gate}.png`);
        }
    }
};

LogicGate.ID = 3;