const url = "https://res.cloudinary.com/dsk80td7v/image/upload/v1779871718/hello-pizza/ads/cgkck9w87huv4cl5ps1b.jpg";
fetch(url).then(res => {
  console.log("Status code of Cloudinary URL:", res.status);
}).catch(err => {
  console.error("Fetch error:", err);
});
