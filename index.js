const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON Key Explorer</title>
</head>
<body>
  <h1>JSON Key Explorer</h1>
  <textarea id="jsonInput" rows="14" cols="70" placeholder='Enter JSON object or array of objects'></textarea><br>
  <button onclick="compute()">Show connectors</button>

  <h3>Connection Names:</h3>
  <select id="connectionSelect">
    <option value="">-- No connections found --</option>
  </select>

  <pre id="output"></pre>

  <script>
    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      const select = document.getElementById('connectionSelect');
      select.innerHTML = '<option value="">-- No connections found --</option>'; // Reset
      output.textContent = ''; // Clear output

      try {
        const data = JSON.parse(input);
        let objects = [];

        if (Array.isArray(data)) {
          objects = data;
        } else if (typeof data === 'object' && data !== null) {
          objects = [data];
        } else {
          output.textContent = 'Please enter a valid JSON object or array of objects.';
          return;
        }

        function extractConnectionEntries(obj) {
          const entries = [];

          if (!obj.ScheduledProcesses || !Array.isArray(obj.ScheduledProcesses)) return entries;

          obj.ScheduledProcesses.forEach(proc => {
            if (proc.Connectors && Array.isArray(proc.Connectors)) {
              proc.Connectors.forEach(conn => {
                if (
                  conn.connectionName && typeof conn.connectionName === 'string' &&
                  conn.connectorType && typeof conn.connectorType === 'string'
                ) {
                  const connectionName = conn.connectionName.trim();
                  const connectorType = conn.connectorType.trim();
                  entries.push({ connectionName, connectorType });
                }
              });
            }
          });

          return entries;
        }

        // Get entries (connectionName + connectorType)
        const rawEntries = extractConnectionEntries(objects[0]);

        // Create unique keys (case insensitive) for uniqueness
        const uniqueMap = new Map();
        rawEntries.forEach(({ connectionName, connectorType }) => {
          const key = (connectionName + ' ' + connectorType).toLowerCase();
          if (!uniqueMap.has(key)) uniqueMap.set(key, { connectionName, connectorType });
        });

        // Sort alphabetically by combined string (case insensitive)
        const uniqueSortedEntries = Array.from(uniqueMap.values())
          .sort((a, b) => (a.connectionName + ' ' + a.connectorType).localeCompare(b.connectionName + ' ' + b.connectorType));

        if (uniqueSortedEntries.length > 0) {
          select.innerHTML = uniqueSortedEntries
            .map(({ connectionName, connectorType }) =>
              \`<option value="\${connectionName} \${connectorType}">\${connectionName} \${connectorType}</option>\`
            ).join('');
        }
      } catch (e) {
        output.textContent = 'Invalid JSON: ' + e.message;
      }
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
