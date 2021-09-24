if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('hello', (ctx) => {
  ctx.reply(`Hello, ${ctx.from.first_name}`)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))