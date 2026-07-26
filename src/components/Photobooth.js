import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const frameOptions = [
  "/assets/frames/frame-2.png",
  "/assets/frames/frame-3.png",
  "/assets/frames/frame-4.png",
  "/assets/frames/frame-5.png",
  "/assets/frames/frame-6.png",
  "/assets/frames/frame-7.png",
  "/assets/frames/frame-8.png",
  "/assets/frames/frame-9.png",
  "/assets/frames/frame-10.png",
];

const stickerOptions = [];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };

const getFrameDimensions = (src) => {
  if (!src) return { width: 1200, height: 3000 };
  if (src.includes("heart-frame")) {
    return { width: 1200, height: 3000 };
  }
  return { width: 1181, height: 1772 };
};

const getFrameSlots = (src) => {
  const heartSlots = [
    { x: 123, y: 78, width: 953, height: 599 },
    { x: 123, y: 697, width: 953, height: 599 },
    { x: 123, y: 1286, width: 953, height: 599 },
    { x: 123, y: 1885, width: 953, height: 599 },
  ];
  if (!src) return heartSlots;
  if (src.includes("heart-frame")) return heartSlots;

  const expand = (slots) =>
    slots.map((s) => ({
      x: s.x - 20,
      y: s.y - 20,
      width: s.width + 40,
      height: s.height + 40,
    }));

  if (src.includes("frame-1.png") || src.includes("frame-3.png")) {
    return expand([
      { x: 115, y: 209, width: 951, height: 603 },
      { x: 98, y: 1019, width: 951, height: 619 },
    ]);
  }
  if (src.includes("frame-2.png")) {
    return expand([
      { x: 72, y: 162, width: 1019, height: 672 },
      { x: 68, y: 887, width: 1021, height: 673 },
    ]);
  }
  if (src.includes("frame-4.png")) {
    return expand([
      { x: 56, y: 125, width: 1060, height: 698 },
      { x: 61, y: 873, width: 1060, height: 698 },
    ]);
  }
  if (src.includes("frame-5.png")) {
    return expand([
      { x: 56, y: 124, width: 1059, height: 705 },
      { x: 56, y: 861, width: 1061, height: 713 },
    ]);
  }
  if (src.includes("frame-6.png")) {
    return expand([
      { x: 72, y: 327, width: 1040, height: 641 },
      { x: 72, y: 1012, width: 1040, height: 641 },
    ]);
  }
  if (src.includes("frame-7.png")) {
    return expand([{ x: 67, y: 562, width: 1049, height: 710 }]);
  }
  if (src.includes("frame-8.png")) {
    return expand([{ x: 55, y: 493, width: 1072, height: 692 }]);
  }
  if (src.includes("frame-9.png")) {
    return expand([
      { x: 172, y: 190, width: 825, height: 605 },
      { x: 172, y: 1016, width: 825, height: 605 },
    ]);
  }
  if (src.includes("frame-10.png")) {
    return expand([
      { x: 169, y: 198, width: 853, height: 585 },
      { x: 178, y: 975, width: 853, height: 584 },
    ]);
  }

  return heartSlots;
};

