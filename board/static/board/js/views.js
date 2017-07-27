(function ($, Backbone, _, app) {

  let HomepageView = Backbone.View.extend({
    templateName: '#home-template',/* the _ template to render */
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

  app.views.HomepageView = HomepageView; /* homepage view added to views for router to use */

})(jQuery, Backbone, _, app);/* js closure that uses jQ+Backbone+_+app.js */