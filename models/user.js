const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const Campground = require("./campground");
const Review = require("./review");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

UserSchema.plugin(passportLocalMongoose)
//this will add field for username, password
//make sure usernames are unique etc..
//gives us some methods

//when a user is deleted, delete all campgrounds and reviews associated with him
UserSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        const campgrounds = await Campground.find({ author: { $in: doc } });
        for (let campground of campgrounds) {
            //campgrounds is an array of campgrounds matching author id
            await Review.deleteMany({ _id: { $in: campground.reviews } }); //find reviews of that one campground from array of campgrounds
        }
        await Campground.deleteMany({ author: { $in: doc } }); //find campgrounds of that user/author
    }
})

module.exports = mongoose.model("User", UserSchema);