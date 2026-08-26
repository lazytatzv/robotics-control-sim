import React, { useState, useEffect } from 'react';
import { Header, TabId } from './components/Header';
import { PidSimulator } from './components/pid/PidSimulator';
import { ArmSimulator } from './components/arm/ArmSimulator';
import { TheoryGuide } from './components/theory/TheoryGuide';
import { initializeWasm } from './sim-bridge';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('pid');
  const [wasmReady, setWasmReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeWasm()
      .then(() => setWasmReady(true))
      .catch((err) => setError(err.toString()));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
        <h2>WebAssembly の初期化に失敗しました</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!wasmReady) {
    return (
      <div style={{ padding: '4rem', color: '#94a3b8', textAlign: 'center' }}>
        <p>Loading Rust WebAssembly Core...</p>
      </div>
    );
  }

  return (
    <>
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />
      {activeTab === 'pid' && <PidSimulator />}
      {activeTab === 'arm' && <ArmSimulator />}
      {activeTab === 'theory' && <TheoryGuide />}
    </>
  );
};
