if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn; // Return the connection object
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

module.exports = connectDB;
