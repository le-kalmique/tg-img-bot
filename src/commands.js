const sharp = require("sharp");
const { getImageWidth, getImageHeight, getFile, downloadImage } = require("./utils/file");
const { checkTextWidth, getFontSize, breakText } = require('./utils/text');
const bot = require('./init');


const waitingState = new Map();

bot.command('hello', (ctx) => {
  ctx.reply(`Hello, ${ctx.from.first_name}!`)
})

bot.command('quote', (ctx) => {
  ctx.reply('Send a message with quote (maximum length: 300chars)');
  waitingState.set(ctx.from.id, 'quote');
});

bot.command('generate', (ctx) => {
  ctx.reply('Send an image with caption');
  waitingState.set(ctx.from.id, 'generate');
});

bot.command('generate_meme', (ctx) => {
  ctx.reply('Send an image with caption');
  waitingState.set(ctx.from.id, 'generateMeme');
});

bot.command('generate_sticker', (ctx) => {
  ctx.reply('Send an image with caption');
  waitingState.set(ctx.from.id, 'generateSticker');
})

bot.on('message', (ctx) => {
  const achievementRegEx = /\/achievement (?<text>.+)/gm;
  if (ctx.message.text && ctx.message.text.match(achievementRegEx)) {
    const achievementTxt = achievementRegEx.exec(ctx.message.text)?.groups.text;
    if (achievementTxt.length > 40) {
      ctx.reply('Achievement title should be 40 characters or less.');
      return;
    }
    generateAchievement(achievementTxt).then((imgBuffer) => {
      ctx.replyWithSticker({
        source: imgBuffer
      });
    });
    waitingState.set(ctx.from.id, 'none');
  }

  const userWaitingState  = waitingState.get(ctx.from.id);
  switch (userWaitingState) {
    case 'quote':
      if (!ctx.message || !ctx.message.text) {
        ctx.reply('Please, provide a message with text.');
        break;
      } else if (ctx.message.text.length > 300) {
        ctx.reply('Maximum message length is 300 characters.');
        break;
      }
      generateQuote(ctx).then(imgBuffer => {
        ctx.replyWithPhoto({
          source: imgBuffer
        });
      });
      waitingState.set(ctx.from.id, 'waiting');
      break;
    case 'generate':
      if (!checkMsgForGeneration(ctx)) break;
      const img = ctx.message.photo.pop().file_id;
      generateImageWithText(ctx, img, ctx.message.caption).then(res => {
        ctx.replyWithPhoto({ source: res });
      })
      waitingState.set(ctx.from.id, 'waiting');
      break;

    case 'generateMeme':
      if (!checkMsgForGeneration(ctx)) break;
      const meme = ctx.message.photo.pop().file_id;
      generateImageWithText(ctx, meme, ctx.message.caption, true).then(res => {
        ctx.replyWithPhoto({ source: res });
      })
      waitingState.set(ctx.from.id, 'waiting');
      break;

    case 'generateSticker':
      if (!checkMsgForGeneration(ctx)) break;
      const sticker = ctx.message.photo.pop().file_id;
      generateImageWithText(ctx, sticker, ctx.message.caption).then(res => {
        ctx.replyWithSticker({ source: res });
      })
      waitingState.set(ctx.from.id, 'waiting');
      break;

    case 'waiting':
      ctx.reply('Pick a command');
      break;
  }
});

const checkMsgForGeneration = (ctx) => {
  if (!ctx.message.photo) {
    ctx.reply('Please, provide an image with caption.');
    return false;
  } else if (!ctx.message.caption) {
    ctx.reply('Please, provide a caption.');
    return false;
  } else if (ctx.message.caption > 100) {
    ctx.reply('The caption should be 100 characters or less.');
    return false;
  }
  return true;
};

