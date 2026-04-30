import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Folder,
  Heart,
  Home,
  ImagePlus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import "./App.css";

function Media({ moment, className = "", mode = "cover", autoPlay = true }) {
  if (!moment) return null;

  const isVideo = moment.mediaType === "video";

  if (isVideo) {
    return (
      <video
        src={moment.image}
        className={className}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        controls={false}
        style={{ objectFit: mode }}
      />
    );
  }

  return (
    <img
      src={moment.image}
      alt="Memory"
      className={className}
      draggable="false"
      style={{ objectFit: mode }}
    />
  );
}

function App() {
  const today = new Date().getDate();

  const [page, setPage] = useState("review");
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedMoments, setSavedMoments] = useState([]);
  const [pendingMoment, setPendingMoment] = useState(null);

  const [friendName, setFriendName] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [shareWithFriend, setShareWithFriend] = useState(true);

  const [folderName, setFolderName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [treasured, setTreasured] = useState(false);

  const [manualFriends, setManualFriends] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteFriendName, setInviteFriendName] = useState("");
  const [selectedFriend, setSelectedFriend] = useState("");
  const [peopleTab, setPeopleTab] = useState("with");
  const [editingFriendName, setEditingFriendName] = useState(false);
  const [friendNameDraft, setFriendNameDraft] = useState("");
  const [peopleMontageIndex, setPeopleMontageIndex] = useState(0);

  const [openMoment, setOpenMoment] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");

  const [recapMode, setRecapMode] = useState("weekly");
  const [recapFolderOnly, setRecapFolderOnly] = useState(false);
  const [recapHeartOnly, setRecapHeartOnly] = useState(false);
  const [recapIndex, setRecapIndex] = useState(0);
  const [recapCaption, setRecapCaption] = useState("This week in quiet moments");
  const [recapDescription, setRecapDescription] = useState(
    "A small collection of memories worth keeping."
  );

  const [reviewRecapPlaying, setReviewRecapPlaying] = useState(false);
  const [reviewRecapDone, setReviewRecapDone] = useState(false);
  const [reviewRecapIndex, setReviewRecapIndex] = useState(0);

  const [selectedDay, setSelectedDay] = useState(today);
  const [archiveIndex, setArchiveIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarTouchStart, setCalendarTouchStart] = useState(null);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);

  const [startX, setStartX] = useState(null);
  const [dragX, setDragX] = useState(0);

  const currentPhoto = photos[currentIndex];
  const finishedReview = photos.length > 0 && currentIndex >= photos.length;

  const existingFriends = useMemo(() => {
    return [
      ...new Set(
        savedMoments
          .map((moment) => moment.friend)
          .filter(Boolean)
          .map((name) => name.trim())
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [savedMoments]);

  const existingFolders = useMemo(() => {
    return [
      ...new Set(
        savedMoments
          .map((moment) => moment.folder)
          .filter(Boolean)
          .map((name) => name.trim())
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [savedMoments]);

  const people = useMemo(() => {
    const grouped = {};

    manualFriends.forEach((friend) => {
      if (!grouped[friend]) grouped[friend] = [];
    });

    savedMoments.forEach((moment) => {
      if (!moment.friend) return;
      if (!grouped[moment.friend]) grouped[moment.friend] = [];
      grouped[moment.friend].push(moment);
    });

    return grouped;
  }, [savedMoments, manualFriends]);

  const recapMoments = useMemo(() => {
    const now = new Date();

    let filtered = savedMoments.filter((moment) => {
      const savedDate = new Date(moment.savedAt || moment.createdAt);

      if (recapMode === "weekly") {
        const diff =
          (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }

      if (recapMode === "monthly") {
        return (
          savedDate.getMonth() === now.getMonth() &&
          savedDate.getFullYear() === now.getFullYear()
        );
      }

      if (recapMode === "yearly") {
        return savedDate.getFullYear() === now.getFullYear();
      }

      return true;
    });

    if (recapFolderOnly) {
      filtered = filtered.filter((moment) => moment.folder);
    }

    if (recapHeartOnly) {
      filtered = filtered.filter((moment) => moment.treasured);
    }

    return filtered;
  }, [savedMoments, recapMode, recapFolderOnly, recapHeartOnly]);

  const archiveMoments = useMemo(() => {
    return savedMoments.filter((moment) => {
      const date = new Date(moment.createdAt);
      return (
        date.getDate() === selectedDay &&
        date.getMonth() === calendarMonth.getMonth() &&
        date.getFullYear() === calendarMonth.getFullYear()
      );
    });
  }, [savedMoments, selectedDay, calendarMonth]);

  const selectedFriendMoments = selectedFriend ? people[selectedFriend] || [] : [];
  const sharedFriendMoments = selectedFriendMoments.filter(
    (moment) => moment.shared
  );
  const visiblePeopleMoments =
    peopleTab === "shared" ? sharedFriendMoments : selectedFriendMoments;
  const montageMoments =
    sharedFriendMoments.length > 0 ? sharedFriendMoments : selectedFriendMoments;

  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInCalendarMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();

  useEffect(() => {
    if (page !== "recap") return;
    if (recapMoments.length === 0) return;

    const timer = setInterval(() => {
      setRecapIndex((current) => (current + 1) % recapMoments.length);
    }, 700);

    return () => clearInterval(timer);
  }, [page, recapMoments.length]);

  useEffect(() => {
    if (page !== "archive") return;
    if (archiveMoments.length <= 1) return;

    const timer = setInterval(() => {
      setArchiveIndex((current) => (current + 1) % archiveMoments.length);
    }, 700);

    return () => clearInterval(timer);
  }, [page, archiveMoments.length]);

  useEffect(() => {
    if (page !== "people") return;
    if (peopleTab !== "montage") return;
    if (montageMoments.length <= 1) return;

    const timer = setInterval(() => {
      setPeopleMontageIndex((current) => (current + 1) % montageMoments.length);
    }, 700);

    return () => clearInterval(timer);
  }, [page, peopleTab, montageMoments.length]);

  useEffect(() => {
    if (!reviewRecapPlaying) return;
    if (savedMoments.length === 0) {
      setReviewRecapPlaying(false);
      setReviewRecapDone(true);
      return;
    }

    setReviewRecapIndex(0);

    const timer = setInterval(() => {
      setReviewRecapIndex((current) => {
        if (current >= savedMoments.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setReviewRecapPlaying(false);
            setReviewRecapDone(true);
          }, 700);
          return current;
        }

        return current + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [reviewRecapPlaying, savedMoments.length]);

  function shiftCalendarMonth(direction) {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
    setSelectedDay(1);
    setArchiveIndex(0);
  }

  function handleCalendarWheel(event) {
    if (Math.abs(event.deltaY) < 30) return;
    shiftCalendarMonth(event.deltaY > 0 ? 1 : -1);
  }

  function handleCalendarTouchStart(event) {
    setCalendarTouchStart(event.touches[0].clientX);
  }

  function handleCalendarTouchEnd(event) {
    if (calendarTouchStart === null) return;

    const endX = event.changedTouches[0].clientX;
    const diff = endX - calendarTouchStart;

    if (Math.abs(diff) > 50) {
      shiftCalendarMonth(diff < 0 ? 1 : -1);
    }

    setCalendarTouchStart(null);
  }

  function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function getMediaType(file) {
    if (file.type?.startsWith("video/")) return "video";
    if (file.name?.toLowerCase().endsWith(".mov")) return "video";
    if (file.name?.toLowerCase().endsWith(".mp4")) return "video";
    return "image";
  }

  function handlePhotoReview(event) {
    const files = Array.from(event.target.files || []);

    const reviewedPhotos = files
      .map((file, index) => {
        const photoDate = new Date(file.lastModified || Date.now());

        return {
          id: `${Date.now()}-${index}`,
          image: URL.createObjectURL(file),
          mediaType: getMediaType(file),
          createdAt: photoDate.toISOString(),
          originalFileName: file.name,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setPhotos(reviewedPhotos);
    setCurrentIndex(0);
    setPendingMoment(null);
    setFriendName("");
    setNewFriendName("");
    setShareWithFriend(true);
    setFolderName("");
    setNewFolderName("");
    setTreasured(false);
    setReviewRecapPlaying(false);
    setReviewRecapDone(false);
    setReviewRecapIndex(0);
  }

  function skipPhoto() {
    setPendingMoment(null);
    setCurrentIndex((current) => current + 1);
    setDragX(0);
    setStartX(null);
  }

  function keepPhoto() {
    if (!currentPhoto) return;

    setPendingMoment(currentPhoto);
    setDragX(0);
    setStartX(null);
    setFriendName("");
    setNewFriendName("");
    setShareWithFriend(true);
  }

  function savePendingMoment() {
    if (!pendingMoment) return;

    const finalFriend =
      friendName === "__new__" ? newFriendName.trim() : friendName.trim();

    const finalFolder =
      folderName === "__new__" ? newFolderName.trim() : folderName.trim();

    const saved = {
      ...pendingMoment,
      savedAt: new Date().toISOString(),
      friend: finalFriend,
      shared: Boolean(finalFriend && shareWithFriend),
      treasured,
      folder: finalFolder,
      caption: "",
    };

    setSavedMoments((current) => [...current, saved]);
    setPendingMoment(null);
    setCurrentIndex((current) => current + 1);
    setFriendName("");
    setNewFriendName("");
    setShareWithFriend(true);
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

  function deletePendingMoment() {
    setPendingMoment(null);
    setCurrentIndex((current) => current + 1);
    setFriendName("");
    setNewFriendName("");
    setShareWithFriend(true);
    setFolderName("");
    setNewFolderName("");
    setTreasured(false);
  }

  function removeCurrentPhoto() {
    if (!currentPhoto) return;

    setPhotos((current) =>
      current.filter((photo) => photo.id !== currentPhoto.id)
    );
  }

  function openMemory(moment) {
    setOpenMoment(moment);
    setCaptionDraft(moment.caption || "");
  }

  function saveCaption() {
    if (!openMoment) return;

    setSavedMoments((current) =>
      current.map((moment) =>
        moment.id === openMoment.id
          ? { ...moment, caption: captionDraft.trim() }
          : moment
      )
    );

    setOpenMoment((current) =>
      current ? { ...current, caption: captionDraft.trim() } : current
    );
  }

  function addManualFriend() {
    setInviteOpen(true);
    setInviteFriendName("");
  }

  function createInviteFriend() {
    const cleanName = inviteFriendName.trim();
    if (!cleanName) return;

    setManualFriends((current) =>
      current.includes(cleanName) ? current : [...current, cleanName]
    );

    setSelectedFriend(cleanName);
    setFriendNameDraft(cleanName);
    setEditingFriendName(false);
    setPeopleTab("with");
    setInviteOpen(false);
    setInviteFriendName("");
  }

  function copyInviteLink() {
    const link = "https://notice.app/invite/f8th";
    navigator.clipboard?.writeText(link);
  }

  function messageInvite() {
    const text = encodeURIComponent(
      "Add me on Notice so we can share memories together: https://notice.app/invite/f8th"
    );
    window.location.href = `sms:?&body=${text}`;
  }

  function renameSelectedFriend() {
    const cleanName = friendNameDraft.trim();
    if (!selectedFriend || !cleanName) return;

    setSavedMoments((current) =>
      current.map((moment) =>
        moment.friend === selectedFriend
          ? { ...moment, friend: cleanName }
          : moment
      )
    );

    setSelectedFriend(cleanName);
    setFriendNameDraft(cleanName);
    setEditingFriendName(false);
  }

  function getDayCount(day) {
    return savedMoments.filter((moment) => {
      const date = new Date(moment.createdAt);
      return (
        date.getDate() === day &&
        date.getMonth() === calendarMonth.getMonth() &&
        date.getFullYear() === calendarMonth.getFullYear()
      );
    }).length;
  }

  function getDayClass(day) {
    const count = getDayCount(day);
    const now = new Date();

    const isCurrentMonth =
      calendarMonth.getMonth() === now.getMonth() &&
      calendarMonth.getFullYear() === now.getFullYear();

    const isToday = isCurrentMonth && day === today;

    if (selectedDay === day && isToday) {
      return "bg-[#E5E7EB] text-[#5E6E82] border border-[#C9D1DA]";
    }

    if (selectedDay === day) {
      return "bg-[#8FAED0] text-white border border-[#8FAED0]";
    }

    if (isToday) {
      return "bg-[#ECEFF2] text-[#5E6E82] border border-[#D6DCE3]";
    }

    if (count === 0) {
      return "bg-transparent text-[#8B97A4] border border-transparent";
    }

    if (count <= 2) {
      return "bg-[#EEF5FB] text-[#5E6E82] border border-[#D9E4EE]";
    }

    if (count <= 5) {
      return "bg-[#D7E6F4] text-[#5E6E82] border border-[#BFD4E8]";
    }

    return "bg-[#8FAED0] text-white border border-[#8FAED0]";
  }

  return (
    <main className="app-shell min-h-screen bg-[#FFFDF9] text-[#364252] flex justify-center">
      <section className="w-full max-w-[430px] h-screen bg-[#FFFDF9] shadow-[0_12px_32px_rgba(143,174,208,0.18)] flex flex-col relative overflow-hidden border-[3px] border-[#8FAED0]">
        <header className="px-4 pt-4 pb-1 flex items-center justify-between shrink-0">
          <div>
            <p className="font-serif text-2xl tracking-tight text-[#5E6E82]">
              notice
            </p>
                        <p className="text-[10px] text-[#A5AFB8]">
              {savedMoments.length} memories / {savedMoments.filter((moment) => moment.friend).length} with friends
            </p>
          </div>

          <button className="w-8 h-8 rounded-full bg-[#EEF3F8] shadow-sm grid place-items-center text-[#5E6E82]">
            <Bell size={14} />
          </button>
        </header>

        <section className="flex-1 px-3 pb-20 overflow-hidden">
          {page === "review" && (
            <div className="h-full flex flex-col gap-2">
              {!currentPhoto && !pendingMoment && !finishedReview && (
                <div className="flex-1 rounded-[1.8rem] overflow-hidden relative border border-[#D9E4EE] bg-[#F6F1E8]">
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#8B97A4]">
                        today
                      </p>
                      <h1 className="text-xl font-medium mt-1 text-[#364252]">
                        Look back quietly.
                      </h1>
                      <p className="text-xs text-[#8B97A4] mt-1 max-w-[230px]">
                        save photos, live photos, and videos
                      </p>
                    </div>

                    <label className="block rounded-2xl bg-[#FFFCF7] px-3 py-3 cursor-pointer shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#8FAED0] text-white grid place-items-center">
                          <ImagePlus size={15} />
                        </div>
                        <div>
                          <p className="font-medium text-xs text-[#364252]">
                            Review past memories
                          </p>
                          <p className="text-[10px] text-[#A5AFB8]">
                            swipe right to save / left to skip
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*,video/*,.mov,.mp4"
                        multiple
                        onChange={handlePhotoReview}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {currentPhoto && !pendingMoment && (
                <>
                  <div className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] px-3 py-2 shadow-sm shrink-0">
                    <p className="text-xs font-medium text-[#708090]">
                      Review
                    </p>
                    <p className="text-[10px] text-[#A5AFB8]">
                      {currentIndex + 1}/{photos.length}
                    </p>
                  </div>

                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="relative flex-1 min-h-0 rounded-[1.8rem] overflow-hidden bg-[#EEF3F8] border border-[#D9E4EE] touch-none transition-transform"
                    style={{
                      transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
                    }}
                  >
                    <Media
                      moment={currentPhoto}
                      className="w-full h-full object-contain"
                      mode="cover"
                    />

                    <button
                      onClick={removeCurrentPhoto}
                      className="absolute top-3 left-3 w-9 h-9 rounded-full bg-[#FFFCF7]/80 backdrop-blur grid place-items-center text-[#5E6E82]"
                    >
                      <Trash2 size={16} />
                    </button>

                    {dragX > 40 && (
                      <div className="absolute top-12 left-5 rounded-2xl border-2 border-[#8FAED0] bg-[#FFFCF7]/85 px-3 py-1.5 text-[#5E6E82] text-sm font-bold rotate-[-10deg]">
                        SAVE
                      </div>
                    )}

                    {dragX < -40 && (
                      <div className="absolute top-12 right-5 rounded-2xl border-2 border-red-400 bg-[#FFFCF7]/85 px-3 py-1.5 text-red-500 text-sm font-bold rotate-[10deg]">
                        SKIP
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={skipPhoto}
                      className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium text-[#5E6E82]"
                    >
                      <X size={16} />
                      Skip
                    </button>

                    <button
                      onClick={keepPhoto}
                      className="rounded-2xl bg-[#8FAED0] text-white py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium"
                    >
                      <Sparkles size={16} />
                      Keep
                    </button>
                  </div>
                </>
              )}
              {pendingMoment && (
                <div className="flex-1 min-h-0 rounded-[1.8rem] bg-black shadow-lg border border-[#D9E4EE] overflow-hidden relative">
                  <Media
                    moment={pendingMoment}
                    className="absolute inset-0 w-full h-full object-contain"
                    mode="contain"
                  />

                  <button
                    onClick={deletePendingMoment}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-[#FFFDF9]/85 backdrop-blur grid place-items-center text-[#5E6E82] border border-white/40"
                    title="Remove from review"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3">
                    <div className="rounded-[1.35rem] bg-[#FFFDF9]/90 backdrop-blur px-3 py-2.5 border border-white/40 shadow-sm">
                      <div className="flex items-center gap-2">
                        <select
                          value={friendName}
                          onChange={(event) => setFriendName(event.target.value)}
                          className="flex-1 min-w-0 h-9 rounded-full bg-[#EEF3F8] px-3 text-[10px] outline-none text-[#364252] border border-[#D9E4EE]"
                        >
                          <option value="">Tag friend</option>
                          {existingFriends.map((friend) => (
                            <option key={friend} value={friend}>
                              {friend}
                            </option>
                          ))}
                          <option value="__new__">+ New friend</option>
                        </select>

                        <div className={`relative w-9 h-9 rounded-full grid place-items-center border ${
                          folderName
                            ? "bg-[#8FAED0] border-[#8FAED0] text-white"
                            : "bg-[#EEF3F8] border-[#D9E4EE] text-[#5E6E82]"
                        }`}>
                          <Folder size={14} />
                          <select
                            value={folderName}
                            onChange={(event) => setFolderName(event.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            aria-label="Choose folder"
                          >
                            <option value="">No folder</option>
                            {existingFolders.map((folder) => (
                              <option key={folder} value={folder}>
                                {folder}
                              </option>
                            ))}
                            <option value="__new__">+ New folder</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setTreasured((current) => !current)}
                          className={`w-9 h-9 rounded-full grid place-items-center border ${
                            treasured
                              ? "bg-[#8FAED0] border-[#8FAED0] text-white"
                              : "bg-[#EEF3F8] border-[#D9E4EE] text-[#5E6E82]"
                          }`}
                          aria-label="Toggle treasured memory"
                        >
                          <Heart size={14} fill={treasured ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {(friendName === "__new__" || folderName === "__new__") && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {friendName === "__new__" && (
                            <input
                              value={newFriendName}
                              onChange={(event) => setNewFriendName(event.target.value)}
                              placeholder="friend name"
                              className="col-span-2 w-full rounded-full bg-[#EEF3F8] px-3 py-2 text-[11px] outline-none border border-[#D9E4EE]"
                            />
                          )}

                          {folderName === "__new__" && (
                            <input
                              value={newFolderName}
                              onChange={(event) => setNewFolderName(event.target.value)}
                              placeholder="folder name"
                              className="w-full rounded-full bg-[#EEF3F8] px-3 py-2 text-[11px] outline-none border border-[#D9E4EE]"
                            />
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-[38px_1fr_96px] gap-2 mt-2">
                        <button
                          onClick={skipPhoto}
                          className="w-9 h-9 rounded-full bg-[#EEF3F8] border border-[#D9E4EE] grid place-items-center text-[#5E6E82]"
                          title="Do not save to memories"
                        >
                          <X size={15} />
                        </button>

                        <button
                          onClick={savePendingMoment}
                          className="h-9 rounded-full bg-[#8FAED0] text-white text-[11px] font-medium"
                        >
                          Save memory
                        </button>

                        <button
                          onClick={() => setShareWithFriend((current) => !current)}
                          className={`h-9 rounded-full px-2 text-[10px] border ${
                            shareWithFriend
                              ? "bg-[#8FAED0] border-[#8FAED0] text-white"
                              : "bg-[#EEF3F8] border-[#D9E4EE] text-[#5E6E82]"
                          }`}
                        >
                          {shareWithFriend ? "Shared on" : "Shared off"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {finishedReview && (
                <div className="flex-1 rounded-[1.8rem] bg-[#F6F1E8] border border-[#D9E4EE] overflow-hidden relative">
                  {reviewRecapPlaying && savedMoments.length > 0 ? (
                    <>
                      <Media
                        moment={savedMoments[reviewRecapIndex % savedMoments.length]}
                        className="absolute inset-0 w-full h-full object-contain"
                        mode="cover"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      <p className="absolute left-4 bottom-4 text-[10px] text-white/90">
                        quick weekly recap
                      </p>
                    </>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-4 text-center">
                      <div>
                        <p className="text-xl font-medium text-[#364252]">
                          Review complete.
                        </p>
                        <p className="text-xs text-[#8B97A4] mt-1">
                          {savedMoments.length} memories saved
                        </p>

                        {!reviewRecapDone ? (
                          <button
                            onClick={() => {
                              setReviewRecapPlaying(true);
                              setReviewRecapDone(false);
                              setReviewRecapIndex(0);
                            }}
                            className="mt-4 rounded-2xl bg-[#8FAED0] text-white px-5 py-3 text-xs font-medium"
                          >
                            Make weekly recap
                          </button>
                        ) : (
                          <div className="mt-4 flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setRecapMode("weekly");
                                setRecapIndex(0);
                                setPage("recap");
                              }}
                              className="rounded-2xl bg-[#8FAED0] text-white px-5 py-3 text-xs font-medium"
                            >
                              Watch weekly recap
                            </button>

                            <label className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] text-[#5E6E82] px-5 py-3 text-xs font-medium cursor-pointer">
                              Add more photos
                              <input
                                type="file"
                                accept="image/*,video/*,.mov,.mp4"
                                multiple
                                onChange={handlePhotoReview}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {page === "people" && (
            <div className="h-full flex flex-col gap-2 relative">
              {!selectedFriend ? (
                <>
                  <div className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] px-3 py-2 shadow-sm shrink-0">
                    <p className="text-xs font-medium text-[#708090]">
                      People
                    </p>
                    <p className="text-[10px] text-[#A5AFB8]">
                      private memory spaces by person
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 rounded-[1.8rem] bg-[#FFFCF7] border border-[#D9E4EE] shadow-sm p-3 overflow-y-auto">
                    {Object.keys(people).length === 0 ? (
                      <button
  onClick={addManualFriend}
  className="col-span-2 w-full rounded-2xl bg-[#EEF3F8] border border-dashed border-[#BFD4E8] px-4 py-4 text-center text-sm font-medium text-[#5E6E82]"
>
  + Add friends
</button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(people).map(([friend, items]) => (
                          <button
                            key={friend}
                            onClick={() => {
                              setSelectedFriend(friend);
                              setFriendNameDraft(friend);
                              setEditingFriendName(false);
                              setPeopleTab("with");
                            }}
                            className="rounded-2xl bg-[#EEF3F8] border border-[#D9E4EE] p-2 text-left h-32 relative overflow-hidden"
                          >
                            {items[0] && (
                              <Media
                                moment={items[0]}
                                className="absolute inset-0 w-full h-full object-cover opacity-40"
                                mode="cover"
                              />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

                            <div className="absolute left-2 bottom-2 right-2 z-10">
                              <p className="font-medium text-xs text-white capitalize leading-tight">
                                {friend}
                              </p>
                              <p className="text-[9px] text-white/75">
                                {items.length} memories
                              </p>
                            </div>
                          </button>
                        ))}

                        <button
  onClick={addManualFriend}
  className="col-span-2 w-full rounded-2xl bg-[#EEF3F8] border border-dashed border-[#BFD4E8] px-4 py-4 text-center text-sm font-medium text-[#5E6E82]"
>
  + Add friends
</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedFriend("")}
                    className="rounded-2xl bg-[#EEF3F8] px-3 py-2 text-left text-xs text-[#5E6E82] shrink-0"
                  >
                    ? Back
                  </button>

                  <div className="rounded-2xl bg-[#8FAED0] text-white px-3 py-3 shadow-sm shrink-0">
                    <p className="text-[10px] text-white/70">memory space</p>
                    <h1 className="text-lg font-medium mt-0.5">
                      {selectedFriend}
                    </h1>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <TabButton
                      label="With them"
                      active={peopleTab === "with"}
                      onClick={() => setPeopleTab("with")}
                    />
                    <TabButton
                      label="Shared"
                      active={peopleTab === "shared"}
                      onClick={() => setPeopleTab("shared")}
                    />
                    <TabButton
                      label="Montage"
                      active={peopleTab === "montage"}
                      onClick={() => setPeopleTab("montage")}
                    />
                  </div>

                  {peopleTab === "montage" ? (
                    <div className="flex-1 min-h-0 rounded-[1.8rem] overflow-hidden bg-black shadow-lg relative">
                      {montageMoments.length === 0 ? (
                        <EmptyState text="No montage memories yet." />
                      ) : (
                        <>
                          <Media
                            moment={montageMoments[peopleMontageIndex % montageMoments.length]}
                            className="absolute inset-0 w-full h-full object-contain"
                            mode="cover"
                          />

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4 text-white">
                            <p className="text-[10px] text-white/75">
                              montage ï¿½ {selectedFriend}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 rounded-[1.8rem] bg-[#FFFCF7] border border-[#D9E4EE] shadow-sm p-2 overflow-y-auto">
                      {visiblePeopleMoments.length === 0 ? (
                        <EmptyState text="Nothing here yet." />
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {visiblePeopleMoments.map((moment) => (
                            <button
                              key={moment.id}
                              onClick={() => openMemory(moment)}
                              className="relative aspect-square rounded-2xl overflow-hidden bg-[#EEF3F8] border border-[#D9E4EE]"
                            >
                              <Media
                                moment={moment}
                                className="absolute inset-0 w-full h-full object-contain"
                                mode="cover"
                              />

                              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 to-transparent" />

                              <p className="absolute left-2 bottom-1.5 text-[9px] text-white/90">
                                {formatDate(moment.createdAt)}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {page === "recap" && (
            <div className="h-full flex flex-col gap-2">
              <div className="rounded-2xl bg-[#8FAED0] text-white px-3 py-2.5 shadow-sm shrink-0">

                <div className="flex items-center gap-1.5">
                  <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {["weekly", "monthly", "yearly"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setRecapMode(mode);
                          setRecapIndex(0);
                        }}
                        className={`rounded-full py-1 text-[10px] ${recapMode === mode
                            ? "bg-white text-[#364252]"
                            : "bg-white/15 text-white/75"
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setRecapFolderOnly((current) => !current)}
                    className={`w-8 h-8 rounded-full grid place-items-center border ${recapFolderOnly
                        ? "bg-white text-[#364252] border-white"
                        : "bg-[#EAF2FB] text-[#5E748F] border-[#D5E3F2]"
                      }`}
                    title="Folder memories"
                  >
                    <Folder size={14} />
                  </button>

                  <button
                    onClick={() => setRecapHeartOnly((current) => !current)}
                    className={`w-8 h-8 rounded-full grid place-items-center border ${recapHeartOnly
                        ? "bg-white text-[#364252] border-white"
                        : "bg-[#EAF2FB] text-[#5E748F] border-[#D5E3F2]"
                      }`}
                    title="Treasured memories"
                  >
                    <Heart size={14} fill={recapHeartOnly ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              {recapMoments.length === 0 ? (
                <EmptyState text="No memories yet." />
              ) : (
                <button
                  onClick={() =>
                    openMemory(recapMoments[recapIndex % recapMoments.length])
                  }
                  className="flex-1 min-h-0 rounded-[1.8rem] overflow-hidden bg-black shadow-lg relative text-left"
                >
                  <Media
                    moment={recapMoments[recapIndex % recapMoments.length]}
                    className="absolute inset-0 w-full h-full object-contain"
                    mode="cover"
                  />

                  <div className="absolute inset-0 bg-black/10" />


                </button>
              )}

              <div className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] p-2 shrink-0">
                <p className="text-[10px] font-medium text-[#708090] mb-1">
                  Recap caption
                </p>

                <input
                  value={recapCaption}
                  onChange={(event) => setRecapCaption(event.target.value)}
                  placeholder="caption..."
                  className="w-full rounded-2xl bg-[#EEF3F8] px-3 py-2 text-xs outline-none mb-1"
                />

                <textarea
                  value={recapDescription}
                  onChange={(event) => setRecapDescription(event.target.value)}
                  placeholder="description..."
                  rows={1}
                  className="w-full rounded-2xl bg-[#EEF3F8] px-3 py-2 text-xs outline-none resize-none"
                />
              </div>
            </div>
          )}

          {page === "archive" && (
            <div
              className="h-full flex flex-col gap-2 relative"
              onWheel={handleCalendarWheel}
              onTouchStart={handleCalendarTouchStart}
              onTouchEnd={handleCalendarTouchEnd}
            >
              <div className="rounded-2xl bg-[#FFFCF7] border border-[#D9E4EE] px-3 py-2 shadow-sm shrink-0">
                <div className="grid grid-cols-[1fr_auto_92px] items-center gap-2">
                  <p className="text-xs font-medium text-[#708090]">
                    Calendar
                  </p>

                  <button
                    onClick={() => setCalendarPickerOpen((current) => !current)}
                    className="text-sm font-semibold text-[#5E6E82] rounded-full px-3 py-1 bg-[#EEF3F8]"
                  >
                    {calendarMonthLabel}
                  </button>

                  <div className="flex justify-end gap-1">
  <button
    onClick={() => {
      setCalendarMonth(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() - 1, 1)
      );
      setSelectedDay(1);
      setArchiveIndex(0);
    }}
    className="h-7 px-2 rounded-full bg-[#EEF3F8] border border-[#D9E4EE] text-[#5E6E82] text-[10px]"
  >
    Prev
  </button>

  <button
    onClick={() => {
      setCalendarMonth(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() + 1, 1)
      );
      setSelectedDay(1);
      setArchiveIndex(0);
    }}
    className="h-7 px-2 rounded-full bg-[#EEF3F8] border border-[#D9E4EE] text-[#5E6E82] text-[10px]"
  >
    Next
  </button>
</div>
</div>

{calendarPickerOpen && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {Array.from({ length: 12 }, (_, index) => {
                      const monthDate = new Date(calendarMonth.getFullYear(), index, 1);
                      const isActive = index === calendarMonth.getMonth();

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setCalendarMonth(
                              new Date(calendarMonth.getFullYear(), index, 1)
                            );
                            setSelectedDay(1);
                            setArchiveIndex(0);
                            setCalendarPickerOpen(false);
                          }}
                          className={`rounded-full py-1.5 text-[10px] ${
                            isActive
                              ? "bg-[#8FAED0] text-white"
                              : "bg-[#EEF3F8] text-[#5E6E82]"
                          }`}
                        >
                          {monthDate.toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-7 gap-0.5 shrink-0">
                {Array.from({ length: daysInCalendarMonth }, (_, index) => {
                  const day = index + 1;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDay(day);
                        setArchiveIndex(0);
                      }}
                      className={`h-8 rounded-lg text-[9px] relative transition ${getDayClass(day)}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-h-0 rounded-[1.8rem] bg-[#FFFCF7] shadow-sm border border-[#D9E4EE] overflow-hidden flex flex-col">
                {archiveMoments.length > 0 ? (
                  <button
                    onClick={() =>
                      openMemory(
                        archiveMoments[archiveIndex % archiveMoments.length]
                      )
                    }
                    className="relative flex-1 min-h-0 text-left"
                  >
                    <Media
                      moment={archiveMoments[archiveIndex % archiveMoments.length]}
                      className="absolute inset-0 w-full h-full object-contain"
                      mode="cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

                    <p className="absolute left-4 bottom-4 text-[10px] text-white/90">
                      {formatDate(
                        archiveMoments[archiveIndex % archiveMoments.length]
                          .createdAt
                      )}
                    </p>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          )}
        </section>

        {openMoment && (
          <div className="absolute inset-0 z-30 bg-[#FFFDF9] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#D9E4EE] shrink-0">
              <button
                onClick={() => setOpenMoment(null)}
                className="text-xs text-[#5E6E82]"
              >
                ? Back
              </button>

              <p className="text-[10px] text-[#A5AFB8]">
                {formatDate(openMoment.createdAt)}
              </p>
            </div>

            <div className="relative flex-1 min-h-0 bg-black">
              <Media
                moment={openMoment}
                className="w-full h-full object-contain"
                mode="contain"
              />

              {openMoment.caption && (
                <div className="absolute left-3 right-3 bottom-3 rounded-2xl bg-black/35 backdrop-blur px-3 py-2">
                  <p className="text-[11px] text-white/90 leading-snug">
                    {openMoment.caption}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#D9E4EE] bg-[#FFFDF9] shrink-0">
              <textarea
                value={captionDraft}
                onChange={(event) => setCaptionDraft(event.target.value)}
                onBlur={saveCaption}
                placeholder="add a quiet caption..."
                rows={2}
                className="w-full rounded-2xl bg-[#EEF3F8] px-3 py-2.5 text-[11px] outline-none resize-none text-[#364252] placeholder:text-[#A5AFB8]"
              />

              <button
                onClick={saveCaption}
                className="mt-2 w-full rounded-2xl bg-[#8FAED0] text-white py-2 text-xs font-medium"
              >
                Save caption
              </button>
            </div>
          </div>
        )}

        {inviteOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px] flex items-end px-3 pb-24">
            <div className="w-full rounded-[1.8rem] bg-[#FFFDF9] border border-[#D9E4EE] shadow-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#364252]">
                    Add someone to Notice
                  </p>
                  <p className="text-[10px] text-[#A5AFB8] mt-0.5">
                    invite them or make a private memory space
                  </p>
                </div>

                <button
                  onClick={() => setInviteOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#EEF3F8] grid place-items-center text-[#5E6E82]"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-[112px_1fr] gap-3 items-stretch">
                <div className="rounded-2xl bg-[#EEF3F8] border border-[#D9E4EE] p-3 grid place-items-center">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }, (_, index) => (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-[2px] ${
                          [0,1,2,5,10,12,14,16,18,20,21,22,24].includes(index)
                            ? "bg-[#5E6E82]"
                            : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-[#8B97A4] mt-2">QR invite</p>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    value={inviteFriendName}
                    onChange={(event) => setInviteFriendName(event.target.value)}
                    placeholder="friend name"
                    className="w-full rounded-full bg-[#EEF3F8] border border-[#D9E4EE] px-4 py-2.5 text-xs outline-none text-[#364252]"
                  />

                  <button
                    onClick={createInviteFriend}
                    className="rounded-full bg-[#8FAED0] text-white py-2.5 text-xs font-medium"
                  >
                    Create memory space
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={copyInviteLink}
                      className="rounded-full bg-[#EEF3F8] border border-[#D9E4EE] text-[#5E6E82] py-2 text-[11px] font-medium"
                    >
                      Copy link
                    </button>

                    <button
                      onClick={messageInvite}
                      className="rounded-full bg-[#EEF3F8] border border-[#D9E4EE] text-[#5E6E82] py-2 text-[11px] font-medium"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="absolute bottom-0 left-0 right-0 bg-[#FFFDF9]/90 backdrop-blur border-t border-[#D9E4EE] px-4 py-2">
          <div className="grid grid-cols-4 gap-2">
            <NavButton
              icon={<Home size={16} />}
              label="Review"
              active={page === "review"}
              onClick={() => setPage("review")}
            />
            <NavButton
              icon={<Users size={16} />}
              label="People"
              active={page === "people"}
              onClick={() => setPage("people")}
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

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-2 text-center border ${active
          ? "bg-[#8FAED0] border-[#8FAED0] text-white"
          : "bg-[#FFFCF7] border-[#D9E4EE] text-[#5E6E82]"
        }`}
    >
      <p className="text-[10px] font-medium">{label}</p>
    </button>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl py-2 flex flex-col items-center gap-0.5 text-[10px] transition ${active
          ? "bg-[#8FAED0] text-white"
          : "text-[#8B97A4] hover:bg-[#EEF3F8]"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex-1 rounded-[1.8rem] bg-[#FFFCF7] border border-[#D9E4EE] shadow-sm grid place-items-center p-4 text-center">
      <p className="text-xs text-[#A5AFB8]">{text}</p>
    </div>
  );
}

export default App;























