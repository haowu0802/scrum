(function ($, Backbone, _, app) {

  /* generic views
  ===============*/

  /* a generic template view, boilerplate code */
  let TemplateView = Backbone.View.extend({
    templateName: '',
    initialize: function () {
      this.template = _.template($(this.templateName).html()); /* use _.template to render homepage tpl into html */
    },
    render: function () {
      let context = this.getContext(),
        html = this.template(context);
      this.$el.html(html);
    },
    getContext: function () {
      return {};
    }
  });

  /* generic form view */
  let FormView = TemplateView.extend({
    events: {
      'submit form': 'submit' /* listens to all submit events within login view */
    },
    errorTemplate: _.template('<span class="error"><%- msg %></span>'),/* use this inline template for the error message */
    /* clear msg for each new submission */
    clearErrors: function () {
      $('.error', this.form).remove();
    },
    showErrors: function (errors) {
      /* loop through errors and append error messages to the label */
      _.map(errors, function (fieldErrors, name) {
        let field = $(':input[name=' + name + ']', this.form),
          label = $('label[for=' + field.attr('id') + ']', this.form);
        if (label.length === 0) {
          label = $('label', this.form).first();
        }
        function appendError(msg) {
          label.before(this.errorTemplate({msg: msg})); /* append error message to element */
        }
        _.map(fieldErrors, appendError, this);
      }, this);
    },
    /* a generic serialization of the form */
    serializeForm: function (form) {
      return _.object(_.map(form.serializeArray(), function (item) {
        // Convert object to tuple of (name, value)
        return [item.name, item.value];
      }));
    },
    /* submit only clears previous error and start triggering event, further actions should be done after extending this */
    submit: function (event) { /* handles all the submit action and deal with response*/
      event.preventDefault(); /* replaces the default submit behavior */
      this.form = $(event.currentTarget);
      this.clearErrors(); /* clears error message for each submission */
    },
    failure: function (xhr, status, error) {
      let errors = xhr.responseJSON;
      this.showErrors(errors);
    },
    /* after the submission, generally the form should be removed from DOM */
    done: function (event) {
      if (event) {
        event.preventDefault();
      }
      this.trigger('done');
      this.remove();
    },
    /* failure callback for models */
    modelFailure: function (model, xhr, options) {
      let errors = xhr.responseJSON;
      this.showErrors(errors);
    }
  });

  /* form views
  ===============*/

  /* the login view, extending the generic form view */
  let LoginView = FormView.extend({
    id: 'login',
    templateName: '#login-template',
    submit: function (event) {
      let data = {};
      FormView.prototype.submit.apply(this, arguments); /* the login form calls the submit of the inherited form view */
      data = this.serializeForm(this.form); /* the serializeForm helper retrieves the data auto */
      $.post(app.apiLogin, data)
        .done($.proxy(this.loginSuccess, this))
        .fail($.proxy(this.failure, this));
    },
    loginSuccess: function (data) {
      app.session.save(data.token); /* after success, save the token then use inherited done to finish off */
      this.done();
    }
  });

  /* the view for creating new sprint, inherit generic form view */
  let NewSprintView = FormView.extend({
    templateName: '#new-sprint-template',
    className: 'new-sprint',
    /* in addition to the default submit, also provide a cancel function */
    events: _.extend({
      'click button.cancel': 'done',
    }, FormView.prototype.events),
    submit: function (event) {
      let self = this,
      attributes = {};
      FormView.prototype.submit.apply(this, arguments);
      attributes = this.serializeForm(this.form);
      app.collections.ready.done(function () {
        /* use model level create instead of manually call post */
        app.sprints.create(attributes, {
          wait: true,
          success: $.proxy(self.success, self),
          error: $.proxy(self.modelFailure, self)
        });
      });
    },
    /* redirect to detail route of sprint on success */
    success: function (model) {
      this.done();
      window.location.hash = '#sprint/' + model.get('id');
    }
  });

  /* template views
  ===============*/

  /* the home page view */
  let HomepageView = TemplateView.extend({
    /* the _ template to render */
    templateName: '#home-template',
    /* events on the page */
    events: {
      /* add sprint button renders form for creating sprint */
      'click button.add': 'renderAddForm'
    },
    /* handles the click event on add button */
    renderAddForm: function (event) {
      /* a new view instance for NewSprintView created */
      let view = new NewSprintView(),
        link = $(event.currentTarget);
      /* prevent default click event */
      event.preventDefault();
      /* put the view before the button */
      link.before(view.el);
      /* hide button */
      link.hide();
      /* show form */
      view.render();
      /* when done or cancel, show button again */
      view.on('done', function () {
        link.show();
      });
    },
    /* render the sprints */
    initialize: function (options) {
      let self = this;
      TemplateView.prototype.initialize.apply(this, arguments);
      app.collections.ready.done(function () {
        /* only sprints with end date of 7 days ago or greater */
        let end = new Date();
        end.setDate(end.getDate() - 7);
        end = end.toISOString().replace(/T.*/g, '');
        app.sprints.fetch({
          data: {end_min: end},
          success: $.proxy(self.render, self)
        });
      });
    },
    getContext: function () {
      return {sprints: app.sprints || null}; /* get context from app collection */
    }
  });

  /* header view */
  let HeaderView = TemplateView.extend({ /* use generic template */
    tagName: 'header',  /* target element that the template renders into */
    templateName: '#header-template',
    events: {
      'click a.logout': 'logout' /* a logout event callback is bind to logout */
    },
    getContext: function () {
      return {authenticated: app.session.authenticated()}; /* auth value passed to context */
    },
    logout: function (event) { /* logout and redirect to home */
      event.preventDefault();
      app.session.delete();
      window.location = '/';
    }
  });

  /* sprint detail view, extended from base template view */
  let SprintView = TemplateView.extend({
    templateName: '#sprint-template',
    initialize: function (options) {
      let self = this;
      TemplateView.prototype.initialize.apply(this, arguments);
      /* retrieve detail from api by sprint id */
      this.sprintId = options.sprintId;
      this.sprint = null;
      app.collections.ready.done(function () {
        /* app.sprint.push will put a model into client-side collection with only the id */
        /* replace original fetch with get or fetch */
        app.sprints.getOrFetch(self.sprintId).done(function (sprint) {
          self.sprint = sprint;
          console.log(sprint)
          self.render();
        }).fail(function (sprint) { /* on fetch fails, error out */
          self.sprint = sprint;
          self.sprint.invalid = true;
          self.render();
        });
      });
    },
    getContext: function () {
      return {sprint: this.sprint};
    }
  });

  /* add views to application */
  app.views.HomepageView = HomepageView;
  app.views.HeaderView = HeaderView;
  app.views.LoginView = LoginView;
  app.views.SprintView = SprintView;


})(jQuery, Backbone, _, app);/* js closure that uses jQ+Backbone+_+app.js */