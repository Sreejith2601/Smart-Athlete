/**
 * Verification Script for Training Engine API
 */

const http = require('http');

const payload = {
  event: "800m",
  level: "beginner",
  startDate: new Date().toISOString(), // Day 0
  raceTime: 2.5, // 2:30 for 800m
  raceDistance: 800,
  mlFeatures: {
    cpi: 70,
    loadScore: 65,
    performanceScore: 80,
    efficiencyScore: 75,
    trend: "stable",
    compliance: 90,
    weeklySessions: 6,
    avgDuration: 3500,
    fatigueIndex: 20,
    stressScore: 350,
    recoveryScore: 150
  }
};

const jsonBody = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/training-engine/daily-plan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonBody)
  }
};

console.log(`[Test] Sending request to ${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
  let data = '';
  console.log(`[Test] Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('[Test] Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('[Test] Failed to parse response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`[Test] Request failed: ${e.message}`);
});

req.write(jsonBody);
req.end();
