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

        function extractConnectionNames(obj) {
          const names = [];

          if (!obj.ScheduledProcesses || !Array.isArray(obj.ScheduledProcesses)) return names;

          obj.ScheduledProcesses.forEach(proc => {
            if (proc.Connectors && Array.isArray(proc.Connectors)) {
              proc.Connectors.forEach(conn => {
                if (conn.connectionName && typeof conn.connectionName === 'string') {
                  names.push(conn.connectionName.trim());
                }
              });
            }
          });

          return names;
        }

        // Normalize for uniqueness (case-insensitive), keep original casing for display
        const rawNames = extractConnectionNames(objects[0]);
        const uniqueMap = new Map();
        rawNames.forEach(name => {
          const key = name.toLowerCase();
          if (!uniqueMap.has(key)) uniqueMap.set(key, name);
        });
        const uniqueSortedNames = Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b));

        if (uniqueSortedNames.length > 0) {
          select.innerHTML = uniqueSortedNames.map(name => \`<option value="\${name}">\${name}</option>\`).join('');
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
