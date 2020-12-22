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

  event_click() {
    menu.commentBox.open(this);
  }

  toObject() {
    return { ...super.toObject(), d: btoa(this.text), };
  }
}

CommentBox.ID = 4;
CommentBox.hoverInfo = true;