const generateImageWithText = async (ctx, imgId, text, fun = false) => {
  const fileLink = await ctx.telegram.getFileLink(imgId);
  const imageWidth = await getImageWidth(fileLink.href);
  const imageHeight = await getImageHeight(fileLink.href);

  await downloadImage(fileLink.href, "image.jpg");
  const imageBuffer = getFile("image.jpg");


  let imgText = text;
  const fontSize = getFontSize(imgText, imageWidth, imageWidth / 100 * 6, 120); 
  if (checkTextWidth(imgText, fontSize) > imageWidth) {
    imgText = breakText(text, imageWidth, fontSize, 50);
  }

  const fontFamily = fun ? 'Comic Sans MS, Comic Sans, cursive' : 'Arial, sans-serif';
  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}">
      <style>
        .text { fill: white; font-size: ${fontSize-4}px; 
                font-family: ${fontFamily};
                font-weight: bold;
                paint-order: stroke; 
                stroke: #000000; stroke-width: 1px; 
              }
      </style>
      <filter id="dropshadow" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> <!-- stdDeviation is how much to blur -->
        <feOffset dx="6" dy="6" result="offsetblur"/> <!-- how much to offset -->
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.7"/> <!-- slope is the opacity of the shadow -->
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/> <!-- this contains the offset blurred image -->
          <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
        </feMerge>
      </filter>
      <text x="50%" y="${fontSize / 1.5}" text-anchor="middle" dominant-baseline="hanging" class="text" style="filter:url(#dropshadow)">${imgText}</text>
    </svg>  
    `;
  const svgBuffer = Buffer.from(svg);
  try {
    return await sharp(imageBuffer)
        .composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0
          },
        ])
        .toBuffer();
  } catch (e) {
    console.error(e);
  }
  return '';
}

/** @deprecated generateImageWithTextAPI */
const generateImageWithTextAPI = async (ctx, imgId, text) => {
  const fileLink = await ctx.telegram.getFileLink(imgId);
  const imageWidth = await getImageWidth(fileLink.href);

  let fontSize = 64;
  let textWidth = checkTextWidth(text, fontSize);
  while (textWidth > imageWidth / 100 * 90) {
    if (fontSize <= 32) {
      break;
    } else {
      fontSize /= 2;
    }
    textWidth = checkTextWidth(text, fontSize);
  }

  return `https://textoverimage.moesif.com/image?image_url=${fileLink.href}&text=${text}&y_align=bottom&x_align=center&margin=15&text_size=${fontSize}`;
}

const generateQuote = async (ctx) => {
  let quote = ctx.message.text;
  let quoteFrom = ctx.message.from.username;
  if (ctx.message.forward_from) {
    quoteFrom = ctx.message.forward_from.username || ctx.message.forward_from.first_name;
  }

  const imgLink = 'src/assets/quote.jpg';
  const quoteImage = getFile(imgLink);

  const fontSize = getFontSize(quote, 512, 40); 
  if (checkTextWidth(quote, fontSize) > 512) {
    quote = breakText(quote, 512, fontSize, 40);
  }

  const svg = `
    <svg width="${1024}" height="${586}">
      <style>
      .title { fill: #001; font-size: ${fontSize-5}px;  }
      .name { fill: #002; font-size: 32px; font-family: Impact, fantasy; }
      </style>
      <text x="40%" y="25%" text-anchor="start" class="title">${quote}</text>
      <text x="80%" y="90%" text-anchor="middle" class="name">(c) ${quoteFrom}</text>
    </svg>  
    `;
  const svgBuffer = Buffer.from(svg);

  try {
    return await sharp(quoteImage)
        .composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0
          },
        ])
        .toBuffer();
  } catch (e) {
    console.error(e);
  }

  return quoteImage;
}

const generateAchievement = async (text) => {
  const imgLink = 'src/assets/achievement.png';
  const achievementImage = getFile(imgLink);

  const fontSize = getFontSize(text, 750, 30); 
  if (checkTextWidth(text, fontSize) > 750) {
    text = breakText(text, 750, fontSize, 55);
  }

  const svg = `
    <svg width="${1024}" height="${422}">
      <style>
      .title { fill: #fff; font-size: ${fontSize}; }
      </style>
      <text x="56%" y="62%" text-anchor="middle" class="title">${text}</text>
    </svg>  
    `;
  const svgBuffer = Buffer.from(svg);

  try {
    return await sharp(achievementImage)
        .composite([
          {
            input: svgBuffer,
            top: 0,
            left: 0
          },
        ])
        .toBuffer();
  } catch (e) {
    console.error(e);
  }

  return achievementImage;
}

