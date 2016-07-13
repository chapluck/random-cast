var express = require('express');
var router = express.Router();
var config = require('config');
var crypto = require('crypto');
var querystring = require('querystring');

// gets random Fucking Great Advice
router.get('/fga', function(req, res, next) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    var http = require('http');
    var options = {
      host: 'fucking-great-advice.ru',
      path: '/api/random_by_tag/%D0%BA%D0%BE%D0%B4%D0%B5%D1%80%D1%83'
    };
    var serviceRequest = http.get(options, function(serviceResponse) {
      console.log('STATUS: ' + serviceResponse.statusCode);
      console.log('HEADERS: ' + JSON.stringify(serviceResponse.headers));
    
      var bodyChunks = [];
      serviceResponse.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {
        var body = Buffer.concat(bodyChunks);
        console.log('FGA`s body: ' + body);
        res.send(body);
      });
    });
    
    serviceRequest.on('error', function(e) {
      console.log('ERROR: ' + e.message);
      res.send('{error: true}');
    });
});

// get Readability articles
router.get('/readability', function(req, res, next) {
try{
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    var http = require('https');
    var timeStamp = parseInt((new Date()).getTime() / 1000);
    var options = {
        host: 'readability.com',
        path: '/api/rest/v1/oauth/access_token/',
        headers:{
            Authorization: "OAuth"
                + " oauth_consumer_key=\"" + encodeURIComponent(config.get('Readability.Reader.Key')) + "\""
//                + ", oauth_verifier=\"" + encodeURIComponent(config.get('Readability.Reader.Secret')) + "\""
//                + ", oauth_token=\"" + encodeURIComponent(config.get('Readability.Reader.Secret')) + "\""
                + ", oauth_nonce=\"readability" + timeStamp + "\""
                + ", oauth_signature=\"" + encodeURIComponent(getOAuthSignature(timeStamp)) + "\""
                + ", oauth_signature_method=\"HMAC-SHA1\""
                + ", oauth_timestamp=\"" + timeStamp + "\""
                + ", x_auth_mode=\"client_auth\""
                + ", x_auth_password=\"" + encodeURIComponent(config.get('Readability.Reader.AccountPwd')) + "\""
                + ", x_auth_username=\"" + encodeURIComponent(config.get('Readability.Reader.AccountName')) + "\""
        }
    };
    console.log(options.headers);
    var serviceRequest = http.get(options, function(serviceResponse) {
      console.log('STATUS: ' + serviceResponse.statusCode);
      console.log('HEADERS: ' + JSON.stringify(serviceResponse.headers));
    
      var bodyChunks = [];
      serviceResponse.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {
        var body = Buffer.concat(bodyChunks);
        console.log('Readability`s body: ' + body);
        var token = querystring.parse(body.toString());
        console.log('Readability`s token: ' + JSON.stringify(token));
        res.send(body);
      });
    });

    serviceRequest.on('error', function(e) {
      console.log('ERROR: ' + e.message);
      res.send('{error: true}');
    });
}
catch(ex){
      console.log('ERROR: ' + ex);
      res.send('{error: true}');
}
});

function getOAuthSignature(timeStamp){
    var strToSign = "GET&" + encodeURIComponent("https://readability.com/api/rest/v1/oauth/access_token/")
        +"&" + encodeURIComponent("oauth_consumer_key=" + config.get('Readability.Reader.Key')
        + "&oauth_nonce=readability" + timeStamp
        + "&oauth_signature_method=HMAC-SHA1"
        + "&oauth_timestamp=" + timeStamp
        + "&x_auth_mode=client_auth"
        + "&x_auth_password=" + config.get('Readability.Reader.AccountPwd')
        + "&x_auth_username=" + config.get('Readability.Reader.AccountName'));
    return crypto.createHmac('sha1', config.get('Readability.Reader.Secret') + '&').update(strToSign).digest('base64');
}

module.exports = router;
