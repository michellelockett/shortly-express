var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      this.hash(model.get('password'), function(hash) {
        model.set('username', model.get('username'));
        model.set('password', hash);
        debugger;
      })
    });
  },
  hash: function(plainPassword, cb) {
    bcrypt.hash(plainPassword, null, null, function(err, hash) {
      if (err) {
        console.log("ERROR IN hash =", err)
      }
      console.log("HAAAASH in hash =", hash)
      cb(hash);
    })
  }
},
  {
    login: Promise.method(function(username, password) {
      if (!username || !password) {
        throw new Error('Username and password are both required');
      }
      return new this({username: username.toLowerCase().trim()}).fetch({require: true}).tap(function(user) {
        return bcrypt.compareAsync(password, user.get('password'));
      }).then(function(res) {
        if (!res) {
          throw new Error('Invalid password');
        }
      });
    })
  }
);

module.exports = User;