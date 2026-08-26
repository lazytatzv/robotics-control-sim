import React from 'react';
import { Sliders, GitFork, FileText } from 'lucide-react';

export type TabId = 'pid' | 'arm' | 'theory';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header>
      <div className="logo-area">
        <span className="brand-title">Control Lab</span>
        <span className="badge-wasm">WASM · RK4</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'pid' ? 'active' : ''}`}
          onClick={() => onSelectTab('pid')}
        >
          <Sliders size={13} />
          PID Control
        </button>
        <button
          className={`tab-btn ${activeTab === 'arm' ? 'active' : ''}`}
          onClick={() => onSelectTab('arm')}
        >
          <GitFork size={13} />
          Kinematics (2-DOF)
        </button>
        <button
          className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => onSelectTab('theory')}
        >
          <FileText size={13} />
          Reference
        </button>
      </nav>
    </header>
  );
};
