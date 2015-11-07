$(function() {
  PNotify.desktop.permission();
  var page = window.location.href.split("/")[3];
  console.log("Loaded JS");
  updateTitle();
  effects();
  reminders();
  login();
  days();
  header();
  if($('#send-message').data("username") !== undefined){
    if(page == "home" || page==""){
      homepage();
    }
    sockets();
    clientSchedule();
    console.log(page);
    if(page == "work"){
      workindex();
      homework();
    }
  }
  updateTooltips();
});

function updateTooltips(){
  $('[data-toggle="tooltip"]').tooltip();
}

function linkify(text) {
  var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlRegex, function(url) {
      return '<a target="_blank" href="' + url + '">' + url + '</a>';
  });
}

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

var title=$("title").text();
function updateTitle(){

  if(!sessionStorage.unread)
    sessionStorage.unread = 0;
  if(!sessionStorage.advunread)
    sessionStorage.advunread = 0;

  var toSet = title + " (";

  if(Number(sessionStorage.unread) > 0)
    toSet += sessionStorage.unread+" unread";
  if(Number(sessionStorage.advunread) > 0){
    if(Number(sessionStorage.unread > 0))
      toSet += ", ";
    toSet+= sessionStorage.advunread+" advchat unread";
  }
  toSet+= ")";

  if(Number(sessionStorage.unread) == 0 && Number(sessionStorage.advunread) == 0)
    $("title").text(title);
  else
    $("title").text(toSet);
}