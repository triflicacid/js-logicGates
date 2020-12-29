const CircuitFile = require("./circuit_file.js");

class Connection {
  constructor(socket) {
    this._ = socket;
    this._num = Connection.connections.push(this);

    this._init();
  }

  _init() {
    console.log(`New Connection: ${this._.id}`);
    this.message(`Connected... ID = ${this._.id}`);

    // Request for list of files
    this._.on('request-file-list', () => {
      let arr = [];
      for (let fname in CircuitFile.files) {
        let file = CircuitFile.files[fname];
        let stats = file.getStats();
        arr.push({ name: fname, protected: file.isProtected(), size: stats.size });
      }
      this._.emit('file-list', arr);
    });

    // Request to get file contents
    this._.on('get-file', data => {
      if (CircuitFile.files.hasOwnProperty(data.file)) {
        let file = CircuitFile.files[data.file];
        if (file.isProtected() && file.getPassword() != data.passwd) {
          return this.message(`Password for protected file '${data.file}' is incorrect`, 2);
        } else {
          this._.emit('file-data', { type: data.type, name: data.file, data: file.getData() });
        }
      } else {
        return this.message(`Circuit '${data.file}' does not exist`, 2);
      }
    });

    // Request to write to file
    this._.on('write-file', data => {
      if (CircuitFile.files.hasOwnProperty(data.file)) {
        let file = CircuitFile.files[data.file];
        if (file.isProtected() && file.getPassword() != data.passwd) {
          this.message(`Password for protected file ${data.file} is incorrect`, 2);
        } else {
          file.writeData(data.data);
          this._.emit('wrote-file', data.file);
        }
      } else {
        this.message(`File ${data.file} does not exist`, 2);
      }
    });

    // Request to create a file
    this._.on('create-file', data => {
      if (CircuitFile.files.hasOwnProperty(data.name)) {
        return this.message(`File ${data.name} already exists`, 2);
      } else if (typeof data.name != 'string' || data.name.length == 0) {
        return this.message(`File name must be provided`, 2);
      } else if (data.name.match(CircuitFile.nameRegex)) {
        return this.message(`File name must not match ${CircuitFile.nameRegex}`, 2);
      } else {
        if (typeof data.passwd != 'string' || data.passwd.length == 0) data.passwd = null;
        let obj = CircuitFile.create(data.name, data.passwd);
        if (data.data) obj.writeData(data.data); // Write data to file if provided
        this._.emit('created-file', { type: data.type, name: obj.name });
      }
    });

    // Delete file
    this._.on('delete-file', data => {
      if (CircuitFile.files.hasOwnProperty(data.file)) {
        let file = CircuitFile.files[data.file];
        if (file.isProtected() && file.getPassword() != data.passwd) {
          this.message(`Password for protected file ${data.file} is incorrect`, 2);
        } else {
          file.delete();
          this._.emit('deleted-file', file.name);
        }
      } else {
        this.message(`File ${data.file} does not exist`, 2);
      }
    });
  }

  /**
   * Send message to user
   * @param {string} msg
   * @param {number} lvl - Severity -1: log, 0: info, 1: warning, 2: error
   */
  message(msg, lvl = -1) {
    this._.emit('message', { lvl, msg });
  }
}

Connection.connections = [];

module.exports = Connection;