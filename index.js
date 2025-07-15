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
  <button onclick="compute()">Compute</button>
  <pre id="output"></pre>

  <script>
    function compute() {
      const input = document.getElementById('jsonInput').value;
      const output = document.getElementById('output');
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

        function getAllKeys(obj, prefix = '') {
          let keys = [];

          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              const arrayPrefix = \`\${prefix}[\${index}]\`;
              keys = keys.concat(getAllKeys(item, arrayPrefix));
            });
          } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              const newPrefix = prefix ? \`\${prefix}.\${key}\` : key;
              keys = keys.concat(getAllKeys(obj[key], newPrefix));
            }
          } else {
            keys.push(prefix);
          }

          return keys;
        }

        const result = objects.map((obj, index) => {
          const keys = getAllKeys(obj);
          return \`Object \${index + 1} keys:\\n- \${keys.join('\\n- ')}\`;
        }).join('\\n\\n');

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
