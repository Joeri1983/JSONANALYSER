const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON Key Explorer</title>
</head>
<body>
  <h1>Paste the JSON data into the textbox below</h1>
  <textarea id="jsonInput" rows="40" cols="400" placeholder='Enter JSON object or array of objects'></textarea><br>
  <button onclick="compute()">Show connectors</button>

  <h3>Connection Names:</h3>
  <select id="connectionSelect" onchange="showProcesses()">
    <option value="">-- No connections found --</option>
  </select>

  <h3>Related Process Names:</h3>
  <div id="processNames"></div>

  <pre id="output"></pre>

  <script>
    let currentData = null; // Store parsed JSON

    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      const select = document.getElementById('connectionSelect');
      const processDiv = document.getElementById('processNames');
      select.innerHTML = '<option value="">-- No connections found --</option>';
      output.textContent = '';
      processDiv.textContent = '';
      currentData = null;

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

        // Collect unique connectors
        const connectorsSet = new Set();
        obj.ScheduledProcesses.forEach(proc => {
          if (proc.Connectors && Array.isArray(proc.Connectors)) {
            proc.Connectors.forEach(conn => {
              if (conn.connectionName && conn.connectorType) {
                const val = conn.connectionName.trim() + ' ' + conn.connectorType.trim();
                connectorsSet.add(val);
              }
            });
          }
        });

        const connectors = Array.from(connectorsSet).sort((a,b) => a.localeCompare(b));

        if (connectors.length === 0) {
          select.innerHTML = '<option value="">-- No connections found --</option>';
          return;
        }

        select.innerHTML = connectors.map(c => \`<option value="\${c}">\${c}</option>\`).join('');

      } catch (e) {
        output.textContent = 'Invalid JSON: ' + e.message;
      }
    }

    function showProcesses() {
      const select = document.getElementById('connectionSelect');
      const processDiv = document.getElementById('processNames');
      processDiv.textContent = '';

      if (!currentData) return;
      if (!currentData.ScheduledProcesses) return;

      const val = select.value.trim();
      if (!val) return;

      // Split into connectionName and connectorType by last space (to be safe)
      // Because connectorType can have spaces too
      const lastSpaceIndex = val.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        processDiv.textContent = 'Invalid selection.';
        return;
      }

      const connectionName = val.substring(0, lastSpaceIndex);
      const connectorType = val.substring(lastSpaceIndex + 1);

      // Find all ProcessNames with matching connector
      const matchingProcesses = [];

      currentData.ScheduledProcesses.forEach(proc => {
        if (!proc.Connectors || !Array.isArray(proc.Connectors)) return;

        const match = proc.Connectors.some(conn => {
          return (
            conn.connectionName && conn.connectorType &&
            conn.connectionName.trim() === connectionName &&
            conn.connectorType.trim() === connectorType
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

      // Show unique ProcessNames
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
