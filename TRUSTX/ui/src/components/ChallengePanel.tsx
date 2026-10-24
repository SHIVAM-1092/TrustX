import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Challenge, ChallengeAttackResponse } from '../types';

interface ChallengePanelProps {
  onTargetStateChange?: () => void;
}

export default function ChallengePanel({ onTargetStateChange }: ChallengePanelProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [payload, setPayload] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChallengeAttackResponse | null>(null);
  const [hintIndex, setHintIndex] = useState<number>(-1);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const challengeList = await api.getChallenges();
      if (challengeList.length > 0) {
        setSelectedChallenge(challengeList[0]);
      }
    } catch (e) {
      console.error('Failed to load challenges', e);
    }
  };

  const handleAttack = async () => {
    if (!selectedChallenge || loading) return;
    setLoading(true);
    try {
      const res = await api.challengeAttack(selectedChallenge.id, payload);
      setResult(res);
      if (res.success && onTargetStateChange) {
        onTargetStateChange();
      }
    } catch (e: any) {
      setResult({
        challenge_id: selectedChallenge.id,
        success: false,
        feedback: e.message,
        target_response: '',
        gateway_status: 500,
        attempt_number: 0,
        completed: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!selectedChallenge || loading) return;
    setLoading(true);
    try {
      await api.challengeReset(selectedChallenge.id);
      setResult(null);
      setPayload('');
      setHintIndex(-1);
      setShowHint(false);
      if (onTargetStateChange) onTargetStateChange();
    } catch (e) {
      console.error('Reset failed', e);
    } finally {
      setLoading(false);
    }
  };

  const showNextHint = () => {
    if (selectedChallenge && hintIndex < selectedChallenge.hints.length - 1) {
      setHintIndex(hintIndex + 1);
      setShowHint(true);
    }
  };

  const currentHint = selectedChallenge && hintIndex >= 0
    ? selectedChallenge.hints[hintIndex]
    : null;

  return (
    <div style={{ background: '#0F172A', border: '1px solid #DC2626', borderRadius: '8px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#FCA5A5' }}>Red Team Lab</h2>
      </div>
      <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: 0 }}>
        Interactive Adversarial AI Safety Challenges
      </p>

      {selectedChallenge && (
        <>
          {/* Challenge Header */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#1E293B', borderRadius: '6px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#F8FAFC' }}>
                  {selectedChallenge.name}
                </h3>
                <span style={{ fontSize: '11px', color: '#38BDF8', background: '#0C4A6E', padding: '2px 8px', borderRadius: '4px' }}>
                  {selectedChallenge.category} • {selectedChallenge.difficulty}
                </span>
              </div>
              <button
                onClick={handleReset}
                disabled={loading}
                style={{ background: '#475569', color: '#F8FAFC', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              >
                🔄 Reset Lab
              </button>
            </div>

            {/* Objective */}
            <div style={{ marginTop: '12px', padding: '10px', background: '#0F172A', borderRadius: '4px', borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 'bold', marginBottom: '4px' }}>
                OBJECTIVE
              </div>
              <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.5 }}>
                {selectedChallenge.objective}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
              {selectedChallenge.description}
            </div>
          </div>

          {/* Input Area */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: '4px' }}>
              Your Adversarial Payload:
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder={selectedChallenge.hints[0] || 'Enter your prompt injection attempt...'}
              disabled={loading || result?.completed}
              style={{
                width: '95%', height: '80px', padding: '8px',
                background: '#1E293B', border: '1px solid #334155',
                color: '#F8FAFC', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
              <button
                onClick={handleAttack}
                disabled={loading || !payload.trim() || result?.completed}
                style={{
                  flex: 1, background: result?.completed ? '#10B981' : '#DC2626',
                  color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '4px',
                  cursor: loading || result?.completed ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: '13px'
                }}
              >
                {loading ? 'Executing...' : result?.completed ? '✅ Challenge Complete!' : '⚡ Execute Attack'}
              </button>
              <button
                onClick={showNextHint}
                disabled={!selectedChallenge || hintIndex >= selectedChallenge.hints.length - 1 || result?.completed}
                style={{
                  background: '#475569', color: '#F8FAFC', border: 'none',
                  padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                }}
              >
                💡 Hint ({hintIndex + 1}/{selectedChallenge?.hints.length || 0})
              </button>
            </div>
          </div>

          {/* Hint Display */}
          {showHint && currentHint && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#0C4A6E', borderRadius: '4px', border: '1px solid #38BDF8' }}>
              <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 'bold', marginBottom: '4px' }}>
                HINT {hintIndex + 1}
              </div>
              <div style={{ fontSize: '12px', color: '#BAE6FD' }}>{currentHint}</div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#1E293B', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: result.success ? '#065F46' : '#991B1B',
                    color: result.success ? '#34D399' : '#F87171',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {result.success ? 'SUCCESS' : 'ATTEMPT FAILED'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Attempt #{result.attempt_number} • Gateway: HTTP {result.gateway_status}
                  </span>
                </div>
                {result.flag && (
                  <div style={{
                    background: '#065F46', color: '#34D399', padding: '6px 12px',
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
                    fontWeight: 'bold', border: '1px solid #10B981'
                  }}>
                    🏁 {result.flag}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '8px' }}>
                {result.feedback}
              </div>

              {result.target_response && (
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  <div style={{ fontWeight: 'bold', color: '#38BDF8', marginBottom: '4px' }}>
                    Target Response:
                  </div>
                  <pre style={{
                    margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: '#0F172A', padding: '8px', borderRadius: '4px',
                    fontSize: '10px', color: '#E2E8F0', maxHeight: '150px', overflow: 'auto'
                  }}>
                    {result.target_response}
                  </pre>
                </div>
              )}

              {result.completed && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#065F46', borderRadius: '4px', border: '1px solid #10B981' }}>
                  <div style={{ color: '#34D399', fontWeight: 'bold', fontSize: '12px' }}>
                    🎉 Challenge Completed!
                  </div>
                  <div style={{ color: '#6EE7B7', fontSize: '11px', marginTop: '4px' }}>
                    You successfully extracted the system prompt. The flag above is your proof of completion.
                    Click "Reset Lab" to try again or explore other attack vectors.
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}