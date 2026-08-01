const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

const server = http.createServer((request, response) => {
  const urlPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^([.]{2}[\/\\])+/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, fileContents) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    response.end(fileContents);
  });
});

server.listen(port, () => {
  console.log(`Serving D:/Assignment SE at http://localhost:${port}`);
});