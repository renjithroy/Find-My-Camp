const express = require("express");
const pdf = require('html-pdf');
const passport = require("passport");
const router = express.Router();
const Admin = require("../models/admin");
const Campground = require("../models/campground");
const User = require("../models/user");
const Review = require("../models/review");
const session = require("express-session");
const { isAdmin } = require("../middleware");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const multer = require('multer') //for parsing image data from new campground form
const { storage } = require("../cloudinary");
const upload = multer({ storage }) //asking multer to store in cloudinary


const { cloudinary } = require("../cloudinary");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const campground = require("../models/campground");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

// router.get("/newAdmin", async (req, res) => {
//     const hash = await bcrypt.hash("admin", 12);
//     const admin = new Admin({ username: "admin", password: hash });
//     await admin.save();
//     console.log(admin);
//     res.send(hash);
// })

router.use(session({
    name: 'adminsession',
    secret: 'notagoodsecret',
    resave: false,
    saveUninitialized: true,
}));

router.get("/dashboard", isAdmin, async (req, res) => {

    // Use Promise.all for parallel database queries
    // Gettting total count of each collection
    const [userCount, adminCount, campgroundCount, reviewCount] = await Promise.all([
        User.countDocuments(),
        Admin.countDocuments(),
        Campground.countDocuments(),
        Review.countDocuments()
    ]);

    let totalCount = {
        userCount: userCount,
        adminCount: adminCount,
        campgroundCount: campgroundCount,
        reviewCount: reviewCount,
    }

    const campgroundData = await Campground.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                },
                count: 1,
                _id: 0
            }
        },
        { $sort: { date: -1 } }, // Sort by date in ascending order
        { $limit: 30 }, // Limit the result to the top 10 most recent records
    ]);

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

    // Top Rated Camps
    // Sort the campgrounds by averageRating in descending order
    campgrounds.sort((a, b) => b.averageRating - a.averageRating);

    // Get the top 5 campgrounds
    const top5Campgrounds = campgrounds.slice(0, 5);

    res.render("admin/index", { campgroundData, totalCount, top5Campgrounds });
})

router.get("/reports", isAdmin, async (req, res) => {
    let notFoundError = null;
    // If date range is selected
    if (req.query.dateRange) {

        // Assuming dateRange is the query parameter value
        const dateRange = req.query.dateRange;

        // Split the dateRange into an array using ' - ' as the separator
        const dateRangeArray = dateRange.split(' - ');

        // Extract startDate and endDate from the array
        const startDateString = dateRangeArray[0];
        const endDateString = dateRangeArray[1];

        // Parse the date strings into Date objects
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        try {
            // MongoDB query here
            const campgrounds = await Campground.find({ createdAt: { $gte: startDate, $lte: endDate } }).populate("author").exec();

            if (campgrounds.length === 0) {
                notFoundError = "No campgrounds found for the given date range";
            }

            res.render("admin/reports", { campgrounds, notFoundError });
        } catch (error) {
            console.error("Error fetching data:", error);
            // Handle the error and render an error page or message
            res.status(500).send("Internal Server Error");
        }

    } else { // When reports page is loaded without selecting a date range

        // If no date parameters are provided, render the reports page without filtering
        const campgrounds = []; // Or retrieve your campgrounds data using your existing logic
        res.render("admin/reports", { campgrounds, notFoundError });
    }
});

