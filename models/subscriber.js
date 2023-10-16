const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriberSchema = new Schema({
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                // Use a regular expression to validate email format
                // This regular expression checks for a basic email format.
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: "Invalid email format",
        },
    },
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
