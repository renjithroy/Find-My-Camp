if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//npm packages
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const MongoDBStore = require("connect-mongo")(session); //using mongo session store instead of memory store

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
const dbUrl = process.env.DB_URL;
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("Database connection failed :( " + err);
  });

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); //to populate req.body from post
app.use(methodOverride("_method")); //to use DELETE, PUT, PATCH
app.use(express.static(path.join(__dirname, "public"))); //serve public directory files
app.use(mongoSanitize());

const store = new MongoDBStore({
  url: "mongodb://localhost:27017/yelp-camp",
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

//ADMIN
// passport.serializeUser(Admin.serializeUser());
// passport.deserializeUser(Admin.deserializeUser());

// passport.serializeUser(function (user, done) {
//   if (user instanceof User) {
//     done(null, user.id);
//   } else if (user instanceof Admin) {
//     done(null, user.id);
//   }
// });

// passport.deserializeUser(function (id, done) {
//   User.findById(id, function (err, user) {
//     if (user) {
//       done(err, user);
//     } else {
//       Admin.findById(id, function (err, user) {
//         done(err, user);
//       });
//     }
//   });
// });



// app.get("/fakeAdmin", async (req, res) => {
//   const admin = new Admin({ email: "admin@gmail.com", username: "admin" });
//   const newAdmin = await Admin.register(admin, "admin");
//   res.send(newAdmin);
// })

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

app.listen(3000);


// To create two separate session variables for user and admin sides, you can use different session names or keys to store the session data

// const express = require('express');
// const session = require('express-session');

// const app = express();

// // Set up session middleware for user side
// const userSessionMiddleware = session({
//   secret: 'user-side-secret',
//   resave: false,
//   saveUninitialized: false,
//   name: 'userSessionID' // set a different name for the user session cookie
// });
// app.use('/user', userSessionMiddleware);

// // Set up session middleware for admin side
// const adminSessionMiddleware = session({
//   secret: 'admin-side-secret',
//   resave: false,
//   saveUninitialized: false,
//   name: 'adminSessionID' // set a different name for the admin session cookie
// });
// app.use('/admin', adminSessionMiddleware);

// // Routes for user side
// app.get('/user', (req, res) => {
//   // Set user session data
//   req.session.user = {
//     name: 'John Doe',
//     email: 'john@example.com'
//   };
//   res.send('User session set');
// });

// app.get('/user/data', (req, res) => {
//   // Get user session data
//   const userSessionData = req.session.user;
//   res.send(userSessionData);
// });

// // Routes for admin side
// app.get('/admin', (req, res) => {
//   // Set admin session data
//   req.session.admin = {
//     name: 'Admin',
//     email: 'admin@example.com'
//   };
//   res.send('Admin session set');
// });

// app.get('/admin/data', (req, res) => {
//   // Get admin session data
//   const adminSessionData = req.session.admin;
//   res.send(adminSessionData);
// });
