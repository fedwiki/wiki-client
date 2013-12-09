(function() {
  module.exports = function(owner) {
    var failureDlg;
    $("#user-email").hide();
    $("#persona-login-btn").hide();
    $("#persona-logout-btn").hide();
    failureDlg = function(message) {
      return $("<div></div>").dialog({
        open: function(event, ui) {
          return $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
          "Ok": function() {
            $(this).dialog("close");
            return navigator.id.logout();
          }
        },
        close: function(event, ui) {
          return $(this).remove();
        },
        resizable: false,
        title: "Login Failure",
        modal: true
      }).html(message);
    };
    navigator.id.watch({
      loggedInUser: owner,
      onlogin: function(assertion) {
        return $.post("/persona_login", {
          assertion: assertion
        }, function(verified) {
          var failureMsg;
          verified = JSON.parse(verified);
          if ("okay" === verified.status) {
            return window.location = "/";
          } else if ("wrong-address" === verified.status) {
            return failureDlg("<p>Sign in is currently only available for the site owner.</p>");
          } else if ("failure" === verified.status) {
            if (/domain mismatch/.test(verified.reason)) {
              failureMsg = "<p>It looks as if you are accessing the site using an alternative address.</p>" + "<p>Please check that you are using the correct address to access this site.</p>";
            } else {
              failureMsg = "<p>Unable to log you in.</p>";
            }
            return failureDlg(failureMsg);
          } else {
            return navigator.id.logout();
          }
        });
      },
      onlogout: function() {
        return $.post("/persona_logout", function() {
          return window.location = "/";
        });
      },
      onready: function() {
        if (owner) {
          $("#persona-login-btn").hide();
          return $("#persona-logout-btn").show();
        } else {
          $("#persona-login-btn").show();
          return $("#persona-logout-btn").hide();
        }
      }
    });
    $("#persona-login-btn").click(function(e) {
      e.preventDefault();
      return navigator.id.request({});
    });
    return $("#persona-logout-btn").click(function(e) {
      e.preventDefault();
      return navigator.id.logout();
    });
  };

}).call(this);

/*
//@ sourceMappingURL=persona.js.map
*/