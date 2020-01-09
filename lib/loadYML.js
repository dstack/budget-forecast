const YAML = require("yaml");
const fs = require("fs");

module.exports = function(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (loadErr, data) => {
      if(loadErr) {
        reject(`Unable to load file: ${filename}`);
      }
      let obj = {};
      try {
        let tmp = YAML.parse(data);
        obj = tmp;
        resolve(tmp);
      }
      catch(parseErr) {
        reject(`Unable to parse file "${filename}" as YML"`);
      }
    });
  })
}
