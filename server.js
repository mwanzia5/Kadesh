const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head><title>Kadesh Hope Mission</title></head>
<body>
  <div style="height: 1000px;"></div>
  <section id="foundation">
    <h2>Our Foundation</h2>
    <div class="grid">
      <a href="/projects/education" class="card">Education</a>
      <a href="/projects/health" class="card">Health</a>
      <a href="/projects/food-security" class="card">Food Security</a>
      <a href="/projects/enterprise-programs" class="card">Enterprise Programs</a>
      <a href="/projects/social-development" class="card">Social Development</a>
    </div>
  </section>
  <section id="who-we-are">
    <h2>Who We Are</h2>
    <button>Learn More About Us</button>
  </section>
  <section id="projects">
    <a href="/projects" class="btn">View All Projects</a>
  </section>
</body>
</html>`);
});
server.listen(5173, '127.0.0.1', () => {
  console.log('Test server running on 5173');
});
