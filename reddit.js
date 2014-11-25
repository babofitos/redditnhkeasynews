var request = require('request');
var config = require('./config.json');

module.exports = new Reddit();

function Reddit() {
  this.modhash = null;
  this.cookie = null;
  this.userAgent = 'nhk easy news article scraper script by /u/babofitos';
}

Reddit.prototype.login = function(user, pw, cb) {
  var that = this;
  var options = {
    url: 'https://ssl.reddit.com/api/login',
    headers: {
      'user-agent': that.userAgent
    },
    method: 'POST',
    form: {
      "api_type": "json",
      "user": user,
      "passwd": pw,
      "rem": true
    }
  }

  request(options, function (err, res, body) {
    if (!err && res.statusCode === 200) {
      var parsed = JSON.parse(body);
      
      if (parsed.json.errors.length < 1) {
        var modhash = parsed.json.data.modhash;
        var cookie = parsed.json.data.cookie;

        that.modhash = modhash;
        that.cookie = cookie;

        console.log('Login successful.');
        cb();
      } else {
        cb(parsed.json.errors);
      }
    }
  });
};

Reddit.prototype.submit = function(title, text, cb) {
  var options = {
    url: 'https://api.reddit.com/api/submit',
    headers: {
      'user-agent': this.userAgent,
      'X-Modhash': this.modhash,
      'Cookie': 'reddit_session='+this.cookie
    },
    method: 'POST',
    form: {
      "api_type": "json",
      "kind": "self",
      "resubmit": "false",
      "extension": "json",
      "title": title,
      "text": text,
      "uh": this.modhash,
      "sr": config.subreddit
    }
  }
  request(options, function (err, res, body) {
    if (!err && res.statusCode === 200) {
      var parsed = JSON.parse(body);

      if (parsed.json.errors.length < 1) {
        cb();
      } else {
        cb(parsed.json.errors);
      }
    } else {
      console.log('Unsuccessful submit');
    }
  });
};
