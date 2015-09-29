// HOMEPAGE CLASS INFO
todayInfo = false;
userInfo = false;
schedule = false;

function updateHomepageInfo(){
  var content = "<hr>";

  if(schedule){
    var cInfo = schedule;
    $("#classInfo").html("");
    $("#cInfo-table tr").removeClass("sucess");

    //console.log(sInfo);
    if(cInfo.nowClass !== false){
      if(cInfo.nowClass.className == "Unstructured Time" && sessionStorage['user-status'] == "In Class")
        setStatus("Available");
      else if(cInfo.nowClass.className != "Unstructured Time")
        setStatus("In Class");

      if(cInfo.justEnded !== false){
        content += "<p class='larger no-margin'><b>"+cInfo.justEnded.className+"</b> has just ended.</p>";
        if(cInfo.justStarted){
          content += "<h2 class='no-margin'>Get to <b>"+cInfo.nowClass.room+"</b> for <b>"+cInfo.nowClass.className+"</b></h2>";
        }
      }else if(cInfo.nowClass.className == "Unstructured Time") {
        // FREE PERIOD
        content += "You currently have a <b>Free Period</b> for <b>"+moment(cInfo.nowClass.endTime, "hh:mm A").fromNow(true)+"</b>";
      }else{
        // Regular class
        content += "<h2>You should currently be in <b>"+cInfo.nowClass.room+"</b> for <b>"+cInfo.nowClass.className+"</b></h2>";
      }
      $("#cInfo-table tbody tr td:contains('"+moment(cInfo.nowClass.className, "hh:mm A").format("h:mm A")+"')").parent().addClass("success");
      if(cInfo.nextClass !== false && cInfo.nextClass.className !== "Afternoon Advisement"){
        content += "<p class='larger'>Your next class is <b>"+cInfo.nextClass.className+"</b> in <b>"+cInfo.nextClass.room+"</b> in <b>"+moment(cInfo.nextClass.startTime, "hh:mm A").fromNow(true)+"</b></p>";
      }else{
        content += "<p class='larger'>This is the last class of your day!</p>";
      }

      $("#classInfo").html(content);
    }else{
      // out of school
      if(sessionStorage['user-status'] == "In Class"){
        setStatus("Available");
      }
    }
  }
}

function updateSidebarClassInfo(){
  var content = "";
  if(schedule){
    var cInfo = schedule;
    if(cInfo.nowClass !== false){
      $("#sidebar-class-info").show();
      if(cInfo.nowClass.className == "Unstructured Time") {
        // FREE PERIOD
        $("#sidebar-now-class").text("Free Period");
      }else{
        // Regular class
        var cTitle = cInfo.nowClass.className;
        if(cTitle.indexOf(")") > -1)
          cTitle = cTitle.split(")")[0] +")";
        $("#sidebar-now-class").text(cTitle);
        $("#nowclass-room").text(cInfo.nowClass.room);
      }

      if(cInfo.nextClass !== false && cInfo.nextClass.className !== "Afternoon Advisement"){
        $("#sd-nextc").show();
        $("#sidebar-next-class").text(cInfo.nextClass.className.split(")")[0]+")");
        if(cInfo.nextClass.room !== "Anywhere")
          $("#nextclass-room").text(cInfo.nextClass.room);
      }else{
        $("#sd-nextc").hide();
      }
    }else{
      $("#sidebar-class-info").hide();
    }
  }
}

var hasClasses = false;
var registered = true;
var profileUserInfo = null;
function updateProfileSchedule(){
  var profileUsername = window.location.href.split("/")[2];
  if(!profileUserInfo){
    $.get('/api/user/'+username, function(data){
      if(data){
        console.log(data);
        registered = data.registered;
        if(data.registered == false){
          $("#profile-schedule").hide();
          return;
        }
        hasClasses = true;
        profileUserInfo = data;
        updateProfileSchedule();
      }
    });
  }else{
    var cInfo = getCurrentClassInfo(profileUserInfo.todaysClassesInfo.periods);
    if(cInfo.inSchool == true && cInfo !== false){
      if(cInfo.nowClass !== false){
        $("#profile-schedule").show();
        $("#profile-schedule p").html("<b>"+profileUserInfo.firstName+"</b> currently has <b>"+cInfo.nowClass.className+"</b> in <b>"+cInfo.nowClass.room+"</b> until <b>"+moment(cInfo.nowClass.endTime, "hh:mm A").format("h:mm A")+"</b>");
      }
    }else{
      $("#profile-schedule").hide();
    }
  }
}


