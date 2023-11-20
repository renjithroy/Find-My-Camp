const Campground = require("../models/campground");

const { cloudinary } = require("../cloudinary");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
//geocoder contains forward and reverse geocoding
//forward => get coordinates from location

//MVC - Models, Views, this is the Controller

module.exports.index = async (req, res) => {
    try {
        // Fetch the campgrounds that are verified
        const campgrounds = await Campground.find({ isVerified: true }).populate("reviews").exec();

        // Calculate the averageRating for each campground and add it to the original campground object
        campgrounds.forEach((campground) => {
            let averageRating = 0;

            if (campground.reviews.length > 0) {
                const totalRating = campground.reviews.reduce((acc, review) => acc + review.rating, 0);
                averageRating = totalRating / campground.reviews.length;
            }

            // To prevent 3 from becoming 3.0
            if (!Number.isInteger(averageRating)) {
                averageRating = averageRating.toFixed(1);
            }

            // Add the averageRating field to the original campground object
            campground.averageRating = averageRating;
        });

        // Reverse the campgrounds if needed
        campgrounds.reverse();

        // Render the view with the campgrounds data
        res.render("campgrounds/index", { campgrounds });
    } catch (error) {
        console.error(error);
        // Handle errors as needed
        res.status(500).send("Internal Server Error");
    }
};

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
    if (!Number.isInteger(averageRating)) {
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

module.exports.searchCampgrounds = async (req, res) => {
    const { location } = req.query;

    try {
        const geoData = await geocoder.forwardGeocode({
            query: location,
            limit: 1
        }).send();

        // Check if valid location data is obtained
        if (!geoData.body.features || geoData.body.features.length === 0) {
            // No valid location data found
            req.flash("error", "Invalid location. Please enter a valid location.");
            return res.redirect("/campgrounds");
        }
        // Get detailed place name from mapbox
        const place_name = geoData.body.features[0].place_name;
        const coordinates = geoData.body.features[0].geometry.coordinates;

        let nearbyCampgrounds = await Campground.find({
            geometry: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: 100000 // 100 kilometers
                }
            },
            isVerified: true
        });

        if (nearbyCampgrounds.length === 0) {
            // No campgrounds found for the given location
            // req.flash("error", `No campgrounds found near ${place_name}. Try a different location.`);
            // return res.redirect("/campgrounds");
            res.render("campgrounds/search", { noResults : true, place_name });
        }

        res.render("campgrounds/search", { campgrounds: nearbyCampgrounds, place_name, totalResults: nearbyCampgrounds.length, noResults: false, searchCoordinates: coordinates });

    } catch (err) {
        console.error("Error during geocoding:", err);
        req.flash("error", "Error finding location. Please try again.");
        return res.redirect("/campgrounds");
    }
};
