const express = require("express");
const router = express.Router({ mergeParams: true }); //to access req.params (like id in url) in router
const catchAsync = require("../utils/catchAsync");

const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware");
const Review = require("../models/review")
const Campground = require("../models/campground");
const reviews = require("../controllers/reviews");



//create reviews
router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview))

//delete reviews
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router;