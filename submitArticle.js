var stream = require('stream');
var submitter = new stream.Transform({objectMode: true});
var nhkeasy = require('nhkeasy');
var config = require('./config.json');

module.exports = function(reddit) {
  submitter._transform = function (chunk, encoding, done) {
    var id = chunk.toString('utf8');
    var that = this;

    submitArticle(id, function(err) {
      if (err) {
        submitter.emit('error', err);
      } else {
        that.push(id + '\n');
      }
      done();
    });
  }

  function makeEasyUrl(id) {
    var url = 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html';

    return url;
  }

  function addUrlToArticle(url, article) {
    return url + config.separator + article;
  }

  function addDateToTitle(date, title) {
    function formatDate(date) {
      return '[' + date.replace(/-/g, '/') + '] ';
    }

    var formatDate = formatDate(date);

    return formatDate + title;
  }

  function submitArticle(id, cb) {
    var easyUrl = makeEasyUrl(id);
    var date = process.argv[4];

    nhkeasy({separator: config.separator}, easyUrl, function(err, d) {
      //submit to reddit here
      if (err) {
        console.log('Error scraping NHK site at ' + easyUrl);
        cb(err);
      } else {
        var text = addUrlToArticle(easyUrl, d.article);
        var title = addDateToTitle(date, d.title);

        reddit.submit(title, text, function(err) {
          if (err) {
            console.log('Error submitting for ' + title);
            cb(err);
          } else {
            console.log('Successful submit: ' + title);
            cb(null);
          }
        })
      }
    });
  }
  return submitter;
}
