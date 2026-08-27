import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [printDataUrl, setPrintDataUrl] = useState(null);
  const navigate = useNavigate();
  const { showToast, showConfirm } = useToast();

  useEffect(() => {
    const handleAfterPrint = () => setPrintDataUrl(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Frame Builder States
  const [frames, setFrames] = useState([]);
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [frameImageFile, setFrameImageFile] = useState(null);
  const [frameImageUrl, setFrameImageUrl] = useState(null);
  const [frameDimensions, setFrameDimensions] = useState({ width: 0, height: 0 });
  const [slots, setSlots] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);
  const [isSavingFrame, setIsSavingFrame] = useState(false);
  
  const canvasRef = useRef(null);

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

  const fetchFrames = async () => {
    setLoadingFrames(true);
    try {
      const { data, error } = await supabase.storage.from('booth').list('frames/configs', {
        limit: 100,
      });
      if (error) throw error;
      
      const frameList = [];
      for (const file of data) {
        if (file.name.endsWith('.json')) {
          const { data: fileData, error: downloadError } = await supabase.storage.from('booth').download(`frames/configs/${file.name}`);
          if (downloadError) continue;
          const text = await fileData.text();
          try {
            const config = JSON.parse(text);
            frameList.push({ id: file.name, ...config });
          } catch (e) {
            console.error("Error parsing frame config", file.name);
          }
        }
      }
      setFrames(frameList);
    } catch (error) {
      console.error("Error fetching frames: ", error.message);
    } finally {
      setLoadingFrames(false);
    }
  };

  useEffect(() => {
    if (activeTab === "photos") {
      fetchPhotos();
    } else if (activeTab === "frames") {
      fetchFrames();
    }
  }, [activeTab]);

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

  const handleDelete = (id, url) => {
    showConfirm({
      title: "Hapus Foto",
      message: "Apakah Anda yakin ingin menghapus foto ini?",
      type: "danger",
      confirmText: "Ya, Hapus",
      onConfirm: async () => {
        try {
          const filePath = url.split('/public/booth/')[1];
          if (filePath) {
            await supabase.storage.from('booth').remove([filePath]);
          }
          const { error: dbError } = await supabase.from('photos').delete().eq('id', id);
          if (dbError) throw dbError;
          setSelectedPhotos(prev => prev.filter(pid => pid !== id));
          showToast("Foto berhasil dihapus.", "success");
          fetchPhotos();
        } catch (error) {
          console.error("Error deleting photo:", error.message);
          showToast("Gagal menghapus foto.", "error");
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    if (selectedPhotos.length === 0) return;
    showConfirm({
      title: "Hapus Foto Terpilih",
      message: `Hapus ${selectedPhotos.length} foto yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      type: "danger",
      confirmText: `Ya, Hapus ${selectedPhotos.length} Foto`,
      onConfirm: async () => {
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
        showToast(`${selectedPhotos.length} foto berhasil dihapus.`, "success");
        setSelectedPhotos([]);
        fetchPhotos();
      },
    });
  };

  const toggleSelect = (id) => {
    setSelectedPhotos(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handlePrintPhoto = (url) => {
    setPrintDataUrl(url);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(p => p.id));
    }
  };

  // --- Frame Builder Logic ---

  const handleFrameUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFrameImageFile(file);
    const url = URL.createObjectURL(file);
    setFrameImageUrl(url);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setFrameDimensions({ width: img.width, height: img.height });
      setSlots([]); // reset slots
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y)
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setSlots([...slots, currentRect]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleRemoveSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isAddingFrame) {
      const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !frameImageUrl) return;
        const ctx = canvas.getContext("2d");
        
        const img = new Image();
        img.src = frameImageUrl;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw a checkerboard pattern for transparency
          const checkerSize = 20;
          for (let y = 0; y < canvas.height; y += checkerSize) {
            for (let x = 0; x < canvas.width; x += checkerSize) {
              ctx.fillStyle = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0 ? '#ccc' : '#fff';
              ctx.fillRect(x, y, checkerSize, checkerSize);
            }
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Draw saved slots
          slots.forEach((slot, index) => {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 4;
            ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
            
            ctx.fillStyle = "red";
            ctx.font = "30px Arial";
            ctx.fillText(`Slot ${index + 1}`, slot.x + 10, slot.y + 40);
          });

          // Draw current rect
          if (isDrawing && currentRect) {
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 4;
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
          }
        };
      };
      drawCanvas();
    }
  }, [frameImageUrl, slots, currentRect, isDrawing, isAddingFrame]);

  const saveFrame = async () => {
    if (!frameImageFile || slots.length === 0) {
      showToast("Harap unggah gambar dan gambar setidaknya 1 kotak slot foto.", "warning");
      return;
    }
    setIsSavingFrame(true);
    try {
      const timestamp = Date.now();
      const imageExt = frameImageFile.name.split('.').pop() || 'png';
      const imageFileName = `frame_${timestamp}.${imageExt}`;
      const configFileName = `frame_${timestamp}.json`;

      // Upload image
      const { error: imgError } = await supabase.storage
        .from('booth')
        .upload(`frames/images/${imageFileName}`, frameImageFile, { contentType: frameImageFile.type });
      
      if (imgError) throw imgError;

      const { data: { publicUrl: imageUrl } } = supabase.storage.from('booth').getPublicUrl(`frames/images/${imageFileName}`);

      // Upload config
      const configObj = {
        name: `Custom Frame ${timestamp}`,
        width: frameDimensions.width,
        height: frameDimensions.height,
        imageUrl: imageUrl,
        imageFileName: imageFileName,
        slots: slots
      };

      const configBlob = new Blob([JSON.stringify(configObj)], { type: 'application/json' });
      const { error: configError } = await supabase.storage
        .from('booth')
        .upload(`frames/configs/${configFileName}`, configBlob, { contentType: 'application/json' });

      if (configError) throw configError;

      showToast("Frame berhasil disimpan!", "success");
      setIsAddingFrame(false);
      setFrameImageFile(null);
      setFrameImageUrl(null);
      setSlots([]);
      fetchFrames();
    } catch (error) {
      console.error("Error saving frame:", error);
      showToast("Gagal menyimpan frame.", "error");
    } finally {
      setIsSavingFrame(false);
    }
  };

  const handleDeleteFrame = (id, imageFileName) => {
    showConfirm({
      title: "Hapus Frame",
      message: "Yakin ingin menghapus frame ini? Tindakan ini tidak dapat dibatalkan.",
      type: "danger",
      confirmText: "Ya, Hapus Frame",
      onConfirm: async () => {
        try {
          await supabase.storage.from('booth').remove([`frames/configs/${id}`, `frames/images/${imageFileName}`]);
          showToast("Frame berhasil dihapus.", "success");
          fetchFrames();
        } catch (error) {
          console.error("Error deleting frame:", error);
          showToast("Gagal menghapus frame.", "error");
        }
      },
    });
  };

  return (
    <>
      {/* Hidden print area */}
      {printDataUrl && (
        <div className="print-area">
          <img src={printDataUrl} alt="Print" className="print-image" crossOrigin="anonymous" />
        </div>
      )}

      <div className="admin-page no-print">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h2 className="admin-title">Admin Dashboard</h2>
        </div>
        <div className="admin-header-right">
          <button onClick={handleLogout} className="admin-btn admin-btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Foto ({photos.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'frames' ? 'active' : ''}`}
          onClick={() => setActiveTab('frames')}
        >
          Manajemen Frame
        </button>
      </div>

      {/* Content Photos */}
      {activeTab === "photos" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar" style={{ marginTop: '1rem' }}>
            <button onClick={fetchPhotos} className="admin-btn admin-btn-refresh" title="Refresh">
              Refresh Foto
            </button>
            {photos.length > 0 && (
              <>
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
                    Hapus {selectedPhotos.length} Foto
                  </button>
                )}
              </>
            )}
          </div>

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
                  <div className="admin-card-check">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={() => toggleSelect(photo.id)}
                    />
                  </div>
                  <div className="admin-card-img-wrap">
                    <img src={photo.url} alt="Photobooth" className="admin-card-img" />
                  </div>
                  <div className="admin-card-info">
                    <span className="admin-card-date">
                      {photo.created_at ? new Date(photo.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                  <div className="admin-card-actions">
                    <button onClick={() => handlePrintPhoto(photo.url)} className="admin-action-btn" style={{ background: '#e3f2fd', color: '#1976d2' }}>Cetak</button>
                    <button onClick={() => handleDownload(photo.url)} className="admin-action-btn admin-action-download">Unduh</button>
                    <button onClick={() => handleDelete(photo.id, photo.url)} className="admin-action-btn admin-action-delete">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Frames */}
      {activeTab === "frames" && (
        <div className="admin-tab-content">
          {!isAddingFrame ? (
            <>
              <div className="admin-toolbar" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
                <div>
                  <button onClick={fetchFrames} className="admin-btn admin-btn-refresh" style={{ marginRight: '1rem' }}>
                    Refresh Frames
                  </button>
                  <button onClick={() => setIsAddingFrame(true)} className="admin-btn" style={{ background: '#2d9c9c', color: 'white' }}>
                    + Tambah Frame Kustom
                  </button>
                </div>
              </div>

              {loadingFrames ? (
                <div className="admin-loading">
                  <div className="admin-spinner"></div>
                  <p>Memuat frame...</p>
                </div>
              ) : frames.length === 0 ? (
                <div className="admin-empty">
                  <h3>Belum Ada Frame Kustom</h3>
                  <p>Klik "Tambah Frame Kustom" untuk membuat frame baru.</p>
                </div>
              ) : (
                <div className="admin-grid">
                  {frames.map((frame) => (
                    <div key={frame.id} className="admin-card">
                      <div className="admin-card-img-wrap" style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px' }}>
                        <img src={frame.imageUrl} alt="Frame" className="admin-card-img" style={{ objectFit: 'contain' }} />
                      </div>
                      <div className="admin-card-info">
                        <span className="admin-card-date">
                          {frame.slots.length} Slot Foto
                        </span>
                      </div>
                      <div className="admin-card-actions">
                        <button onClick={() => handleDeleteFrame(frame.id, frame.imageFileName)} className="admin-action-btn admin-action-delete">
                          Hapus Frame
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="frame-builder">
              <div className="admin-toolbar" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
                <button onClick={() => setIsAddingFrame(false)} className="admin-btn admin-btn-logout">
                  Batal
                </button>
                <button onClick={saveFrame} disabled={isSavingFrame} className="admin-btn" style={{ background: '#2d9c9c', color: 'white' }}>
                  {isSavingFrame ? "Menyimpan..." : "Simpan Frame"}
                </button>
              </div>

              <div className="frame-builder-content">
                <div className="frame-builder-sidebar">
                  <h3>Frame Builder</h3>
                  <p className="frame-builder-help">
                    1. Unggah gambar frame Anda (format PNG transparan dianjurkan).
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="file" accept="image/png, image/jpeg" onChange={handleFrameUpload} />
                    {frameImageUrl && (
                      <button
                        onClick={() => {
                          if (frameImageUrl) URL.revokeObjectURL(frameImageUrl);
                          setFrameImageFile(null);
                          setFrameImageUrl(null);
                          setFrameDimensions({ width: 0, height: 0 });
                          setSlots([]);
                        }}
                        className="admin-btn admin-btn-delete-bulk"
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                  
                  {frameImageUrl && (
                    <>
                      <p className="frame-builder-help">
                        2. Klik dan tarik (drag) pada gambar di samping untuk menggambar kotak tempat foto akan muncul.
                      </p>
                      
                      <div className="frame-slots-list">
                        <h4>Slot Foto: {slots.length}</h4>
                        {slots.map((slot, i) => (
                          <div key={i} className="frame-slot-item">
                            <span>Slot {i + 1} ({Math.round(slot.width)}x{Math.round(slot.height)})</span>
                            <button onClick={() => handleRemoveSlot(i)} className="admin-btn admin-btn-logout" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="frame-builder-canvas-container">
                  {frameImageUrl ? (
                    <canvas
                      ref={canvasRef}
                      width={frameDimensions.width}
                      height={frameDimensions.height}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      style={{ 
                        width: '100%', 
                        maxWidth: '800px', 
                        height: 'auto', 
                        cursor: 'crosshair',
                        border: '1px solid #ccc',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div className="frame-builder-placeholder">
                      Area Pratinjau Frame
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}
