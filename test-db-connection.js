const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

console.log("Testing connection to:", uri.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose.connect(uri)
  .then(() => {
    console.log("✅ SUCCESS: Connected to MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ ERROR: Connection failed.");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.error("Hostname:", err.hostname);
    process.exit(1);
  });
