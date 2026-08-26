import React from 'react';

export type TabId = 'pid' | 'arm' | 'theory';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  return (
    <header>
      <div className="brand-area">
        <span className="brand-logo">LORE · SIM</span>
        <span className="brand-tag">RUST / WASM RK4</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'pid' ? 'active' : ''}`}
          onClick={() => onSelectTab('pid')}
        >
          [01] PID CONTROL
        </button>
        <button
          className={`tab-btn ${activeTab === 'arm' ? 'active' : ''}`}
          onClick={() => onSelectTab('arm')}
        >
          [02] 2-DOF KINEMATICS
        </button>
        <button
          className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => onSelectTab('theory')}
        >
          [03] REFERENCE
        </button>
      </nav>
    </header>
  );
};
