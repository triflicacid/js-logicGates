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

        this.onStateChange = undefined; // Called whenever state is changed
        this.isHighlighted = false;
    }

    get name() { return this.constructor.name; }

    /**
     * Get state at node {i}
     * @param {number} i - Output node index
     * @return {0 | 1} State
    */
    getState(i) { return this.outputs[i].s; }

    /**
     * Set state at node {i}
     * @param {number} i - Output node index
     * @param {0 | 1} s - New state. Will be converted to 0 or 1 as s = s ? 1 : 0
    */
    setState(i, s) {
        try {
            this.outputs[i].s = s ? 1 : 0;
        } catch (e) {
            console.log("i =", i, ";s =", s, this.outputs);
            throw e;
        }
        if (typeof this.onStateChange == 'function') this.onStateChange();
    }

    /**
     * Render connections
     */
    renderConns() {
        if (this.inputs.length != 0) {
            strokeWeight(app.opts.cnodew / 2);
            stroke(51);
            noFill();
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
        if (app.opts.debug) {
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
        fill(51);
        for (let obj of this.inputs) {
            // if (obj.h) fill(90, 90, 255); else fill(51);
            let w = obj.h ? app.opts.cnodew * 1.5 : app.opts.cnodew;
            circle(obj.x, obj.y, w);
        }
        for (let obj of this.outputs) {
            // if (obj.h) fill(90, 90, 255); else fill(51);
            let w = obj.h ? app.opts.cnodew * 1.5 : app.opts.cnodew;
            circle(obj.x, obj.y, w);
        }

        if (typeof fn == 'function') {
            push();
            fn(this);
            pop();
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
        if (ino < 0 || ino > this.inputs.length - 1) throw new Error(`Component ${this.name}: cannot get input state with index ${ino}`);
        if (this.inputs[ino].c) {
            return this.inputs[ino].c.outputs[this.inputs[ino].ci].s;
        } else {
            return 0;
        }
    }

    /**
     * Evaluate component and pass to outputs
     */
    chain_eval() {
        let cont = this.eval();
        if (cont === false) return;
        for (let output of this.outputs) {
            for (let c of output.c) {
                c.chain_eval();
            }
        }
    }

    /**
     * Backtrace and return algebraic representation
     * @param {number} out - Which output node index did the request come from?
     * @param {boolean} subin   Sub in Input values?
     * @return {string}
     */
    backtrace(out, subin) {
        console.warn(`Each component must have an overrided backtrace method`);
        return '?';
    }

    /**
     * Backtrace and return JavaScript representation
     * @param {number} out - Which output node index did the request come from?
     * @return {string}
     */
    backtraceJS(out) {
        throw new Error(`backtraceJS() is not implemented for component type ` + this.constructor.name);
    }

    /**
     * Get hover info for component
     * @return {string[]} Lines for popup
     */
    getPopupText() {
        const arr = [];
        if (app.opts.debug) arr.unshift("ID " + this.id);
        return arr;
    }

    event_mousedown() { }

    /** @param {boolean} beenMoved - Has this component been moved since event_mousedown has been called? */
    event_mouseup(beenMoved = false) {
        if (beenMoved) return;
        this.isHighlighted = !this.isHighlighted;
    }

    event_click() {
        this.event_mousedown();
        this.event_mouseup();
    }

    /** Permission to delete? */
    event_delete() { return true; }

    /** Permission to START moving */
    event_mstart() { return true; }

    event_drag() { }

    /** Stopped moving */
    event_mstop() { }

    /**
     * Represent class in object form
     * @return {object} Data
     */
    toObject() {
        return { id: this.id, t: this.constructor.ID, x: this.x, y: this.y };
    }
}

Component.StyledAlgebra = true;

/** A component which is tied to a label */
class LabeledComponent extends Component {
    constructor(x, y, label) {
        super(x, y);
        this._labelObj = new Label(this.x, this.y - this.h);
        this._labelObj.linkedc = this;
        this.label = label;
    }

    get label() { return this._labelObj._txt; }
    set label(t) { return this._labelObj._txt = t; }

    render(fn) {
        super.render(fn);
        if (app.opts.showBLabels) {
            this._labelObj.render(true);
            if (app.opts.debug) {
                stroke(255, 100, 200);
                strokeWeight(3);
                line(this.x, this.y - this.h / 2, this._labelObj.x, this._labelObj.y + this._labelObj.h / 2);
            }
        }
    }

    toObject() {
        return { ...super.toObject(), l: this.label };
    }

    event_drag() {
        this._labelObj.x = this.x;
        this._labelObj.y = this.y - this.h;
    }
}