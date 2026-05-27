const http = require('https');

const url = "https://res.cloudinary.com/dsk80td7v/image/upload/v1779873314/hello-pizza/ads/khu5ggetgeiff02ekfxr.jpg";

http.get(url, (res) => {
  console.log(`${url} -> Status Code: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`Error checking ${url}:`, e);
});
