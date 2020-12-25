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