export default function PhotoBooth() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const frameImgRef = useRef(null);

  const [selectedFrame, setSelectedFrame] = useState(null);
  const slots = getFrameSlots(selectedFrame);

  const [mode, setMode] = useState("photo");

  const [photos, setPhotos] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [canTakePhoto, setCanTakePhoto] = useState(true);
  const [draggingPhoto, setDraggingPhoto] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [countdown, setCountdown] = useState(null);

  const [stickers, setStickers] = useState([]);
  const [draggingSticker, setDraggingSticker] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);

  // useEffects

  // frames
  useEffect(() => {
    if (!selectedFrame) return;
    const img = new Image();
    img.src = selectedFrame;

    img.onload = () => {
      frameImgRef.current = img;
      drawCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFrame]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImgRef.current) return;

    const ctx = canvas.getContext("2d");

    const { width: frameWidth, height: frameHeight } =
      getFrameDimensions(selectedFrame);
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    photos.forEach((p) => {
      const slot = slots[p.slotIndex];
      const drawW = p.img.width * p.scale;
      const drawH = p.img.height * p.scale;
      const dx = slot.x + p.offsetX;
      const dy = slot.y + p.offsetY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
      ctx.clip();
      ctx.drawImage(p.img, dx, dy, drawW, drawH);
      ctx.restore();
    });
    ctx.drawImage(frameImgRef.current, 0, 0, frameWidth, frameHeight);

    stickers.forEach((s, i) => {
      ctx.drawImage(s.img, s.x, s.y, 150, 150);
      if (i === selectedSticker) {
        ctx.strokeStyle = "#e8763a";
        ctx.lineWidth = 4;
        ctx.strokeRect(s.x, s.y, 150, 150);
      }
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(drawCanvas, [photos, stickers, selectedSticker, photoCount]);

  const handleBack = () => {
    if (mode === "decorate") {
      setMode("photo");
      setCanTakePhoto(false);
      setStickers([]);
      setSelectedSticker(null);
    } else {
      setSelectedFrame(null);
      setPhotos([]);
      setPhotoCount(0);
      setStickers([]);
      setSelectedSticker(null);
      setMode("photo");
      setCanTakePhoto(true);
    }
  };

  // photos
  const addPhoto = (img) => {
    const slot = slots[photoCount];
    if (!slot) return;

    const scaleX = slot.width / img.width;
    const scaleY = slot.height / img.height;
    const scale = Math.max(scaleX, scaleY);

    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (slot.width - drawW) / 2;
    const offsetY = (slot.height - drawH) / 2;

    setPhotos((p) => [
      ...p,
      { img, slotIndex: photoCount, scale, offsetX, offsetY },
    ]);

    setCanTakePhoto(true);

    setPhotoCount((c) => {
      const next = c + 1;
      if (next === slots.length) setMode("decorate");
      return next;
    });
  };

  const takePhotoNow = () => {
    const src = webcamRef.current.getScreenshot();
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => addPhoto(img);
  };

  const capturePhoto = () => {
    if (!canTakePhoto || countdown !== null) return;

    setCanTakePhoto(false);
    setCountdown(3);

    let current = 3;
    const interval = setInterval(() => {
      current -= 1;

      if (current === 0) {
        clearInterval(interval);
        setCountdown(null);
        takePhotoNow();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const uploadPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => addPhoto(img);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const redoLastPhoto = () => {
    if (!photos.length) return;
    setPhotos((p) => p.slice(0, -1));
    setPhotoCount((c) => Math.max(0, c - 1));
    setCanTakePhoto(true);
  };

  const getCoords = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current.height / r.height),
    };
  };

  // drag photos
  const handleMouseDown = (e) => {
    const { x, y } = getCoords(e);
    if (mode === "photo") {
      for (let i = photos.length - 1; i >= 0; i--) {
        const p = photos[i];
        const slot = slots[p.slotIndex];
        const w = p.img.width * p.scale;
        const h = p.img.height * p.scale;

        if (
          x >= slot.x + p.offsetX &&
          x <= slot.x + p.offsetX + w &&
          y >= slot.y + p.offsetY &&
          y <= slot.y + p.offsetY + h
        ) {
          setDraggingPhoto(i);
          setDragOffset({
            x: x - slot.x - p.offsetX,
            y: y - slot.y - p.offsetY,
          });
          return;
        }
      }
    }

    if (mode === "decorate") {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        if (x >= s.x && x <= s.x + 150 && y >= s.y && y <= s.y + 150) {
          setDraggingSticker(i);
          setSelectedSticker(i);
          setDragOffset({ x: x - s.x, y: y - s.y });
          return;
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoords(e);

    if (draggingPhoto !== null && mode === "photo") {
      setPhotos((prev) => {
        const updated = [...prev];
        const p = updated[draggingPhoto];
        const slot = slots[p.slotIndex];
        const w = p.img.width * p.scale;
        const h = p.img.height * p.scale;

        p.offsetX = x - slot.x - dragOffset.x;
        p.offsetY = y - slot.y - dragOffset.y;
        p.offsetX = Math.min(Math.max(p.offsetX, slot.width - w), 0);
        p.offsetY = Math.min(Math.max(p.offsetY, slot.height - h), 0);

        return updated;
      });
    }

    if (draggingSticker != null && mode === "decorate") {
      setStickers((s) => {
        const u = [...s];
        u[draggingSticker] = {
          ...u[draggingSticker],
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        return u;
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingPhoto(null);
    setDraggingSticker(null);
  };

  // add Sticker
  const addSticker = (src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => setStickers((s) => [...s, { img, x: 400, y: 100 }]);
  };

  // delete Sticker
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedSticker != null &&
        mode === "decorate"
      ) {
        setStickers((s) => s.filter((_, i) => i !== selectedSticker));
        setSelectedSticker(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSticker, mode]);

  //download

  const downloadPhoto = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image.png");
    a.download = "photo-strip.png";
    a.click();
  };

  const canvasDisplayStyle = {};
  if (selectedFrame && !selectedFrame.includes("heart-frame")) {
    canvasDisplayStyle.width = (1181 / 1772) * 500;
    canvasDisplayStyle.height = 500;
  } else {
    canvasDisplayStyle.width = 200;
    canvasDisplayStyle.height = 500;
  }

  return (
    <div className="photobooth-center">
      {/* top bar with back btn and text */}
      <div className="photobooth-topbar">
        {selectedFrame && (
          <button
            className="photobooth-btn photobooth-btn-back"
            onClick={handleBack}
          >
            {" "}
            ← Back
          </button>
        )}

        <h1 className="photobooth-topbar-title">
          {!selectedFrame
            ? "Select a frame"
            : mode === "photo"
              ? "⋆｡‧˚ʚ Smile :)ɞ˚‧｡⋆"
              : ". ݁₊ ⊹ . ݁Let's decorate . ⊹ ₊ ݁."}
        </h1>
      </div>
      <div className="photobooth-main">
        {!selectedFrame ? (
          <div className="photobooth-frame-grid">
            {frameOptions.map((src) => {
              const isSelected = selectedFrame === src;

              return (
                <img
                  key={src}
                  src={src}
                  alt="frame"
                  onClick={() => setSelectedFrame(src)}
                  className={`photobooth-frame-thumb${isSelected ? " selected" : ""}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="photobooth-capture">
            <div className="photobooth-webcam-panel">
              {mode === "photo" && (
                <>
                  <div className="photobooth-webcam-wrap">
                    {/* Webcam */}
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/png"
                      videoConstraints={videoConstraints}
                      mirrored={true}
                    />

                    {/* Overlay countdown */}
                    {countdown != null && (
                      <div className="photobooth-countdown">{countdown}</div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="photobooth-btn-row">
                    {canTakePhoto && (
                      <>
                        <button
                          className="photobooth-btn"
                          onClick={capturePhoto}
                        >
                          Take Photo
                        </button>
                        <label
                          className="photobooth-btn"
                          style={{ cursor: "pointer" }}
                        >
                          Upload
                          <input
                            type="file"
                            accept="image /*"
                            onChange={uploadPhoto}
                            style={{ display: "none" }}
                          />
                        </label>
                      </>
                    )}
                    {/* redo btn */}
                    {photoCount > 0 && (
                      <button
                        className="photobooth-btn photobooth-btn-redo"
                        onClick={redoLastPhoto}
                      >
                        ⟳
                      </button>
                    )}
                  </div>
                </>
              )}

              {mode === "decorate" && (
                <div className="photobooth-sticker-grid">
                  {stickerOptions.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="sticker"
                      onClick={() => addSticker(src)}
                      className="photobooth-sticker"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Display frame */}
            <div className="photobooth-canvas-panel">
              <canvas
                ref={canvasRef}
                className="photobooth-canvas"
                style={canvasDisplayStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />

              {mode === "decorate" && (
                <div className="photobooth-btn-download">
                  <button className="photobooth-btn" onClick={downloadPhoto}>
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
