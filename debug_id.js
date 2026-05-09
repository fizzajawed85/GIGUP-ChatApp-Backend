const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        const user = await User.findOne({ username: 'angel-fizza' });
        if (user) {
            console.log("Found User:", {
                id: user._id,
                username: user.username,
                isOnline: user.isOnline
            });
        } else {
            console.log("User 'fizza-jawed' not found.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

checkUser();
