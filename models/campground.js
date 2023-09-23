const mongoose = require("mongoose");
const Schema = mongoose.Schema; //shortcut
const Review = require("./review");
// const mongoosePaginate = require("mongoose-paginate-v2"); // Import mongoose-paginate-v2

const ImageSchema = new Schema({
  url: String,
  filename: String
})

ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200"); //this refers to each ImageSchema
})

const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
  title: String,
  images: [ImageSchema],
  geometry: {
    type: { //just saying format is type: Point
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true //these data are on geoJSON format. Map box returns the same format too. So setup our schema in geoJSON format
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  isVerified: {
    type: Boolean,
    default: false
  },
}, opts);

CampgroundSchema.set('timestamps', true);
// CampgroundSchema.plugin(mongoosePaginate);

//data of popup marker on index page map should be inside object properties: {}
CampgroundSchema.virtual("properties.popupMarkup").get(function () {
  return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
            <p>${this.description.substring(0, 50)}...</p>`;
})

// Calculate how the timestamp was added
CampgroundSchema.virtual("timeAgo").get(function () {
  const currentDate = new Date();
  const timeDifference = currentDate - this.createdAt; // Time difference in milliseconds
  const secondsAgo = Math.floor(timeDifference / 1000); // Convert to seconds
  const minutesAgo = Math.floor(secondsAgo / 60); // Convert to minutes
  const hoursAgo = Math.floor(minutesAgo / 60); // Convert to hours
  const daysAgo = Math.floor(hoursAgo / 24); // Convert to days
  const monthsAgo = Math.floor(daysAgo / 30); // Approximate months
  const yearsAgo = Math.floor(monthsAgo / 12); // Approximate years

  if (secondsAgo < 60) {
    return "just now";
  } else if (minutesAgo < 60) {
    return `${minutesAgo} ${minutesAgo === 1 ? "minute" : "minutes"} ago`;
  } else if (hoursAgo < 24) {
    return `${hoursAgo} ${hoursAgo === 1 ? "hour" : "hours"} ago`;
  } else if (daysAgo < 30) {
    return `${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`;
  } else if (monthsAgo < 12) {
    return `${monthsAgo} ${monthsAgo === 1 ? "month" : "months"} ago`;
  } else {
    return `${yearsAgo} ${yearsAgo === 1 ? "year" : "years"} ago`;
  }
});

CampgroundSchema.post('findOneAndDelete', async function (doc) { //'findOneAndDelete' corresponds to how we delete campground
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } })
  }
})

module.exports = mongoose.model("Campground", CampgroundSchema);
