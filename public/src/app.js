const app = {
  /** Canvas for P5 sktches */
  p5canvas: undefined,

  /** Current workspace object which is active
   * @type {Workspace}
  */
  workspace: null,

  /** How many frames per second? */
  fps: 30,

  /** Block all events? */
  isFrozen: false,

  /** Render options */
  opts: {
    gridw: 50, // How wide is the grid?
    cnodew: 9, // Node with for connectors
    curviness: 120, // Curviness to connections
    colourConns: true, // Show state in wires?
    showBLabels: true, // Show binded labels for components
    commentPreview: 25, // Number of characters to view in comment preview
    readonly: false,

    colour0: [250, 30, 55],
    colour1: [74, 159, 74],
    debug: false, // Debug mode?
  },

  /** File data */
  file: {
    open: false, // Is a file open?
    name: null,
    data: null,
    passwd: null, // Store password used to open file so it doesn't need to be re-entered
  },

  /** Data for component-insertion */
  insertData: null,

  /** HTML elements for visuals */
  html: {
    menuBar: document.getElementsByClassName('menu-bar')[0],
    canvasContainer: document.getElementById('container'),
    optionsNofile: document.getElementById('options-nofile'),
    optionsFile: document.getElementById('options-file'),
    cover: document.getElementsByClassName('cover')[0],
    nav: document.getElementById('nav'),
    evalBtn: document.getElementById('btn-eval'),
  },

  init() {
    socket.init();
    CommentBox.img = loadImage('./img/comment.png');
    Clock.imgOff = loadImage('./img/clock-wave-off.png');
    Clock.imgOn = loadImage('./img/clock-wave-on.png');
    hide(this.html.canvasContainer, true);
    hide(this.html.optionsFile, true);
    hide(this.html.cover, true);
    hide(this.html.nav, true);
    this.html.evalBtn.addEventListener('click', (ev) => {
      app.workspace.isRunning ^= 1;
      menu.renderEvalBtn();
    });
    for (let el of document.getElementsByClassName('popup')) hide(el, true);
    document.body.addEventListener('click', this.stopInsert);
    menu.advancedOpts.init();
    this.statusbar.render();
    menu.clockComponent.init();
    menu.nBitOutput.init();
    menu.nBitInput.init();
    menu.sidebar.init();
    initLogicGateData();

    // Sounds
    Sounds.create('click', './sound/click.mp3');
    Sounds.create('error', './sound/error.mp3');
    // Sounds.create('tick', './sound/tick.mp3');

    // User-defined main function?
    if (typeof window.main == 'function') this.tryCatchWrap(window.main);

    // Open file via has in URI?
    if (window.location.hash.length > 0) {
      let name = window.location.hash.substr(1);
      menu.openFile.open({ name });
      window.location.hash = '';
    }
  },

  /** Status bar things */
  statusbar: {
    _: document.getElementById('statusbar'),
    items: [["File", "none"]],
    render() {
      this._.innerHTML = '<div><a target="_blank" href="/help">Help</a></div>';
      for (let item of this.items) {
        this._.insertAdjacentHTML('beforeend', `<div>${item[0]}: ${item[1]}</div>`);
      }
    },
    changeItem(item, value) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i][0] == item) {
          this.items[i][1] = value;
          this.render();
          return true;
        }
      }
      return false;
    },
    removeItem(item) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i][0] == item) {
          this.items.splice(i, 1);
          this.render();
          return true;
        }
      }
      return false;
    },

    /** Edit or add item */
    item(item, value) {
      if (this.changeItem(item, value)) return;
      this.items.push([item, value]);
      this.render();
    },
  },

  /**
   * Manage isFrozen property
   * @param {boolean} isFrozen    New state of isFrozen
   */
  freeze(isFrozen) {
    this.isFrozen = isFrozen;
    document.body.classList[isFrozen ? 'add' : 'remove']('frozen');
  },

  /**
   * Open a new workspace from data
   * - Get file data from app.file.*
  */
  openWorkspace() {
    if (this.workspace) {
      alert('A workspace is already open');
    } else {
      if (this.file.name) {
        let json;
        try {
          json = JSON.parse(this.file.data);
        } catch (e) {
          console.error(e);
          this.message(`File ${this.file.name} is corrupted and cannot be loaded\nError: ` + e.message, ERROR);
          json = null;
        }

        this.workspace = json ? Workspace.fromObject(json) : new Workspace();
        this.statusbar.item('File', this.file.name);
      } else {
        app.workspace = new Workspace();
        this.statusbar.item('File', '*New*');
      }
      this.statusbar.item('Up-To-Date', 'Yes');
      this.history.reset();
      hide(this.html.canvasContainer, false);
      hide(this.html.optionsNofile, true);
      hide(this.html.optionsFile, false);
      hide(this.html.nav, false);
      for (let el of document.getElementsByClassName('current-file')) el.innerText = this.file.name;
      menu.advancedOpts.update();
      menu.renderEvalBtn();
      menu.sidebar.updateChips();
    }
  },

  /** Close workspace */
  closeWorkspace() {
    if (this.workspace) {
      this.workspace.terminate();
      this.workspace = null;
      hide(this.html.canvasContainer, true);
      hide(this.html.optionsNofile, false);
      hide(this.html.optionsFile, true);
      hide(this.html.nav, true);
      this.history.reset();
      this.setOptData(this.defaultOptData());

      // Clear file info
      app.file.open = false;
      app.file.name = app.file.passwd = app.file.data = null;
      app.statusbar.removeItem('File');
      app.statusbar.removeItem('Up-To-Date');

      menu.sidebar.menu_chips.innerHTML = '';
      menu.renderEvalBtn();
    }
  },

  /** Manage history of app.workspace */
  history: {
    _: [],
    i: -1, // Position of current version

    reset() {
      this._.length = 0;
      this.i = -1;
    },

    /** Add item to history */
    push() {
      this._.push(app.workspace.toObject());
      this.i++;
    },

    /** Remove item from history */
    pop() {
      if (this._.length > 0) {
        this._.pop();
        this.i--;
      }
    },

    /** Register change to workspace */
    registerChange(wasChange) {
      if (wasChange) {
        app.workspace.contentAltered = true;
      } else {
        this.pop();
      }
    },

    /** Undo to i - 1 */
    undo() {
      if (this._[this.i] != undefined) {
        app.workspace = Workspace.fromObject(this._[this.i--]);
        return true;
      }
      return false;
    },

    redo() {
      if (this._[this.i + 1] != undefined) {
        app.workspace = Workspace.fromObject(this._[++this.i]);
        return true;
      }
      return false;
    },

    /** Press undo button */
    undoBtn() {
      if (!this.undo()) playSound('error');
    },

    /** Press undo button */
    redoBtn() {
      if (!this.redo()) playSound('error');
    },
  },

  /** 
   * Show message
   * @param {string} msg
   * @param {number} lvl - Level of message. -1: log, 0: info, 1: warning, 2: error
  */
  message(msg, lvl = 0, extra = undefined) {
    switch (lvl) {
      case -1:
        console.log('[LOG] %c' + msg, 'font-style:italic;color:gray;');
        break;
      case 1:
        console.warn('[WARNING] ' + msg);
        alert(msg);
        break;
      case 2:
        playSound('error');
        console.error('[ERROR] ' + msg);
        let title = typeof extra == 'string' ? extra : "Error";
        alert(`⚠ ${title} ⚠\n${msg}`);
        break;
      default:
        console.log('[SERVER] %c' + msg, 'font-style:italic;color:gray;');
        alert(msg);
    }
  },

  /**
   * Try to execute a function
   * @param {Function} fn Function to execute
   * @param {...any} args Arguments to give to @param fn
   * @return {boolean} Was success?
   */
  tryCatchWrap(fn, ...args) {
    try {
      fn(...args);
      return true;
    } catch (e) {
      console.error(e);
      this.message(`Error whilst executing function '${fn.name}':\n${e.message}`, ERROR);
      return false;
    }
  },

  /**
   * Start inserting component
   * @param {number} type - Type of component to insert
   * @param {number} data - Data of component to insert
   */
  startInsert(type, data) {
    if (this.isFrozen) return;
    if (app.opts.readonly) return readonlyMsg();
    this.insertData = [type, data];
    document.body.classList.add('dragging');
  },

  /**
   * Stop inserting component
   * - Called inside p5_funcs @ mousePressed
   * - NB {x, y} are relative to the canvas
   * @param {number} x
   * @param {number} y
   */
  stopInsert(x, y) {
    if (app.insertData && app.workspace) {
      if (x > 0 && x < width && y > 0 && y < height) {
        if (app.opts.readonly) {
          readonlyMsg();
        } else {
          let c = app.workspace.createComponent(...app.insertData, roundCoord(x), roundCoord(y));
          if (c) {
            app.workspace.addComponent(c);
            if (c instanceof LabeledComponent) c.label = c.id.toString();
            app.workspace.contentAltered = true;
          } else {
            app.message(`Unable to insert component`, ERROR);
          }
        }
        app.insertData = null;
        document.body.classList.remove('dragging');
      }
    }
  },

  /** Export current opt data to array */
  getOptData() {
    return [this.opts.gridw, this.opts.curviness, +this.opts.colourConns, this.opts.cnodew, +this.opts.showBLabels, this.opts.commentPreview, +this.opts.readonly];
  },

  /** Import opt data from array (output of this.getOptData) */
  setOptData(array) {
    this.opts.gridw = array[0];
    this.opts.curviness = array[1];
    this.opts.colourConns = !!(array[2]);
    this.opts.cnodew = array[3];
    this.opts.showBLabels = !!(array[4]);
    this.opts.commentPreview = array[5];
    this.opts.readonly = !!(array[6]);
  },

  /** Set opt data to default */
  defaultOptData() {
    return [50, 120, 1, 9, 1, 25, 0];
  },

  /**
   * Add new chip to sidebar
   * @param {object} data - Chip data
   * @param {Workspace} ws - Workspace to add to
   * @return {number} Index of chip data
   * */
  addChip(data, workspace = undefined) {
    if (workspace == undefined) workspace = app.workspace;

    let index = workspace.chips.findIndex(x => x.name == data);
    if (index == -1) {
      let n = workspace.chips.push(data);
      menu.sidebar.updateChips();
      return n - 1;
    } else {
      return index;
    }
  }
};

const INFO = 0;
const WARNING = 1;
const ERROR = 2;