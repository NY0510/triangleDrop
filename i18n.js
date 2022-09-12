const i18n = require("i18n");

i18n.configure({
  locales: ["en", "ko"],
  directory: __dirname + "/locales",
  defaultLocale: "en",
  cookie: "lang",
  queryParameter: "lang",
  autoReload: true,
});

module.exports = (req, res, next) => {
  i18n.init(req, res);
  res.locals.__ = res.__;
  var current_locale = i18n.getLocale();
  return next();
};
