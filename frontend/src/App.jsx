import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [prompt, setPrompt] = useState('ghibli style, whimsical scene');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setResultUrl('');
    setError('');
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview('');
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setResultUrl('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResultUrl('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        const response = await fetch('https://api.getimg.ai/v1/flux-schnell/image-to-image', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer key-4oukIz5zPvx7YCMEhnAq6QKIpUaWX0qRrBULhJro39ZdOhcmQwntRR8W6mfE1Qay2XfIzwp9GRDkebPnNy3sMUiOczqz8qc7',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Image,
            prompt: prompt
          })
        });
        if (response.ok) {
          const data = await response.json();
          setResultUrl(data.image_url || data.url || '');
        } else {
          setError('Failed to generate image.');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error generating image.');
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: 0, margin: 0 }}>
      <div style={{ maxWidth: 480, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 32 }}>
        <h1 style={{ textAlign: 'center', color: '#4f46e5', marginBottom: 24 }}>getimg.ai Image-to-Image</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontWeight: 500, color: '#374151' }}>
            Upload Image
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: 8 }} />
          </label>
          {preview && (
            <div style={{ textAlign: 'center' }}>
              <img src={preview} alt="Preview" style={{ maxWidth: 220, maxHeight: 180, borderRadius: 12, boxShadow: '0 2px 8px #0002', margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: '#6b7280' }}>Preview</div>
            </div>
          )}
          <label style={{ fontWeight: 500, color: '#374151' }}>
            Prompt
            <input
              type="text"
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Enter your prompt"
              style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 16 }}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !file || !prompt}
            style={{
              background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              fontWeight: 600,
              fontSize: 18,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8
            }}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
        {resultUrl && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <h2 style={{ color: '#4f46e5', fontSize: 20, marginBottom: 12 }}>Result</h2>
            <img src={resultUrl} alt="Generated" style={{ maxWidth: 320, maxHeight: 320, borderRadius: 16, boxShadow: '0 2px 12px #0002' }} />
            <div>
              <a
                href={resultUrl}
                download="generated-image.png"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  background: '#4f46e5',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: 16
                }}
              >
                Download Image
              </a>
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', color: '#a5b4fc', marginTop: 32, fontSize: 14 }}>
        Powered by <a href="https://getimg.ai/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>getimg.ai</a>
      </div>
    </div>
  );
}

export default App;
