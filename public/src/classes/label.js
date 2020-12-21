class Label extends Component {
  constructor(x, y) {
    super(x, y);

    this._txt = '';
    this.typing = false;
    this._flash = false;
    this.showInfo = false;
  }

  /**
   * Set text content of this
   * @param {string} txt  Text content
   */
  text(txt) { this._txt = txt; }

  render() {
    super.render(() => {
      textAlign(CENTER, CENTER);
      noStroke();
      fill(51);
      textSize(15);
      let p = 7;
      let w = textWidth(this._txt) + 2 * p;
      let h = 25;
      rect(-w / 2, -h / 2, w, h);
      fill(250);
      text(this._txt, 0, 0);

      if (this.typing) {
        if (this._flash) {
          stroke(255);
          strokeWeight(2);
          let x = w / 2 - p / 2;
          let mh = h / 3;
          line(x, -mh, x, mh);

          if (frameCount % 30 == 0) this._flash = false;
        } else {
          if (frameCount % 15 == 0) this._flash = true;
        }
      }
    });
  }

  type(event) {
    if (event.keyCode == 13) {
      // Enter
      this.event_click();
    } else if (event.keyCode == 16) { } else if (event.keyCode == 8) {
      // Backspace
      this._txt = this._txt.substr(0, this._txt.length - 1)
    } else if (event.key.length == 1) {
      this._txt += event.key;
    } else {
      console.log(event.key, event.keyCode)
      Sounds.play("error");
    }
  }

  event_click() {
    this.typing = !this.typing;
    Label.selected = this.typing ? this : null;
  }
}

/**
 * Which label is selected?
 * @type {null | Label}
 */
Label.selected = null;

Label.ID = 3;