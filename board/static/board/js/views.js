(function ($, Backbone, _, app) {

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

  /* the home page view */
  let HomepageView = TemplateView.extend({
    templateName: '#home-template',/* the _ template to render */
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
    }
  });

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



  /* add views to application */
  app.views.HomepageView = HomepageView;
  app.views.HeaderView = HeaderView;
  app.views.LoginView = LoginView;


})(jQuery, Backbone, _, app);/* js closure that uses jQ+Backbone+_+app.js */