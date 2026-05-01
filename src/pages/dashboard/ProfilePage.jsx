import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, FileText,
  Save, Shield, Camera, Loader2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/profile/me');
        setData(res.data);
        setForm(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile/me', {
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        qualification: form.qualification,
        photo_url: form.photo_url,
        staff_role: form.staff_role,
      });
      setData(res.data);
      setForm(res.data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData(prev => ({ ...prev, photo_url: res.data.url }));
      setForm(prev => ({ ...prev, photo_url: res.data.url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Failed to upload photo');
    }
    setUploading(false);
  };

  const handlePhotoDelete = async () => {
    setUploading(true);
    try {
      await api.delete('/profile/photo');
      setData(prev => ({ ...prev, photo_url: null }));
      setForm(prev => ({ ...prev, photo_url: null }));
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Failed to remove photo');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Could not load profile</p>
      </div>
    );
  }

  const isAdmin = data.is_admin || data.role === 'admin';
  const isStaff = data.role === 'staff';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and update your personal details</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {data.photo_url ? (
                <img src={data.photo_url} alt={data.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: data.color || (isStaff ? '#6366F1' : '#0F172A') }}
                >
                  {data.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              {editing && (
                <>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </>
              )}
              {editing && data.photo_url && (
                <button
                  onClick={handlePhotoDelete}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-sm transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{data.full_name}</h2>
              <p className="text-sm text-slate-500">{data.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {data.role !== 'admin' && (
                  <Badge className="rounded-full text-xs capitalize bg-primary/15 text-primary">
                    {data.role}
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="rounded-full text-xs bg-slate-900 text-white">
                    <Shield className="h-3 w-3 mr-1" /> Admin
                  </Badge>
                )}
                {isStaff && data.staff_role && (
                  <Badge variant="outline" className="rounded-full text-xs">{data.staff_role}</Badge>
                )}
              </div>
            </div>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)} className="shrink-0">
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <>
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={form.email || ''} disabled className="mt-1.5 bg-slate-50" />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your address" className="mt-1.5" />
              </div>
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Role Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Role / Title</Label>
                    <Input value={form.staff_role || ''} onChange={e => setForm({ ...form, staff_role: e.target.value })} placeholder="Groomer, Bather, Receptionist..." className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Qualification / Certifications</Label>
                    <Input value={form.qualification || ''} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. Pet Grooming Certificate" className="mt-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setForm(data); setEditing(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Account & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Full Name" value={data.full_name} icon={<User className="h-3.5 w-3.5 text-slate-400" />} />
              <InfoRow label="Email" value={data.email} icon={<Mail className="h-3.5 w-3.5 text-slate-400" />} />
              <InfoRow label="Phone" value={data.phone} icon={<Phone className="h-3.5 w-3.5 text-slate-400" />} />
              <InfoRow label="Address" value={data.address} icon={<MapPin className="h-3.5 w-3.5 text-slate-400" />} />
              <InfoRow label="Role" value={
                <span className="capitalize flex items-center gap-1.5">
                  {data.role !== 'admin' && data.role}
                  {isAdmin && <span className="bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded-full">Admin</span>}
                </span>
              } icon={<Shield className="h-3.5 w-3.5 text-slate-400" />} />
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Role Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Role / Title" value={data.staff_role} />
                <InfoRow label="Qualification" value={data.qualification} icon={<GraduationCap className="h-3.5 w-3.5 text-slate-400" />} />
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Admin Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">You have full administrative access to salon settings, team management, and all client data.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard/settings')}>
                  Go to Salon Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5 text-right max-w-[60%]">
        {icon}
        {value || <span className="text-slate-300">-</span>}
      </span>
    </div>
  );
}
