(function ($, Backbone, _, app) {

  /* CSRF helper functions taken directly from Django docs
    will hijack all ajax and add auth and csrf tokens
  */
  function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/i.test(method));
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie != '') {
      let cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        let cookie = $.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(
            cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Setup jQuery ajax calls to handle CSRF
  $.ajaxPrefilter(function (settings, originalOptions, xhr) {
    let csrftoken;
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      // Send the token to same-origin, relative URLs only.
      // Send the token only if the method warrants CSRF protection
      // Using the CSRFToken value acquired earlier
      csrftoken = getCookie('csrftoken');
      xhr.setRequestHeader('X-CSRFToken', csrftoken);
    }
  });

  /* define the user Session */
  let Session = Backbone.Model.extend({
    defaults: {
      token: null  /* make sure token var is available */
    },
    initialize: function (options) {
      this.options = options;
      $.ajaxPrefilter($.proxy(this._setupAuth, this)); /* check if user is authenticated before initialization */
      this.load();
    },
    load: function () {
      let token = localStorage.apiToken;  /* use local storage for init token */
      if (token) {
        this.set('token', token);
      }
    },
    save: function (token) {
      this.set('token', token);
      if (token === null) {  /* de-auth when there's no token */
        localStorage.removeItem('apiToken');
      } else {
        localStorage.apiToken = token;
      }
    },
    delete: function () {
      this.save(null);
    },
    authenticated: function () {
      return this.get('token') !== null; /* checks to see if already authenticated */
    },
    _setupAuth: function (settings, originalOptions, xhr) { /* for requesting auth token in XHR */
      if (this.authenticated()) {
        xhr.setRequestHeader( /* set auth token in header */
          'Authorization',
          'Token ' + this.get('token')
        );
      }
    }
  });

  /* apply user Session to application scope */
  app.session = new Session();

})(jQuery, Backbone, _, app); /* self-invoking js closure that uses jQ+Backbone+_+app.js */
