class Canvas {
    #_;
    #_w;
    #_h;
    #els;
    #nextCID;

    constructor(container, width, height) {
        // Create P5 canvas
        this.#_w = width;
        this.#_h = height;
        this.#_ = createCanvas(width, height);
        this.#_.parent(container);
        this.#_.style("border", "1px solid black");

        /** Object containing all components ('elements') { id: component } */
        this.#els = {};

        /** Next ID for next component */
        this.#nextCID = 0;

        /** Which component are we hovering over? */
        this.componentOver = null;

        /** Coordinates of last this.componentOver */
        this.overCoords = [NaN, NaN];

        /** Are we dragging the componentOver? */
        this.componentDragging = false;

        /** Has this.componentDragging been moved? */
        this.componentBeenMoved = false;

        /** Primed deletion of component? */
        this.primedDeletion = false;

        /** Frozen: disallows any interaction */
        this.isFrozen = false;

        /** Register: has there been a change in anything? (e.g. state change) ? */
        this.stateChanged = false;
    }

    /** Render on this._ */
    render() {
        background(245);
        for (const id in this.#els) {
            this.#els[id].render();
        }

        if (this.primedDeletion) {
            background(150, 200);
            textAlign(CENTER);
            noStroke();

            textSize(24);
            fill(250, 60, 77);
            let y = height / 2;
            let x = width / 2;
            text('Delete Component', x, y);
            
            textSize(16);
            fill(50, 60, 230);
            y += 35;
            text('Press Enter to delete ' + this.componentOver.name + '...', x, y);
        }
    }

    /**
     * Loop over all components, executing a function
     * @param {(component: Component, id: number) => boolean} fn        Callback. Break loop if return false
     */
    forEachComponent(fn) {
        for (const id in this.#els) {
            if (this.#els.hasOwnProperty(id)) {
                if (fn(this.#els[id], id) === false) break;
            }
        }
    }

    /**
     * Add a component. Return index.
     * @param {Component} component Component to add
     * @return {Number} ID of component
     */
    addComponent(component) {
        component.onStateChange = () => this.stateChanged = true;
        const id = this.#nextCID++;
        this.#els[id] = component;
        component.id = id;
        return id;
    }

    /**
     * Get element with ID
     * @param {Number} id           Component ID
     */
    getComponent(id) {
        return this.#els[id];
    }

    getComponentCount() { return this.#els.length; }

    /** 
     * Connect two components together (src -> dst)
     * @param {Number} src          Source component
     * @param {number} src_index    Connection node index
     * @param {Number} dst          Destination component
     * @param {number} dst_index    Connection node index
     */
    connectComponents(src, src_index, dst, dst_index) {
        const src_c = this.#els[src];
        if (src_c.outputs.length <= src_index) throw new Error(`Connection source (${src_c.name}) does not have output node with index ${src_index}`);

        const dst_c = this.#els[dst];
        if (dst_c.inputs.length <= dst_index) throw new Error(`Connection destination (${dst_c.name}) does not have input node with index ${dst_index}`);
        
        src_c.outputs[src_index].c.push(dst_c);
        src_c.outputs[src_index].ci.push(dst_index);

        dst_c.inputs[dst_index].c = src_c;
        dst_c.inputs[dst_index].ci = src_index;
    }

    /**
     * Remove component
     * @param {Component} c Component to remove
     */
    removeComponent(c) {
        if (this.#els.hasOwnProperty(c.id)) {
            // Remove joint connections
            for (let input of c.inputs) {
                if (input.c) {
                    // Find stored index in input component, and remove their
                    // copy of a connection object
                    let index = input.c.outputs[input.ci].c.indexOf(c);
                    if (index != -1) {
                        input.c.outputs[input.ci].c.splice(index, 1);
                        input.c.outputs[input.ci].ci.splice(index, 1);
                    }
                    
                    // Remove our version
                    input.c = null;
                    input.ci = NaN;
                }
            }
            
            for (let output of c.outputs) {
                for (let i = 0; i < output.c.length; i++) {
                    // Remove conn object stored in output.c[i].inputs array
                    output.c[i].inputs[output.ci[i]].c = null;
                    output.c[i].inputs[output.ci[i]].ci = NaN;
                }
                output.c.length = 0;
            }

            // Actually remove component
            delete this.#els[c.id];
        }
    }

    /**
    * EValuate components
    */
    evaluate() {
        for (let id in this.#els) {
            if (this.#els.hasOwnProperty(id) && this.#els[id].constructor.name == 'Input') this.#els[id].chain_eval();
        }
       console.log("Evaluated");
    }

    /**
     * Get algebraic representation of "circuit" from a certain output
     * @param {number} id       ID of output component to trace back from
     */
    getAlgebraic(id) {
        const c = this.getComponent(id);
        const trace = c.backtrace();
        return (c.constructor.name == 'Output' ? `${c.label} = ` : '') + trace.substring(1, trace.length - 1); 
    }

    /**
     * Get JSON representation of canvas
     * - See saveDataStructure.txt for more information
     * @return {object} JSON representation of canvas
     */
    getJSON() {
        const json = {};

        // Global information
        json.g = { w: this.#_w, h: this.#_h };

        // Array of components ('elements')
        json.e = [];

        // Array of connections
        json.c = [];

        let logicGateTypes = Object.keys(LogicGate.data);
        this.forEachComponent((c) => {
            let obj = { id: c.id, t: c.constructor.ID, x: c.x, y: c.y };
            if (c.constructor.name == 'LogicGate') obj.d = logicGateTypes.indexOf(c.type);
            else if (c.constructor.name == 'Input'|| c.constructor.name == 'Output') obj.d = c.label;
            json.e.push(obj);
            
            for (let output of c.outputs) {
                for (let i = 0; i < output.c.length; i++) {
                    json.c.push([ c.id, i, output.c[i].id, output.ci[i] ]);
                }
            }
        });

        return json;
    }
}