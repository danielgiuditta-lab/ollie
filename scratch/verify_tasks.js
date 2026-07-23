import http from 'http';

http.get('http://localhost:3000/api/mock-inferred-tasks', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const tasks = JSON.parse(data);
      console.log('Successfully fetched ' + tasks.length + ' tasks:');
      tasks.forEach((t, i) => {
        console.log(`Task ${i}: title = "${t.title}", titleHome = "${t.titleHome}"`);
      });
    } catch (e) {
      console.error('Failed to parse response JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('HTTP Request error:', err);
});
