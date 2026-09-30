import React, { useState, useEffect, useRef } from 'react'
import {
  IconPosts,
  IconFieldVibes,
  IconClose,
  IconImage,
  IconMusic,
  IconMapPin,
  IconLeaf,
  IconCheck,
  IconTractor,
  IconMarket,
  IconWeather,
  IconScheme,
  IconSoil,
  IconDroplets,
  IconCow,
  IconBug,
  IconSprout,
  IconWarehouse,
  IconDrone,
  IconFruit
} from './SocialIcons'
import MusicPickerModal from './MusicPickerModal'

// 15 Comprehensive Agricultural Categories
export const AGRI_CATEGORIES = [
  { id: 'Crop Care', label: 'Crop Care', Icon: IconLeaf },
  { id: 'Pest Control', label: 'Pest Control', Icon: IconBug },
  { id: 'Organic Farming', label: 'Organic Farming', Icon: IconSprout },
  { id: 'Drip Irrigation', label: 'Drip Irrigation', Icon: IconDroplets },
  { id: 'Mandi Rates', label: 'Mandi Rates', Icon: IconMarket },
  { id: 'Machinery & Tools', label: 'Machinery & Tools', Icon: IconTractor },
  { id: 'Weather Advisory', label: 'Weather Advisory', Icon: IconWeather },
  { id: 'Govt Subsidies', label: 'Govt Subsidies', Icon: IconScheme },
  { id: 'Soil Health', label: 'Soil Health', Icon: IconSoil },
  { id: 'Horticulture', label: 'Horticulture', Icon: IconFruit },
  { id: 'Dairy & Livestock', label: 'Dairy & Livestock', Icon: IconCow },
  { id: 'Seed Varieties', label: 'Seed Varieties', Icon: IconLeaf },
  { id: 'Post-Harvest Storage', label: 'Post-Harvest Storage', Icon: IconWarehouse },
  { id: 'Solar Pumps', label: 'Solar Pumps', Icon: IconDrone },
  { id: 'Agri-Finance', label: 'Agri-Finance', Icon: IconScheme }
]

