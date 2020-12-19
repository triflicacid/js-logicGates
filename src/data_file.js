const fs = require('fs');
const path = require('path');

class DataFile {
  constructor(name) {
    this.name = name;

    /**
     * Connection object which is operating on the file
     * - Hance, the only connection which may write to the file
     * @type {Connection | null}
     */
    this.opener = null;

    DataFile.files[this.name] = this;
  }

  get path() { return DataFile.base + this.name; }

  /**
   * Get stats of file
   * @return {fs.Stats}
   */
  getStats() {
    return fs.statSync(this.path + '.lgc');
  }

  /**
   * Get data from circuit file
   * @return {string} File data
   */
  getData() {
    // .lgc -> Logic Gate Circuit
    return fs.readFileSync(this.path + '.lgc', DataFile.opts);
  }

  /**
   * Write data to file
   * @param {string} data   Date to write
   */
  writeData(data) {
    fs.writeFileSync(this.path + '.lgc', data, DataFile.opts);
  }

  /**
   * Is file password protected?
   * @return {boolean}
   */
  isProtected() {
    return fs.existsSync(this.path + '.passwd');
  }

  /**
   * Get password for file
   * @return {string | null} Password, or null is has no password
   */

  getPassword() {
    if (this.isProtected()) {
      return fs.readFileSync(this.path + '.passwd', DataFile.opts);
    } else {
      return null;
    }
  }

  /**
   * Delete
   */
  delete() {
    fs.unlinkSync(this.path + '.lgc');
    if (fs.existsSync(this.path + '.passwd')) fs.unlinkSync(this.path + '.passwd');
    delete DataFile.files[this.name];
  }

  /**
   * Create a new file
   * @param {string} name             MName of circuit (and therefore file)
   * @param {string | null} passwd    Password protection for file
   * @return {DataFile} DataFile class instance
   */
  static create(name, passwd) {
    const obj = new DataFile(name);
    obj.writeData('{}');
    if (passwd != null) fs.writeFileSync(obj.path + '.passwd', passwd);
    DataFile.files[name] = obj;
    return obj;
  }

  /**
   * Called on server start-up...
   * Load and register all existing files
   */
  static loadFiles() {
    const ext = '.lgc';
    fs.readdirSync(DataFile.base).forEach(file => {
      if (path.extname(file) == ext) {
        let name = path.basename(file).replace(ext, '');
        let _ = new DataFile(name);
      }
    });
  }
}

/** Base path */
DataFile.base = './data/';

/** List of all files
 * @type {{[name: string]: DataFile}}
 */
DataFile.files = {};

/** Options for reading files */
DataFile.opts = { encoding: 'utf8' };

/** Regex for creating a new file */
DataFile.nameRegex = /[^A-Za-z\-_0-9\s]/g;

module.exports = DataFile;