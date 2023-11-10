const express = require('express');
const apiRoute = require('./api.route');
const { auth, requiresAuth } = require('express-openid-connect');
const ejs = require('ejs');
const path = require('path');
const app = express();
const auth0 = require('../auth0/server');
const profile = require('../auth0/routes/index')
app.set('view engine', 'ejs');
console.log(__dirname)
app.set('views', path.join(__dirname, '..', 'auth0', 'views'));
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL
};


app.use(auth(config));
app.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});
app.use('/profile', requiresAuth(), profile)

app.use('/', requiresAuth());
app.use('/api', requiresAuth(), apiRoute);

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Upload app listening on port 3000!');
});