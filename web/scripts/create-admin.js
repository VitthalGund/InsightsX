const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error("No .env file found in the current directory.");
    process.exit(1);
}

const url = process.env.MONGO_URI;
if (!url) {
    console.error("MONGO_URI is missing from the .env file.");
    process.exit(1);
}

// Minimal User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isApproved: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node scripts/create-admin.js <email> <password>");
        process.exit(1);
    }

    const [email, plainPassword] = args;

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(url);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.role === 'admin') {
                console.log(`User ${email} already exists and is an admin.`);
            } else {
                existingUser.role = 'admin';
                existingUser.isApproved = true;
                await existingUser.save();
                console.log(`User ${email} existed and has been promoted to Admin and approved.`);
            }
        } else {
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            await User.create({
                email,
                password: hashedPassword,
                role: 'admin',
                isApproved: true
            });
            console.log(`Successfully created new Admin user: ${email}`);
        }

    } catch (error) {
        console.error("Error creating admin:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
