import { useState, useRef } from 'react';
import { X, User, Check, Camera, Upload, Link } from 'lucide-react';
import { getUserName, setUserName, getUserAvatar, setUserAvatar, removeUserAvatar } from '../services/ai';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string | null) => void;
}

export function SettingsModal({ onClose, onNameChange, onAvatarChange }: SettingsModalProps) {
  const [name, setName] = useState(getUserName() || '');
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(getUserAvatar() || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName.length >= 2) {
      setUserName(trimmedName);
      onNameChange(trimmedName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatar(result);
        setUserAvatar(result);
        onAvatarChange(result);
        setAvatarSaved(true);
        setTimeout(() => setAvatarSaved(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSave = () => {
    if (avatarUrl.trim()) {
      setAvatar(avatarUrl.trim());
      setUserAvatar(avatarUrl.trim());
      onAvatarChange(avatarUrl.trim());
      setAvatarUrl('');
      setShowUrlInput(false);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2000);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    removeUserAvatar();
    onAvatarChange(null);
    setAvatarSaved(true);
    setTimeout(() => setAvatarSaved(false), 2000);
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
              <Camera size={18} />
              <span>รูปโปรไฟล์</span>
            </label>
            <p className="settings-desc">รูปที่จะแสดงเมื่อคุณส่งข้อความ</p>
            
            <div className="avatar-section">
              <div className="avatar-preview">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={24} />
                  </div>
                )}
              </div>
              
              <div className="avatar-controls">
                <button 
                  className="avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  อัปโหลดรูป
                </button>
                
                <button 
                  className="avatar-btn"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  <Link size={16} />
                  ใส่ URL
                </button>
                
                {avatar && (
                  <button 
                    className="avatar-btn remove"
                    onClick={handleRemoveAvatar}
                  >
                    <X size={16} />
                    ลบรูป
                  </button>
                )}
              </div>
              
              {showUrlInput && (
                <div className="url-input-section">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="url-input"
                  />
                  <button 
                    className="save-url-btn"
                    onClick={handleUrlSave}
                    disabled={!avatarUrl.trim()}
                  >
                    บันทึก
                  </button>
                </div>
              )}
              
              {avatarSaved && (
                <p className="save-success">✓ บันทึกรูปโปรไฟล์แล้ว</p>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

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
