class Label extends Component {
  constructor(x, y) {
    super(x, y);

    this._txt = '';
    this.typing = false;
    this._flash = false;
    this._frames = 0;
    this.linkedc = null; // Component we are linked to
  }

  /**
   * Set text content of this
   * @param {string} txt  Text content
   */
  text(txt) { this._txt = txt; }

  /** @param {boolean} sudo  SUDO render if linkedc? */
  render(sudo = false) {
    this._frames++;

    if (!sudo && this.linkedc) return;

    super.render(() => {
      textAlign(CENTER, CENTER);
      noStroke();
      fill(51);
      textSize(15);
      let p = 7;
      this.w = (typeof this._txt != 'string' || this._txt.length == 0 ? 0 : textWidth(this._txt)) + 2 * p;
      this.h = 25;
      rect(-this.w / 2, -this.h / 2, this.w, this.h);
      fill(250);
      text(this._txt, 0, 0);

      if (this.typing) {
        if (this._flash) {
          stroke(255);
          strokeWeight(2);
          let x = this.w / 2 - p / 2;
          let h = this.h / 3;
          line(x, -h, x, h);

          if (this._frames >= 30) {
            this._flash = false;
            this._frames = 0;
          }
        } else {
          if (this._frames >= 10) {
            this._flash = true;
            this._frames = 0;
          }
        }
      }
    });
  }

  type(event) {
    if (event.keyCode == 13) {
      // Enter
      this.event_mouseup();
    } else if (event.keyCode == 16) { } else if (event.keyCode == 8) {
      // Backspace
      this._txt = this._txt.substr(0, this._txt.length - 1)
    } else if (event.key.length == 1 && Label.validChars.indexOf(event.key) != -1 && this._txt.length < Label.max) {
      this._txt += event.key;
    } else {
      playSound("error");
    }
  }

  event_mouseup(beenMoved) {
    if (!beenMoved) {
      this.typing = !this.typing;
      Label.selected = this.typing ? this : null;

      if (!this.typing && this.linkedc && (typeof this._txt != 'string' || this._txt.length == 0)) this._txt = this.linkedc.id.toString();
    }
  }

  event_delete() { return !this.linkedc; }

  event_mstart() { return !this.linkedc; }

  toObject() {
    // Linked to component via LabeledComponent?
    return this.linkedc ? null : { ...super.toObject(), d: btoa(this._txt), };
  }

  backtrace(subin) {
    return this.linkedc ? this.linkedc.backtrace(subin) : 'null';
  }
}

/**
 * Which label is selected?
 * @type {null | Label}
 */
Label.selected = null;

Label.ID = 3;
Label.hoverInfo = false;
Label.max = 15;
Label.validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY1234567890-_ !:';

class CommentBox extends Component {
  constructor(x, y) {
    super(x, y);
    this.w = this.h = 32;
    this.text = '';
  }

  render() {
    super.render(() => {
      if (CommentBox.img) {
        image(CommentBox.img, -this.w / 2, -this.h / 2);
      }
    });
  }

  event_mouseup(beenMoved) {
    if (!beenMoved) {
      menu.commentBox.open(this);
    }
  }

  toObject() {
    return { ...super.toObject(), d: btoa(this.text), };
  }
}

CommentBox.ID = 4;
CommentBox.hoverInfo = true;