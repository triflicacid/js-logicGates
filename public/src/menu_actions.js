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
      let list = document.createElement('ul'), li, a;
      list.classList.add('invis-list');
      for (let file of files) {
        li = document.createElement('li');
        li.insertAdjacentHTML('beforeend', '&#128462; ');
        a = document.createElement('a');
        a.href = 'javascript:void(0);';
        a.innerText = file.name;
        a.setAttribute('title', `${file.size} bytes ${file.protected ? '(password protected)' : ''}`);
        a.addEventListener('click', () => { this.showPopup(false); this.open(file); });
        li.insertAdjacentElement('beforeend', a);
        list.insertAdjacentElement('beforeend', li);
      }
      this.fl.innerHTML = '';
      this.fl.insertAdjacentElement('beforeend', list);
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
        let passwd = file.protected ? window.prompt(`File ${file.name} is protected. Enter password to open.`) : null;
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
   * */
  saveFile(closeAfter) {
    if (app.workspace && typeof app.file.name == 'string') {
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
      app.message('Nothing to save', ERROR);
      return false;
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
      if (app.workspace && typeof app.file.name === 'string') {
        if (!ignore && app.workspace.contentAltered) {
          // Not up-to-date
          this.showPopup(true);
        } else {
          app.closeWorkspace();
        }
      } else {
        this.message('No file to close', ERROR);
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

  /** Create new file */
  newFile: {
    _: document.getElementById('popup-new-file'),
    inputName: document.getElementById('new-file-name'),
    inputPasswd: document.getElementById('new-file-passwd'),

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    create() {
      let fname = this.inputName.value, passwd = this.inputPasswd.value;
      socket.newFile.request(fname, passwd.length == 0 ? null : passwd);
    },
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
        this.num = Math.floor(Math.random() * 1e6);
        this.numShow.innerText = this.num;
      } else {
        this.inputNum.value = '';
      }

      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    delete() {
      if (app.workspace && typeof app.file.name == 'string') {
        if (this.num != +this.inputNum.value) {
          this.showPopup(false);
          app.message(`Entered number was incorrect`, ERROR);
        } else {
          this.showPopup(false);
          socket.deleteFile.request(app.file.name, app.file.passwd);
        }
      } else {
        app.message('No file to delete', ERROR);
      }
    }
  },
};