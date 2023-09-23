const User = require("../models/user");

module.exports.renderRegisterForm = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password); //password will be salted, hashed
        //after register, automatically login
        req.login(registeredUser, (err) => { //passport function
            if (err) return next(err); //invoke error handler
            req.flash('success', 'Welcome to FindMyCamp');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash("error", e.message) //passport ensures no duplicate 
        res.redirect('register');
    }
}

module.exports.renderLoginForm = (req, res) => {
    res.render('users/login');

}

module.exports.login = async (req, res) => {
    //we reach here only if credentials are authenticated
    // console.log(req.body);
    req.flash("success", "Logged In Successfully");
    const redirectUrl = req.session.returnTo || "/campgrounds"; //req.session.returnTo set in middleware.js
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Logged out successfully");
        res.redirect('/campgrounds');
    });
}