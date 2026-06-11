# pscf-web

Web panel for configuring and sending industrial protocol strings (Modbus TCP, Protocol X) to a backend server via HTTP POST.

---

## Run locally

**Required:**
```bash
sudo apt install nodejs npm
```

```bash
git clone https://github.com/delux444/pscf-web.git
cd pscf-web
npx serve .
```

Open `http://localhost:3000` in your browser.

---

## Test without a real backend

To inspect outgoing packets in the terminal, run a mock HTTP server on port 3333:

```bash
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
```

Every time you hit **Send**, the panel logs the result and the terminal prints:
```
GOT: {"data":"modbustcp:ip:192.168.1.100:port:502:unit:1:fc:03:address:0:quantity:1:datatype:float:value:0"}
```

---

## Protocol string format

```
modbustcp:ip:<ip>:port:<port>:unit:<unit>:fc:<fc>:address:<addr>:quantity:<qty>:datatype:<type>:value:<val>
protocolx:endpoint:<ep>:command:<cmd>:payload:<payload>
```

Strings are sent as JSON to `http://localhost:3333/send`:
```json
{ "data": "<protocol string>" }
```
