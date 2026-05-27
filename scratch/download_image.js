const http = require('https');
const fs = require('fs');
const path = require('path');

const url = "https://res.cloudinary.com/dsk80td7v/image/upload/v1779873314/hello-pizza/ads/khu5ggetgeiff02ekfxr.jpg";
const dest = path.join(__dirname, 'test_image.jpg');

const file = fs.createWriteStream(dest);
http.get(url, (res) => {
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    const stats = fs.statSync(dest);
    console.log(`Download finished!`);
    console.log(`File size: ${stats.size} bytes`);
    console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
  });
}).on('error', (e) => {
  fs.unlink(dest, () => {});
  console.error(`Error downloading:`, e);
});
