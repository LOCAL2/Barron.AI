import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './Toast.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <Check size={16} /> : <X size={16} />}
      <span>{message}</span>
    </div>
  );
}
