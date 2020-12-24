/**
 * Input component
 * - Input 1 (on) or 0 (off)
 */
class Input extends LabeledComponent {
    constructor(x, y, label) {
        super(x, y, label);
        this.outputs[0] = createOutputConnObj(this.w / 2, 0, true);
    }

    /** Toggle state of Input */
    toggle() { this.state ^= 1; }

    /**
     * @param {Function} fn - Optional callback
     * */
    render(fn) {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            if (typeof fn == 'function') {
                fn();
            } else {
                fill(...app.opts['colour' + this.state]);
                if (pad == undefined) pad = this.w / 6;
                noStroke();
                rect(-this.w / 2 + pad, -this.h / 2 + pad, this.w - 2 * pad, this.h - 2 * pad, 6);

                textAlign(CENTER, CENTER);
                fill(200);
                textSize(13);
                text(this.state == 1 ? "On" : "Off", 0, 0);
            }
        });
    }

    /**
     * Called by chain_eval
     */
    eval() { }

    /** @override */
    backtrace(subin) {
        return subin ? this.state : this.label;
    }

    /** Toggle state */
    event_click() {
        this.toggle();
        playSound('click');
    }

    toObject() {
        let obj = super.toObject();
        if (obj.d == undefined && this.state == 1) obj.d = 1;
        return obj;
    }
}

Input.hoverInfo = true;
Input.ID = 0;

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
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            noStroke();
            fill(...app.opts['colour' + this.state]);
            textSize(35);
            textAlign(CENTER, CENTER);
            text(this.state, 0, 0);
        });
    }

    /**
     * Called by chain_eval
     * Update state according to input
    */
    eval() {
        this.state = this.getInputState(0);
        return false;
    }

    /** @override */
    backtrace(subin) {
        if (this.inputs[0].c) {
            return this.inputs[0].c.backtrace(subin);
        } else {
            return subin ? 0 : '?';
        }
    }
}

Output.hoverInfo = true;
Output.ID = 1;

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
            // this.stop();
            // this.start();
        }
    }

    start() {
        if (this._interval) this.stop();
        this._interval = setInterval(() => {
            this.state ^= 1;
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
            let img = 'img' + (this.state ? "On" : "Off");
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

    event_click() {
        this.isHighlighted ^= 1;
        if (this._interval) this.stop(); else this.start();
        if (this.isHighlighted) {
            menu.clockComponent.open(this);
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
Clock.ID = 5;