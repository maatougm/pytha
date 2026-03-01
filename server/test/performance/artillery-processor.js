/**
 * Artillery Processor Functions
 * 
 * These functions can be used in Artillery scenarios for:
 * - Generating dynamic data
 * - Custom request handling
 * - Response processing
 * - Metric tracking
 */

const { faker } = require('@faker-js/faker');

/**
 * Generate random test data for requests
 */
function generateTestData(userContext, events, done) {
  // Generate random user data
  userContext.vars.email = faker.internet.email();
  userContext.vars.firstName = faker.person.firstName();
  userContext.vars.lastName = faker.person.lastName();
  userContext.vars.phone = faker.phone.number();
  
  // Generate random message content
  userContext.vars.messageContent = faker.lorem.sentence();
  
  done();
}

/**
 * Set authorization header from previous login
 */
function setAuthHeader(requestParams, context, ee, next) {
  if (context.vars.token) {
    requestParams.headers = requestParams.headers || {};
    requestParams.headers.Authorization = `Bearer ${context.vars.token}`;
  }
  return next();
}

/**
 * Custom response handler for tracking metrics
 */
function trackResponseTime(requestParams, response, context, ee, next) {
  const responseTime = response.timings.response;
  
  // Log slow responses
  if (responseTime > 1000) {
    console.warn(`Slow response: ${requestParams.url} - ${responseTime}ms`);
  }
  
  return next();
}

/**
 * Check if response contains expected data
 */
function checkResponse(requestParams, response, context, ee, next) {
  if (response.statusCode !== 200) {
    console.error(`Request failed: ${requestParams.url} - Status ${response.statusCode}`);
    ee.emit('error', `Request failed: ${requestParams.url}`);
  }
  
  return next();
}

/**
 * Generate random attendance records for bulk marking
 */
function generateAttendanceRecords(userContext, events, done) {
  const records = [];
  const statuses = ['present', 'absent', 'late', 'excused'];
  
  // Generate 30 student records
  for (let i = 0; i < 30; i++) {
    records.push({
      studentId: `student-${i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      note: Math.random() > 0.8 ? faker.lorem.sentence() : undefined,
    });
  }
  
  userContext.vars.attendanceRecords = records;
  done();
}

/**
 * Generate pagination parameters
 */
function setPaginationParams(requestParams, context, ee, next) {
  requestParams.qs = requestParams.qs || {};
  requestParams.qs.page = Math.floor(Math.random() * 5) + 1;
  requestParams.qs.limit = [10, 20, 50][Math.floor(Math.random() * 3)];
  
  return next();
}

/**
 * Log errors for debugging
 */
function logError(err, requestParams, context, ee, next) {
  console.error('Request error:', {
    url: requestParams.url,
    error: err.message,
    timestamp: new Date().toISOString(),
  });
  
  return next();
}

/**
 * Extract and store data from response
 */
function extractData(requestParams, response, context, ee, next) {
  try {
    const body = JSON.parse(response.body);
    
    // Store user data for subsequent requests
    if (body.user) {
      context.vars.userId = body.user.id;
    }
    
    // Store first item from list responses
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      context.vars.firstItemId = body.data[0].id;
    }
  } catch (e) {
    // Not JSON or parsing error, ignore
  }
  
  return next();
}

/**
 * Random think time between requests
 */
function randomThinkTime(userContext, events, done) {
  // Random think time between 1-5 seconds
  const thinkTime = Math.floor(Math.random() * 4000) + 1000;
  userContext.vars.thinkTime = thinkTime;
  done();
}

/**
 * Select random user credentials
 */
function selectRandomUser(userContext, events, done) {
  const users = [
    { email: 'admin@school.com', password: 'Password123!', role: 'admin' },
    { email: 'teacher1@school.com', password: 'Password123!', role: 'teacher' },
    { email: 'teacher2@school.com', password: 'Password123!', role: 'teacher' },
    { email: 'student1@school.com', password: 'Password123!', role: 'student' },
    { email: 'student2@school.com', password: 'Password123!', role: 'student' },
    { email: 'parent1@school.com', password: 'Password123!', role: 'parent' },
  ];
  
  const randomUser = users[Math.floor(Math.random() * users.length)];
  userContext.vars.email = randomUser.email;
  userContext.vars.password = randomUser.password;
  userContext.vars.role = randomUser.role;
  
  done();
}

/**
 * Track custom metrics
 */
function trackCustomMetrics(requestParams, response, context, ee, next) {
  // Track response size
  const responseSize = response.body ? response.body.length : 0;
  ee.emit('histogram', 'response_size_bytes', responseSize);
  
  // Track status code distribution
  ee.emit('counter', `status_code_${response.statusCode}`, 1);
  
  return next();
}

/**
 * Validate response structure
 */
function validateResponseStructure(requestParams, response, context, ee, next) {
  const contentType = response.headers['content-type'];
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const body = JSON.parse(response.body);
      
      // Check for error responses
      if (body.error || (body.status && body.status === 'error')) {
        console.warn('Error response:', {
          url: requestParams.url,
          error: body.error || body.message,
        });
      }
    } catch (e) {
      console.warn('Invalid JSON response from:', requestParams.url);
    }
  }
  
  return next();
}

// Export all functions
module.exports = {
  generateTestData,
  setAuthHeader,
  trackResponseTime,
  checkResponse,
  generateAttendanceRecords,
  setPaginationParams,
  logError,
  extractData,
  randomThinkTime,
  selectRandomUser,
  trackCustomMetrics,
  validateResponseStructure,
};
