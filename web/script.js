/* -- config -- */

const SERVER_URL = 'http://localhost:3333/send';

/* -- helpers -- */

function togglePanel(id) {
  document.getElementById(id).classList.toggle('open');
}

function now() {
  return new Date().toTimeString().slice(0, 8);
}

function logEntry(logId, str, isError = false) {
  const box = document.getElementById(logId);
  box.style.display = 'block';
  const el = document.createElement('div');
  el.className = 'log-entry';
  el.innerHTML =
    `<span class="ts">${now()}</span>` +
    (isError
      ? `<span class="err">✗</span><span class="str-err">${str}</span>`
      : `<span class="ok">✓</span><span class="str">${str}</span>`);
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

/**
 * POST the protocol string to the server.
 * Body: { "data": "modbustcp:ip:...:port:..." }
 * Logs success or error into the panel's log box.
 */
async function sendToServer(protocolString, logId) {
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: protocolString })
    });
    if (!res.ok) {
      logEntry(logId, `HTTP ${res.status} – ${res.statusText}`, true);
    } else {
      logEntry(logId, protocolString);
    }
  } catch (err) {
    logEntry(logId, `Connection error: ${err.message}`, true);
  }
}

function flashPanel(panelId) {
  const f = document.getElementById(panelId.replace('-panel', '-flash'));
  if (!f) return;
  f.style.animation = 'none';
  void f.offsetWidth;
  f.style.animation = 'flash 0.55s ease-out forwards';
}

/**
 * Animates the progress bar for a single-shot send.
 * @param {string} panelId
 * @param {string} progWrapId
 * @param {string} progId
 * @param {string} dotId
 * @param {string} badgeId
 * @param {Function} buildFn   – returns the protocol string
 * @param {string} logId
 */
function singleShot(panelId, progWrapId, progId, dotId, badgeId, buildFn, logId) {
  const dot   = document.getElementById(dotId);
  const badge = document.getElementById(badgeId);
  const wrap  = document.getElementById(progWrapId);
  const bar   = document.getElementById(progId);

  wrap.style.display = 'block';
  bar.style.width = '0%';
  dot.className = 'dot active';
  badge.textContent = 'sending';
  badge.classList.add('active');

  flashPanel(panelId);
  sendToServer(buildFn(), logId);

  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 30 + 15;
    if (p >= 100) {
      p = 100;
      clearInterval(iv);
      setTimeout(() => {
        wrap.style.display = 'none';
        bar.style.width = '0%';
        dot.className = 'dot';
        badge.textContent = 'sent';
        setTimeout(() => {
          badge.textContent = 'idle';
          badge.classList.remove('active');
        }, 2000);
      }, 200);
    }
    bar.style.width = p + '%';
  }, 60);
}

/* ---------------------------------------
   STRING BUILDERS
   Format: protocol:key:val:key:val:...
------------------------------------------*/

function buildModbusString() {
  const ip    = document.getElementById('mb-ip').value    || '192.168.1.100';
  const port  = document.getElementById('mb-port').value;
  const unit  = document.getElementById('mb-unit').value;
  const fc    = document.getElementById('mb-fc').value;
  const addr  = document.getElementById('mb-addr').value;
  const qty   = document.getElementById('mb-qty').value;
  const dtype = document.getElementById('mb-dtype').value;
  const val   = document.getElementById('mb-val').value   || '0';
  return `modbustcp:ip:${ip}:port:${port}:unit:${unit}:fc:${fc}:address:${addr}:quantity:${qty}:datatype:${dtype}:value:${val}`;
}

function buildProtoxString() {
  const ep  = document.getElementById('px-endpoint').value || 'none';
  const cmd = document.getElementById('px-cmd').value      || 'NOP';
  const pay = document.getElementById('px-payload').value;
  return `protocolx:endpoint:${ep}:command:${cmd}${pay ? ':payload:' + pay : ''}`;
}

/* ---------------------------------------
   MODBUS TCP
------------------------------------------ */

let mbLoopIv = null;
let mbCount  = 0;

function modbusAction() {
  const mode = document.getElementById('mb-mode').value;

  if (mode === 'loop') {
    if (mbLoopIv) return;                      // already running
    const ms = parseInt(document.getElementById('mb-interval').value) || 1000;

    document.getElementById('mb-stop-btn').style.display = '';
    document.getElementById('mb-send-btn').style.display = 'none';
    document.getElementById('mb-loop-ind').style.display = 'flex';
    document.getElementById('modbus-badge').textContent = 'looping';
    document.getElementById('modbus-badge').classList.add('active');
    document.getElementById('modbus-dot').className = 'dot active pulse';
    document.getElementById('mb-log').style.display = 'block';

    const fire = () => {
      mbCount++;
      document.getElementById('mb-count').textContent = mbCount;
      flashPanel('modbus-panel');
      sendToServer(buildModbusString(), 'mb-log');
    };

    fire();
    mbLoopIv = setInterval(fire, ms);

  } else {
    singleShot(
      'modbus-panel', 'mb-prog-wrap', 'mb-prog',
      'modbus-dot', 'modbus-badge', buildModbusString, 'mb-log'
    );
  }
}

function modbusStop() {
  clearInterval(mbLoopIv);
  mbLoopIv = null;
  mbCount  = 0;

  document.getElementById('mb-stop-btn').style.display = 'none';
  document.getElementById('mb-send-btn').style.display = '';
  document.getElementById('mb-loop-ind').style.display = 'none';
  document.getElementById('mb-count').textContent = '0';
  document.getElementById('modbus-badge').textContent = 'idle';
  document.getElementById('modbus-badge').classList.remove('active');
  document.getElementById('modbus-dot').className = 'dot';
}

/* ---------------------------------------
   PROTOCOL X
------------------------------------------ */

let pxLoopIv = null;
let pxCount  = 0;

function protoxAction() {
  const mode = document.getElementById('px-mode').value;

  if (mode === 'loop') {
    if (pxLoopIv) return;
    const ms = parseInt(document.getElementById('px-interval').value) || 2000;

    document.getElementById('px-stop-btn').style.display = '';
    document.getElementById('px-send-btn').style.display = 'none';
    document.getElementById('px-loop-ind').style.display = 'flex';
    document.getElementById('px-badge').textContent = 'looping';
    document.getElementById('px-badge').classList.add('active');
    document.getElementById('px-dot').className = 'dot active pulse';
    document.getElementById('px-log').style.display = 'block';

    const fire = () => {
      pxCount++;
      document.getElementById('px-count').textContent = pxCount;
      flashPanel('protox-panel');
      sendToServer(buildProtoxString(), 'px-log');
    };

    fire();
    pxLoopIv = setInterval(fire, ms);

  } else {
    singleShot(
      'protox-panel', 'px-prog-wrap', 'px-prog',
      'px-dot', 'px-badge', buildProtoxString, 'px-log'
    );
  }
}

function protoxStop() {
  clearInterval(pxLoopIv);
  pxLoopIv = null;
  pxCount  = 0;

  document.getElementById('px-stop-btn').style.display = 'none';
  document.getElementById('px-send-btn').style.display = '';
  document.getElementById('px-loop-ind').style.display = 'none';
  document.getElementById('px-count').textContent = '0';
  document.getElementById('px-badge').textContent = 'idle';
  document.getElementById('px-badge').classList.remove('active');
  document.getElementById('px-dot').className = 'dot';
}