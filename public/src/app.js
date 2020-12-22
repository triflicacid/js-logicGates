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
    canvasContainer: document.getElementById('container'),
    optionsNofile: document.getElementById('options-nofile'),
    optionsFile: document.getElementById('options-file'),
    cover: document.getElementsByClassName('cover')[0],
    nav: document.getElementById('nav'),
  },

  /** Status bar things */
  statusbar: {
    _: document.getElementById('statusbar'),
    items: [["File", "none"]],
    render() {
      this._.innerHTML = '<div><a target="_blank" href="help.html">Help</a></div>';
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

  init() {
    socket.init();
    hide(this.html.canvasContainer, true);
    hide(this.html.optionsFile, true);
    hide(this.html.cover, true);
    hide(this.html.nav, true);
    for (let el of document.getElementsByClassName('popup')) hide(el, true);
    document.body.addEventListener('click', this.stopInsert);
    menu.advancedOpts.init();
    this.statusbar.render();

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
        } catch {
          this.message(`File ${this.file.name} is corrupted and cannot be opened`, ERROR);
          return;
        }

        this.workspace = Workspace.fromObject(json);
        this.statusbar.item('File', this.file.name);
      } else {
        app.workspace = new Workspace();
        this.statusbar.item('File', '*New*');
      }
      this.statusbar.item('Up-To-Date', 'Yes');
      hide(this.html.canvasContainer, false);
      hide(this.html.optionsNofile, true);
      hide(this.html.optionsFile, false);
      hide(this.html.nav, false);
      for (let el of document.getElementsByClassName('current-file')) el.innerText = this.file.name;
      menu.advancedOpts.update();
    }
  },

  /** Close workspace */
  closeWorkspace() {
    if (this.workspace) {
      this.workspace = null;
      hide(this.html.canvasContainer, true);
      hide(this.html.optionsNofile, false);
      hide(this.html.optionsFile, true);
      hide(this.html.nav, true);

      // Clear file info
      app.file.open = false;
      app.file.name = app.file.passwd = app.file.data = null;
      app.statusbar.removeItem('File');
      app.statusbar.removeItem('Up-To-Date');
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
        alert(msg);
        break;
      case 2:
        Sounds.get("error").play(); // THis ensures the sound cannot be stacked
        console.error('⚠ [ERROR] ' + msg);
        alert(`⚠ Error ⚠\n${msg}`);
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
        let c = Workspace.createComponent(...app.insertData, x, y);
        if (c) {
          app.workspace.addComponent(c);
          if (c instanceof LabeledComponent) c.label = c.id.toString();
          app.workspace.contentAltered = true;
        }
        app.insertData = null;
        document.body.classList.remove('dragging');
      }
    }
  },

  /** Export current opt data to array */
  getOptData() {
    return [this.opts.gridw, this.opts.curviness, +this.opts.colourConns, this.opts.cnodew, +this.opts.showBLabels];
  },

  /** Import opt data from array (output of this.getOptData) */
  setOptData(array) {
    this.opts.gridw = array[0];
    this.opts.curviness = array[1];
    this.opts.colourConns = !!(array[2]);
    this.opts.cnodew = array[3];
    this.opts.showBLabels = !!(array[4]);
  },

  /** Set opt data to default */
  defaultOptData() {
    return [50, 120, 1, 9, 1];
  },
};

const INFO = 0;
const WARNING = 1;
const ERROR = 2;