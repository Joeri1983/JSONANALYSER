const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Boomi - Connection/Process relations</title>
  <style>
    /* Hide the sections initially */
    #connectionSection, #processSection {
      display: none;
    }
  </style>
</head>
<body>
  <h1>Insert JSON data</h1>
  <textarea id="jsonInput" rows="20" cols="200" placeholder='Enter JSON object or array of objects'></textarea><br>
  <button onclick="compute()">Show connectors</button>

  <div id="connectionSection">
    <h3>Connection Names:</h3>
    <select id="connectionSelect" onchange="showProcesses()">
      <option value="">-- No connections found --</option>
    </select>
  </div>

  <div id="processSection">
    <h3>Related Process Names:</h3>
    <div id="processNames"></div>
  </div>

  <pre id="output"></pre>

  <script>
    let currentData = null; // Store parsed JSON
    let connectionNames = [];

    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      const select = document.getElementById('connectionSelect');
      const processDiv = document.getElementById('processNames');
      const connectionSection = document.getElementById('connectionSection');
      const processSection = document.getElementById('processSection');

      output.textContent = '';
      processDiv.textContent = '';
      select.innerHTML = '<option value="">-- No connections found --</option>';
      currentData = null;
      connectionNames = [];

      // Hide sections initially until valid data is found
      connectionSection.style.display = 'none';
      processSection.style.display = 'none';

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
          return;
        }

        select.innerHTML = connectionNames
          .map(name => \`<option value="\${name}">\${name}</option>\`)
          .join('');

        // Show the connection dropdown section now that data is loaded
        connectionSection.style.display = 'block';
        processSection.style.display = 'none'; // keep process section hidden until selection
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
        processSection.style.display = 'block';
        return;
      }

      const uniqueProcesses = [...new Set(matchingProcesses)];
      // Use <ol> for numbered list instead of <ul>
      processDiv.innerHTML = '<ol>' + uniqueProcesses.map(p => '<li>' + p + '</li>').join('') + '</ol>';
      processSection.style.display = 'block';
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
