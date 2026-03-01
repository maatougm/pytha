/**
 * k6 Load Testing Script for School Hub
 * 
 * Usage:
 *   k6 run k6-script.js
 *   k6 run --vus 100 --duration 5m k6-script.js
 *   k6 run --env API_BASE_URL=https://api.schoolhub.com k6-script.js
 * 
 * Environment Variables:
 *   API_BASE_URL - Base URL of the API (default: http://localhost:3000)
 *   WS_URL - WebSocket URL (default: ws://localhost:3000/messaging)
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const httpReqDuration = new Trend('http_req_duration_custom');
const wsLatency = new Trend('websocket_latency');
const dbQueryCount = new Counter('db_queries');
const cacheHitRate = new Rate('cache_hits');
const activeUsers = new Gauge('active_users');

// Test configuration
export const options = {
  stages: [
    // Phase 1: Warm up
    { duration: '1m', target: 50 },
    // Phase 2: Ramp up
    { duration: '2m', target: 200 },
    // Phase 3: Peak load
    { duration: '5m', target: 500 },
    // Phase 4: Spike
    { duration: '30s', target: 800 },
    // Phase 5: Recovery
    { duration: '2m', target: 200 },
    // Phase 6: Cool down
    { duration: '1m', target: 0 },
  ],
  
  thresholds: {
    // HTTP thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    
    // Custom thresholds
    errors: ['rate<0.05'],
    http_req_duration_custom: ['p(95)<500'],
    websocket_latency: ['p(95)<100'],
    
    // Metric based thresholds
    'http_req_duration{status:200}': ['p(95)<400'],
    'http_req_duration{status:500}': ['p(95)<1000'],
  },
  
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 50 },
      },
    },
  },
};

// Constants
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000/messaging';

// Test data
const USERS = [
  { email: 'admin@school.com', password: 'Password123!', role: 'admin' },
  { email: 'teacher1@school.com', password: 'Password123!', role: 'teacher' },
  { email: 'teacher2@school.com', password: 'Password123!', role: 'teacher' },
  { email: 'teacher3@school.com', password: 'Password123!', role: 'teacher' },
  { email: 'student1@school.com', password: 'Password123!', role: 'student' },
  { email: 'student2@school.com', password: 'Password123!', role: 'student' },
  { email: 'student3@school.com', password: 'Password123!', role: 'student' },
  { email: 'parent1@school.com', password: 'Password123!', role: 'parent' },
  { email: 'parent2@school.com', password: 'Password123!', role: 'parent' },
  { email: 'parent3@school.com', password: 'Password123!', role: 'parent' },
];

const ENDPOINTS = {
  public: [
    { method: 'GET', url: '/api/health', name: 'Health Check' },
  ],
  authenticated: [
    { method: 'GET', url: '/api/users?page=1&limit=20', name: 'List Users' },
    { method: 'GET', url: '/api/courses?page=1&limit=50', name: 'List Courses' },
    { method: 'GET', url: '/api/grading/assignments', name: 'List Assignments' },
    { method: 'GET', url: '/api/attendance/sessions', name: 'List Attendance' },
    { method: 'GET', url: '/api/messaging/channels', name: 'List Channels' },
  ],
  write: [
    { 
      method: 'POST', 
      url: '/api/classes/class-test-id/attendance/bulk', 
      name: 'Bulk Mark Attendance',
      payload: {
        date: new Date().toISOString().split('T')[0],
        period: 1,
        records: [],
      },
    },
  ],
};

// Setup function - runs once at the beginning
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
  });
  
  return {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    startTime: Date.now(),
  };
}

// Main test function
export default function (data) {
  activeUsers.add(1);
  
  // Select random user
  const user = randomItem(USERS);
  
  // Execute different scenarios based on VU ID
  const scenario = __VU % 3;
  
  switch (scenario) {
    case 0:
      adminWorkflow(user);
      break;
    case 1:
      teacherWorkflow(user);
      break;
    case 2:
      studentWorkflow(user);
      break;
  }
  
  activeUsers.add(-1);
  
  // Random think time between 1-3 seconds
  sleep(randomIntBetween(1, 3));
}

// Admin workflow
function adminWorkflow(user) {
  group('Admin Workflow', () => {
    // Login
    const loginRes = login(user.email, user.password);
    if (!loginRes) return;
    
    const token = loginRes.json('accessToken');
    
    // Get system metrics
    makeRequest('GET', '/api/metrics', token, null, 'Get Metrics');
    
    // Get all users with pagination
    makeRequest('GET', '/api/users?page=1&limit=50', token, null, 'List All Users');
    
    // Get system health
    makeRequest('GET', '/api/admin/analytics', token, null, 'Get Analytics');
    
    // Get audit logs
    makeRequest('GET', '/api/moderation/audit-logs?page=1&limit=20', token, null, 'Get Audit Logs');
  });
}

// Teacher workflow
function teacherWorkflow(user) {
  group('Teacher Workflow', () => {
    // Login
    const loginRes = login(user.email, user.password);
    if (!loginRes) return;
    
    const token = loginRes.json('accessToken');
    
    // Get my classes
    makeRequest('GET', '/api/classes/my', token, null, 'Get My Classes');
    
    // Get courses
    makeRequest('GET', '/api/courses', token, null, 'List Courses');
    
    // Get assignments
    makeRequest('GET', '/api/grading/assignments', token, null, 'List Assignments');
    
    // Mark attendance (if user is a teacher)
    if (user.role === 'teacher') {
      const attendancePayload = {
        date: new Date().toISOString().split('T')[0],
        period: randomIntBetween(1, 8),
        records: generateAttendanceRecords(),
      };
      makeRequest('POST', '/api/classes/class-test-id/attendance/bulk', token, attendancePayload, 'Bulk Mark Attendance');
    }
  });
}

// Student workflow
function studentWorkflow(user) {
  group('Student Workflow', () => {
    // Login
    const loginRes = login(user.email, user.password);
    if (!loginRes) return;
    
    const token = loginRes.json('accessToken');
    
    // Get my courses
    makeRequest('GET', '/api/courses/my', token, null, 'Get My Courses');
    
    // Get my assignments
    makeRequest('GET', '/api/grading/assignments/my', token, null, 'Get My Assignments');
    
    // Get my grades
    makeRequest('GET', '/api/grading/grades/my', token, null, 'Get My Grades');
    
    // Get my attendance
    makeRequest('GET', '/api/attendance/my', token, null, 'Get My Attendance');
    
    // Get channels for messaging
    makeRequest('GET', '/api/messaging/channels', token, null, 'List Channels');
  });
}

// Login helper
function login(email, password) {
  const payload = JSON.stringify({ email, password });
  const headers = { 'Content-Type': 'application/json' };
  
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers });
  const duration = Date.now() - startTime;
  
  httpReqDuration.add(duration);
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('accessToken') !== undefined,
  });
  
  errorRate.add(!success);
  
  return success ? res : null;
}

// Generic request helper
function makeRequest(method, url, token, payload, name) {
  const fullUrl = `${BASE_URL}${url}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  
  const body = payload ? JSON.stringify(payload) : null;
  
  const startTime = Date.now();
  let res;
  
  switch (method.toUpperCase()) {
    case 'GET':
      res = http.get(fullUrl, { headers, tags: { name } });
      break;
    case 'POST':
      res = http.post(fullUrl, body, { headers, tags: { name } });
      break;
    case 'PUT':
      res = http.put(fullUrl, body, { headers, tags: { name } });
      break;
    case 'DELETE':
      res = http.del(fullUrl, null, { headers, tags: { name } });
      break;
    default:
      console.error(`Unknown method: ${method}`);
      return null;
  }
  
  const duration = Date.now() - startTime;
  httpReqDuration.add(duration);
  
  const success = check(res, {
    [`${name} status is 200/201`]: (r) => r.status === 200 || r.status === 201,
    [`${name} response time < 1000ms`]: (r) => duration < 1000,
  });
  
  errorRate.add(!success);
  dbQueryCount.add(1);
  
  return res;
}

// Generate attendance records
function generateAttendanceRecords() {
  const records = [];
  const statuses = ['present', 'absent', 'late', 'excused'];
  
  for (let i = 0; i < 30; i++) {
    records.push({
      studentId: `student-${i}`,
      status: randomItem(statuses),
      note: Math.random() > 0.8 ? 'Random note' : undefined,
    });
  }
  
  return records;
}

// WebSocket test (separate scenario)
export function websocketTest() {
  const user = randomItem(USERS);
  
  // First login to get token
  const loginRes = login(user.email, user.password);
  if (!loginRes) return;
  
  const token = loginRes.json('accessToken');
  
  const url = `${WS_URL}?token=${token}`;
  
  const res = ws.connect(url, null, (socket) => {
    socket.on('open', () => {
      console.log(`VU ${__VU}: WebSocket connected`);
      
      // Send message
      const startTime = Date.now();
      socket.send(JSON.stringify({
        event: 'message:send',
        data: {
          channelId: 'test-channel',
          content: `Test message from VU ${__VU}`,
        },
      }));
      
      socket.on('message', (data) => {
        const latency = Date.now() - startTime;
        wsLatency.add(latency);
        
        const msg = JSON.parse(data);
        check(msg, {
          'message received successfully': (m) => m.event === 'message:new' || m.event === 'message:sent',
        });
      });
      
      socket.on('error', (e) => {
        console.error(`VU ${__VU}: WebSocket error:`, e);
      });
    });
    
    // Close after 10 seconds
    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });
  
  check(res, {
    'WebSocket connection established': (r) => r && r.status === 101,
  });
  
  sleep(1);
}

// Teardown function - runs once at the end
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nLoad test completed in ${duration}s`);
  console.log(`Report available at: ./test-reports/`);
}
