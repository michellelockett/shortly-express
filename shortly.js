var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());

// Set session secret
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'secret',
  cookie: { maxAge: 600000 }
}));



// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/',
function(req, res) {
  if (!req.session.username) {
    res.redirect('login');
  } else {
   res.render('index');
  }
});

app.get('/create',
function(req, res) {
  if (!req.session.username) {
    res.redirect('login');
  } else {
   res.render('index');
  }
});

app.get('/links',
function(req, res) {

  if (!req.session.username) {
    res.redirect('login');
  } else {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  }
});

app.post('/links',
function(req, res) {

  // if (!req.session.username) {
  //   res.redirect('login');
  // } else {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
          .then(function(newLink) {
            res.status(200).send(newLink);
          });
        });
      }
    });
  // }
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  if (!req.session.username) {
    res.render('login');
  } else {
    res.redirect('/')
  }
});

app.post('/login', function(req, res) {

  User.login(req.body.username, req.body.password).then(function(result) {
    if (result) {
      req.session.regenerate(function(err) {
        if (err) { throw err; }
      });
      req.session.username = req.body.username;
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  })
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {

  var newUser = new User({'username': req.body.username, 'password': req.body.password});

  newUser.save().then(function(user) {
    req.session.username = req.body.username;
    return res.redirect('/');
  });
});

app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) { throw err; }
  });
  res.redirect('login');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
