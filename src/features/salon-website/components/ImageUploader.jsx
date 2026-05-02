import React, { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '@/shared/lib/api';

export default function ImageUploader({ value, onChange, imageType = 'gallery', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/website/upload-image?image_type=${imageType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleRemove = () => onChange(null);

  if (value) {
    return (
      <div className={`relative group rounded-xl overflow-hidden border border-slate-200 ${className}`}>
        <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors
        ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files?.[0])}
      />
      {uploading ? (
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      ) : (
        <>
          <Upload className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Drop your image here or click to upload</p>
        </>
      )}
    </div>
  );
}
