const fs = require('fs');

class CircuitFile {
  constructor(name) {
    this.name = name;
    CircuitFile.files[this.name] = this;
  }

  get path() { return CircuitFile.baseCircuit + this.name; }
  get passwordPath() { return CircuitFile.basePasswd + this.name; }

  /**
   * Get stats of file
   * @return {fs.Stats}
   */
  getStats() {
    return fs.statSync(this.path);
  }

  /**
   * Get data from circuit file
   * @return {string} File data
   */
  getData() {
    // .lgc -> Logic Gate Circuit
    return fs.readFileSync(this.path, CircuitFile.opts);
  }

  /**
   * Write data to file
   * @param {string} data   Date to write
   */
  writeData(data) {
    fs.writeFileSync(this.path, data, CircuitFile.opts);
  }

  /**
   * Is file password protected?
   * @return {boolean}
   */
  isProtected() {
    return fs.existsSync(this.passwordPath);
  }

  /**
   * Get password for file
   * @return {string | null} Password, or null is has no password
   */

  getPassword() {
    if (this.isProtected()) {
      return fs.readFileSync(this.passwordPath, CircuitFile.opts);
    } else {
      return null;
    }
  }

  /**
   * Delete
   */
  delete() {
    fs.unlinkSync(this.path);
    if (fs.existsSync(this.passwordPath)) fs.unlinkSync(this.passwordPath);
    delete CircuitFile.files[this.name];
  }

  /**
   * Create a new file
   * @param {string} name             MName of circuit (and therefore file)
   * @param {string | null} passwd    Password protection for file
   * @return {CircuitFile} DataFile class instance
   */
  static create(name, passwd) {
    const obj = new CircuitFile(name);
    obj.writeData('{}');
    if (passwd != null) fs.writeFileSync(obj.passwordPath, passwd);
    CircuitFile.files[name] = obj;
    return obj;
  }

  /**
   * Called on server start-up...
   * Load and register all existing files
   */
  static loadFiles() {
    fs.readdirSync(CircuitFile.baseCircuit).forEach(file => new CircuitFile(file));
  }
}

/** Base path */
CircuitFile.baseCircuit = './data/circuits/';
CircuitFile.basePasswd = './data/passwds/';

/** List of all files
 * @type {{[name: string]: CircuitFile}}
 */
CircuitFile.files = {};

/** Options for reading files */
CircuitFile.opts = { encoding: 'utf8' };

/** Regex for creating a new file */
CircuitFile.nameRegex = /[^A-Za-z\-_0-9\s]/g;

module.exports = CircuitFile;