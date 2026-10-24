import React, { useState } from 'react';
import { Globe, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Play } from 'lucide-react';

export const CorsSimulatorCard: React.FC = () => {
  const [testOrigin, setTestOrigin] = useState<'allowed' | 'evil'>('evil');
  const [result, setResult] = useState<{
    tested: boolean;
    allowed: boolean;
    originHeader: string;
    responseHeaders: Record<string, string>;
    message: string;
  } | null>(null);

  const handleRunCorsTest = () => {
    if (testOrigin === 'allowed') {
      setResult({
        tested: true,
        allowed: true,
        originHeader: 'http://localhost:3000',
        responseHeaders: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Vary': 'Origin'
        },
        message: 'Origin authorized by gateway allowlist. Request permitted with credentials.'
      });
    } else {
      setResult({
        tested: true,
        allowed: false,
        originHeader: 'https://evil-untrusted-site.local',
        responseHeaders: {
          'Access-Control-Allow-Origin': 'null',
          'X-TrustX-CORS-Block': 'BLOCKED_BY_POLICY_RULE_NET_05'
        },
        message: 'Origin REJECTED by cross-domain security policy. Browser will halt reading of response data.'
      });
    }
  };

  return (
    <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Simulated Cross-Domain (CORS) Policy Denial Bench
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          WEB BOUNDARY TEST
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed font-sans">
        Test how the TrustX Security Gateway inspects incoming cross-domain browser origins to prevent telemetry exfiltration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 block mb-1.5 text-[11px]">Simulated Origin Header:</label>
            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                  testOrigin === 'allowed'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="corsOrigin"
                    checked={testOrigin === 'allowed'}
                    onChange={() => setTestOrigin('allowed')}
                    className="text-cyan-500"
                  />
                  <span>http://localhost:3000 (Allowlisted)</span>
                </div>
                <span className="text-[10px] text-emerald-400">AUTHORIZED</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                  testOrigin === 'evil'
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="corsOrigin"
                    checked={testOrigin === 'evil'}
                    onChange={() => setTestOrigin('evil')}
                    className="text-rose-500"
                  />
                  <span>https://evil-untrusted-site.local</span>
                </div>
                <span className="text-[10px] text-rose-400">UNTRUSTED</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleRunCorsTest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Cross-Origin Preflight</span>
          </button>
        </div>

        {/* Result */}
        <div className="rounded-lg bg-[#070A11] border border-slate-800 p-3.5 flex flex-col justify-between">
          {result ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 text-[11px]">CROSS-ORIGIN VERDICT:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    result.allowed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                  }`}
                >
                  {result.allowed ? 'ORIGIN ALLOWED' : 'CROSS-DOMAIN DENIAL'}
                </span>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="text-slate-400">Response Headers Emitted:</div>
                <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
                  {JSON.stringify(result.responseHeaders, null, 2)}
                </pre>
              </div>

              <p className="text-[11px] font-sans text-slate-300 pt-1">
                {result.message}
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-[11px] py-4 text-center">
              <span>Click &quot;Simulate Cross-Origin Preflight&quot; to inspect origin boundary verification.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
