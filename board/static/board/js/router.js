/* client side routing */
(function ($, Backbone, _, app) {

  let AppRouter = Backbone.Router.extend({
    routes: {
      '': 'home' /* only one page is used for this single page application */
    },
    initialize: function (options) {
      this.contentElement = '#content'; /* where _ tpl will load on the page */
      this.current = null;
      Backbone.history.start();
    },
    home: function () {
      let view = new app.views.HomepageView({el: this.contentElement});
      this.render(view);
    },
    render: function (view) { /* router helper to track view to view transitions */
      if (this.current) {
        this.current.$el = $();
        this.current.remove();
      }
      this.current = view;
      this.current.render();
    }
  });

  app.router = AppRouter; /* add to app config for the scope of the application */

})(jQuery, Backbone, _, app);/* js closure that uses jQ+Backbone+_+app.js */