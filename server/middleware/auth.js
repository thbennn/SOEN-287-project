function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next(); // user is logged in, continue
  } else {
    res.redirect('/login.html'); // not logged in, send back to login
  }
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    next(); // user is admin, continue
  } else {
    res.redirect('/dashboard.html'); // not admin, send to dashboard
  }
}

module.exports = { isAuthenticated, isAdmin };