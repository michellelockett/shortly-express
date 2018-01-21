var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', this.hash, this);
  },
  hash: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(model.attributes.password, null, null, function(err, hash) {
        if (err) {
          console.log("ERROR IN hash =", err)
          reject(err);
        }
        model.set('password', hash);
        resolve(hash);
      })
    })
  }
},
  {
    login: Promise.method(function(username, password) {
      var hash = bcrypt.hashSync(password);
      if (!username || !password) {
        throw new Error('Username and password are both required');
      }
      return new this({username: username.toLowerCase().trim()}).fetch({require: true}).tap(function(user) {
        return bcrypt.compareSync(password, hash);
      });
    })
  }
);

module.exports = User;