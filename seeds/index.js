if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Campground = require("../models/campground");
const Review = require("../models/review");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");
const dbUrl = process.env.DB_URL;

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("Database connection failed :( " + err);
  });

const sample = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

function getRandomAuthor(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  const item = arr[randomIndex];
  return item;
}

function getRandomDesc(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  const item = arr[randomIndex];
  return item;
}

const authors = ["650ecc610db8191d50b77aba", "650eccd10db8191d50b78c64", "650ecca60db8191d50b78555", "650ead360451915030954810"];
const descriptions = ["Offering mountain views, Caradamam village villas in Munnar offers accommodation, a garden and a terrace. Fitted with a balcony, the units feature a flat-screen TV and a private bathroom with shower. There is a seating and a dining area in all units.",
  "Set in Jaisalmer in the Rajasthan region, with Jaisalmer Fort and Salim Singh Ki Haveli nearby, 1st night desert camping offers accommodation with free private parking.",
  "Featuring a garden, Kura Kura Agonda is located in Canacona, within 36 km of Margao Railway Station and 17 km of Cabo De Rama Fort.",
  "Nature's Nest is set in Molem 10 km from Dudhsagar waterfall entry gate and 13th-century Tambdi Surla Temple respectively. The resort provides an outdoor swimming pool and a restaurant."
];

// ... (other code)

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const seedDB = async () => {
  await Campground.deleteMany({});
  await Review.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 800) + 10;

    // Generate a random date within the last year (in milliseconds)
    const oneYearAgo = Date.now() - 31536000000;
    const randomDate = new Date(oneYearAgo + Math.floor(Math.random() * 31536000000));

    const imageUrls = [
      'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473082/Campscape/tent1_rtihmp.jpg',
      'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473081/Campscape/tent2_a00gj5.jpg',
      'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473081/Campscape/ten3_bmx6hh.jpg',
    ];

    shuffleArray(imageUrls); // Shuffle the image URLs

    const c = new Campground({
      author: getRandomAuthor(authors),
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: "https://source.unsplash.com/collection/483251",
      description: getRandomDesc(descriptions),
      price,
      // date: randomDate, // Remove this line, as 'createdAt' will be handled by Mongoose
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude
        ]
      },
      images: imageUrls.map(url => ({
        url,
        filename: url.split('/').pop(), // Extract filename from URL
      })),
      isVerified: true,
    });

    // Set the 'createdAt' field to the random date
    c.createdAt = randomDate;

    await c.save();
  }
};



// const seedDB = async () => {
//   await Campground.deleteMany({});
//   await Review.deleteMany({});
//   for (let i = 0; i < 300; i++) {
//     const random1000 = Math.floor(Math.random() * 1000);
//     const price = Math.floor(Math.random() * 800) + 10;

//     // Generate a random date within the last year (in milliseconds)
//     const oneYearAgo = Date.now() - 31536000000;
//     const randomDate = new Date(oneYearAgo + Math.floor(Math.random() * 31536000000));

//     const c = new Campground({
//       author: getRandomAuthor(authors),
//       location: `${cities[random1000].city}, ${cities[random1000].state}`,
//       title: `${sample(descriptors)} ${sample(places)}`,
//       image: "https://source.unsplash.com/collection/483251",
//       description: getRandomDesc(descriptions),
//       price,
//       // date: randomDate, // Remove this line, as 'createdAt' will be handled by Mongoose
//       geometry: {
//         type: "Point",
//         coordinates: [
//           cities[random1000].longitude,
//           cities[random1000].latitude
//         ]
//       },
//       images: [
//         {
//           url: 'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473082/Campscape/tent1_rtihmp.jpg',
//           filename: 'Campscape/tent1_rtihmp',
//         },
//         {
//           url: 'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473081/Campscape/tent2_a00gj5.jpg',
//           filename: 'Campscape/tent2_a00gj5',
//         },
//         {
//           url: 'https://res.cloudinary.com/djkeah1gc/image/upload/v1695473081/Campscape/ten3_bmx6hh.jpg',
//           filename: 'Campscape/ten3_bmx6hh',
//         }
//       ],
//       isVerified: true,
//     });

//     // Set the 'createdAt' field to the random date
//     c.createdAt = randomDate;

//     await c.save();
//   }
// };


seedDB().then(() => {
  mongoose.connection.close();
});
