//this is needed because for some reason the nhk easy json returned has a weird character in front that screws up json parsing
//as expected of japan

var stream = require('stream');
var strip = new stream.Transform();
var first = true;

strip._transform = function(chunk, encoding, done) {
  var data = chunk.toString('utf8');
  if (first) {
    first = false;
    this.push(data.slice(1));
  } else {
    this.push(data);
  }
  done();
}

module.exports = strip;