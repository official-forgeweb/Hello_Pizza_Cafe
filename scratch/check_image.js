const http = require('https');

const urls = [
  "https://res.cloudinary.com/dsk80td7v/image/upload/v1777089593/hello-pizza/menu/chocolate-brownie-shake.jpg"
];

urls.forEach(url => {
  http.get(url, (res) => {
    console.log(`${url} -> Status Code: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Error checking ${url}:`, e);
  });
});
