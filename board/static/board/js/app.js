/* scope of application */

let app = (function ($) {

  /* init vars from config element */
  let config = $('#config'),
    app = JSON.parse(config.text());

  /* make sure router initialized only after the dom is ready */
  $(document).ready(function () {
    let router = new app.router();
  });

  return app;

})(jQuery);