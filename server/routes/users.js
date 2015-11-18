var express = require('express');
var router = express.Router();
var _ = require("underscore");
var achievements = require("../modules/achievements");
var utils = require("../modules/utils");
var schedules = require("../modules/schedule");
var moment = require("moment");

/* GET users listing. */
router.get('/', function(req, res, next) {
  req.toJade.title = "Users";
  req.toJade.tableForm = (req.query.table == "1" ? true : false);
  req.toJade.registered = false;
  req.toJade.users = false;

  var perPage = 10;
  var pages = (530/10);
  var pageNum = (req.query.page ? parseInt(req.query.page) : 1);

  req.Student.find({registered: true}, 'registered firstName lastName advisement username rank mpicture ipicture')
    .sort({rank: -1, points: -1})
    .exec(function(err, registered){
      if(err){req.session.errs.push('An error occured, please try again.'); res.redirect(req.baseUrl); return;}
      if(registered)
        req.toJade.registered = registered;
      req.Student.find({}, 'registered firstName lastName advisement username rank mpicture ipicture')
        .sort({advisement: 1})
        .skip(perPage*(pageNum-1))
        .limit(perPage)
        .exec(function(err, users){
          if(err){req.session.errs.push('An error occured, please try again.'); res.redirect(req.baseUrl); return;}
          if(users){
            req.toJade.users = users;
            req.toJade.pageNum = pageNum;
            req.toJade.prev = ((pageNum-1) <= 0 ? pages : (pageNum-1));
            req.toJade.next = ((pageNum+1) > pages ? 1 : (pageNum+1));
            req.toJade.pages = pages;
          }
          res.render('users/list', req.toJade);
        });
    });
});

router.get("/profile", function(req, res) {
  req.toJade.title = "Your Profile";
  res.render('users/edit', req.toJade);
});

router.post("/profile", function(req, res) {
  var newbio = req.body.newbio;
  var newnickname = req.body.newnickname;

  if(newbio){
    req.Student.findOne({username: req.currentUser.username}, function(err, user) {
      if(err){req.session.errs.push('An error occured, please try again.'); res.redirect(req.baseUrl); return;}
      if(user){
        user.bio = utils.filter(newbio);
        user.nickname = newnickname;
        user.steamlink = (req.body.newsteamlink.indexOf("http://steamcommunity.com") > -1 ? req.body.newsteamlink : user.steamlink);
        user.save(function(err) {
          if(err){req.session.errs.push('An error occured, please try again.'); res.redirect(req.baseUrl); return;}
          req.session.info.push("Successfully updated profile.");
          req.session.currentUser.bio = user.bio;
          req.session.currentUser.nickname = user.nickname;
          req.session.currentUser.steamlink = user.steamlink;
          done();
        });
      }else{
        done();
      }
    });
  }else{done();}

  function done(){
    res.redirect("/users/"+req.currentUser.username);
  }
});

router.get("/:username", function(req, res){
  req.toJade.title = "Not a User";
  var username = req.params.username;
  req.toJade.user = false;
  req.toJade.allAchievements = achievements;

  req.Student.findOne({username: username}, '-schedule -locker_number')
    .populate('courses', 'tID title code')
    .exec(function(err, user) {
      if(err){res.json({error:'An error occured, please try again.'}); return;}
      if(user){
        user.deepPopulate('courses.teacher', function(err, u) {
          req.toJade.title = u.firstName+" "+u.lastName[0]+"'s Profile";
          u.courses.forEach(function(c) {
            c.students = undefined;
            if(c.teacher)
              c.teacher.schedule = undefined;
          });
          var stars = _.range(u.rank+1);
          u.schedule = undefined;
          var pointdiff = "";
          if(req.currentUser.points > u.points)
            pointdiff = (req.currentUser.points - u.points)+" fewer";
          else if(req.currentUser.points < u.points)
            pointdiff = (u.points - req.currentUser.points)+" more";
          else
            pointdiff = "the same amount of";

          req.toJade.pointdiff = pointdiff;
          console.log("TEST: ");
          console.log(req.toJade.allAchievements);

          u.stars = stars;
          req.toJade.user = u;
          res.render('users/profile', req.toJade);
        });
      }else{
        res.render('users/profile', req.toJade);
      }
    });
});

router.get("/:username/schedule", function(req, res){
  req.Student.findOne({username: req.params.username}, 'firstName lastName schedule code', function(err, user) {
    if(err){req.session.errs.push('An error occured, please try again.'); res.redirect(req.baseUrl); return;}

    if(user.schedule){
      req.toJade.title = user.firstName+" "+user.lastName.charAt(0)+"'s Schedule";
      req.toJade.url = "StudentCode="+user.code;
      req.toJade.schedule = user.schedule;

      res.render('schedule', req.toJade);
    }else{
      req.session.errs.push('Failed to find a schedule for this user.');
      res.redirect("/users/"+req.params.username);
    }
  });
});






//   A     PPPPP    IIIIII
//  A A    P    P     I
// AAAAA   PPPPP      I
//A     A  P        IIIIII


/* GET users */
router.get('/api/list', function(req, res, next) {
  req.Student.find({}, 'registered firstName lastName advisement username rank mpicture ipicture')
    .sort({advisement: 1})
    .lean()
    .exec(function(err, users){
      if(err){res.json({error: 'An error occured, please try again.'}); return;}
      if(users){
        res.json(users);
      }
    });
});

/* GET user */
router.get('/api/loggedIn', function(req, res) {
  if(req.loggedIn){
    var u = req.currentUser;
    var sd = user.scheduleObject.scheduleDays[moment().format("MM/DD/YY")];
    if(sd){
      //console.log(user.scheduleObject.dayClasses);
      u.todaysClassesInfo = {scheduleDay: sd, periods: user.scheduleObject.dayClasses[sd], currentInfo: schedules.getCurrentClassInfo(user.scheduleObject.dayClasses[sd])};
    }
    res.json(req.currentUser);
  }
});

router.get("/api/:username", function(req, res){
  var username = req.params.username;
  req.Student.findOne({username: username}, '-schedule -locker_number')
    .populate('courses', 'tID title mID code')
    .exec(function(err, user) {
      if(err){res.json({error:'An error occured, please try again.'}); return;}
      if(user){
        user.deepPopulate('courses.teacher', function(err, u) {
          //console.log(u.courses);
          u.courses.forEach(function(c) {
            c.students = undefined;
            if(c.teacher)
              c.teacher.schedule = undefined;
          });
          var stars = _.range(u.rank+1);
          u.schedule = undefined;
          u = u.toObject();
          if(user.registered){
            var sd = user.scheduleObject.scheduleDays[moment().format("MM/DD/YY")];
            if(sd){
              //console.log(user.scheduleObject.dayClasses);
              u.todaysClassesInfo = {scheduleDay: sd, periods: user.scheduleObject.dayClasses[sd], currentInfo: schedules.getCurrentClassInfo(user.scheduleObject.dayClasses[sd])};
            }
          }

          u.fullName = String(u.fullName);
          u.gradeName = String(u.gradeName);
          res.json(u);
        });
      }else{
        res.json({error: "No such user found!"});
      }
    });
});

module.exports = function(io) {
  return {router: router, models: ['Student', 'Teacher']}
};
