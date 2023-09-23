const Review = require("../models/review");
const Campground = require("../models/campground");

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);

    // Check if the user has already left a review for this campground

    // const existingReview = await Review.findOne({
    //     author: req.user._id,
    //     campground: campground._id,
    // });

    // if (existingReview) {
    //     req.flash("error", "You have already left a review for this campground.");
    //     return res.redirect(`/campgrounds/${campground._id}`);
    // }

    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash("success", "Review created successfully")
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); //pulls out particular review with review id from array of reviews
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted successfully")
    res.redirect(`/campgrounds/${id}`);
}