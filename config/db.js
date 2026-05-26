const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
       
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        // Fixed the typo from 'processe' to 'process'
        process.exit(1);
    }
}

module.exports = dbConnect;