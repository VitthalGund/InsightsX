require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Chat = mongoose.models.Chat || mongoose.model('Chat', new mongoose.Schema({}, { strict: false }));
  const chat = await Chat.findById('69ace87f93186baee9fc22b1').lean();
  fs.writeFileSync('inspect-result.json', JSON.stringify(chat, null, 2));
  console.log('Done');
  process.exit(0);
}

check();
