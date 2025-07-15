const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON Key Explorer</title>
  <style>
    #dropdownList {
      border: 1px solid #ccc;
      max-height: 150px;
      overflow-y: auto;
      position: absolute;
      background: white;
      width: 300px;
      display: none;
      margin-top: 0;
      padding-left: 0;
      list-style: none;
      z-index: 1000;
    }
    #dropdownList li {
      padding: 5px 10px;
      cursor: pointer;
    }
    #dropdownList li:hover {
      background-color: #eee;
    }
    #connectionInput {
      width: 300px;
      padding: 5px;
      box-sizing: border-box;
    }
    .container {
      position: relative;
      width: 300px;
    }
  </style>
</head>
<body>
  <h1>JSON Key Explorer</h1>
  <textarea id="jsonInput" rows="14" cols="70" placeholder='Enter JSON object or array of objects'></textarea><br>
  <button onclick="compute()">Show connectors</button>

  <h3>Connection Names:</h3>
  <div class="container">
    <input type="text" id="connectionInput" placeholder="Type to search connection names" autocomplete="off" />
    <ul id="dropdownList"></ul>
  </div>

  <h3>Related Process Names:</h3>
  <div id="processNames"></div>

  <pre id="output"></pre>

  <script>
    let currentData = null;
    let connectionNames = []; // unique connection names

    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      const processDiv = document.getElementById('processNames');
      const dropdownList = document.getElementById('dropdownList');
      const connectionInput = document.getElementById('connectionInput');

      output.textContent = '';
      processDiv.textContent = '';
      dropdownList.style.display = 'none';
      connectionInput.value = '';
      currentData = null;
      connectionNames = [];

      try {
        const data = JSON.parse(input);
        let obj = null;

        if (Array.isArray(data)) {
          obj = data[0];
        } else if (typeof data === 'object' && data !== null) {
          obj = data;
        } else {
          output.textContent = 'Please enter a valid JSON object or array of objects.';
          return;
        }
        currentData = obj;

        if (!obj.ScheduledProcesses || !Array.isArray(obj.ScheduledProcesses)) {
          output.textContent = 'JSON missing ScheduledProcesses array.';
          return;
        }

        // Collect unique connectionNames
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

        connectionNames = Array.from(namesSet).sort((a,b) => a.localeCompare(b));
        if(connectionNames.length === 0) {
          output.textContent = 'No connection names found.';
        }
      } catch (e) {
        output.textContent = 'Invalid JSON: ' + e.message;
      }
    }

    const connectionInput = document.getElementById('connectionInput');
    const dropdownList = document.getElementById('dropdownList');
    const processDiv = document.getElementById('processNames');

    // Show filtered dropdown when typing
    connectionInput.addEventListener('input', () => {
      const val = connectionInput.value.trim().toLowerCase();
      processDiv.textContent = '';
      if (!val) {
        dropdownList.style.display = 'none';
        return;
      }
      const filtered = connectionNames.filter(name => name.toLowerCase().includes(val));
      if (filtered.length === 0) {
        dropdownList.style.display = 'none';
        return;
      }
      dropdownList.innerHTML = filtered.map(name => '<li>' + name + '</li>').join('');
      dropdownList.style.display = 'block';
    });

    // Click on dropdown item to select it
    dropdownList.addEventListener('click', e => {
      if (e.target.tagName.toLowerCase() === 'li') {
        connectionInput.value = e.target.textContent;
        dropdownList.style.display = 'none';
        showProcesses();
      }
    });

    // Hide dropdown if click outside
    document.addEventListener('click', e => {
      if (!connectionInput.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.style.display = 'none';
      }
    });

    // Show processes when input loses focus but only if exact match
    connectionInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (connectionNames.includes(connectionInput.value.trim())) {
          showProcesses();
        } else {
          processDiv.textContent = '';
        }
        dropdownList.style.display = 'none';
      }, 150);
    });

    function showProcesses() {
      processDiv.textContent = '';
      if (!currentData) return;

      const selectedName = connectionInput.value.trim();
      if (!selectedName) return;

      if (!currentData.ScheduledProcesses || !Array.isArray(currentData.ScheduledProcesses)) return;

      const matchingProcesses = [];

      currentData.ScheduledProcesses.forEach(proc => {
        if (!proc.Connectors || !Array.isArray(proc.Connectors)) return;

        const match = proc.Connectors.some(conn => {
          return (
            conn.connectionName &&
            conn.connectionName.trim() === selectedName
          );
        });

        if (match) {
          matchingProcesses.push(proc.ProcessName || '(no ProcessName)');
        }
      });

      if (matchingProcesses.length === 0) {
        processDiv.textContent = 'No ProcessName found for selected connector.';
        return;
      }

      const uniqueProcesses = [...new Set(matchingProcesses)];
      processDiv.innerHTML = '<ul>' + uniqueProcesses.map(p => '<li>' + p + '</li>').join('') + '</ul>';
    }
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
