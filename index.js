const http = require('http');
const fetch = require('node-fetch');
const { URL } = require('url');

const PORT = 3000;

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Boomi - Connection/Process relations</title>
  <style>
    #connectionSection, #processSection {
      display: none;
    }
    .input-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }
    .input-grid input {
      padding: 4px;
      width: 250px;
    }
  </style>
</head>
<body>
  <h1>Insert JSON data</h1>

  <div style="display: flex; align-items: flex-start; gap: 20px;">
    <textarea id="jsonInput" rows="30" cols="100" placeholder='Enter JSON object or array of objects'></textarea>

    <div>
      <div class="input-grid">
        <input type="text" id="accountID" placeholder="Account ID" />
        <input type="text" id="envID" placeholder="Environment ID" />
        <input type="text" id="atomID" placeholder="Atom ID" />
        <input type="password" id="authToken" placeholder="Auth Password" />
        <button onclick="retrieveData()">Retrieve Data</button>
      </div>
    </div>
  </div>

  <br>
  <button onclick="compute()">Show connectors</button>

  <div id="connectionSection">
    <h3>Connection Names:</h3>
    <select id="connectionSelect" onchange="showProcesses()">
      <option value="">&lt;select a connection&gt;</option>
    </select>
  </div>

  <div id="processSection">
    <h3>Related Process Names:</h3>
    <div id="processNames"></div>
  </div>

  <pre id="output"></pre>

  <script>
    let currentData = null;
    let connectionNames = [];

    async function retrieveData() {
      const accountID = document.getElementById('accountID').value.trim();
      const envID = document.getElementById('envID').value.trim();
      const atomID = document.getElementById('atomID').value.trim();
      const password = document.getElementById('authToken').value.trim();
      const output = document.getElementById('output');
      const jsonInput = document.getElementById('jsonInput');

      output.textContent = '';

      if (!accountID || !envID || !atomID || !password) {
        output.textContent = 'All input fields must be filled.';
        return;
      }

      try {
        const response = await fetch('/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accountID, envID, atomID, password })
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        jsonInput.value = JSON.stringify(data, null, 2);
        output.textContent = 'Data retrieved successfully. Click "Show connectors" to continue.';
      } catch (err) {
        output.textContent = 'Error retrieving data: ' + err.message;
      }
    }

    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      const select = document.getElementById('connectionSelect');
      const processDiv = document.getElementById('processNames');
      const connectionSection = document.getElementById('connectionSection');
      const processSection = document.getElementById('processSection');

      output.textContent = '';
      processDiv.textContent = '';
      currentData = null;
      connectionNames = [];

      connectionSection.style.display = 'none';
      processSection.style.display = 'none';

      try {
        const data = JSON.parse(input);
        let obj = Array.isArray(data) ? data[0] : data;

        if (!obj || typeof obj !== 'object') {
          output.textContent = 'Please enter a valid JSON object or array of objects.';
          return;
        }

        currentData = obj;

        if (!obj.ScheduledProcesses || !Array.isArray(obj.ScheduledProcesses)) {
          output.textContent = 'JSON missing ScheduledProcesses array.';
          return;
        }

        const namesSet = new Set();
        obj.ScheduledProcesses.forEach(proc => {
          if (proc.Connectors && Array.isArray(proc.Connectors)) {
            proc.Connectors.forEach(conn => {
              if (conn.connectionName && typeof conn.connectionName === 'string') {
                namesSet.add(conn.connectionName.trim());
              }
            });
          }
        });

        connectionNames = Array.from(namesSet).sort((a, b) => a.localeCompare(b));

        if (connectionNames.length === 0) {
          output.textContent = 'No connection names found.';
          return;
        }

        select.innerHTML = '<option value="">&lt;select a connection&gt;</option>' +
          connectionNames.map((name, index) => \`<option value="\${name}">\${index + 1}. \${name}</option>\`).join('');

        connectionSection.style.display = 'block';
        processSection.style.display = 'none';
      } catch (e) {
        output.textContent = 'Invalid JSON: ' + e.message;
      }
    }

    function showProcesses() {
      const select = document.getElementById('connectionSelect');
      const processDiv = document.getElementById('processNames');
      const processSection = document.getElementById('processSection');
      processDiv.textContent = '';

      if (!currentData) return;

      const selectedName = select.value.trim();
      if (!selectedName) {
        processSection.style.display = 'none';
        return;
      }

      if (!currentData.ScheduledProcesses || !Array.isArray(currentData.ScheduledProcesses)) return;

      const matchingProcesses = [];

      currentData.ScheduledProcesses.forEach(proc => {
        if (!proc.Connectors || !Array.isArray(proc.Connectors)) return;

        const match = proc.Connectors.some(conn => {
          return conn.connectionName && conn.connectionName.trim() === selectedName;
        });

        if (match) {
          matchingProcesses.push(proc.ProcessName || '(no ProcessName)');
        }
      });

      if (matchingProcesses.length === 0) {
        processDiv.textContent = 'No ProcessName found for selected connector.';
        processSection.style.display = 'block';
        return;
      }

      const uniqueProcesses = [...new Set(matchingProcesses)];
      processDiv.innerHTML = '<ol>' + uniqueProcesses.map(p => '<li>' + p + '</li>').join('') + '</ol>';
      processSection.style.display = 'block';
    }
  </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.method === 'POST' && req.url === '/proxy') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { accountID, envID, atomID, password } = JSON.parse(body);
        const username = 'dataconbv-LXAOAC.TJMXZJ';
        const auth = Buffer.from(username + ':' + password).toString('base64');

        const boomiRes = await fetch('https://c01-deu.integrate.boomi.com/ws/rest/processes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + auth
          },
          body: JSON.stringify({ accountID, envID, atomID }),
          timeout: 75000 // wait up to 75 seconds
        });

        if (!boomiRes.ok) {
          res.writeHead(boomiRes.status, { 'Content-Type': 'text/plain' });
          const errText = await boomiRes.text();
          return res.end('Boomi API error: ' + errText);
        }

        const data = await boomiRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error: ' + err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
