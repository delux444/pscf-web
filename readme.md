
sudo apt install nodejs npm

git clone ...
cd dir

npx serve .

podglądanie zwracanej wartości w terminalu przez 

node -e "
const http = require('http');
http.createServer((req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    console.log('GOT:', body);
    res.writeHead(200, headers);
    res.end('ok');
  });
}).listen(3333, () => console.log('listening on :3333'));
"