export default function CreatePostModal({
  isOpen,
  onClose,
  currentUser,
  onCreatePost
}) {
  const [contentType, setContentType] = useState('post') // 'post' | 'fieldVibe'
  const [category, setCategory] = useState('Crop Care')
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  
  // Media state
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [videoDuration, setVideoDuration] = useState(null)
  
  // Video Trimming State for fieldVibes > 60s
  const [trimStart, setTrimStart] = useState(0)
  const [needsTrimming, setNeedsTrimming] = useState(false)

  // Music state
  const [showMusicModal, setShowMusicModal] = useState(false)
  const [attachedMusic, setAttachedMusic] = useState(null)

  const fileInputRef = useRef(null)

  // Background Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Reset file selection
  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setIsVideo(false)
    setVideoDuration(null)
    setNeedsTrimming(false)
    setTrimStart(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // File Upload Handler with Video Duration Validation & Trimmer Activation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileIsVideo = file.type.startsWith('video/')
    const fileIsImage = file.type.startsWith('image/')

    if (!fileIsVideo && !fileIsImage) {
      alert('Please upload a valid image or video file.')
      return
    }

    setIsVideo(fileIsVideo)
    setMediaFile(file)

    if (fileIsVideo) {
      const tempVideo = document.createElement('video')
      tempVideo.preload = 'metadata'
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src)
        const duration = Math.round(tempVideo.duration) || 0
        setVideoDuration(duration)

        // For Standard Posts: Max 10 minutes (600s)
        if (contentType === 'post' && duration > 600) {
          alert(`Standard Post videos cannot exceed 10 minutes (600s). Your file is ${Math.round(duration / 60)} minutes.`)
          handleRemoveMedia()
          return
        }

        // For fieldVibes: Strictly 60 seconds
        if (contentType === 'fieldVibe') {
          if (duration > 60) {
            setNeedsTrimming(true)
            setTrimStart(0)
          } else {
            setNeedsTrimming(false)
          }
        }
      }
      tempVideo.src = URL.createObjectURL(file)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setMediaPreview(previewUrl)
    } else {
      // Image reader
      const reader = new FileReader()
      reader.onload = (ev) => {
        setMediaPreview(ev.target?.result)
      }
      reader.readAsDataURL(file)
      setVideoDuration(null)
      setNeedsTrimming(false)
    }
  }

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!content.trim() && !mediaPreview) {
      alert('Please add a description, photo, or short video.')
      return
    }

    if (contentType === 'fieldVibe' && !isVideo && !mediaPreview) {
      alert('fieldVibes require an attached short video (up to 60s).')
      return
    }

    const postData = {
      id: `post-${Date.now()}`,
      author: {
        id: currentUser?.id || 'farmer-user',
        name: currentUser?.name || 'Farmer',
        username: currentUser?.username || currentUser?.handle || '@kisan_farmer',
        village: location.trim() || currentUser?.village || 'Local Village',
        district: location.trim() || currentUser?.district || 'Agricultural Mandal',
        state: currentUser?.state || 'India',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        hasGreenTick: Boolean(currentUser?.verified || currentUser?.hasGreenTick),
        primaryCategory: category
      },
      category: category,
      district: location.trim() || 'Local Mandal',
      contentType: contentType,
      audioTrack: attachedMusic ? attachedMusic.title : null,
      audioTrackUrl: attachedMusic ? attachedMusic.audioUrl : null,
      timestamp: 'Just now',
      reach: '420',
      boostedReach: false,
      englishContent: content.trim(),
      image: isVideo ? null : mediaPreview,
      video: isVideo ? mediaPreview : null,
      videoDuration: contentType === 'fieldVibe' && needsTrimming ? 60 : videoDuration,
      trimWindow: needsTrimming ? { start: trimStart, end: trimStart + 60 } : null,
      reactions: { shabaash: 0 },
      userReaction: null,
      saved: false,
      comments: []
    }

    if (onCreatePost) {
      onCreatePost(postData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-[#111827]">Create New Update</h2>
            <p className="text-xs text-gray-500 font-medium">Share agricultural updates, advice, or fieldVibes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            aria-label="Close modal"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 1. Format Type Pill Switcher */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setContentType('post')
                setNeedsTrimming(false)
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
                contentType === 'post'
                  ? 'bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#2E7D32]'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconPosts size={16} />
              <span>Standard Post (Video ≤ 10m)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setContentType('fieldVibe')
                if (isVideo && videoDuration > 60) {
                  setNeedsTrimming(true)
                }
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${
                contentType === 'fieldVibe'
                  ? 'bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#2E7D32]'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconFieldVibes size={16} />
              <span>fieldVibe (Short Video ≤ 60s)</span>
            </button>
          </div>

          {/* 2. Free-Text Location Input (Strictly No Hardcoded Dropdowns) */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 flex items-center gap-1.5">
              <IconMapPin size={15} color="#2E7D32" />
              <span>Location (Village, Mandal, or District)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your village, mandal, or district (e.g., Kaikalur, Eluru, AP)..."
              className="w-full px-3.5 py-2.5 bg-gray-50 text-xs font-medium text-[#111827] rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white placeholder-gray-400 transition"
            />
          </div>

          {/* 3. Category Selector (15 Domains) */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 flex items-center gap-1.5">
              <IconLeaf size={15} color="#2E7D32" />
              <span>Agricultural Domain (15 Categories)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 text-xs font-bold text-[#111827] rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white cursor-pointer transition"
            >
              {AGRI_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Text Content Description */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              {contentType === 'fieldVibe' ? 'Video Caption & Advice' : 'Discussion or Advice Note'}
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                contentType === 'fieldVibe'
                  ? 'Add a short caption for your fieldVibe vertical video...'
                  : 'Share crop updates, fertilizer ratios, market rates, or farm findings with fellow farmers...'
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 text-xs font-medium text-[#111827] rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white placeholder-gray-400 resize-none transition"
            />
          </div>

          {/* 5. Media Upload Section */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5 flex items-center justify-between">
              <span>{contentType === 'fieldVibe' ? 'Upload Vertical Video (Max 60s)' : 'Attach Photo or Video (Max 10m)'}</span>
              {videoDuration && (
                <span className="text-[11px] font-semibold text-[#2E7D32]">
                  Duration: {videoDuration}s
                </span>
              )}
            </label>

            {!mediaPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-[#2E7D32] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-[#E8F5E9]/40 transition group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 group-hover:text-[#2E7D32] transition">
                  <IconImage size={20} />
                </div>
                <p className="text-xs font-bold text-gray-700">Click to upload media</p>
                <p className="text-[11px] text-gray-400">
                  {contentType === 'fieldVibe' ? 'MP4, WebM (Vertical short video ≤ 60s)' : 'PNG, JPG, MP4 (Photo or video ≤ 10m)'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={contentType === 'fieldVibe' ? 'video/*' : 'image/*,video/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black/90 p-2 flex flex-col items-center">
                {isVideo ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="max-h-60 rounded-lg object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Upload Preview"
                    className="max-h-60 rounded-lg object-contain"
                  />
                )}
                
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition"
                  title="Remove media"
                >
                  <IconClose size={16} />
                </button>
              </div>
            )}
          </div>

          {/* 6. Video Trimming Slider (for fieldVibes > 60s) */}
          {contentType === 'fieldVibe' && isVideo && needsTrimming && videoDuration > 60 && (
            <div className="p-4 bg-[#E8F5E9] rounded-xl space-y-2 border border-[#2E7D32]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#2E7D32]">
                  Trim to 60 Seconds
                </span>
                <span className="text-[11px] font-bold text-[#111827]">
                  {trimStart}s - {trimStart + 60}s of {videoDuration}s
                </span>
              </div>
              <p className="text-[11px] text-gray-600">
                fieldVibes are strictly restricted to 1 minute. Select your 60-second window:
              </p>
              <input
                type="range"
                min={0}
                max={Math.max(0, videoDuration - 60)}
                value={trimStart}
                onChange={(e) => setTrimStart(Number(e.target.value))}
                className="w-full accent-[#2E7D32] cursor-pointer"
              />
            </div>
          )}

          {/* 7. Working Music / Audio Track Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <IconMusic size={15} color="#2E7D32" />
                <span>Background Agri Audio / Regional Folk Beats</span>
              </label>
              <button
                type="button"
                onClick={() => setShowMusicModal(true)}
                className="text-xs font-bold text-[#2E7D32] hover:underline"
              >
                {attachedMusic ? 'Change Music' : '+ Search Music'}
              </button>
            </div>

            {attachedMusic ? (
              <div className="flex items-center justify-between p-3 bg-[#E8F5E9] rounded-xl border border-[#2E7D32]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2E7D32] flex items-center justify-center text-white">
                    <IconMusic size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111827]">{attachedMusic.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{attachedMusic.artist || 'Folk Song'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedMusic(null)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <IconClose size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMusicModal(true)}
                className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 flex items-center justify-center gap-2 transition"
              >
                <IconMusic size={15} color="#2E7D32" />
                <span>Attach Telugu, Hindi, or Regional Folk Audio Preview</span>
              </button>
            )}
          </div>

          {/* 8. Action Submit Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <IconCheck size={16} />
              <span>{contentType === 'fieldVibe' ? 'Publish fieldVibe' : 'Publish Post'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Embedded Music Picker Modal */}
      {showMusicModal && (
        <MusicPickerModal
          isOpen={showMusicModal}
          onClose={() => setShowMusicModal(false)}
          onSelectTrack={(track) => {
            setAttachedMusic(track)
            setShowMusicModal(false)
          }}
          activeTrackId={attachedMusic?.id}
        />
      )}
    </div>
  )
}
