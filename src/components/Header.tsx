import React from 'react';
import { Cpu, Activity, Compass, BookOpen } from 'lucide-react';

export type TabId = 'pid' | 'arm' | 'theory';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header>
      <div className="logo-area">
        <Cpu className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Robotics & Control Lab</h1>
        <span className="badge-wasm">Rust / Wasm</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'pid' ? 'active' : ''}`}
          onClick={() => onSelectTab('pid')}
        >
          <Activity style={{ width: 15, height: 15, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
          PID 制御
        </button>
        <button
          className={`tab-btn ${activeTab === 'arm' ? 'active' : ''}`}
          onClick={() => onSelectTab('arm')}
        >
          <Compass style={{ width: 15, height: 15, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
          2自由度アーム運動学
        </button>
        <button
          className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => onSelectTab('theory')}
        >
          <BookOpen style={{ width: 15, height: 15, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
          理論・数式解説
        </button>
      </nav>
    </header>
  );
};
