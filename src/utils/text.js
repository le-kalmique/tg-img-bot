const wrapText = require("wrap-text");
const pixelWidth = require('string-pixel-width');

const checkTextWidth = (text, fontSize) => {
  return pixelWidth(text, { size: fontSize });
};

const getFontSize = (text, imgWidth, minFont, maxFont = 64) => {
  let font = maxFont;
  let width = checkTextWidth(text, font);
  while (width > imgWidth / 100 * 95) {
    if (font < minFont) {
      break;
    }
    font -= 2;
    width = checkTextWidth(text, font);
  }
  return font;
}

const getLongestPhrase = (phrases) => {
  let longestPhrase = '';
  let charsNum = 0;
  phrases.forEach((phrase) => {
    if (phrase.length > charsNum) {
      charsNum = phrase.length;
      longestPhrase = phrase;
    }
  });
  return longestPhrase;
};

const breakText = (text, width, fontSize, xSpan) => {
  let newText = text;
  let wrapSize = 1.1;
  while (checkTextWidth(getLongestPhrase(newText.split('\n')), fontSize) > width) {
    wrapSize += 0.05;
    newText = wrapText(text, text.length / wrapSize);
    if (newText === text) {
      newText = text.slice(0, text.length / 2) + '\n' + text.slice(text.length / 2);
    }
  }
  return newText.split('\n').map(item => `<tspan x="${xSpan}%" dy="1.2em">${item}</tspan>`).join("\n");
}

module.exports = {
  checkTextWidth, getFontSize, getLongestPhrase, breakText
};