/**
 * Input component
 * - Input 1 (on) or 0 (off)
 */
class Input extends Component {
    constructor(label, x, y) {
        super(x, y);
        this.label = label;
        this.outputs[0] = createOutputConnObj(this.w / 2, 0, true);
    }

    get name() { return `Input(${this.label})`; }

    /** Toggle state of Input */
    toggle() { this.state ^= 1; }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);
            
            if (this.state == 1) fill(80, 220, 50); else fill(250, 30, 55);
            let pad = this.w / 6;
            noStroke();
            rect(-this.w / 2 + pad, -this.h / 2 + pad, this.w - 2 * pad, this.h - 2 * pad, 6);

            textAlign(CENTER, CENTER);
            fill(17);
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
        return subin ?
            Component.StyledAlgebra ? getHTMLState(this.state) : this.state :
            this.label;
    }

    /** Toggle state */
    event_click() {
        this.toggle();
        Sounds.play("click");
    }
}

Input.ID = 0;

/**
 * Output component
 * - Shows state 0 (off) or 1 (on)
 * - Terminal component
 */
class Output extends Component {
    constructor(label, x, y) {
        super(x, y);
        this.label = label;
        this.inputs[0] = createInputConnObj(-this.w / 2, 0, false);
    }

    get name() { return `Output(${this.label})`; }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);
            
            if (this.state == 1) fill(80, 220, 50); else fill(250, 30, 55);
            let pad = this.w / 6;
            noStroke();
            rect(-this.w / 2 + pad, -this.h / 2 + pad, this.w - 2 * pad, this.h - 2 * pad, 6);
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
            if (subin) {
                return Component.StyledAlgebra ? getHTMLState(0) : 0;
            } else {
                return Component.StyledAlgebra ? getHTMLUnknown() : '?';
            }
        }
    }
}

Output.ID = 1;

/**
 * "Views" state
 * - Throuhgway which shows state but is non-terminal
*/
class Viewer extends Output {
    constructor(x, y) {
        super('', x, y);
        this.outputs[0] = createOutputConnObj(this.w / 2, 0);
    }

    get name() { return "Viewer"; }

    eval() {
        super.eval();
    }
}

Viewer.ID = 2;