function clientSchedule(){
  $.get('/api/user/'+username, function(data){
    console.log(data);
    userInfo = data;
    todayInfo = userInfo.todaysClassesInfo;
    console.log(todayInfo);

    if(todayInfo){
      schedule = getCurrentClassInfo(todayInfo.periods);
      updateDayInfo();
      setInterval(updateDayInfo, 60000);
    }else{
      console.log("Not a school day, not updating class info.");
    }
  });
}

function updateDayInfo(){
  schedule = getCurrentClassInfo(todayInfo.periods);

  if($("#classInfo").length)
    updateHomepageInfo();

  if($("#profile-schedule").length && registered)
    updateProfileSchedule();

  updateSidebarClassInfo();
  console.log("Updated schedule info");
}

// Return an the scheduleobject for today with the periods filled in.
var getCurrentClassInfo = function(periods){
  var mom = moment("08:45 AM", "hh:mm A");
  var dayStart = moment("08:40 AM", "hh:mm A");
  var dayEnd = moment("02:50 PM", "hh:mm A");

  var now = false;
  var next = false;
  var justEnded = false;
  var justStarted = false;
  var inSchool = false;

  if(periods !== false && mom.isBetween(dayStart, dayEnd)){
    inSchool = true;
    // THERE ARE CLASSES SCHEDULED FOR TODAY

    // Loop through today's classes to find the currently ongoing
    now = periods.filter(function(period) {
      if(mom.isBetween(moment(period.startTime, "hh:mm A"), moment(period.endTime, "hh:mm A"))){
        return true;
      }
      return false;
    });
    if(now.length >= 1) now = now[0];
    // If there is no such period (and it is during the school day)

    // Try to find a class that just ended
    var cur = mom;
    var found = periods.filter(function(period) {
      var ended = moment(period.endTime, "hh:mm A");
      var buffer = moment(ended).add(3, 'minutes'); // Start of next period with buffer time
      if(cur.isBetween(ended, buffer)){
        return true;
      }
      return false;
    });
    if(found.length == 1){ justEnded = found[0];}else{justEnded = false;}
    // If none found set to false

    // Did the current class just start?
    var started = moment(now.startTime, "hh:mm A");
    var buffer = moment(started).add(3, 'minutes');
    if(cur.isBetween(started, buffer)) justStarted = true;

    // If a class has just ended and another has just started, you are in between adjacent classes
    if(justStarted !== false && justEnded !== false){
      var index = periods.indexOf(justStarted) + 1;
      if(periods[index])
        now = periods[index];
    }

    // Get the next class
    next = ((periods.length-1 > periods.indexOf(now)) ? periods[periods.indexOf(now)+1] : false);

  }

  return {
    nowClass: now, // object of current class | false
    nextClass: next, // object of next class | false
    justStarted: justStarted, // boolean stating whether current class just started | false
    justEnded: justEnded, // object of class that just ended | false
    inSchool: inSchool // boolean stating whether the current time is during school hours
  };
};

function getNextDay(day, sO){
  var current = moment(day).add(1, 'days');
  var count = 0;
  while(count < 50){
    if(sO.scheduleDays[current.format("MM/DD/YY")] !== undefined){
      return current.format("MM/DD/YY");
    }
    current.add(1, 'days');
    count++;
  }
  return false;
}

function getPrevDay(day, sO){
  var current = moment(day).subtract(1, 'days');
  var count = 50;
  while(count > 0){
    if(sO.scheduleDays[current.format("MM/DD/YY")] !== undefined){
      return current.format("MM/DD/YY");
    }
    current.subtract(1, 'days');
    count--;
  }
  return false;
}
