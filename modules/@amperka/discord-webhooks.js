/*
IF YOU ARE GOING TO COPY THIS CODE - DO NOT DELETE THESE COMMENTS! EVERYONE SHOULD KNOW THE REAL AUTHOR.

Author: 3peekawOwD (vk.com/3peekawowd)
For Amperka (amperka.ru)

Example use:
var myButton = require('@amperka/button')
  .connect(BTN1);
var discord = require('@amperka/discord-webhooks').init({token: "", id: ""});
myButton.on('press', function() {
  discord.sendMessage({content: "HELLO! I\'m Iskra.js", username: "Iskra.js", avatar_url: "https://static-eu.insales.ru/images/products/1/3053/113216493/iskra-js.2.1.jpg"});
});
*/

var Discord = function(opts) {
  this._token = opts.token;
  this._id = opts.id
  this._url = "https://discordapp.com/api/webhooks"
  this._http = require('http');
};
Discord.prototype.sendMessage = function(data) {
    var content = JSON.stringify(data);
    var options = url.parse(`${this._url}/${this._id}/${this._token}`);
    options.method = 'POST';
    options.headers = {
      "Content-Type":"application/json",
      "Content-Length": "3"
    };
    var req = require("http").request(options, function(res)  {
      var d = "";
      res.on('data', function(data) {});
      res.on('close', function(data) {});
    });
    req.on('error', function(e) {
      console.error(e);
    });
    req.end(content);
};

exports.init = function(opts) {
  return new Discord(opts);
};
