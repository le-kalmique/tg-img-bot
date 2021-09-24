if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const bot = require('./init');
require('./commands');

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
