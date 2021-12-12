class DataReader extends LabeledComponent {
    constructor(x, y) {
        super(x, y);
        this.h = 102;
        this.w = 52;
        this._data = [0];
        this._ptr = 0;

        let outx = this.w / 2;
        let yspace = this.h / 9;
        let outy = -this.h / 2 + yspace;
        for (let i = 0; i < 8; i++, outy += yspace) {
            this.outputs[i] = createOutputConnObj(outx, outy);
        }

        this.inputs[0] = createInputConnObj(-this.w / 2, 0); // For clock.
    }

    get name() { return "Data Reader"; }

    get num() { return this._data[this._ptr]; }
    set num(n) { return this._data[this._ptr] = n; }

    incPtr() { return this._ptr = (this._ptr + 1) % this._data.length; }

    /** Get binary of this.num */
    getBinary() {
        return this.num.toString(2).padStart(8, '0');
    }

    updateOutputs() {
        const bin = this.getBinary();
        for (let i = 0; i < bin.length; i++) {
            this.setState(i, bin[bin.length - i - 1] == "1", false);
        }
    }

    /** Set data from comma-seperated string of numbers */
    setData(data) {
        this._data = data.split(',').map(n => parseInt(n.trim()) % 256).filter(n => !isNaN(n) && isFinite(n));
        if (this._data.length === 0) this._data.push(0);
        this._ptr = 0;
        this.updateOutputs();
        this.render();
    }

    /** Get data string */
    getData(seperator = ",") {
        return this._data.join(seperator);
    }

    eval() {
        const input = this.getInputState(0);
        if (input) {
            this.incPtr();
            this.updateOutputs();
            this.render();
        }
    }

    render() {
        super.render(() => {
            fill(200);
            strokeWeight(2);
            stroke(0);
            rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);
            stroke(51);
            fill(0);
            rect(-this.w * (2 / 5), -this.h / 3, this.w * (4 / 5), this.h * (2 / 3), 4);
            push();
            textAlign(CENTER, CENTER);
            textSize(30);
            textFont(app.font_clacon2);
            noStroke();
            fill(50, 205, 50);
            text(this._ptr, 0, -15);
            text(this.num.toString(16).toUpperCase().padStart(2, "0"), 0, 15);
            pop();
        });
    }

    event_mouseup(beenMoved) {
        if (!beenMoved) {
            this.isHighlighted ^= 1;
            if (this.isHighlighted) {
                menu.dataReader.open(this);
            }
        }
    }

    getPopupText() {
        const arr = super.getPopupText();
        arr.push("Ptr: " + this._ptr);
        arr.push("Data: " + this._data.length);
        arr.push("Value: " + this.num);
        return arr;
    }

    toObject() {
        return { ...super.toObject(), d: this.getData() };
    }
}

DataReader.ID = 13;
DataReader.hoverInfo = true;