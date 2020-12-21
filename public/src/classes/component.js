class Component {
    constructor(x, y) {
        /** From createInputConnObj */
        this.inputs = [];

        /** From createOutputConnObj */
        this.outputs = [];

        // These coordinates are the centre of the component
        this.x = x;
        this.y = y;

        this.w = 50;
        this.h = 50;

        /** State of component
         * @getter state
         * @type {0 | 1}
         */
        this._state = 0;

        this.label = ''; // Label for component

        this.onStateChange = undefined; // Called whenever state is changed
        this.isHighlighted = false;
    }

    get state() { return this._state; }
    set state(s) {
        s = s ? 1 : 0;
        if (s != this._state) {
            this._state = s;
            if (typeof this.onStateChange === 'function') this.onStateChange();
        }
    }

    get name() { return this.constructor.name; }

    /**
     * Render connections
     */
    renderConns() {
        if (this.inputs.length != 0) {
            strokeWeight(2);
            stroke(51);
            noFill();
            let crv = app.opts.curviness;
            for (let i = 0; i < this.inputs.length; i++) {
                const input = this.inputs[i];
                if (input.c) {
                    if (app.opts.colourConns) stroke(...app.opts['colour' + this.getInputState(i)]);
                    let end = [this.x + input.x, this.y + input.y];
                    let start = [input.c.x + input.c.outputs[input.ci].x, input.c.y + input.c.outputs[input.ci].y];
                    drawCurve(start, end);
                }
            }
        }
    }

    /**
     * Render information
     * @param {Function} fn 
     */
    render(fn) {
        if (Component.Debug) {
            // Bounding box
            noFill();
            stroke(255, 50, 240);
            strokeWeight(1);
            rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);

            strokeWeight(7);
            point(this.x, this.y);
        }

        push();
        translate(this.x, this.y);

        noStroke();
        for (let obj of this.inputs) {
            if (obj.h) fill(90, 90, 255); else fill(51);
            circle(obj.x, obj.y, app.opts.cnodew);
        }
        for (let obj of this.outputs) {
            if (obj.h) fill(90, 90, 255); else fill(51);
            circle(obj.x, obj.y, app.opts.cnodew);
        }

        if (typeof fn == 'function') {
            push();
            fn(this);
            pop();
        }

        // Label
        if (typeof this.label == 'string') {
            fill(51);
            noStroke();
            textSize(13);
            textAlign(CENTER);
            text(this.label, 0, -this.h / 1.7);
        }

        pop();

        if (this.isHighlighted) {
            stroke(250, 240, 50);
            strokeWeight(4);
            noFill();
            let pad = 7;
            rect(this.x - this.w / 2 - pad, this.y - this.h / 2 - pad, this.w + pad * 2, this.h + pad * 2, 13);
        }
    }

    /**
     * Are we over this component?
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} pad  Padding around component
     */
    isOver(x, y, pad = 0) {
        const w = this.w / 2 + pad;
        const h = this.h / 2 + pad;
        // return (x > this.x - w && x < this.x + w && y > this.y - h && y < this.y + h);
        if (x < this.x - w || x > this.x + w || y < this.y - h || y > this.y + h) return false;
        return true;
    }

    /**
     * Are we over a connection node?
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @return {[boolean, number] | false} [isInput, index]
     */
    isOverConn(x, y) {
        const r = app.opts.cnodew / 2;
        for (let i = 0; i < this.inputs.length; ++i) {
            let nx = this.x + this.inputs[i].x, ny = this.y + this.inputs[i].y;
            if (x < nx - r || x > nx + r || y < ny - r || y > ny + r) continue;
            return [true, i];
        }
        for (let i = 0; i < this.outputs.length; ++i) {
            let nx = this.x + this.outputs[i].x, ny = this.y + this.outputs[i].y;
            if (x < nx - r || x > nx + r || y < ny - r || y > ny + r) continue;
            return [false, i];
        }
        return false;
    }

    /**
     * Get state of certain input
     * @param {number} ino      Input number
     * @return {0 | 1} State
     */
    getInputState(ino) {
        if (ino > this.inputs.length - 1) throw new Error(`Component ${this.name}: cannot get input state with index ${ino}`);
        return this.inputs[ino].c ? this.inputs[ino].c.state : 0;
    }

    /**
     * Evaluate component and pass to outputs
     */
    chain_eval() {
        let cont = this.eval();
        if (cont === false) return;
        for (let output of this.outputs) {
            for (let c of output.c) c.chain_eval();
        }
    }

    /**
     * Backtrace and return algebraic representation
     * @param {boolean} subin   Sub in Input values?
     * @return {string}
     */
    backtrace() {
        console.warn(`Each component must have an overrided backtrace method`);
        return '?';
    }

    /**
     * Get hover info for component
     * @return {string[]} Lines for popup
     */
    getPopupText() {
        const arr = [];
        if (Component.Debug) arr.unshift("ID " + this.id);
        return arr;
    }

    /** Click event */
    event_click() {
        this.isHighlighted = !this.isHighlighted;
    }
}

Component.Debug = false;
Component.StyledAlgebra = true;