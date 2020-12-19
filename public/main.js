const app = {
  /** Canvas for P5 sktches */
  p5canvas: undefined,

  /** Current workspace object which is active
   * @type {Workspace}
  */
  workspace: null,

  /** File data */
  file: {
    open: false, // Is a file open?
    name: null,
    data: null,
    passwd: null, // Store password used to open file so it doesn't need to be re-entered
  },

  /** HTML elements for visuals */
  html: {
    canvasContainer: document.getElementById('container'),
    componentInfo: document.getElementById('c-info'),
    evaluateCheckbox: document.getElementById('is-executing'),
    booleanAlgebraTable: document.getElementById('c-algebra'),
    optionsNofile: document.getElementById('options-nofile'),
    optionsFile: document.getElementById('options-file'),
    actionbar: document.getElementById('actionbar'),
    cover: document.getElementsByClassName('cover')[0],
  },

  init() {
    socket.init();
    hide(app.html.canvasContainer, true);
    hide(app.html.optionsFile, true);
    hide(app.html.cover, true);
    for (let el of document.getElementsByClassName('popup')) hide(el, true);
  },

  /**
   * Open a new workspace from data
   * - Get file data from app.file.*
  */
  openWorkspace() {
    if (this.workspace) {
      alert('A workspace is already open');
    } else {
      let json;
      try {
        json = JSON.parse(this.file.data);
      } catch {
        this.message(`File ${this.file.name} is corrupted and cannot be opened`, ERROR);
        return;
      }

      this.workspace = Workspace.fromObject(json);
      hide(this.html.canvasContainer, false);
      hide(this.html.optionsNofile, true);
      hide(this.html.optionsFile, false);
      for (let el of document.getElementsByClassName('current-file')) el.innerText = this.file.name;
      this.html.actionbar.innerText = "File: " + this.file.name;
      loop();
    }
  },

  /** Close workspace */
  closeWorkspace() {
    if (this.workspace) {
      this.workspace = null;
      hide(this.html.canvasContainer, true);
      hide(this.html.optionsNofile, false);
      hide(this.html.optionsFile, true);

      // Clear file info
      app.file.open = false;
      app.file.name = app.file.passwd = app.file.data = null;
      app.html.actionbar.innerText = '';

      noLoop();
    }
  },

  /** 
   * Show message
   * @param {string} msg
   * @param {number} lvl - Level of message. -1: log, 0: info, 1: warning, 2: error
  */
  message(msg, lvl = 0) {
    switch (lvl) {
      case -1:
        console.log('[LOG] %c' + msg, 'font-style:italic;color:gray;');
        break;
      case 1:
        console.warn('[WARNING] ' + msg);
        break;
      case 2:
        Sounds.get("error").play(); // THis ensures the sound cannot be stacked
        console.error('[ERROR] ' + msg);
        alert(`-- Error --\n${msg}`);
        break;
      default:
        console.log('[SERVER] %c' + msg, 'font-style:italic;color:gray;');
        alert(msg);
    }
  },
};

const INFO = 0;
const ERROR = 2;