require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Chat = mongoose.models.Chat || mongoose.model('Chat', new mongoose.Schema({}, { strict: false }));
  const chats = await Chat.find({}).sort({ updatedAt: -1 }).limit(2).lean();
  fs.writeFileSync('db-out.json', JSON.stringify(chats, null, 2), 'utf8');
  console.log('done');
  process.exit(0);
}

check();
