import { useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import './WelcomeModal.css';

interface WelcomeModalProps {
  onComplete: (name: string) => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('กรุณากรอกชื่อของคุณ');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
      return;
    }

    onComplete(trimmedName);
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-icon">
          <Sparkles size={32} />
        </div>
        
        <h1>ยินดีต้อนรับสู่ Barron AI</h1>
        <p className="welcome-subtitle">
          ก่อนเริ่มต้น บอกชื่อของคุณให้เราได้รู้จักหน่อยนะ
        </p>

        <form onSubmit={handleSubmit} className="welcome-form">
          <div className="input-wrapper">
            <User size={20} className="input-icon" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="ชื่อของคุณ..."
              autoFocus
              maxLength={50}
            />
          </div>
          
          {error && <p className="welcome-error">{error}</p>}
          
          <button type="submit" className="welcome-btn">
            เริ่มต้นใช้งาน
          </button>
        </form>

        <p className="welcome-note">
          เราจะจำชื่อของคุณไว้เพื่อให้ AI สามารถเรียกชื่อคุณได้
        </p>
      </div>
    </div>
  );
}
