import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Folder,
  Heart,
  Home,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import "./App.css";

function App() {
  const today = new Date().getDate();

  const [page, setPage] = useState("review");
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedMoments, setSavedMoments] = useState([]);
  const [history, setHistory] = useState([]);
  const [pendingMoment, setPendingMoment] = useState(null);

  const [note, setNote] = useState("");
  const [treasured, setTreasured] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [startX, setStartX] = useState(null);
  const [dragX, setDragX] = useState(0);

  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);

  const [dailyRecapMade, setDailyRecapMade] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState([]);

  const [recapMode, setRecapMode] = useState("weekly");
  const [recapIndex, setRecapIndex] = useState(0);
  const [recapView, setRecapView] = useState("video");

  const [selectedDay, setSelectedDay] = useState(today);
  const [archiveIndex, setArchiveIndex] = useState(0);

  const currentPhoto = photos[currentIndex];
  const finishedReview = photos.length > 0 && currentIndex >= photos.length;

  const todayMoments = useMemo(() => {
    return savedMoments.filter((moment) => {
      const date = new Date(moment.createdAt);
      return date.getDate() === today;
    });
  }, [savedMoments, today]);

  const recapMoments = useMemo(() => {
    const now = new Date();

    if (recapMode === "weekly") {
      return savedMoments.filter((moment) => {
        const diff =
          (now.getTime() - new Date(moment.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return diff <= 7;
      });
    }

    return savedMoments.filter((moment) => {
      const date = new Date(moment.createdAt);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [savedMoments, recapMode]);

  const treasuredMoments = useMemo(() => {
    return savedMoments.filter((moment) => moment.treasured);
  }, [savedMoments]);

  const folders = useMemo(() => {
    const grouped = {};

    savedMoments.forEach((moment) => {
      const folder = moment.folder || "uncategorized";
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(moment);
    });

    return grouped;
  }, [savedMoments]);

  const archiveMoments = useMemo(() => {
    return savedMoments.filter((moment) => {
      const date = new Date(moment.createdAt);
      return date.getDate() === selectedDay;
    });
  }, [savedMoments, selectedDay]);

  const activeArchiveMoment =
    archiveMoments.length > 0
      ? archiveMoments[archiveIndex % archiveMoments.length]
      : null;

  const homePreviewImages =
    todayMoments.length > 0
      ? todayMoments
      : previewPhotos.length > 0
        ? previewPhotos
        : [];

  const homePreviewImage =
    homePreviewImages.length > 0 ? homePreviewImages[0].image : null;

  useEffect(() => {
    if (!loading) return;

    const flashSource =
      todayMoments.length > 0
        ? todayMoments
        : previewPhotos.length > 0
          ? previewPhotos
          : [];

    if (flashSource.length === 0) {
      setLoading(false);
      setDailyRecapMade(true);
      setPage("recap");
      return;
    }

    const flashTimer = setInterval(() => {
      setFlashIndex((current) => (current + 1) % flashSource.length);
    }, 900);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1600);

    const finishTimer = setTimeout(() => {
      clearInterval(flashTimer);
      setLoading(false);
      setFadeOut(false);
      setDailyRecapMade(true);
      setPage("recap");
      setRecapMode("weekly");
      setRecapView("video");
      setRecapIndex(0);
      setPhotos([]);
      setCurrentIndex(0);
      setPendingMoment(null);
    }, 2400);

    return () => {
      clearInterval(flashTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [loading, todayMoments, previewPhotos]);

  useEffect(() => {
    if (page !== "recap") return;
    if (recapView !== "video") return;
    if (recapMoments.length === 0) return;

    const videoTimer = setInterval(() => {
      setRecapIndex((current) => (current + 1) % recapMoments.length);
    }, 1000);

    return () => clearInterval(videoTimer);
  }, [page, recapView, recapMoments.length]);

  function handlePhotoReview(event) {
    const files = Array.from(event.target.files || []);

    const reviewedPhotos = files
      .map((file, index) => {
        const photoDate = new Date(file.lastModified || Date.now());

        return {
          id: `${Date.now()}-${index}`,
          image: URL.createObjectURL(file),
          createdAt: photoDate.toISOString(),
          time: photoDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          scene: "today",
          originalFileName: file.name,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setPhotos(reviewedPhotos);
    setPreviewPhotos(reviewedPhotos);
    setCurrentIndex(0);
    setPendingMoment(null);
    setHistory([]);
    setNote("");
    setFolderName("");
    setShowFolderInput(false);
    setTreasured(false);
    setDailyRecapMade(false);
  }

  function skipPhoto() {
    if (!currentPhoto) return;

    setHistory((current) => [
      ...current,
      {
        type: "skip",
        index: currentIndex,
        photo: currentPhoto,
      },
    ]);

    setCurrentIndex((current) => current + 1);
    setDragX(0);
  }

  function removeCurrentPhotoFromReview() {
    if (!currentPhoto) return;

    setHistory((current) => [
      ...current,
      {
        type: "trash",
        index: currentIndex,
        photo: currentPhoto,
      },
    ]);

    setPhotos((current) =>
      current.filter((photo) => photo.id !== currentPhoto.id)
    );

    setPreviewPhotos((current) =>
      current.filter((photo) => photo.id !== currentPhoto.id)
    );

    setDragX(0);
  }

  function keepPhoto() {
    if (!currentPhoto) return;

    setPendingMoment(currentPhoto);
    setNote("");
    setTreasured(false);
    setFolderName("");
    setShowFolderInput(false);
    setDragX(0);
  }

  function savePendingMoment() {
    if (!pendingMoment) return;

    const saved = {
      ...pendingMoment,
      note,
      treasured,
      folder: folderName.trim(),
    };

    setSavedMoments((current) => [...current, saved]);

    setHistory((current) => [
      ...current,
      {
        type: "keep",
        index: currentIndex,
        saved,
      },
    ]);

    setPendingMoment(null);
    setCurrentIndex((current) => current + 1);
    setNote("");
    setFolderName("");
    setShowFolderInput(false);
    setTreasured(false);
  }

  function deletePendingMoment() {
    if (!pendingMoment) return;

    setHistory((current) => [
      ...current,
      {
        type: "delete",
        index: currentIndex,
        photo: pendingMoment,
      },
    ]);

    setPendingMoment(null);
    setCurrentIndex((current) => current + 1);
    setNote("");
    setFolderName("");
    setShowFolderInput(false);
    setTreasured(false);
  }

  function undoLastAction() {
    const lastAction = history[history.length - 1];
    if (!lastAction) return;

    setHistory((current) => current.slice(0, -1));
    setPendingMoment(null);
    setNote("");
    setFolderName("");
    setShowFolderInput(false);
    setTreasured(false);

    if (lastAction.type === "keep") {
      setSavedMoments((current) =>
        current.filter((moment) => moment.id !== lastAction.saved.id)
      );
      setCurrentIndex(lastAction.index);
      return;
    }

    if (lastAction.type === "trash") {
      setPhotos((current) => {
        const restored = [...current];
        restored.splice(lastAction.index, 0, lastAction.photo);
        return restored;
      });

      setPreviewPhotos((current) => {
        const restored = [...current];
        restored.splice(lastAction.index, 0, lastAction.photo);
        return restored;
      });

      setCurrentIndex(lastAction.index);
      return;
    }

    setCurrentIndex(lastAction.index);
  }

  function handlePointerDown(event) {
    setStartX(event.clientX);
  }

  function handlePointerMove(event) {
    if (startX === null) return;
    setDragX(event.clientX - startX);
  }

  function handlePointerUp() {
    if (dragX > 90) {
      keepPhoto();
    } else if (dragX < -90) {
      skipPhoto();
    } else {
      setDragX(0);
    }

    setStartX(null);
  }

  function createWeeklyRecap() {
    setLoading(true);
    setFadeOut(false);
    setFlashIndex(0);
  }

  function nextRecap() {
    if (recapMoments.length === 0) return;
    setRecapIndex((current) => (current + 1) % recapMoments.length);
  }

  function prevRecap() {
    if (recapMoments.length === 0) return;
    setRecapIndex((current) =>
      current === 0 ? recapMoments.length - 1 : current - 1
    );
  }

  function nextTreasure() {
    if (treasuredMoments.length === 0) return;
    setRecapIndex((current) => (current + 1) % treasuredMoments.length);
  }

  function prevTreasure() {
    if (treasuredMoments.length === 0) return;
    setRecapIndex((current) =>
      current === 0 ? treasuredMoments.length - 1 : current - 1
    );
  }

  function nextArchive() {
    if (archiveMoments.length === 0) return;
    setArchiveIndex((current) => (current + 1) % archiveMoments.length);
  }

  function prevArchive() {
    if (archiveMoments.length === 0) return;
    setArchiveIndex((current) =>
      current === 0 ? archiveMoments.length - 1 : current - 1
    );
  }

  function selectDay(day) {
    setSelectedDay(day);
    setArchiveIndex(0);
  }

  function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    const flashSource =
      todayMoments.length > 0
        ? todayMoments
        : previewPhotos.length > 0
          ? previewPhotos
          : [];

    const activeFlash =
      flashSource.length > 0
        ? flashSource[flashIndex % flashSource.length]
        : null;

    const previousFlash =
      flashSource.length > 0
        ? flashSource[
        (flashIndex - 1 + flashSource.length) % flashSource.length
        ]
        : null;

    return (
      <main className="min-h-screen bg-black flex justify-center">
        <style>
          {`
            @keyframes memoryFadeIn {
              0% { opacity: 0; transform: scale(1.04); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>

        <section
          className={`w-full max-w-[430px] h-screen relative overflow-hidden transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"
            }`}
        >
          {previousFlash && (
            <img
              src={previousFlash.image}
              alt="Previous flashback"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
            />
          )}

          {activeFlash && (
            <img
              key={activeFlash.id}
              src={activeFlash.image}
              alt="Flashback"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ animation: "memoryFadeIn 900ms ease-in-out forwards" }}
            />
          )}

          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

          <div className="absolute bottom-8 left-5 right-5 text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">
              flashback
            </p>
            <h1 className="text-xl font-medium mt-1">
              Building your weekly recap.
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] text-[#1c1c1e] flex justify-center">
      <section className="w-full max-w-[430px] h-screen bg-[#f8f8f8] shadow-2xl flex flex-col relative overflow-hidden">
        <header className="px-4 pt-4 pb-1 flex items-center justify-between shrink-0">
          <div>
            <p className="font-serif text-2xl tracking-tight text-stone-700">
              notice
            </p>
            <p className="text-[10px] text-stone-400">
              photos into memories
            </p>
          </div>

          <button className="w-8 h-8 rounded-full bg-white shadow-sm grid place-items-center">
            <Bell size={14} />
          </button>
        </header>

        <section className="flex-1 px-3 pb-20 overflow-hidden">
          {page === "review" && (
            <div className="h-full flex flex-col gap-2">
              {!currentPhoto && !pendingMoment && !finishedReview && (
                <>
                  <div className="rounded-2xl bg-white/70 border border-stone-100 px-3 py-2 shadow-sm shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-stone-600">
                          Tonight’s Notice
                        </p>
                        <p className="text-[10px] text-stone-400">
                          review what’s worth keeping
                        </p>
                      </div>

                      <button
                        onClick={undoLastAction}
                        disabled={history.length === 0}
                        className="w-8 h-8 rounded-full bg-stone-100 grid place-items-center disabled:opacity-30"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 rounded-[1.7rem] overflow-hidden relative border border-stone-100 shadow-sm bg-stone-200">
                    {homePreviewImage ? (
                      <>
                        <img
                          src={homePreviewImage}
                          alt="Today preview"
                          className="absolute inset-0 w-full h-full object-cover scale-105"
                        />
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
                    )}

                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                          today
                        </p>
                        <h1 className="text-xl font-medium mt-1 text-stone-800 max-w-[260px]">
                          {dailyRecapMade
                            ? "Your week is taking shape."
                            : "Look back quietly."}
                        </h1>
                        <p className="text-xs text-stone-500 mt-1 max-w-[230px]">
                          {dailyRecapMade
                            ? "add more photos or watch recap"
                            : "keep what matters, skip the rest"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block rounded-2xl bg-white/75 backdrop-blur px-3 py-3 cursor-pointer shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1c1c1e] text-white grid place-items-center">
                              <ImagePlus size={15} />
                            </div>
                            <div>
                              <p className="font-medium text-xs text-stone-800">
                                Review today’s photos
                              </p>
                              <p className="text-[10px] text-stone-400">
                                sorted by photo date
                              </p>
                            </div>
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoReview}
                            className="hidden"
                          />
                        </label>

                        {savedMoments.length > 0 && (
                          <button
                            onClick={() => {
                              setRecapMode("weekly");
                              setRecapView("video");
                              setRecapIndex(0);
                              setPage("recap");
                            }}
                            className="w-full rounded-2xl bg-white/55 backdrop-blur px-3 py-3 text-left shadow-sm"
                          >
                            <p className="font-medium text-xs text-stone-800">
                              Watch weekly recap
                            </p>
                            <p className="text-[10px] text-stone-400">
                              one photo per second
                            </p>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentPhoto && !pendingMoment && (
                <>
                  <div className="rounded-2xl bg-white/70 border border-stone-100 px-3 py-2 shadow-sm shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-stone-600">
                          Review
                        </p>
                        <p className="text-[10px] text-stone-400">
                          left skip · right keep
                        </p>
                      </div>

                      <button
                        onClick={undoLastAction}
                        disabled={history.length === 0}
                        className="w-8 h-8 rounded-full bg-stone-100 grid place-items-center disabled:opacity-30"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-stone-400 px-1 shrink-0 flex justify-between">
                    <span>
                      {currentIndex + 1}/{photos.length}
                    </span>
                    <span>{formatDate(currentPhoto.createdAt)}</span>
                  </div>

                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="relative flex-1 min-h-0 touch-none"
                  >
                    <div
                      className="absolute inset-0 rounded-[1.8rem] overflow-hidden bg-white border border-stone-100 shadow-lg transition-transform"
                      style={{
                        transform: `translateX(${dragX}px) rotate(${dragX / 18
                          }deg)`,
                      }}
                    >
                      <img
                        src={currentPhoto.image}
                        alt="Review photo"
                        className="w-full h-full object-cover"
                        draggable="false"
                      />

                      <button
                        onClick={removeCurrentPhotoFromReview}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/75 backdrop-blur grid place-items-center text-stone-700"
                        title="Remove from review"
                      >
                        <Trash2 size={16} />
                      </button>

                      {dragX > 40 && (
                        <div className="absolute top-12 left-5 rounded-2xl border-2 border-green-500 bg-white/80 px-3 py-1.5 text-green-600 text-sm font-bold rotate-[-10deg]">
                          KEEP
                        </div>
                      )}

                      {dragX < -40 && (
                        <div className="absolute top-12 right-5 rounded-2xl border-2 border-red-500 bg-white/80 px-3 py-1.5 text-red-600 text-sm font-bold rotate-[10deg]">
                          SKIP
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={skipPhoto}
                      className="rounded-2xl bg-white border border-stone-200 py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium text-stone-600"
                    >
                      <X size={16} />
                      Skip
                    </button>

                    <button
                      onClick={keepPhoto}
                      className="rounded-2xl bg-[#1c1c1e] text-white py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium"
                    >
                      <Sparkles size={16} />
                      Keep
                    </button>
                  </div>
                </>
              )}

              {pendingMoment && (
                <div className="flex-1 min-h-0 rounded-[1.8rem] bg-white shadow-lg border border-stone-100 overflow-hidden flex flex-col">
                  <img
                    src={pendingMoment.image}
                    alt="Chosen memory"
                    className="w-full h-[62%] object-cover shrink-0"
                  />

                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div>
                      <p className="text-xs font-medium text-stone-600">
                        Quick note
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {formatDate(pendingMoment.createdAt)}
                      </p>
                    </div>

                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="type a sentence..."
                      className="w-full rounded-2xl bg-stone-100 px-3 py-2.5 text-xs outline-none"
                    />

                    {showFolderInput && (
                      <input
                        value={folderName}
                        onChange={(event) => setFolderName(event.target.value)}
                        placeholder="friends, food, school..."
                        className="w-full rounded-2xl bg-stone-100 px-3 py-2.5 text-xs outline-none"
                      />
                    )}

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setTreasured((current) => !current)}
                        className={`w-11 h-11 rounded-full grid place-items-center ${treasured
                          ? "bg-[#1c1c1e] text-white"
                          : "bg-stone-100 text-stone-700"
                          }`}
                        title="Heart"
                      >
                        <Heart size={17} />
                      </button>

                      <button
                        onClick={() =>
                          setShowFolderInput((current) => !current)
                        }
                        className={`w-11 h-11 rounded-full grid place-items-center ${showFolderInput
                          ? "bg-[#1c1c1e] text-white"
                          : "bg-stone-100 text-stone-700"
                          }`}
                        title="Folder"
                      >
                        <Folder size={17} />
                      </button>

                      <button
                        onClick={deletePendingMoment}
                        className="w-11 h-11 rounded-full grid place-items-center bg-stone-100 text-stone-700"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => setPendingMoment(null)}
                        className="rounded-2xl bg-stone-100 py-2.5 text-xs font-medium"
                      >
                        Back
                      </button>

                      <button
                        onClick={savePendingMoment}
                        className="rounded-2xl bg-[#1c1c1e] text-white py-2.5 text-xs font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {finishedReview && (
                <div className="flex-1 rounded-[1.8rem] overflow-hidden relative border border-stone-100 shadow-sm bg-stone-200">
                  {homePreviewImage ? (
                    <>
                      <img
                        src={homePreviewImage}
                        alt="Finished review"
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                      />
                      <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
                  )}

                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                        week
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {savedMoments.length} memories saved
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <button
                        onClick={createWeeklyRecap}
                        className="rounded-[1.7rem] bg-white/80 backdrop-blur px-8 py-6 shadow-sm active:scale-[0.98] transition"
                      >
                        <p className="text-xl font-medium text-stone-800">
                          Watch weekly recap
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          one photo per second
                        </p>
                      </button>
                    </div>

                    <label className="block rounded-2xl bg-white/55 backdrop-blur px-3 py-3 text-center shadow-sm cursor-pointer">
                      <p className="font-medium text-xs text-stone-700">
                        Add more photos
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoReview}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === "recap" && (
            <div className="h-full flex flex-col gap-2">
              <div className="rounded-2xl bg-[#1c1c1e] text-white px-3 py-2.5 shadow-sm shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-white/45">recap video</p>
                    <h1 className="text-sm font-medium mt-0.5">
                      {recapMode} memories
                    </h1>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setRecapView("treasures");
                        setRecapIndex(0);
                      }}
                      className={`w-8 h-8 rounded-full grid place-items-center ${recapView === "treasures"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/65"
                        }`}
                      title="Hearted"
                    >
                      <Heart size={14} />
                    </button>

                    <button
                      onClick={() => setRecapView("folders")}
                      className={`w-8 h-8 rounded-full grid place-items-center ${recapView === "folders"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/65"
                        }`}
                      title="Folders"
                    >
                      <Folder size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {["weekly", "monthly"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setRecapMode(mode);
                        setRecapView("video");
                        setRecapIndex(0);
                      }}
                      className={`rounded-full py-1 text-[10px] ${recapMode === mode && recapView === "video"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/60"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {recapView === "video" && (
                <>
                  {recapMoments.length === 0 ? (
                    <EmptyState text="No memories yet." />
                  ) : (
                    <div className="flex-1 min-h-0 rounded-[1.8rem] overflow-hidden bg-black shadow-lg relative">
                      <style>
                        {`
                          @keyframes recapPhotoFade {
                            0% { opacity: 0; transform: scale(1.03); }
                            18% { opacity: 1; transform: scale(1); }
                            82% { opacity: 1; transform: scale(1); }
                            100% { opacity: 0; transform: scale(1.02); }
                          }
                        `}
                      </style>

                      <img
                        key={recapMoments[recapIndex % recapMoments.length].id}
                        src={recapMoments[recapIndex % recapMoments.length].image}
                        alt="Recap memory"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          animation: "recapPhotoFade 1000ms ease-in-out forwards",
                        }}
                      />

                      <div className="absolute inset-0 bg-black/10" />

                      <div className="absolute top-3 left-3 right-3 flex gap-1">
                        {recapMoments.slice(0, 12).map((_, index) => (
                          <div
                            key={index}
                            className={`h-0.5 flex-1 rounded-full ${index === recapIndex % recapMoments.length
                              ? "bg-white"
                              : "bg-white/30"
                              }`}
                          />
                        ))}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                        <p className="text-[10px] text-white/65">
                          {formatDate(
                            recapMoments[recapIndex % recapMoments.length]
                              .createdAt
                          )}
                        </p>

                        <p className="text-xs font-medium mt-0.5">
                          {recapMoments[recapIndex % recapMoments.length].note ||
                            "quiet moment"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {recapView === "treasures" && (
                <>
                  {treasuredMoments.length === 0 ? (
                    <EmptyState text="No hearted memories yet." />
                  ) : (
                    <>
                      <div className="flex-1 min-h-0 rounded-[1.8rem] overflow-hidden bg-white shadow-lg relative">
                        <img
                          src={
                            treasuredMoments[
                              recapIndex % treasuredMoments.length
                            ].image
                          }
                          alt="Hearted memory"
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                          <p className="text-xs font-medium">hearted</p>
                          <p className="text-[10px] text-white/65 mt-0.5">
                            {formatDate(
                              treasuredMoments[
                                recapIndex % treasuredMoments.length
                              ].createdAt
                            )}
                          </p>
                          <p className="text-[11px] text-white/75 mt-0.5">
                            {treasuredMoments[
                              recapIndex % treasuredMoments.length
                            ].note || "no caption"}
                          </p>
                        </div>
                      </div>

                      <SlideControls
                        onPrev={prevTreasure}
                        onNext={nextTreasure}
                      />
                    </>
                  )}
                </>
              )}

              {recapView === "folders" && (
                <div className="flex-1 min-h-0 rounded-[1.8rem] bg-white border border-stone-100 shadow-sm p-3 overflow-hidden">
                  <p className="text-xs font-medium mb-2">folders</p>

                  {Object.keys(folders).length === 0 ? (
                    <div className="h-full grid place-items-center text-center">
                      <p className="text-xs text-stone-400">no folders yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(folders).map(([folder, items]) => (
                        <button
                          key={folder}
                          className="rounded-2xl bg-stone-100 p-2 text-left h-28 relative overflow-hidden"
                        >
                          {items[0]?.image && (
                            <img
                              src={items[0].image}
                              alt={folder}
                              className="absolute inset-0 w-full h-full object-cover opacity-35"
                            />
                          )}

                          <div className="relative z-10">
                            <Folder size={15} />
                            <p className="font-medium text-xs mt-1 capitalize">
                              {folder}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {items.length} memories
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {page === "archive" && (
            <div className="h-full flex flex-col gap-2">
              <div className="rounded-2xl bg-white p-3 shadow-sm border border-stone-100 shrink-0">
                <CalendarDays className="mb-1 text-stone-400" size={15} />
                <h1 className="text-sm font-medium">calendar</h1>
                <p className="text-[10px] text-stone-400">tap a day</p>
              </div>

              <div className="grid grid-cols-7 gap-1 shrink-0">
                {Array.from({ length: 31 }, (_, index) => {
                  const day = index + 1;
                  const hasMemory = savedMoments.some((moment) => {
                    const date = new Date(moment.createdAt);
                    return date.getDate() === day;
                  });

                  return (
                    <button
                      key={day}
                      onClick={() => selectDay(day)}
                      className={`aspect-square rounded-xl text-[10px] relative ${selectedDay === day
                        ? "bg-[#1c1c1e] text-white"
                        : "bg-white text-stone-500"
                        }`}
                    >
                      {day}
                      {hasMemory && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8aa9cc]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-h-0 rounded-[1.8rem] bg-white shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                {activeArchiveMoment ? (
                  <>
                    <div className="relative flex-1 min-h-0">
                      <img
                        src={activeArchiveMoment.image}
                        alt="Archive memory"
                        className="w-full h-full object-cover"
                      />

                      <button
                        onClick={prevArchive}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 grid place-items-center"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <button
                        onClick={nextArchive}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/75 grid place-items-center"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="p-3 shrink-0">
                      <p className="text-xs font-medium">
                        {activeArchiveMoment.treasured ? "hearted" : "saved"}
                      </p>

                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatDate(activeArchiveMoment.createdAt)}
                      </p>

                      {activeArchiveMoment.folder && (
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {activeArchiveMoment.folder}
                        </p>
                      )}

                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {activeArchiveMoment.note || "no caption"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 grid place-items-center p-4 text-center">
                    <p className="text-xs text-stone-400">
                      no memories for this day
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <nav className="absolute bottom-0 left-0 right-0 bg-[#f8f8f8]/90 backdrop-blur border-t border-stone-200 px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <NavButton
              icon={<Home size={16} />}
              label="Review"
              active={page === "review"}
              onClick={() => setPage("review")}
            />
            <NavButton
              icon={<Sparkles size={16} />}
              label="Recap"
              active={page === "recap"}
              onClick={() => setPage("recap")}
            />
            <NavButton
              icon={<CalendarDays size={16} />}
              label="Archive"
              active={page === "archive"}
              onClick={() => setPage("archive")}
            />
          </div>
        </nav>
      </section>
    </main>
  );
}

function SlideControls({ onPrev, onNext }) {
  return (
    <div className="grid grid-cols-2 gap-2 shrink-0">
      <button
        onClick={onPrev}
        className="rounded-2xl bg-white border border-stone-200 py-2.5 flex items-center justify-center gap-1 text-xs font-medium"
      >
        <ChevronLeft size={15} />
        Prev
      </button>

      <button
        onClick={onNext}
        className="rounded-2xl bg-[#1c1c1e] text-white py-2.5 flex items-center justify-center gap-1 text-xs font-medium"
      >
        Next
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl py-2 flex flex-col items-center gap-0.5 text-[10px] transition ${active
        ? "bg-[#1c1c1e] text-white"
        : "text-stone-400 hover:bg-stone-100"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex-1 rounded-[1.8rem] bg-white border border-stone-100 shadow-sm grid place-items-center p-4 text-center">
      <p className="text-xs text-stone-400">{text}</p>
    </div>
  );
}

export default App;
