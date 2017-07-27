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

  /* define a base model for Sprint, Task, User */
  let BaseModel = Backbone.Model.extend({
    /* use urls from links property of the models to build urls */
    url: function () {
      let links = this.get('links'),
        url = links && links.self;
      /* for cases that no links returned, use backbone default url */
      if (!url) {
        url = Backbone.Model.prototype.url.call(this);
      }
      return url;
    }
  });

  /* models for each of the backend models */
  app.models.Sprint = BaseModel.extend({});
  app.models.Task = BaseModel.extend({});
  app.models.User = BaseModel.extend({
    idAttributemodel: 'username' /* user referred by username instead of id */
  });

  /* customized pagination */
  let BaseCollection = Backbone.Collection.extend({
    /* overrides the default pagination of backbone with response */
    parse: function (response) {
      this._next = response.next;
      this._previous = response.previous;
      this._count = response.count;
      return response.results || [];
    }
  });

  /* fetch api root and store in collection ready so other component will wait until api root is loaded */
  app.collections.ready = $.getJSON(app.apiRoot);

  /* parse the response */
  app.collections.ready.done(function (data) {
    /* collection mapping for model and url */
    app.collections.Sprints = BaseCollection.extend({ /* use customized base collection */
      model: app.models.Sprint,
      url: data.sprints
    });
    /* shared instance as app.model */
    app.sprints = new app.collections.Sprints();
    app.collections.Tasks = BaseCollection.extend({ /* use customized base collection */
      model: app.models.Task,
      url: data.tasks
    });
    app.tasks = new app.collections.Tasks();
    app.collections.Users = BaseCollection.extend({ /* use customized base collection */
      model: app.models.User,
      url: data.users
    });
    app.users = new app.collections.Users();
  });

})(jQuery, Backbone, _, app); /* self-invoking js closure that uses jQ+Backbone+_+app.js */
