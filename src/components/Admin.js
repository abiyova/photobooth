import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const navigate = useNavigate();

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos: ", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `photobooth_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(url, '_blank'); // fallback
    }
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;
    try {
      const filePath = url.split('/public/booth/')[1];
      if (filePath) {
        await supabase.storage.from('booth').remove([filePath]);
      }
      const { error: dbError } = await supabase.from('photos').delete().eq('id', id);
      if (dbError) throw dbError;
      setSelectedPhotos(prev => prev.filter(pid => pid !== id));
      fetchPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error.message);
      alert("Gagal menghapus foto.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!window.confirm(`Hapus ${selectedPhotos.length} foto yang dipilih?`)) return;

    for (const id of selectedPhotos) {
      const photo = photos.find(p => p.id === id);
      if (photo) {
        try {
          const filePath = photo.url.split('/public/booth/')[1];
          if (filePath) {
            await supabase.storage.from('booth').remove([filePath]);
          }
          await supabase.from('photos').delete().eq('id', id);
        } catch (err) {
          console.error("Error deleting:", err);
        }
      }
    }
    setSelectedPhotos([]);
    fetchPhotos();
  };

  const toggleSelect = (id) => {
    setSelectedPhotos(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(p => p.id));
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h2 className="admin-title">Admin Dashboard</h2>
          <span className="admin-badge">{photos.length} Foto</span>
        </div>
        <div className="admin-header-right">
          <button onClick={fetchPhotos} className="admin-btn admin-btn-refresh" title="Refresh">
            Refresh
          </button>
          <button onClick={handleLogout} className="admin-btn admin-btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {photos.length > 0 && (
        <div className="admin-toolbar">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={selectedPhotos.length === photos.length && photos.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Pilih Semua</span>
          </label>
          {selectedPhotos.length > 0 && (
            <button onClick={handleDeleteSelected} className="admin-btn admin-btn-delete-bulk">
              Hapus {selectedPhotos.length} Foto Terpilih
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Memuat foto...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon"></span>
          <h3>Belum Ada Foto</h3>
          <p>Foto dari sesi photobooth akan muncul di sini.</p>
        </div>
      ) : (
        <div className="admin-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`admin-card ${selectedPhotos.includes(photo.id) ? 'admin-card-selected' : ''}`}
            >
              {/* Checkbox */}
              <div className="admin-card-check">
                <input
                  type="checkbox"
                  checked={selectedPhotos.includes(photo.id)}
                  onChange={() => toggleSelect(photo.id)}
                />
              </div>

              {/* Image */}
              <div className="admin-card-img-wrap">
                <img src={photo.url} alt="Photobooth" className="admin-card-img" />
              </div>

              {/* Info */}
              <div className="admin-card-info">
                <span className="admin-card-date">
                  {photo.created_at ? new Date(photo.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>

              {/* Actions */}
              <div className="admin-card-actions">
                <button onClick={() => handleDownload(photo.url)} className="admin-action-btn admin-action-download">
                  Unduh
                </button>
                <button onClick={() => handleDelete(photo.id, photo.url)} className="admin-action-btn admin-action-delete">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
