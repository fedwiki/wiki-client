# The Persona module handles the user login in a side cooperation
# with the origin server independent of fetching pages. It signals
# login success by specifically recognizable markup in its user
# prompts.

module.exports = (owner) ->
  $("#user-email").hide()
  $("#persona-login-btn").hide()
  $("#persona-logout-btn").hide()

  failureDlg = (message) ->
    $("<div></div>").dialog({
      # Remove the closing 'X' from the dialog
      open: (event, ui) -> $(".ui-dialog-titlebar-close").hide()
      buttons: {
        "Ok": -> 
          $(this).dialog("close")
          navigator.id.logout()
      }
      close: (event, ui) -> $(this).remove()
      resizable:  false
      title: "Login Failure"
      modal: true
    }).html(message)

  navigator.id.watch
    loggedInUser: owner
    onlogin: (assertion) ->
      $.post "/persona_login",
        assertion: assertion
      , (verified) ->
        verified = JSON.parse(verified)
        if "okay" is verified.status
          window.location = "/";
        else if "wrong-address" is verified.status
          # Logged in user is not the site owner, something to address later...
          failureDlg "<p>Sign in is currently only available for the site owner.</p>"
        else if "failure" is verified.status
          # The verification service has failed to verify the asertion
          if /domain mismatch/.test(verified.reason)
            # The site is being accessed using a different protocol/address than that used as 
            # the audience in the call to the verification service...
            failureMsg = "<p>It looks as if you are accessing the site using an alternative address.</p>" + \
            "<p>Please check that you are using the correct address to access this site.</p>"
          else
            # Verification failed for some other reason
            failureMsg = "<p>Unable to log you in.</p>"
          failureDlg failureMsg
        else
          # something else has happened - be safe log the user out...
          navigator.id.logout()


    onlogout: ->
      $.post "/persona_logout", () ->
          window.location = "/";

    onready: ->
      # It's safe to render the UI now, Persona and
      # the Wiki's notion of a session agree
      
      if owner
        # $("#user-email").text(owner).show()
        $("#persona-login-btn").hide()
        $("#persona-logout-btn").show()
      else
        # $("#user-email").hide()
        $("#persona-login-btn").show()
        $("#persona-logout-btn").hide()

  $("#persona-login-btn").click (e) ->
    e.preventDefault()
    navigator.id.request {}

  $("#persona-logout-btn").click (e) ->
    e.preventDefault()
    navigator.id.logout()
