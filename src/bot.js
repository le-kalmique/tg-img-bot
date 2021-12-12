if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const bot = require('./init');
require('./commands');
// require('./events');

bot.launch();

bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Pick one of my commands.'))

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
