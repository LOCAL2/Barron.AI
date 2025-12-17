import { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { getUserName, setUserName } from '../services/ai';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
  onNameChange: (name: string) => void;
}

export function SettingsModal({ onClose, onNameChange }: SettingsModalProps) {
  const [name, setName] = useState(getUserName() || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName.length >= 2) {
      setUserName(trimmedName);
      onNameChange(trimmedName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>ตั้งค่า</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <label className="settings-label">
              <User size={18} />
              <span>ชื่อของคุณ</span>
            </label>
            <p className="settings-desc">AI จะใช้ชื่อนี้ในการเรียกคุณ</p>
            <div className="settings-input-group">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="กรอกชื่อของคุณ..."
                maxLength={50}
              />
              <button 
                className={`save-btn ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={!name.trim() || name.trim().length < 2}
              >
                {saved ? <Check size={18} /> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
