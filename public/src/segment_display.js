class Segment {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.w = 100;
        this.h = 20;
        this.padding = 1; // Padding between rectangles
        this.margin = 0; // Padding between this and bounding box
        this.roundness = 20; // Rounding of rectangles

        this.raw_value = 0; // The raw hex value
        this.value = 0; // The integer passed in

        this.onColour = color(255, 0, 90);
        this.on = true;
    }

    get value() { return this.raw_value; }
    set value(n) {
        n = parseInt(n);
        if (isNaN(n)) n = 0;
        this.raw_value = Segment.getNum(n);
    }

    // Get width of whole segment
    get width() {
        return (2 * this.margin) + (2 * this.h) + this.padding + this.w + this.padding;
    }
    // Set width of whole segment
    set width(w) {
        this.w = w / 1.5;
    }

    // Get height of whole segment
    get height() {
        return (2 * this.margin) + (3 * this.h) + (2 * this.w) + (4 * this.padding);
    }
    // Set height of the whole segment
    set height(h) {
        this.h = h / 2.8;
    }

    // Render display depending on this.value
    display() {
        push();
        stroke(0, 50);

        this.getFill(6);
        rect(this.x + this.margin + this.h + this.padding, this.y + this.margin, this.w, this.h, this.roundness); // TOP: a

        this.getFill(5);
        rect(this.x + this.margin + this.h + this.padding + this.w + this.padding, this.y + this.margin + this.h + this.padding, this.h, this.w, this.roundness); // RIGHT UPPER: b

        this.getFill(4);
        rect(this.x + this.margin + this.h + this.padding + this.w + this.padding, this.y + this.margin + (2 * this.h) + this.w + (3 * this.padding), this.h, this.w, this.roundness); // RIGHT LOWER: c

        this.getFill(3);
        rect(this.x + this.margin + this.h + this.padding, this.y + this.margin + (2 * this.h) + (2 * this.w) + (4 * this.padding), this.w, this.h, this.roundness); // BOTTOM: d

        this.getFill(2);
        rect(this.x + this.margin, this.y + this.margin + (2 * this.h) + this.w + (3 * this.padding), this.h, this.w, this.roundness); // LEFT LOWER: e

        this.getFill(1);
        rect(this.x + this.margin, this.y + this.margin + this.h + this.padding, this.h, this.w, this.roundness); // LEFT UPPER: f

        this.getFill(0);
        rect(this.x + this.margin + this.h + this.padding, this.y + this.margin + this.h + this.w + (2 * this.padding), this.w, this.h, this.roundness); // MIDDLE: g

        pop();
        return this;
    }

    // Get a fill for the value and the shift value
    getFill(shift) {
        let state = (this.value >> shift) & 1;

        if (this.on && state) {
            fill(this.onColour);
            return this.onColour;
        } else {
            noFill();
            return 0;
        }
    }

    static getNum(i) {
        i = i % SEGMENT_ENCODED_NUMS.length;
        return SEGMENT_ENCODED_NUMS[i];
    }
}

const SEGMENT_ENCODED_NUMS = new Uint8Array([ // Numbers 0-15 (0-F)
    0x7E,
    0x30,
    0x6D,
    0x79,
    0x33,
    0x5B,
    0x5F,
    0x70,
    0x7F,
    0x7B,
    0x77,
    0x1F,
    0x4E,
    0x3D,
    0x4F,
    0x47,
]);
