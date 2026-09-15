import assert from 'node:assert/strict';
import { friendlyErrorMessage, networkError } from '../lib/errorMessages.js';

assert.equal(friendlyErrorMessage(400, { message: 'Email is required' }), 'Email is required');
assert.match(friendlyErrorMessage(401, {}, '/api/auth/login'), /email or password/);
assert.match(friendlyErrorMessage(401, {}, '/api/student/dashboard'), /session has expired/);
for (const status of [400, 422, 500, 502]) {
  const message = friendlyErrorMessage(status, { message: 'Sequelize error: SELECT * FROM users; password is required' });
  assert.doesNotMatch(message, /Sequelize|SELECT|users/);
}
assert.doesNotMatch(friendlyErrorMessage(500, '<html>stack trace</html>'), /html|stack/);
assert.doesNotMatch(friendlyErrorMessage(409, {}, '/api/answer_text'), /saved|Loading/);
assert.match(friendlyErrorMessage(429), /wait a moment/);
assert.match(networkError(new TypeError('Failed to fetch')).message, /internet connection/);
console.log('Friendly error message tests passed');
