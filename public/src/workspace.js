class Workspace {
    constructor() {
        /** Object containing all components ('elements') { id: component } */
        this._els = {};

        /** Next ID for next component */
        this._nextCID = 0;

        /** Which component are we hovering over? */
        this.componentOver = null;

        /** How many draw() calls have we been over this.componentOver for (without moving) ? */
        this.componentOverTicks = NaN;

        /** Coordinates of last this.componentOver */
        this.overCoords = [NaN, NaN];

        /** Are we dragging the componentOver? */
        this.componentDragging = false;

        /** Has this.componentDragging been moved? */
        this.componentBeenMoved = false;

        /** Register: has there been a change in anything? (e.g. state change) ? */
        this.stateChanged = true;
        this.stateChangeRequestor = null;

        /** Has content been altered? (used for saving) */
        this.contentAltered = false;

        /**
         * Are we over a connection node?
         * @type {[number, boolean, number] | null} [component id, isInput?, conn index]
         */
        this.connNodeOver = null;
        this.connNodeOver2 = null;

        /**
         * Making connection to this position
         * @type {[number, number] | null}
        */
        this.connTo = null;

        /** Are we evaluating? */
        this._running = true;

        /** Array of all chip data */
        this.chips = [];
    }

    get isRunning() { return this._running; }
    set isRunning(value) {
        this._running = !!value;
        if (value) {
            this.stateChanged = true;
            this.evaluate(true);
        } else {
            for (let id in this._els) if (this._els.hasOwnProperty(id) && this._els[id] instanceof Clock) this._els[id].stop();
        }
    }

    /** Render on this._ */
    render() {
        // GRID
        background(250);
        let every = app.opts.gridw;
        if (every > 0 && !isNaN(every)) {
            strokeWeight(1);
            stroke(9, 51);
            for (let x = 0; x < width; x += every) line(x, 0, x, height);
            for (let y = 0; y < height; y += every) line(0, y, width, y);
        }

        for (const id in this._els) this._els[id].renderConns();

        // Making connection?
        if (this.connTo != null) {
            let c = this._els[this.connNodeOver[0]];
            let node = c[this.connNodeOver[1] ? "inputs" : "outputs"][this.connNodeOver[2]];

            noFill();
            stroke(255, 0, 200);
            drawCurve([c.x + node.x, c.y + node.y], this.connTo);
        }

        for (const id in this._els) this._els[id].render();

        // "Title" box over component...
        if (this.componentOver && this.componentOver.constructor.hoverInfo !== false && this.componentOverTicks > app.fps / 2) {
            textAlign(LEFT);
            const c = this.componentOver;

            fill(169, 225);
            stroke(51);
            strokeWeight(1);
            let x = mouseX + 10, y = mouseY;
            let spacing = 15;

            if (c instanceof CommentBox) {
                textAlign(LEFT, CENTER);

                let txt = c.text.substr(0, app.opts.commentPreview);
                if (txt.length < c.text.length) txt += '...';

                let p = 5;
                let h = 20, w = textWidth(txt) + p * 2;
                rect(x, y, w, h);

                fill(250, 255);
                noStroke();
                textSize(13);

                text(txt, x + p, y + h / 2);
            } else {
                const info = c.getPopupText();

                let w = 100, h = (info.length + 1) * spacing + spacing;
                rect(x, y, w, h);

                fill(250, 255);
                noStroke();
                textSize(13);

                x += 5;
                y += spacing;

                text(c.name, x, y);

                for (let txt of info) {
                    y += spacing;
                    text(txt, x, y);
                }
            }
        }
    }

    /**
     * Loop over all components, executing a function
     * @param {(component: Component, id: number) => boolean} fn        Callback. Break loop if return false
     */
    forEachComponent(fn) {
        for (const id in this._els) {
            if (this._els.hasOwnProperty(id)) {
                if (fn(this._els[id], +id) === false) break;
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
        component.onStateChange = (c) => {
            this.stateChanged = true;
            this.stateChangeRequestor = c;
        };
        if (id == undefined) {
            while (this._els[this._nextCID]) this._nextCID++;
            id = this._nextCID++;
        }

        // ID already exists?
        if (this._els[id]) {
            // Replace old component and relocate it
            let old = this._els[id];
            this._els[id] = component;
            this.addComponent(old);
        } else {
            this._els[id] = component;
        }
        component.id = id;
        if (component instanceof LabeledComponent) this.addComponent(component._labelObj);
        return id;
    }

    /**
     * Get element with ID
     * @param {Number} id           Component ID
     */
    getComponent(id) {
        return this._els[id];
    }

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
        if (dst_c.inputs[dst_index].c) throw new Error(`Connection destination (${dst_c.name}) already has an input at node with index ${dst_index}`);

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
    evaluate(all = false) {
        if (this.isRunning) {
            if (all) {
                for (let id in this._els) {
                    if (this._els.hasOwnProperty(id) && (this._els[id] instanceof Input || this._els[id] instanceof DecimalInput)) this._els[id].chain_eval();
                }
            } else {
                if (this.stateChangeRequestor) {
                    const strid = this.stateChangeRequestor.id;
                    this.stateChangeRequestor = null;
                    for (let id in this._els) {
                        if (this._els.hasOwnProperty(id) && +id === strid) this._els[id].chain_eval();
                    }
                }
            }
            this.stateChanged = false;
        }
    }

    /**
     * Terminate (close) workspace
     */
    terminate() {
        for (let id in this._els) {
            if (this._els.hasOwnProperty(id)) {
                if (this._els[id] instanceof Clock) this._els[id].stop();
                delete this._els[id];
            }
        }
    }

    /**
     * Get object representation of canvas
     * - See data/format.txt for more information
     * @return {object} JSON representation of canvas
     */
    toObject() {
        const json = { o: app.getOptData(), e: [], c: [] };

        this.forEachComponent((c) => {
            let data = c.toObject();
            if (data == null) return;
            json.e.push(data);

            for (let i = 0; i < c.outputs.length; i++) {
                for (let j = 0; j < c.outputs[i].c.length; j++) {
                    json.c.push([c.id, i, c.outputs[i].c[j].id, c.outputs[i].ci[j]]);
                }
            }
        });

        if (json.c.length == 0) delete json.c;
        if (json.e.length == 0) delete json.e;

        return json;
    }

    /**
     * Create a component
     * @param {number} type         Numeric ID of type 
     * @param {any} data            Other data
     * @param {number} x The x position of the component
     * @param {number} y The y position of the component
     * @return {Component | null} The created component (or null if type unknown)
     */
    createComponent(type, data, x, y) {
        switch (type) {
            case ToggleInput.ID: {
                let c = new ToggleInput(x, y);
                if (data !== undefined && !isNaN(+data)) c.setState(0, data);
                return c;
            }
            case ConstInput.ID:
                return new ConstInput(x, y, data ? 1 : 0);
            case PushInput.ID:
                return new PushInput(x, y);
            case DecimalInput.ID: {
                let c = new DecimalInput(x, y);
                if (typeof data === "string") {
                    c.setOutputs(data.length);
                    c.num = parseInt(data, 2);
                }
                return c;
            }
            case LogicGate.ID:
                return new LogicGate(LogicGate.types[data], x, y);
            case Label.ID: {
                let c = new Label(x, y);
                if (typeof data === 'string' && data.length > 0) c.text(atob(data));
                return c;
            }
            case CommentBox.ID: {
                let c = new CommentBox(x, y);
                if (typeof data == 'string') c.text = atob(data);
                return c;
            }
            case Clock.ID: {
                let c = new Clock(x, y);
                if (typeof data === 'number') c.every = data;
                return c;
            }
            case Output.ID:
                return new Output(x, y);
            case Output_4bit.ID:
                return new Output_4bit(x, y);
            case Output_Nbit.ID: {
                let c = new Output_Nbit(x, y);
                if (typeof data === "number") c.setInputs(data);
                return c;
            }
            case OutputASCII.ID:
                return new OutputASCII(x, y);
            case DataReader.ID: {
                let c = new DataReader(x, y);
                if (typeof data === 'string') c.setData(data);
                return c;
            }
            case BusIn.ID: {
                let c = new BusIn(x, y);
                if (typeof data === "number") c.setInputs(data);
                return c;
            }
            case BusOut.ID: {
                let c = new BusOut(x, y);
                if (typeof data === "number") c.setOutputs(data);
                return c;
            }
            case Chip.ID: {
                let cdata = this.chips[data];
                if (cdata == null) return null;
                return Chip.fromObject(cdata, x, y);
            }
            default:
                return null;
        }
    }

    /**
     * Create Canvas object from object data
     * - Expects input equivalent to <instance>.toObject()
     * @param {object} data - JSON data
     * @return {Workspace} Canvas object
     */
    static fromObject(data) {
        const workspace = new Workspace();

        // Logic gates
        if (data.e) {
            for (let el of data.e) {
                if (el.t == Chip.ID) {
                    let i = workspace.chips.findIndex(obj => obj.name == el.d.name);
                    if (i == -1) {
                        i = workspace.chips.push(el.d) - 1;
                    }
                    el.d = i;
                }

                let object = workspace.createComponent(el.t, el.d, el.x, el.y);
                if (object) {
                    if (el.l) object.label = el.l;
                    workspace.addComponent(object, el.id);
                } else {
                    app.message(`Malformed component data. Unable to create component.\nData block: ${JSON.stringify(el)}`, ERROR, "Assembly Error");
                }
            }
        }

        // connections
        if (data.c) {
            for (let conn of data.c) {
                try {
                    workspace.connectComponents(...conn);
                } catch (e) {
                    console.error(e);
                    app.message(`Error with connection [${conn}]:\n${e.message}`, ERROR, "Assembly Error");
                }
            }
        }

        // app.opts data
        if (data.o) app.setOptData(data.o);

        return workspace;
    }
}