const fs = require('fs');

const configContent = `const config = {
    GEOCODING_KEY : ${process.env.GEOCODING_KEY},
    MAPS_KEY : ${process.env.MAPS_KEY}
}`;
fs.writeFile('public/config.js', configContent, (err) => {
    if (err) throw new Error;
});