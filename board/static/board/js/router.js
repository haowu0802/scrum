/* client side routing */
(function ($, Backbone, _, app) {

  let AppRouter = Backbone.Router.extend({
    routes: {
      '': 'home' /* only one page is used for this single page application */
    },
    initialize: function (options) {
      this.contentElement = '#content'; /* where _ tpl will load on the page */
      this.current = null;
      this.header = new app.views.HeaderView(); /* the header always present and at top of body */
      $('body').prepend(this.header.el);
      this.header.render();
      Backbone.history.start();
    },
    home: function () {
      let view = new app.views.HomepageView({el: this.contentElement});
      this.render(view);
    },
    /* overwrites the default route */
    route: function (route, name, callback) {

      // Override default route to enforce login on every page
      let login;
      callback = callback || this[name];
      /* wrap the original callback with this to check auth */
      callback = _.wrap(callback, function (original) {
        let args = _.without(arguments, original);
        /* call the original callback when user is already authenticated */
        if (app.session.authenticated()) {
          original.apply(this, args);
        } else {
          /* Show the login screen before calling the view */
          $(this.contentElement).hide();
          /* Bind original callback once the login is successful */
          login = new app.views.LoginView();
          $(this.contentElement).after(login.el);
          /* show the hidden content and do original callback */
          login.on('done', function () {
            this.header.render(); /* re-render header after login to reflex changes */
            $(this.contentElement).show();
            original.apply(this, args);
          }, this);
          /* Render the login form */
          login.render();
        }
      });
      /* call the original route with new wrapped callback */
      return Backbone.Router.prototype.route.apply(this, [route, name, callback]);
    },
    render: function (view) { /* router helper to track view to view transitions */
      if (this.current) {
        this.current.undelegateEvents();
        this.current.$el = $();
        this.current.remove();
      }
      this.current = view;
      this.current.render();
    }
  });

  app.router = AppRouter; /* add to app config for the scope of the application */

})(jQuery, Backbone, _, app);/* js closure that uses jQ+Backbone+_+app.js */