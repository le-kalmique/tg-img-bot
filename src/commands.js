const bot = require('./init');
let waitingState = null;

bot.command('hello', (ctx) => {
  ctx.reply(`Hello, ${ctx.from.first_name}!`)
})

bot.command('quote', (ctx) => {
  ctx.reply('Пришли сообщение с цитатой');
  waitingState = 'quote';
});

bot.on('message', (ctx) => {
  console.log(waitingState)
  switch (waitingState) {
    case 'quote':
      ctx.reply(`QUOTE from ${ctx.message.forward_from.username}: ${ctx.message.text}`)
  }
});