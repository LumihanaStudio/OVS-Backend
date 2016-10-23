var express = require('express');
var router = express.Router();
var rndString = require("randomstring");
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var TwitterTokenStrategy = require('passport-twitter-token');

router.use(passport.initialize());
router.use(passport.session());
var rndString = require("randomstring");

router.post('/reg', function(req, res, next) {
    if (req.body.user_id === undefined || req.body.pw === undefined || req.body.userid === undefined || req.body.userid === '' ||req.body.name === ''|| req.body.pw === '') {
        return res.status(403).send("Params Missing");
    } else {
        var current = new Users({
            user_id: req.body.userid,
            pw: req.body.pw,
            nick_name: req.body.name,
            token: rndString.generate()
        });

        current.save(function(err, data) {
            if (err) { // TODO handle the error
                if (err.errmsg.indexOf("dup") !== -1) {
                    return res.status(300).send("already exists");
                } else {
                    return res.status(400).send("DB Error");
                }
            } else {
                return res.status(200).send(current);
            }
        });
    }
});


router.post('/login', function(req, res, next) {
    console.log(req.body.userid);
    Users.findOne({ userid: req.body.userid}, function(err, user) {
        if (user != null) {
            if (user.userid === req.body.userid && user.pw === req.body.pw) {
                var obj = {
                    "user_id": user.userid,
                    "name": user.name,
                    "token": user.token
                };
                return res.status(200).send(obj);
            } else {
                return res.status(401).send("login incorrect");
            }

        } else {
            return res.status(400).send("no user");
        }
    });
});

router.post('/auto', function(req, res, next) {
    Users.findOne({
        token: req.body.token
    }, function(err, resul) {
        if (resul != null) {
            return res.status(200).send(resul);
        } else {
            return res.status(401).send("Access Denied");
        }
    });
});

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new FacebookTokenStrategy({
    clientID: "536311256578173",
    clientSecret: "7d13d9ab9e847e98e80299ec533c7cbd",
    profileFields: ['id', 'displayName', 'photos'],
}, function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    Users.findOne({'userid': profile.id}, function(err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            user = new Users({
                user_id: profile.id,
                nick_name: profile.displayName,
                profile_image: profile.photos[0].value,
                token: rndString.generate()
            });

            user.save(function(err) {
                if (err) console.log(err);
                else {
                    done(null, user);
                }
            })
        } else if (user) {
          Users.findOne({userid: profile.id}, function(err, resul){
            if(err) err;

            if(resul){
              done(null, resul);
            }
          });

        }
    })
}));

passport.use(new TwitterTokenStrategy({
    consumerKey: "Zou3zCKnCOR1xs5kJYTIz53TK",
    consumerSecret: "cWhEQmj6crVE9RNsfsGmgW5QcHGlUNZiw0bT5IfKAlXbkFPKGh",
}, function(accessToken, refreshToken, profile, done) {
    Users.findOne({'userid': profile.id}, function(err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            user = new Users({
                user_id: profile.id,
                nick_name: profile.displayName,
                profile_image: profile._json.profile_image_url,
                token: rndString.generate()
            });

            user.save(function(err) {
                if (err) console.log(err);
                else {
                  done(null, profile);
                }
            })
        } else if (user) {
            done(null, profile);
        }
    })
}));

router.get('/fb/token', passport.authenticate('facebook-token'), function(req, res) {
    if (req.user) {
      Users.findOne({userid: req.user.userid}, function(err, result) {
        if(err) err;

        if(result){
          res.status(200).send(result);
        }else{
          res.status(401).send("not found");
        }

      });
    } else if (!req.user) {
        res.send(401, req.user);
    }
});

router.get('/tw/token', passport.authenticate('twitter-token'), function(req, res) {
    if (req.user) {
        Users.findOne({userid: req.user.id}, function(err, result) {
            if(err) err;
                res.send(200, result);
        });
    } else if (!req.user) {
        res.send(401, req.user);
    }
});


router.get('/fb/callback', passport.authenticate('facebook-token', {
    successRedirect: '/',
    failureRedirect: '/'
}));

router.post('/destroy', function(req, res){
  var token = req.body.token;

  Users.resmove({token: token}, function(err, result){
    if(err) return res.status(409).sned("DB ERROR");
    if(result){
      return res.status(200).send("good bye");
    }else{
      return res.status(401).send("user not found")
    }
  });
});

module.exports = router;
