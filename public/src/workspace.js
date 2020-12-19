class Workspace {
    constructor() {
        /** Object containing all components ('elements') { id: component } */
        this._els = {};

        /** Next ID for next component */
        this._nextCID = 0;

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
        this.stateChanged = true;

        /** Has content been altered? (used for saving) */
        this.contentAltered = false;
    }

    /** Render on this._ */
    render() {
        background(245);
        for (const id in this._els) {
            this._els[id].render();
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
        for (const id in this._els) {
            if (this._els.hasOwnProperty(id)) {
                if (fn(this._els[id], id) === false) break;
            }
        }
    }

    /**
     * Add a component. Return index.
     * @param {Component} component Component to add
     * @param {number} [id]  Optional ID to force component to be
     * @return {Number} ID of component
     */
    addComponent(component, id = undefined) {
        component.onStateChange = () => this.stateChanged = true;
        if (id == undefined) id = this._nextCID++;
        this._els[id] = component;
        component.id = id;
        return id;
    }

    /**
     * Get element with ID
     * @param {Number} id           Component ID
     */
    getComponent(id) {
        return this._els[id];
    }

    getComponentCount() { return this._els.length; }

    /** 
     * Connect two components together (src -> dst)
     * @param {Number} src          Source component
     * @param {number} src_index    Connection node index
     * @param {Number} dst          Destination component
     * @param {number} dst_index    Connection node index
     */
    connectComponents(src, src_index, dst, dst_index) {
        const src_c = this._els[src];
        if (src_c.outputs.length <= src_index) throw new Error(`Connection source (${src_c.name}) does not have output node with index ${src_index}`);

        const dst_c = this._els[dst];
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
        if (this._els.hasOwnProperty(c.id)) {
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
            delete this._els[c.id];
        }
    }

    /**
    * EValuate components
    */
    evaluate() {
        for (let id in this._els) {
            if (this._els.hasOwnProperty(id) && this._els[id].constructor.name == 'Input') this._els[id].chain_eval();
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
     * Get object representation of canvas
     * - See saveDataStructure.txt for more information
     * @return {object} JSON representation of canvas
     */
    toObject() {
        const json = {};

        // Array of components ('elements')
        json.e = [];

        // Array of connections
        json.c = [];

        let logicGateTypes = Object.keys(LogicGate.data);
        this.forEachComponent((c) => {
            let obj = { id: c.id, t: c.constructor.ID, x: c.x, y: c.y };
            if (c.constructor.name == 'LogicGate') obj.d = logicGateTypes.indexOf(c.type);
            else if (c.constructor.name == 'Input' || c.constructor.name == 'Output') obj.d = c.label;
            json.e.push(obj);

            for (let output of c.outputs) {
                for (let i = 0; i < output.c.length; i++) {
                    json.c.push([c.id, i, output.c[i].id, output.ci[i]]);
                }
            }
        });

        return json;
    }

    /**
     * Create Canvas object from object data
     * - Expects input equivalent to <instance>.toObject()
     * @param {object} data - JSON data
     * @return {Workspace} Canvas object
     */
    static fromObject(data) {
        const workspace = new Workspace();
        const logicGateTypes = Object.keys(LogicGate.data);

        // Logic gates
        if (data.e) {
            for (let el of data.e) {
                let object;
                switch (el.t) {
                    case 0:
                        object = new Input(el.d, el.x, el.y);
                        break;
                    case 1:
                        object = new Output(el.d, el.x, el.y);
                        break;
                    case 2:
                        object = new Viewer(el.x, el.y);
                        break;
                    case 3:
                        object = new LogicGate(logicGateTypes[el.d], el.x, el.y);
                        break;
                    default:
                        throw new Error('Unknown component type #' + el.t);
                }
                workspace.addComponent(object, el.id);
            }
        }

        // connections
        if (data.c) {
            for (let conn of data.c) {
                workspace.connectComponents(...conn);
            }
        }

        return workspace;
    }
}