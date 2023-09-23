const Campground = require("../models/campground");

const { cloudinary } = require("../cloudinary");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
//geocoder contains forward and reverse geocoding
//forward => get coordinates from location

//MVC - Models, Views, this is the Controller

module.exports.index = async (req, res) => {
    const campgrounds = await (await Campground.find({ isVerified: true })).reverse();
    res.render("campgrounds/index", { campgrounds });
    
    // const page = parseInt(req.query.page) || 1;
    // const limit = 9; // Number of campgrounds per page
    
    // Use the `paginate` method to get paginated results
    // const campgrounds = await Campground.paginate(
        //     { isVerified: true },
        //     { page, limit, sort: { createdAt: -1 } }
        // );
    // res.render("campgrounds/index", { campgrounds });

}

module.exports.renderNewForm = (req, res) => {
    res.render("campgrounds/new");
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    //images are in req.files which is an array. 
    //So we map over multiple image array of objects, and return a array of objects with url and filename
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id; //current logged in user
    await campground.save();
    req.flash("success", "Campground will be verified and published"); // "success" is the key
    res.redirect("/campgrounds");
}

module.exports.showCampgrounds = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("author");
    //we need to populate author in reviews array of Campgrounds collection
    if (!campground) {
        req.flash("error", "Cannot find that campground");
        return res.redirect("/campgrounds");
    }

    // Calculate average rating
    let averageRating = 0;
    if (campground.reviews.length > 0) {
        const totalRating = campground.reviews.reduce((acc, review) => acc + review.rating, 0);
        averageRating = totalRating / campground.reviews.length;
    }

    //to prevent 3 from becoming 3.0
    if (!Number.isInteger(averageRating)){
        averageRating = averageRating.toFixed(1);
    }

    // res.render("campgrounds/show", { campground });
    res.render("campgrounds/show", { campground, averageRating });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash("error", "Cannot find that campground");
        return res.redirect("/campgrounds");
    }
    res.render("campgrounds/edit", { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    //imgs is an array. We should not push an array to an array (campgrounds: images). So destructure and pass it as objects
    campground.images.push(...imgs);
    await campground.save();
    //req.body.deleteImages => [ 'Campscape/sxiklbsqspzwcydzxkur', 'Campscape/vm29in9slnlqsakxj34u' ] - array of filenames
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash("success", "Successfully updated campground")
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "Campground deleted successfully")
    res.redirect("/campgrounds");
}