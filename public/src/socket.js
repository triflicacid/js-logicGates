const socket = {
  _: undefined,

  init() {
    this._ = io();

    this._.on('message', msg => app.message(msg.msg, msg.lvl));

    // Get file data
    this._.on('file-data', data => typeof this.getFile.callback == 'function' && this.getFile.callback(data));

    // Get file list
    this._.on('file-list', flist => typeof this.fileList.callback == 'function' && this.fileList.callback(flist));

    // Written to file
    this._.on('wrote-file', fname => typeof this.writeFile.callback == 'function' && this.writeFile.callback(fname));
    this.writeFile.callback = () => {
      if (app.workspace) app.workspace.contentAltered = false;
      app.history.reset();
      if (menu.exitFile.closeAfterSave) {
        menu.exitFile.exit();
        menu.exitFile.closeAfterSave = false;
      }
    };

    // Create file
    this._.on('created-file', fname => typeof this.newFile.callback == 'function' && this.newFile.callback(fname));
    this.newFile.callback = fname => {
      // If this is called, must be no errors
      menu.saveAs.showPopup(false);
      app.message(`File created: ${fname}`, INFO);
      menu.saveAs.inputName.value = '';
      menu.saveAs.inputPasswd.value = '';

      // Open file?
      if (menu.saveAs.openAfter) app.openWorkspace();
    };

    // Delete file
    this._.on('deleted-file', fname => typeof this.deleteFile.callback == 'function' && this.deleteFile.callback(fname));
    this.deleteFile.callback = fname => {
      app.closeWorkspace();
      app.message(`Delete file ${fname}`, INFO);
    };
  },

  /** List of back-end files */
  fileList: {
    /** @type {(files: {name: string, protected: boolean, size: number}[]) => void}  */
    callback: undefined,

    /**
     * Request file list
     * @param {Function | null} callback
     */
    request(callback = undefined) {
      if (callback !== undefined) this.callback = callback;
      socket._.emit('request-file-list');
    },
  },

  /** Get file data */
  getFile: {
    /** @type {(data: string) => void} */
    callback: undefined,

    /** 
     * Request file data from a file
     * @param {string} file - Name of file to get data from
     * @param {string | null} passwd - The password that is protecting the file
     * @param {Function | null} callback
    */
    request(file, passwd, callback = undefined) {
      if (callback !== undefined) this.callback = callback;
      socket._.emit('get-file', { file, passwd });
    }
  },

  /** Write data to file */
  writeFile: {
    /** @type {(fname: string) => void} */
    callback: undefined,

    /**
     * Write data to a file
     * @param {string} file  Name of file to write to
     * @param {string | null} passwd  Password for file (is protected)
     * @param {string} data Data to write to file
     * @param {boolean} closeAfter  Close file after save
     * @param {Function | null} callback
    */
    request(file, passwd, data, callback = undefined) {
      if (callback !== undefined) this.callback = callback;
      socket._.emit('write-file', { file, passwd, data });
    }
  },

  /** Create a new file */
  newFile: {
    /** @type {(fname: string) => void} */
    callback: undefined,

    /**
     * Create file
     * @param {string} name  Name of file to create
     * @param {string | null} passwd  Password to protect file with
     * @param {string | undefined} data   Data to write to file
     * @param {Function | null} callback
     */
    request(name, passwd = null, data = undefined, callback = undefined) {
      if (callback !== undefined) this.callback = callback;
      let obj = { name, passwd };
      if (typeof data === 'string') obj.data = data;
      socket._.emit('create-file', obj);
    }
  },

  /** Delete file */
  deleteFile: {
    /** @type {(fname: string) => void} */
    callback: undefined,

    /**
     * Delete file
     * @param {string} file  File to delete
     * @param {string | null} passwd  Password to protect file with
     * @param {Function | null} callback
     */
    request(file, passwd = null, callback = undefined) {
      if (callback !== undefined) this.callback = callback;
      socket._.emit('delete-file', { file, passwd });
    }
  },
};