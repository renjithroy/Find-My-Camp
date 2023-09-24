if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//npm packages
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require('./db'); // Import the connectDB function from db.js
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const MongoDBStore = require("connect-mongo")(session); //using mongo session store instead of memory store

const app = express();
const port = process.env.PORT || 3000;

(async () => {
  try {
    // Connect to the database
    const dbConnection = await connectDB();

    // Start the Express server after successful database connection
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
  }
})();

// models||tables
const User = require("./models/user");
const Admin = require("./models/admin");

const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");

//routes
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const mongoSanitize = require("express-mongo-sanitize");
//sudo lsof -i :3000
//kill -9 <PID>
mongoose.set('strictQuery', true);

// mongodb://localhost:27017/yelp-camp
// const dbUrl = process.env.DB_URL;
// mongoose
//   .connect(dbUrl)
//   .then(() => {
//     console.log("Database connected");
//   })
//   .catch((err) => {
//     console.log("Database connection failed :( " + err);
//   });

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); //to populate req.body from post
app.use(methodOverride("_method")); //to use DELETE, PUT, PATCH
app.use(express.static(path.join(__dirname, "public"))); //serve public directory files
app.use(mongoSanitize());

//mongodb://localhost:27017/yelp-camp
const store = new MongoDBStore({
  url: process.env.DB_URL,
  secret: "thisshouldbeabettersecret!",
  touchAfter: 24 * 60 * 60
})
store.on("error", function (e) {
  console.log("SESSION STORE ERROR: ", e);
})

//settings for session
const sessionConfig = {
  store,
  name: 'session',
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, //security
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(flash());

//required for passport
app.use(passport.initialize());
app.use(passport.session());

//added from passport local mongoose

//USER
passport.use('local', new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); //how we store user in session
passport.deserializeUser(User.deserializeUser()); //how we get that user out of the session

app.use((req, res, next) => {
  res.locals.currentUser = req.user; //on login/register req.user will contain user details
  res.locals.success = req.flash("success"); //we'll have access to locals.variable in our templates
  res.locals.error = req.flash("error");
  next();
})

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.render("campgrounds/home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});
//from try catch/throw new Error to ExpressError file to below code
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh Snap, Something went wrong"; //if theres err message, then set a default one
  res.status(statusCode).render("error", { err });
});

// app.listen(3000);