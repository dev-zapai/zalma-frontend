import React, { useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function GalleryManager({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/website/upload-image?image_type=gallery', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newUrls.push(res.data.url);
      }
      onChange([...images, ...newUrls]);
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploading(false);
  };

  const handleRemove = async (url) => {
    try {
      await api.delete(`/website/gallery-image?image_url=${encodeURIComponent(url)}`);
    } catch (e) {
      console.error('Remove failed:', e);
    }
    onChange(images.filter((img) => img !== url));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((url, idx) => (
        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
          <button
            onClick={() => handleRemove(url)}
            className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5 text-slate-600" />
          </button>
        </div>
      ))}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-1.5 aspect-square border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(Array.from(e.target.files || []))}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <>
            <Plus className="h-6 w-6 text-slate-400" />
            <span className="text-xs text-slate-400">Add Photos</span>
          </>
        )}
      </div>
    </div>
  );
}
