var request = require('request');
var stream = require('stream');
var config = require('./config.json');

var checkDupe = new stream.Transform();
var ids = [];

module.exports = function(reddit) {
  checkDupe._transform = function(chunk, encoding, done) {
    ids.push(chunk.toString('utf8'));
    done();
  }

  checkDupe._flush = function (done) {
    if (ids.length < 1) {
      checkDupe.emit('error', 'No articles for date found. Make sure you entered the correct date format.');
      return done();
    }

    var that = this;

    checkRedditPosts(ids, function(err, ids) {
      if (err) {
        checkDupe.emit('error', err);
        return done();
      }

      var boundBufferid = bufferid.bind(that);
      boundBufferid(ids, done);
    })
  }

  function bufferid(ids, cb) {
    setTimeout(function() {
      if (ids.length) {
        var id = ids.shift();
        var boundBufferid = bufferid.bind(this);

        boundBufferid(ids, cb);
        this.push(id);
      } else {
        cb();
      }
     }.bind(this), config.delay);
  }

  function checkRedditPosts(ids, cb) {
    request(
      {
        url: 'https://www.reddit.com/r/' + config.subreddit + '/new.json',
        encoding: 'utf8',
        json: true,
        headers: {
        'user-agent': reddit.userAgent,
        'X-Modhash': reddit.modhash,
        'Cookie': 'reddit_session='+reddit.cookie
        }
      }, 
      function (err, res, body) {
        if (!err && res.statusCode == 200) {
          var posts = body.data.children;

          posts.forEach(function(post) {
            ids.forEach(function(id) {
              var index = post.data.selftext.indexOf(id);

              if (index > -1) {
                console.log('Duplicate article ' + id + '. Skipping...');
                ids.splice(ids.indexOf(id), 1);
              }
            })
          })
          cb(null, ids);    
        }  else {
          cb("Error getting reddit new.json");
        }
      }
    )
  }
  return checkDupe;
}