router.get('/reports/generate-pdf', async (req, res) => {
    try {
        const dateRange = req.query.dateRange;
        const [startDateString, endDateString] = dateRange.split(' - ');

        // Parse the date strings into Date objects
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        // Fetch data from the database or any other source based on the date range
        const campgrounds = await Campground.find({ createdAt: { $gte: startDate, $lte: endDate } }).populate("author").exec();

        // Create an HTML table
        const html = `
            <html>
            <head>
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                <h2 style="text-align: center;">Campground Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Author</th>
                            <th>Location</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campgrounds.map(campground => `
                            <tr>
                                <td>${campground.title}</td>
                                <td>${campground.description}</td>
                                <td>${campground.author.username}</td>
                                <td>${campground.location}</td>
                                <td>₹${campground.price}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Convert HTML to PDF
        pdf.create(html).toStream((err, stream) => {
            if (err) {
                console.error('Error generating PDF:', err);
                res.status(500).send('Internal Server Error');
            } else {
                // Get the content length of the PDF stream
                const contentLength = stream.length;

                // Set the Content-Length header
                res.setHeader('Content-Length', contentLength);

                // Pipe the PDF stream to the response
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="campgrounds-report.pdf"');
                stream.pipe(res);
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});



//serve login form
router.get("/login", (req, res) => {
    res.render("admin/login")
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
        req.flash('error', 'Incorrect admin credentials')
        return res.redirect('/admin/login');
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (validPassword) {
        req.session.admin_id = admin._id;
        req.flash('success', "Welcome Admin!")
        res.redirect("/admin/dashboard");
    } else {
        req.flash('error', 'Incorrect credentials')
        res.redirect('/admin/login')
    }
})

router.post("/logout", isAdmin, (req, res) => {
    req.session.admin_id = null;
    res.redirect("/admin/login");
})

router.get("/campgrounds", isAdmin, async (req, res) => {
    const campgrounds = await Campground.find({ isVerified: true }).populate("author");
    res.render("admin/campgrounds", { campgrounds });
})

//serve form to edit a campground
router.get("/campgrounds/:id/edit", isAdmin, async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate("author");
    res.render("admin/editCampground", { campground });
})

//edit the campground
router.put("/campgrounds/:id", isAdmin, upload.array('image'), async (req, res) => {
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
    req.flash("success", "Campground edited successfully");
    res.redirect("/admin/campgrounds");
})

//delete campground
router.delete("/campgrounds/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "Campground deleted successfully");
    res.redirect("/admin/campgrounds");
})

//serve users page
router.get("/users", isAdmin, async (req, res) => {
    const users = await User.find();
    res.render("admin/users", { users });
})

//delete user
router.delete("/users/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    req.flash("success", "User deleted successfully");
    res.redirect("/admin/users");
})

//server admins page
router.get("/admins", isAdmin, async (req, res) => {
    const admins = await Admin.find();
    res.render("admin/admins", { admins });
})

//serve camp approval page
router.get("/campgrounds/pending", isAdmin, async (req, res) => {
    const pendingCampgrounds = await Campground.find({ isVerified: false });
    res.render("admin/pendingCampgrounds", { pendingCampgrounds });
})

//get reviews
router.get("/campgrounds/reviews", isAdmin, async (req, res) => {
    const campgrounds = await Campground.find({ isVerified: true, 'reviews.0': { $exists: true } });
    res.render("admin/campgroundReviews", { campgrounds });
})

//get particular reviews page
router.get("/campgrounds/:id/reviews", isAdmin, async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("author");
    res.render("admin/showReviews", { campground });
})

//delete Reviews
router.delete("/campgrounds/:id/reviews/:reviewId", isAdmin, async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); //pulls out particular review with review id from array of reviews
    await Review.findByIdAndDelete(reviewId);
    // req.flash("success", "Review deleted successfully")
    res.redirect(`/admin/campgrounds/${id}/reviews`);
})

//approve campground from isVerified to true
router.get("/campgrounds/:id/approve", isAdmin, async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    campground.isVerified = true;
    await campground.save();
    req.flash("success", "Campground approved successfully");
    res.redirect("/admin/campgrounds");
})

//detailed show page for pending campgrounds
router.get("/campgrounds/:id/show", isAdmin, async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate("author");
    res.render("admin/show", { campground })
})

//pages not found
router.get("*", isAdmin, (req, res) => {
    res.render("admin/404");
})


// router.post("/admin", (req, res) => {
//     const { name, email, password } = req.body;
//     bcrypt.hash(password, 12);
// })

// router.get("/admin/dashboard", (req, res) => {
//     res.render("admin/dashboard");
// })

module.exports = router;