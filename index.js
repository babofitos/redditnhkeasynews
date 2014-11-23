if (process.argv.length < 5) {
  throw new Error('Not enough parameters.\n' +
    'Make sure you enter your username, password,' + 
    'and the date of the articles you want to retrieve\n.' +
    'Format: node index.js USERNAME PASSWORD YYYY-MM-DD');
}

var username = process.argv[2];
var password = process.argv[3];
var date = process.argv[4];

var request = require('request');
var reddit = require('./reddit.js');
var config = require('./config.json');
var submitArticle = require('./submitArticle.js')(reddit);
var JSONStream = require('JSONStream');
var getArticleIds = JSONStream.parse([true, date, true, 'news_id'])
var checkDupe = require('./check_dupe.js')(reddit);
var strip = require('./strip.js');

reddit.login(username, password, function(err) {
  if (err) {
    console.log('Error logging in');
    throw err;
  } else {
    var nhkJSONGet = request({url: 'http://www3.nhk.or.jp/news/easy/news-list.json', json: true})

    nhkJSONGet
      .on('error', function(err) {
        console.log('Error requesting nhk JSON' + err);
      })
      .on('response', function(response) {
        if (response.statusCode != 200) {
          console.log('Unsuccessful status code. Aborting');
          nhkJSONGet.abort();
        } else {
          nhkJSONGet
            .pipe(strip)
            .pipe(getArticleIds)
            .on('error', function(err) {
              console.log('Error parsing JSON');
            })
            .pipe(checkDupe)
            .on('error', function(err) {
              console.log(err);
            })
            .pipe(submitArticle)
            .on('error', function(err) {
              console.log(err);
            })
        }
      })
  }
})


