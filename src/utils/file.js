const fs = require('fs');
const fetch = require('node-fetch');
const probe = require('probe-image-size');

const getImageWidth = async (url) => {
  const measures = await probe(url);
  return measures.width;
}

const getImageHeight = async (url) => {
  const measures = await probe(url);
  return measures.height;
}

const getFile = (link) => {
  return fs.readFileSync(link);
};

const downloadImage = async (url, image_path) => {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(`./image.jpg`, buffer, () => 
    console.log('finished downloading!'));
};

module.exports = {
  getImageWidth, getImageHeight, getFile, downloadImage
}

