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
    get name() { return capitalise(this._type) + " Gate"; }

    /**
     * Get text representation of logic gates
     */

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

        let args = [this.getInputState(0)];
        if (this.inputs.length != 1) args.push(this.getInputState(1));

        arr.push(LogicGate.data[this._type].txt(...args) + ' = ' + this.state);
        return arr;
    }

    /** @override */
    backtrace(subin) {
        const unknown = subin ? '0' : '?';

        let str;
        const a = this.inputs[0].c ? this.inputs[0].c.backtrace(subin) : unknown;
        if (this.inputs.length == 1) {
            str = LogicGate.data[this._type].txt(a);
        } else {
            const b = this.inputs[1].c ? this.inputs[1].c.backtrace(subin) : unknown;
            str = LogicGate.data[this._type].txt(a, b);
        }
        return "(" + str + ")";
    }

    toObject() {
        return { ...super.toObject(), d: LogicGate.types.indexOf(this._type) };
    }
}

const initLogicGateData = () => {
    // Info for logic gates
    LogicGate.data = {
        buffer: { w: 60, h: 46, fn: a => a, inputs: [[0, 23]], output: [59, 23], txt: a => a, },
        not: { w: 61, h: 46, fn: a => !a, inputs: [[0, 23]], output: [60, 23], txt: a => '¬' + a, },
        and: { w: 61, h: 43, fn: (a, b) => a && b, inputs: [[0, 11], [0, 31]], output: [60, 21], txt: (a, b) => `${a}⋅${b}`, },
        or: { w: 61, h: 50, fn: (a, b) => a || b, inputs: [[0, 15], [0, 34]], output: [60, 25], txt: (a, b) => `${a}+${b}`, },
        xor: { w: 64, h: 50, fn: (a, b) => (a && !b) || (!a && b), inputs: [[0, 15], [0, 34]], output: [63, 25], txt: (a, b) => `${a}⊕${b}`, },
        nor: { w: 61, h: 50, fn: (a, b) => !(a || b), inputs: [[0, 15], [0, 34]], output: [60, 25], txt: (a, b) => `¬(${a}+${b})`, },
        nand: { w: 60, h: 42, fn: (a, b) => !(a && b), inputs: [[0, 11], [0, 30]], output: [59, 21], txt: (a, b) => `¬(${a}⋅${b})`, },
        xnor: { w: 65, h: 50, fn: (a, b) => (a && b) || (!a && !b), inputs: [[0, 15], [0, 34]], output: [64, 25], txt: (a, b) => `¬(${a}⊕${b})`, },
    };
    LogicGate.types = [];

    for (const gate in LogicGate.data) {
        if (LogicGate.data.hasOwnProperty(gate)) {
            LogicGate.data[gate].img = loadImage(`./img/${gate}.png`);
            LogicGate.types.push(gate);
        }
    }
};

LogicGate.ID = 2;