const http = require('http');
const path = require('path');
const fs = require('fs');
const { EDESTADDRREQ } = require('constants');
const { createInflate } = require('zlib');

const server = http.createServer((req, res) => {

    let filePath = path.join(__dirname, 'public', path.extname(req.url) != '' ? req.url : 'index.html');
    let extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case ".js":
        contentType = "text/javascript";
        break;
        case ".css":
        contentType = "text/css";
        break;
        case ".json":
        contentType = "application/json";
        break;
        case ".png":
        contentType = "image/png";
        break;
        case ".jpg":
        contentType = "image/jpg";
        break;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code == "ENOENT") {
                // Page not found
                fs.readFile(path.join(__dirname, 'public', '404.html'), (err, data) => {
                    res.writeHead(404, { "Content-Type": "text/html"});
                    res.end(data, 'utf8');
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data, "utf8");
        }
    })
})

const PORT = process.env.PORT || 5000; // set port as the environment variable (whatever port host decides on), or 5000 by default

server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); })