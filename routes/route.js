var express = require('express');
var router = express.Router();
var Sentiment = require('sentiment');
var Twitter = require('twitter');
var properties = require('./../config/properties')
var afinnEs165 = require("./../config/AFINN-ES-165.json"); 

var client = new Twitter({
  consumer_key: properties.twitterKeys.consumer_key,
  consumer_secret: properties.twitterKeys.consumer_secret,
  access_token_key: properties.twitterKeys.access_token_key,
  access_token_secret: properties.twitterKeys.access_token_secret
});

router.get('/', function (req, res, next) {    
  res.render('index')
})
router.post('/analisis', function (req, res, next) {  
  let search = req.body.query;
  analisisText(search,res);
})

router.get('/analisis/:hashtagname', function (req, res, next) {  
  let hashtagName = req.params.hashtagname;  
  analisisText(hashtagName,res);
});

function analisisText(search,res) {
  let positiveTweets = 0;
  let negativeTweets = 0;
  let neutralTweets = 0;
  let result = {};
  let tweetRecords = [];
  var sentiment = new Sentiment();
  
  client.get('search/tweets', { q: search, count: 100, lang: 'es', tweet_mode:'extended' }, function (error, tweets, response) {    
    var esLanguage = {      
      labels: afinnEs165
    };
    sentiment.registerLanguage('es', esLanguage);
    tweets.statuses.forEach(function (tweet) {      
      let textTweet = null;
      let res_score = null;
      if (tweet.retweeted_status != undefined) {
        res_score = sentiment.analyze(tweet.retweeted_status.full_text, { language: 'es' });
        textTweet = tweet.retweeted_status.full_text;
      }else {
        res_score = sentiment.analyze(tweet.full_text, { language: 'es' });
        textTweet = tweet.full_text
      }      
      if (res_score["score"] > 0)
        positiveTweets = positiveTweets + 1;
      else if (res_score["score"] < 0)
        negativeTweets = negativeTweets + 1;
      else
        neutralTweets = neutralTweets + 1;
        tweetRecords.push({                
          "tweet":textTweet.replace(/[\r\n]+/gm," "),          
          "score":res_score["score"],
          "positive":res_score["positive"],
          "negative":res_score["negative"],
          "userName":tweet.user.screen_name
        })    
    });
    result.query=search;
    result.positiveTweets=positiveTweets;
    result.negativeTweets=negativeTweets;
    result.neutralTweets=neutralTweets;
    result.tweets=tweetRecords;
    res.render('analisis', {
      res: result
    })
  });  
}

module.exports = router;
