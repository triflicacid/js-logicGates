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

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

            fill(...app.opts['colour' + this.state]);
            let pad = this.w / 6;
            noStroke();
            rect(-this.w / 2 + pad, -this.h / 2 + pad, this.w - 2 * pad, this.h - 2 * pad, 6);

            textAlign(CENTER, CENTER);
            fill(200);
            textSize(13);
            text(this.state == 1 ? "On" : "Off", 0, 0);
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
        Sounds.play("click");
    }

    toObject() {
        let obj = super.toObject();
        if (this.state == 1) obj.d = 1;
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