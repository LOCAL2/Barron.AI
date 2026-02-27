import { useState, useEffect } from 'react';
import { generateImage, IMAGE_MODELS, type ImageModelType } from '../services/imageGeneration';

interface ImageGeneratorProps {
  jsonData: string;
}

export function ImageGenerator({ jsonData }: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ prompt: string; model?: ImageModelType } | null>(null);

  useEffect(() => {
    const generateImg = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parse JSON
        const data = JSON.parse(jsonData);
        
        if (!data.prompt) {
          throw new Error('ไม่พบ prompt ในข้อมูล');
        }

        setImageData(data);

        // Generate image URL
        const model = data.model || 'flux';
        const url = await generateImage(data.prompt, model as ImageModelType);
        
        setImageUrl(url);
        setLoading(false);
      } catch (err: any) {
        console.error('Image generation error:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการสร้างรูปภาพ');
        setLoading(false);
      }
    };

    generateImg();
  }, [jsonData]);

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        margin: '16px 0',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>
          กำลังเตรียมสร้างรูปภาพ...
        </div>
        {imageData && (
          <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
            {imageData.prompt}
          </div>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        margin: '16px 0',
        color: '#ef4444',
      }}>
        <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
          ⚠️ ไม่สามารถสร้างรูปภาพได้
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {error}
        </div>
        {imageData && (
          <details style={{ marginTop: '12px', fontSize: '13px', opacity: 0.8 }}>
            <summary style={{ cursor: 'pointer' }}>ดูรายละเอียด</summary>
            <pre style={{ 
              marginTop: '8px', 
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(imageData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div style={{
      margin: '16px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '4px',
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {imageLoading && (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
            color: 'white',
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ marginTop: '16px', fontSize: '14px', opacity: 0.9 }}>
              กำลังสร้างรูปภาพ... (3-5 วินาที)
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        <img
          src={imageUrl}
          alt={imageData?.prompt || 'Generated image'}
          style={{
            width: '100%',
            height: 'auto',
            display: imageLoading ? 'none' : 'block',
          }}
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            console.error('Image load error:', e);
            setImageLoading(false);
            setError('ไม่สามารถโหลดรูปภาพได้ อาจเป็นเพราะ Cloudflare บล็อก กรุณาลองใหม่อีกครั้ง');
          }}
          crossOrigin="anonymous"
        />
        {!imageLoading && !error && imageData && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
          }}>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              <strong>Prompt:</strong> {imageData.prompt}
            </div>
            {imageData.model && (
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                <strong>Model:</strong> {IMAGE_MODELS[imageData.model]?.name || imageData.model}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
