class Component {
    /** State of component
     * @getter state
     * @type {0 | 1} */
    #state = 0;

    constructor(x, y) {
        /**
         * List of inputs and outputs connected to us
         * Array of { x, y, c: Component?, ci: number? } Where (x, y) is coordinate of connector, and component is null or the connected component. ci is the index of the connection to component
         */
        this.inputs = [];
        this.outputs = [];

        // These coordinates are the centre of the component
        this.x = x;
        this.y = y;

        this.w = 50;
        this.h = 50;

        this.label = ''; // Label for component

        this.onStateChange = undefined; // Called whenever state is changed
        this.isHighlighted = false;
    }

    get state() { return this.#state; }
    set state(s) {
        s = s ? 1 : 0;
        if (s != this.#state) {
            this.#state = s;
            if (typeof this.onStateChange === 'function') this.onStateChange();
        }
    }

    get name() { return this.constructor.name; }

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

        // Connecions
        if (this.outputs.length != 0) {
            strokeWeight(2);
            stroke(51);
            for (const output of this.outputs) {
                for (let i = 0; i < output.c.length; i++) {
                    line(
                        this.x + output.x,
                        this.y + output.y,
                        output.c[i].x + output.c[i].inputs[output.ci[i]].x,
                        output.c[i].y + output.c[i].inputs[output.ci[i]].y,
                    );
                }
            }
        }

        push();
        translate(this.x, this.y);

        noStroke();
        fill(51);
        for (let obj of this.inputs) circle(obj.x, obj.y, Component.ConnNodeW);
        for (let obj of this.outputs) circle(obj.x, obj.y, Component.ConnNodeW);

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
     */
    isOver(x, y) {
        return (x > this.x - this.w / 2 && x < this.x + this.w / 2 && y > this.y - this.h / 2 && y < this.y + this.h / 2);
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
     * @return {string[][]} Lines for popup
     */
    getPopupText() {
        const arr = [["Type", this.name]];
        if (Component.Debug) arr.push(["ID", this.id]);
        arr.push(["State", Component.StyledAlgebra ? getHTMLState(this.state) : this.state]);
        return arr;
    }

    /** Click event */
    event_click() {
        console.warn('Component has no click event');
    }
}

Component.Debug = false;
Component.StyledAlgebra = true;

/** Width of connection nodes */
Component.ConnNodeW = 8;