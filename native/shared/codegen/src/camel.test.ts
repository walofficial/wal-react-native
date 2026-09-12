import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { camel, pascal } from './openapi-model.js';

describe('camel / pascal', () => {
  it('lowercases ALL_CAPS segments so SENT is sent, not sENT', () => {
    assert.equal(camel('SENT'), 'sent');
    assert.equal(camel('PENDING'), 'pending');
    assert.equal(camel('FAILED_PREPROCESSING'), 'failedPreprocessing');
    assert.equal(pascal('FAILED_PREPROCESSING'), 'FailedPreprocessing');
  });

  it('keeps already-camelCase identifiers (route ids)', () => {
    assert.equal(camel('signIn'), 'signIn');
    assert.equal(camel('homeIndex'), 'homeIndex');
    assert.equal(camel('chatList'), 'chatList');
    assert.equal(camel('profileByUsername'), 'profileByUsername');
  });

  it('keeps snake_case wire names as camelCase identifiers', () => {
    assert.equal(camel('feed_id'), 'feedId');
    assert.equal(camel('x-user-location-latitude'), 'xUserLocationLatitude');
    assert.equal(camel('content_type'), 'contentType');
  });

  it('prefixes identifiers that start with a digit', () => {
    assert.equal(camel('24h'), '_24h');
  });
});
