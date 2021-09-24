const bot = require('./init');

bot.command('hello', (ctx) => {
  ctx.reply(`Hello, ${ctx.from.first_name}`)
})
