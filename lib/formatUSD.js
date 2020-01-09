module.exports = function(val) {
  let str = val.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  return str;
}
