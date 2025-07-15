const http = require('http');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON Overview</title>
</head>
<body>
  <h1>JSON Object Viewer</h1>
  <textarea id="jsonInput" rows="10" cols="50" placeholder='Enter JSON array of objects here'></textarea><br>
  <button onclick="compute()">Compute</button>
  <pre id="output"></pre>

  <script>
    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
      try {
        const data = JSON.parse(input);

        if (!Array.isArray(data)) {
          output.textContent = 'Please enter a JSON array of objects.';
          return;
        }

        const result = data.map((obj, index) => {
          if (typeof obj !== 'object' || obj === null) {
            return \`Item \${index} is not a valid object.\`;
          }
          return \`Object \${index + 1} keys: \${Object.keys(obj).join(', ')}\`;
        }).join('\\n');

        output.textContent = result;
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
