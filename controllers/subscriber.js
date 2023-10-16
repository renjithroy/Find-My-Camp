const Subscriber = require("../models/subscriber");

module.exports.submitSubscriber = async (req, res) => {
    try {
        const { email } = req.body;
        const subscriber = new Subscriber({ email });
        await subscriber.save();
        req.flash('success', 'You have successfully subscribed to our newsletter!');
        res.redirect('/campgrounds');
    } catch (e) {
        req.flash("error", e.message)
        res.redirect('/campgrounds');
    }
}