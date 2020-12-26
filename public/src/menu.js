const menu = {
  /** Open File */
  openFile: {
    _: document.getElementById('popup-open-file'),
    fl: document.getElementById('file-list'),

    showPopup(show) {
      if (show) socket.fileList.request(this.populateFileList.bind(this));
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    populateFileList(files) {
      let div = document.createElement('div'), span, a;
      for (let file of files) {
        span = document.createElement('span');
        span.insertAdjacentHTML('beforeend', '&#128462; ');
        a = document.createElement('a');
        a.href = 'javascript:void(0);';
        a.innerText = file.name;
        a.setAttribute('title', `${file.size} bytes ${file.protected ? '(password protected)' : ''}`);
        a.addEventListener('click', () => { this.showPopup(false); this.open(file); });
        span.insertAdjacentElement('beforeend', a);
        div.insertAdjacentElement('beforeend', span);
        div.insertAdjacentHTML('beforeend', '<br>');
      }
      this.fl.innerHTML = '';
      this.fl.insertAdjacentElement('beforeend', div);
    },

    /**
     * Load file into workspace
     * @param {object | string} file - File to load into workspace (file object or file name)
     */
    open(file) {
      if (app.file.open) {
        alert("A file is already open");
      } else {
        if (typeof file == 'string') file = { name: file };
        let passwd = file.protected ?
          file.passwd == undefined ?
            window.prompt(`File ${file.name} is protected. Enter password to open.`) : null
          : file.passwd;
        socket.getFile.request(file.name, passwd, data => {
          app.file.open = true;
          app.file.name = data.name;
          app.file.data = data.data;
          app.file.passwd = passwd;
          app.openWorkspace();
        });
      }
    },
  },

  /**
   * Save file app.file.name
   * @param {boolean} closeAfter  Close file after save?
   */
  saveFile(closeAfter) {
    if (app.workspace) {
      if (app.file.name) {
        try {
          let data = app.workspace.toObject();
          data = JSON.stringify(data);
          socket.writeFile.request(app.file.name, app.file.passwd, data, closeAfter);
          return true;
        } catch (e) {
          console.error(e);
          app.message(`Error saving ${app.file.name}`, ERROR);
          return false;
        }
      } else {
        menu.saveAs.showPopup(true);
      }
    } else {
      app.message('Nothing to save', ERROR);
      return false;
    }
  },

  /** Save As */
  saveAs: {
    _: document.getElementById('popup-saveas'),
    inputName: document.getElementById('saveas-name'),
    inputPasswd: document.getElementById('saveas-passwd'),
    openAfter: true, // Flag for callback - open file after saveAs?

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    save() {
      if (app.workspace) {
        let name = this.inputName.value;
        let passwd = this.inputPasswd.value;
        let data = JSON.stringify(app.workspace.toObject());

        app.file.open = true;
        app.file.name = name;
        app.file.passwd = passwd;
        app.file.data = data;
        app.workspace = null;
        socket.newFile.request(name, passwd, data);
      } else app.message("No workspace to save", ERROR);
    }
  },

  /** Closing the file */
  exitFile: {
    _: document.getElementById('popup-exit-save'),
    closeAfterSave: false, // Close file after saving?

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /**
     * @param {boolean} ignore  Ignore not-up-to-date-ness
     * @default ignore=false
     */
    exit(ignore = false) {
      if (app.workspace) {
        if (app.file.name && !ignore && app.workspace.contentAltered) {
          // Not up-to-date... Prompt to save
          this.showPopup(true);
        } else {
          app.closeWorkspace();
        }
      } else {
        app.message('No workspace to close', ERROR);
      }
    },

    /**
     * Close popup, with a flag
     * @param {boolean} save    Save file before closing?
     */
    popupBtn(save) {
      this.showPopup(false);
      if (save) {
        this.closeAfterSave = true;
        menu.saveFile();
      } else {
        this.exit(true);
      }
    }
  },

  /** Delete a file */
  deleteFile: {
    _: document.getElementById('popup-delete-file'),
    numShow: document.getElementById('delete-file-num'),
    inputNum: document.getElementById('delete-file-num-input'),

    /** To delete, number must be types by user */
    num: NaN,

    showPopup(show) {
      if (show) {
        if (app.opts.readonly) return readonlyMsg();
        this.num = Math.floor(Math.random() * 1e6);
        this.numShow.innerText = this.num;
      } else {
        this.inputNum.value = '';
      }

      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    delete() {
      if (app.workspace) {
        if (app.opts.readonly) return readonlyMsg();
        if (app.file.name) {
          if (this.num != +this.inputNum.value) {
            this.showPopup(false);
            app.message(`Entered number was incorrect`, ERROR);
          } else {
            this.showPopup(false);
            socket.deleteFile.request(app.file.name, app.file.passwd);
          }
        } else {
          this.showPopup(false);
          app.closeWorkspace();
        }
      } else {
        app.message('Nothing to delete', ERROR);
      }
    }
  },

  toggleNav() {
    hide(app.html.nav, !isHidden(app.html.nav));
  },

  advancedOpts: {
    _: document.getElementById('popup-adv-opts'),
    gridSize: document.getElementById('ao-grid-size'),
    gridSizeVal: document.getElementById('ao-grid-size-val'),
    curviness: document.getElementById('ao-curviness'),
    curvinessVal: document.getElementById('ao-curviness-val'),
    cnodew: document.getElementById('ao-cnodew'),
    cnodewVal: document.getElementById('ao-cnodew-val'),
    colouredWires: document.getElementById('ao-coloured-wires'),
    blabels: document.getElementById('ao-blabels'),
    cpreview: document.getElementById('ao-cpreview'),
    cpreviewVal: document.getElementById('ao-cpreview-val'),
    readonly: document.getElementById('ao-readonly'),
    debug: document.getElementById('ao-debug'),

    init() {
      this.gridSize.addEventListener('input', event => {
        app.opts.gridw = +event.target.value;
        menu.advancedOpts.gridSizeVal.innerText = event.target.value;
      });
      this.curviness.addEventListener('input', event => {
        app.opts.curviness = +event.target.value;
        menu.advancedOpts.curvinessVal.innerText = event.target.value;
      });
      this.cnodew.addEventListener('input', event => {
        app.opts.cnodew = +event.target.value;
        menu.advancedOpts.cnodewVal.innerText = event.target.value;
      });
      this.colouredWires.addEventListener('change', event => app.opts.colourConns = event.target.checked);
      this.blabels.addEventListener('change', event => app.opts.showBLabels = event.target.checked);
      this.cpreview.addEventListener('input', event => {
        app.opts.commentPreview = +event.target.value;
        menu.advancedOpts.cpreviewVal.innerText = event.target.value;
      });
      this.readonly.addEventListener('change', event => app.opts.readonly = event.target.checked);
      this.debug.addEventListener('change', event => app.opts.debug = event.target.checked);
      this.update();
    },

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /** Update visual elements to current opt config */
    update() {
      this.cnodewVal.innerText = app.opts.cnodew;
      this.cnodew.value = app.opts.cnodew;
      this.curvinessVal.innerText = app.opts.curviness;
      this.curviness.value = app.opts.curviness;
      this.gridSizeVal.innerText = app.opts.gridw;
      this.gridSize.value = app.opts.gridw;
      this.colouredWires.checked = app.opts.colourConns;
      this.blabels.checked = app.opts.showBLabels;
      this.cpreview.value = app.opts.commentPreview;
      this.cpreviewVal.innerText = app.opts.commentPreview;
      this.readonly.checked = app.opts.readonly;
      this.debug.checked = app.opts.debug;
    },

    /** Reset to original options */
    reset() {
      app.setOptData(app.defaultOptData());
      this.update();
    }
  },

  /** Popup for commentBox component */
  commentBox: {
    _: document.getElementById('popup-comment-box'),
    textarea: document.getElementById('comment-box-text'),
    obj: null,

    open(box) {
      this.obj = box;
      hide(app.html.cover, false);
      hide(this._, false);
      if (app.opts.readonly) this.textarea.setAttribute('readonly', 'readonly'); else this.textarea.removeAttribute('readonly');
      this.textarea.value = box.text;
      this.textarea.focus();
    },

    close() {
      hide(app.html.cover, true);
      hide(this._, true);
      if (this.obj && !app.opts.readonly) {
        if (this.obj.text != this.textarea.value) app.workspace.contentAltered = true;
        this.obj.text = this.textarea.value;
        this.obj = null;
      }
      this.textarea.value = '';
    },
  },

  /** Stuff for CLock component */
  clockComponent: {
    _: document.getElementById('popup-clock'),
    input: document.getElementById('popup-clock-input'),
    speed: document.getElementById('popup-clock-speed'),
    obj: null,

    init() {
      this.input.setAttribute('min', Clock.min);
      this.input.setAttribute('max', Clock.max);
      this.input.addEventListener('change', this.update.bind(this));
    },

    open(obj) {
      hide(this._, false);
      hide(app.html.cover, false);
      this.obj = obj;
      this.input.value = obj.every;
      this.speed.innerText = obj.hertz();
      if (app.opts.readonly) this.input.setAttribute('readonly', 'readonly');
      if (app.workspace.isRunning) app.html.evalBtn.click();
    },

    /** Update obj and rendering */
    update() {
      let val = +this.input.value;
      if (isNaN(val)) val = this.obj.every;
      else if (val < Clock.min) val = Clock.min;
      else if (val > Clock.max) val = Clock.max;
      this.input.value = val;
      this.obj.every = val;
      this.speed.innerText = this.obj.hertz();
    },

    close() {
      hide(this._, true);
      hide(app.html.cover, true);
      this.speed.innertext = '';
      this.input.value = '';
      this.obj.event_click();
      this.obj = null;
      this.input.removeAttribute('readonly');
      if (!app.workspace.isRunning) app.html.evalBtn.click();
    },
  },

  /** Stuff for Output_Nbit */
  nBitOutput: {
    _: document.getElementById('popup-nbit'),
    input: document.getElementById('popup-nbit-input'),
    max: document.getElementById('popup-nbit-max'),
    obj: null,

    init() {
      this.input.setAttribute('min', 1);
      this.input.setAttribute('max', Output_Nbit.max);
      this.input.addEventListener('change', this.update.bind(this));
    },

    open(obj) {
      hide(this._, false);
      hide(app.html.cover, false);
      this.obj = obj;
      this.input.value = obj.inputs.length;
      this.max.innerText = obj.getMax();
      if (app.opts.readonly) this.input.setAttribute('readonly', 'readonly');
    },

    /** Update obj and rendering */
    update() {
      let val = +this.input.value;
      if (isNaN(val)) val = this.obj.every;
      else if (val < 1) val = 1;
      else if (val > Output_Nbit.max) val = Output_Nbit.max;
      this.input.value = val;
      this.max.innerText = Math.pow(2, val) - 1;
    },

    close() {
      hide(this._, true);
      hide(app.html.cover, true);
      this.max.innertext = '';
      this.obj.setInputs(+this.input.value);
      this.input.value = '';
      this.obj.event_click();
      this.obj = null;
      this.input.removeAttribute('readonly');
    },
  },

  /** Download canvas as image */
  downloadImage() {
    let image = app.p5canvas.elt.toDataURL("image/png").replace("image/png", "image/octet-stream");
    // window.open(image);
    window.location.href = image;
  },

  share: {
    _: document.getElementById('popup-share'),

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /** Download as image */
    image() {
      let link = app.p5canvas.elt.toDataURL("image/png");
      downloadLink(link, (app.file.name || 'unnamed') + '.png');
      this.showPopup(false);
    },

    file() {
      let text = JSON.stringify(app.workspace.toObject());
      downloadTextFile(btoa(text), (app.file.name || "unnamed") + '.lgc');
      this.showPopup(false);
    },

    print() {
      this.showPopup(false);
      this.print_setup(true);
      window.print();
      this.print_setup(false);
    },

    print_setup(hideStuff) {
      hide(app.html.nav, hideStuff);
      hide(app.statusbar._, hideStuff);
      hide(app.html.menuBar, hideStuff);
    },
  },

  uploadFile: {
    _: document.getElementById('popup-upload'),
    input: document.getElementById('upload-input'),

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    upload() {
      if (this.input.files.length == 1) {
        let file = this.input.files[0];
        let name = file.name;
        if (name.substr(name.length - 4, 4) != '.lgc') return app.message('File must be .lgc', ERROR);
        name = name.substring(0, name.length - 4);

        let freader = new FileReader();
        freader.onload = event => {
          this.showPopup(false);
          const data = atob(event.target.result);
          menu.saveAs.openAfter = true;
          app.file.open = false;
          app.file.name = name;
          app.file.data = data;
          socket.newFile.request(name, null, data);
        };
        freader.readAsBinaryString(file);
      } else {
        app.message('Please select one file to upload', INFO);
      }
    },
  },

  /** Boolean algebraic representation of circuit */
  boolAlgebra: {
    _: document.getElementById('popup-bool-algebra'),
    target: document.getElementById('bool-algebra-text'),
    data: null,

    /**
     * @param {boolean} show - Show popup?
     * @param {Component | undefined} obj - Which component to who algebra for?
     * @param {any[] | undefined} conn - Which connection node are we over?
     */
    popup(show, obj = undefined, conn = undefined) {
      hide(app.html.cover, !show);
      hide(this._, !show);

      if (show) {
        if (Array.isArray(conn)) {
          if (conn[1]) {
            // Is input node... Backtrace component that is output of conn
            obj = app.workspace._els[conn[0]].inputs[conn[2]].c;
          } else {
            obj = app.workspace._els[conn[0]];
          }
        }

        this.data = obj ? this.write(obj) : this.writeAll();
        this.target.innerHTML = Array.isArray(this.data) ? this.data.join('<br>') : this.data;
      } else {
        this.target.innerHTML = '';
      }
    },

    /** Populate textarea with algebra for provided component */
    write(c) {
      let algebra = c.backtrace();
      let subbed = c.backtrace(true);
      while (algebra[0] == '(' && algebra[algebra.length - 1] == ')') {
        algebra = algebra.substr(1, algebra.length - 2);
        subbed = subbed.substr(1, subbed.length - 2);
      }
      let line = algebra + ' = ' + subbed + ' = ' + c.state;
      return line;
    },

    /** Populate textarea with algebra for all outputs */
    writeAll() {
      let lines = [];
      app.workspace.forEachComponent(c => {
        if (c instanceof Output) lines.push(c.label + ' = ' + this.write(c));
      });
      return lines;
    },

    /** Download this.data as txt file */
    download() {
      const text = Array.isArray(this.data) ? this.data.join('\n') : this.data;
      const fname = 'boolean-algebra.txt';
      downloadTextFile(text, fname);
    },
  },

  truthTable: {
    _: document.getElementById('popup-trace-table'),
    table: document.getElementById('trace-table'),
    title: document.getElementById('trace-table-title'),
    data: null,

    /** @param {Component} obj - Component over */
    popup(show, obj = undefined) {
      hide(app.html.cover, !show);
      hide(this._, !show);
      if (show) {
        let [data, inputs, outputs] = obj instanceof LogicGate ? this.generate(obj) : this.generateWorkspace();
        this.title.innerText = obj instanceof LogicGate ? obj.name : 'Circuit';
        this.table.innerHTML = this.toHTML(inputs, outputs, data);
        this.data = data;
      }
    },

    /**
     * Generate trace table for a logic gate
     * @return {[any[][], number, number]} [data, input count, output count]
     */
    generate(gate) {
      let data = [];

      // Logic Function
      const fn = LogicGate.data[gate.type].fn;

      // "Labels" for I/O
      data[0] = [];
      for (let i = 0; i < gate.inputs.length; i++) data[0].push('i' + (i + 1));
      data[0].push('out');

      const allStates = getCombos(gate.inputs.length);
      for (const states of allStates) {
        let output = fn(...states);
        data.push(states.map(s => +s).concat([output]));
      }

      loop();
      return [data, gate.inputs.length, 1];
    },

    /**
     * Generate Trace Table data from whole workspace
     * @return {[any[][], number, number]} [data, input count, output count]
     */
    generateWorkspace() {
      let data = [];
      noLoop(); // Stop rendering to reduce lag

      // Array of inputs/outputs
      const components = Object.values(app.workspace._els);
      const inputs = components.filter(c => c instanceof Input && c.constructor.isChangeable), outputs = components.filter(c => c instanceof Output);

      if (inputs.length > 0) {
        // Record labels
        data[0] = inputs.map(c => c.label).concat(outputs.map(c => c.label));

        // Record original states
        const originalStates = inputs.map(c => c.state);

        const inputStates = getCombos(inputs.length);
        for (const states of inputStates) {
          // Set states
          for (let i = 0; i < states.length; i++) inputs[i].state = states[i];
          app.workspace.evaluate();

          // Get output states
          data.push(states.map(s => +s).concat(outputs.map(c => c.state)));
        }

        // Reset states
        for (let i = 0; i < inputs.length; i++) inputs[i].state = originalStates[i];
      } else {
        data[0] = [];
      }

      loop();
      return [data, inputs.length, outputs.length];
    },

    toCSV() {
      return Array.isArray(this.data) ? this.data.map(row => row.map(x => typeof x == 'number' ? x : `"${x}"`).join(',')).join('\n') : "";
    },

    /**
     * Generate HTML data from table
     * @param {number} inputs - Number of inputs
     * @param {number} outputs - Number of outputs
     * @param {any[][]} data - Trace table data 
     */
    toHTML(inputs, outputs, data) {
      let html = '';
      html += `<thead><tr><th colspan="${inputs}">Inputs</th><th colspan="${outputs}">Outputs</th></tr>`;
      for (let i = 0; i < data[0].length; i++) html += `<th>${data[0][i]}</th>`;
      html += '</tr></thead><tbody>';
      for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        for (let j = 0; j < data[i].length; j++) {
          html += '<td>' + getHTMLState(data[i][j]) + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody>';
      return html;
    },

    /** Download this.data as CSV */
    download() {
      const text = this.toCSV();
      const fname = (this.title.innerText + ' truth table.csv').toLowerCase().split(' ').join('-');
      downloadTextFile(text, fname);
    },
  },

  /** Update display for evalBtn */
  renderEvalBtn() {
    if (app.workspace) {
      const btn = app.html.evalBtn;
      if (app.workspace.isRunning) {
        btn.innerHTML = '&#8214;';
        btn.setAttribute('title', 'Pause Simulation');
      } else {
        btn.innerHTML = '&#9654;';
        btn.setAttribute('title', 'Play Simulation');
      }
    }
  },

  /** Control for sidebar */
  sidebar: {
    btns: [],
    divs: [],
    plus: '&#10133;',
    minus: '&#10134;',

    init() {
      for (const el of document.getElementsByClassName('collapse-btn')) {
        let i = this.btns.push(el) - 1;
        el.dataset.visible = 1;
        this.divs.push(document.getElementById(el.dataset.control));
        this.render(i);
        el.addEventListener('click', (ev) => this.click(ev, i));
      }
    },

    render(index) {
      let btn = this.btns[index], src = this.divs[index];
      if (btn.dataset.visible == 1) {
        btn.innerHTML = this.minus;
        btn.setAttribute('title', 'Click to collapse');
        hide(src, false);
      } else {
        btn.innerHTML = this.plus;
        btn.setAttribute('title', 'Click to expand');
        hide(src, true);
      }
    },

    /** Called by event listener */
    click(event, arrayIndex) {
      let btn = this.btns[arrayIndex];
      btn.dataset.visible = btn.dataset.visible == "1" ? "0" : "1";
      this.render(arrayIndex);
    },
  },
};