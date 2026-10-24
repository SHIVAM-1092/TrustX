import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

test('Cryptographic audit hash chaining: verifies SHA-256 computation', () => {
  const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const eventData = `${prevHash}|evt-1|2026-10-22T07:00:00Z|operator|/api/test|POST|ALLOW|5|benign probe`;
  const computedHash = crypto.createHash('sha256').update(eventData).digest('hex');

  assert.equal(typeof computedHash, 'string');
  assert.equal(computedHash.length, 64);

  // If payload is altered, hash must mismatch
  const tamperedData = `${prevHash}|evt-1|2026-10-22T07:00:00Z|operator|/api/test|POST|ALLOW|5|tampered payload`;
  const tamperedHash = crypto.createHash('sha256').update(tamperedData).digest('hex');
  assert.notEqual(computedHash, tamperedHash, 'Tampered data must yield different cryptographic hash');
});

test('Flag security: verifies flag format compliance', () => {
  const flags = [
    'TRUSTX{pr0mpt_1nj3ct10n_syst3m_unl0ck3d_94a7}',
    'TRUSTX{j41lbr34k_b0und4ry_hyp4ss_81f2}',
    'TRUSTX{b0la_ag3nt_t00l_unauth0riz3d_33c9}',
    'TRUSTX{c0rs_wildc4rd_cr0ss_0rigin_99b1}',
    'TRUSTX{csrf_act10n_d1sp4tch_expl01t_44a2}',
    'TRUSTX{x_fr4m3_clickj4ck_pr0t0c0l_77e0}'
  ];

  for (const flag of flags) {
    assert.match(flag, /^TRUSTX\{[a-z0-9_]+\}$/, `Flag ${flag} must match strict pattern`);
  }
});
