import React, { useState, useEffect, useRef } from 'react'
import {
  IconCropSprout,
  IconComment,
  IconShare,
  IconDisc,
  IconVolumeX,
  IconVolume2,
  IconVerified,
  IconMusic,
  IconLeaf,
  IconPlay,
  IconPlus,
  IconCheck
} from './SocialIcons'
import DiscussionDrawer, { countTotalComments } from './DiscussionDrawer'

// Single Vibe Item with IntersectionObserver, Overlay HUD, and Audio Sync
function VibeCard({
  vibe,
  isActive,
  isGlobalMuted,
  onToggleMute,
  onShabaash,
  onOpenDiscussion,
  onOpenShare,
  myCircleList = [],
  currentUser
}) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60)
  const [showCenterCropPop, setShowCenterCropPop] = useState(false)
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false)
  const lastTapRef = useRef(0)

  const isAuthorInMyCircle = myCircleList.includes(vibe.author?.username)
  const isShabaashActive = vibe.userReaction === 'shabaash'
  const totalComments = countTotalComments(vibe.comments || [])

  // Auto-play when active (75% visible in viewport), pause and reset when inactive
  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
        setIsPlaying(true)
      }
      if (audioRef.current && vibe.audioTrack) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [isActive, vibe.audioTrack])

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isGlobalMuted
    if (audioRef.current) audioRef.current.muted = isGlobalMuted
  }, [isGlobalMuted])

  // Track video progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration)
      }
    }
  }

  // Toggle Play / Pause on Single Tap
  const handleTogglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        if (audioRef.current) audioRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play().catch(() => {})
        if (audioRef.current) audioRef.current.play().catch(() => {})
        setIsPlaying(true)
      }
    }
  }

  // Handle Double-Tap (shabaash! reaction pop in center)
  const handleContainerClick = () => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      if (!isShabaashActive) {
        onShabaash(vibe.id)
      }
      setShowCenterCropPop(true)
      setTimeout(() => setShowCenterCropPop(false), 900)
    } else {
      handleTogglePlayPause()
    }
    lastTapRef.current = now
  }

  // Scrubber Seek
  const handleScrubberClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newFraction = Math.max(0, Math.min(1, clickX / rect.width))
    const targetTime = newFraction * duration

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime
      if (audioRef.current) audioRef.current.currentTime = targetTime
    }
  }

  return (
    <div
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        height: 'calc(100vh - 85px)',
        maxHeight: 820,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#09090b',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        userSelect: 'none'
      }}
    >
      {/* Background Video / Animated Media Frame */}
      {vibe.image ? (
        <img
          src={vibe.image}
          alt={vibe.englishContent || 'fieldVibe'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <video
          ref={videoRef}
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          loop
          playsInline
          muted={isGlobalMuted}
          onTimeUpdate={handleTimeUpdate}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Hidden Audio Element for Music Synchronization */}
      {vibe.audioTrack && (
        <audio
          ref={audioRef}
          src="https://actions.google.com/sounds/v1/nature/wind_and_leaves.ogg"
          loop
          muted={isGlobalMuted}
        />
      )}

      {/* Center Screen Crop Sprout Double-Tap Pop Animation */}
      {showCenterCropPop && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 40
        }}>
          <div style={{
            animation: 'cropPopAnimation 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            filter: 'drop-shadow(0 4px 24px rgba(16, 185, 129, 0.8))'
          }}>
            <IconCropSprout size={100} filled={true} color="#10b981" />
          </div>
        </div>
      )}

      {/* Play/Pause Indicator Overlay when paused */}
      {!isPlaying && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          zIndex: 20
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <IconPlay size={30} />
          </div>
        </div>
      )}

      {/* Top Floating Controls (Global Mute Toggle + Category Badge) */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30
      }}>
        {/* Category Badge */}
        <span style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          fontSize: 11.5,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5
        }}>
          <IconLeaf size={12} color="#10b981" />
          <span>{vibe.category}</span>
        </span>

        {/* Global Mute Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleMute()
          }}
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: 'none',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isGlobalMuted ? <IconVolumeX size={18} /> : <IconVolume2 size={18} />}
        </button>
      </div>

      {/* RIGHT ACTION RAIL (Floating Vertical Stack) */}
      <div style={{
        position: 'absolute',
        right: 12,
        bottom: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        zIndex: 30
      }}>
        {/* 1. "shabaash!" Outlined Crop Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onShabaash(vibe.id)
          }}
          style={{
            background: isShabaashActive ? '#dcfce7' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            color: isShabaashActive ? '#166534' : '#ffffff',
            border: 'none',
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          <IconCropSprout size={24} filled={isShabaashActive} color={isShabaashActive ? '#166534' : '#ffffff'} />
        </button>
        <span style={{ color: '#ffffff', fontSize: 11.5, fontWeight: 800, marginTop: -12, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {vibe.reactions?.shabaash || 0}
        </span>

        {/* 2. Side Discussion Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenDiscussion(vibe)
          }}
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            border: 'none',
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <IconComment size={22} color="#ffffff" />
        </button>
        <span style={{ color: '#ffffff', fontSize: 11.5, fontWeight: 800, marginTop: -12, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {totalComments}
        </span>

        {/* 3. Share Vibe Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenShare(vibe)
          }}
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            border: 'none',
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <IconShare size={20} color="#ffffff" />
        </button>
        <span style={{ color: '#ffffff', fontSize: 11.5, fontWeight: 800, marginTop: -12, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          Share
        </span>

        {/* 4. Spinning Vinyl/Audio Disc Icon */}
        <div style={{
          marginTop: 6,
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#18181b',
          border: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          animation: isPlaying ? 'spin 3s linear infinite' : 'none'
        }}>
          <IconDisc size={28} color="#10b981" isSpinning={isPlaying} />
        </div>
      </div>

      {/* BOTTOM META OVERLAY */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 14,
        right: 70,
        color: '#ffffff',
        zIndex: 30,
        textShadow: '0 1px 4px rgba(0,0,0,0.8)'
      }}>
        {/* Creator Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <img
            src={vibe.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
            alt={vibe.author?.name}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              border: isAuthorInMyCircle ? '3px solid #f97316' : 'none'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14.5, fontWeight: 900 }}>{vibe.author?.name}</span>
              {vibe.author?.hasGreenTick && <IconVerified size={15} color="#10b981" />}
            </div>
            <span style={{ fontSize: 12, opacity: 0.85 }}>{vibe.author?.username}</span>
          </div>
        </div>

        {/* Caption Text with Expand / Collapse */}
        <p
          onClick={(e) => {
            e.stopPropagation()
            setIsCaptionExpanded(!isCaptionExpanded)
          }}
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            margin: '0 0 8px 0',
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: isCaptionExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {vibe.englishContent || vibe.originalContent}
        </p>

        {/* Animated Marquee Audio Track Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, opacity: 0.95 }}>
          <IconMusic size={13} color="#10b981" />
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220 }}>
            <span style={{ display: 'inline-block', animation: 'marquee 10s linear infinite' }}>
              {vibe.audioTrack || 'Original Krishi Audio'} • {vibe.author?.name}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM PROGRESS SCRUBBER */}
      <div
        onClick={handleScrubberClick}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'rgba(255,255,255,0.25)',
          cursor: 'pointer',
          zIndex: 40
        }}
      >
        <div style={{
          height: '100%',
          width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
          background: '#10b981',
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes cropPopAnimation {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.35); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Default seed items if no posts or vibes are loaded
const DEFAULT_SEED_VIBES = [
  {
    id: 'vibe-seed-1',
    author: {
      id: 'rajesh-wheat',
      name: 'Rajesh Choudhary',
      username: '@rajesh_wheat',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true
    },
    category: 'Crop Care',
    contentType: 'fieldVibe',
    audioTrack: 'Saranga Dariya (Folk Beats)',
    englishContent: 'Drone spraying demonstration over our golden mustard crop. 10 acres covered in just 25 minutes with uniform ultra-low volume droplet distribution!',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    reactions: { shabaash: 248 },
    userReaction: null,
    comments: []
  },
  {
    id: 'vibe-seed-2',
    author: {
      id: 'manpreet-dairy',
      name: 'Manpreet Kaur',
      username: '@manpreet_dairy',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true
    },
    category: 'Organic Farming',
    contentType: 'fieldVibe',
    audioTrack: 'Harvest Celebration Dhol Beats',
    englishContent: 'Quick field demonstration of our zero-budget natural Jeevamrutha preparation using indigenous cow dung and jaggery. Soil microbes multiply 100x within 48 hours!',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    reactions: { shabaash: 310 },
    userReaction: null,
    comments: []
  }
]

export default function VibesFeed({
  posts = [],
  vibes = [],
  currentUser,
  myCircleList = [],
  onShabaash,
  onUpdatePostComments
}) {
  const [activeVibeIndex, setActiveVibeIndex] = useState(0)
  const [isGlobalMuted, setIsGlobalMuted] = useState(false)
  const [activeDiscussionVibe, setActiveDiscussionVibe] = useState(null)
  const [shareModalVibe, setShareModalVibe] = useState(null)
  const [isCopied, setIsCopied] = useState(false)
  const containerRef = useRef(null)

  const vibesList = (vibes && vibes.length > 0)
    ? vibes
    : (posts && posts.filter(p => p.contentType === 'fieldVibe').length > 0)
      ? posts.filter(p => p.contentType === 'fieldVibe')
      : DEFAULT_SEED_VIBES


  // IntersectionObserver at 0.75 threshold for YouTube Shorts / Instagram Reels Snap Lifecycle
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            setActiveVibeIndex(index)
          }
        })
      },
      {
        root: container,
        threshold: 0.75
      }
    )

    const cards = container.querySelectorAll('.vibe-card-container')
    cards.forEach(card => observer.observe(card))

    return () => observer.disconnect()
  }, [vibesList.length])

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 75px)', overflow: 'hidden' }}>
      
      {/* Vertical Snap-Scroll Feed Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: '10px 0'
        }}
      >
        {vibesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#09090b', marginBottom: 8 }}>No fieldVibes yet</h3>
            <p style={{ fontSize: 14 }}>Create the first 1-minute vertical short video for the farming community!</p>
          </div>
        ) : (
          vibesList.map((vibe, idx) => (
            <div
              key={vibe.id}
              data-index={idx}
              className="vibe-card-container"
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <VibeCard
                vibe={vibe}
                isActive={activeVibeIndex === idx}
                isGlobalMuted={isGlobalMuted}
                onToggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
                onShabaash={onShabaash}
                onOpenDiscussion={(v) => setActiveDiscussionVibe(v)}
                onOpenShare={(v) => setShareModalVibe(v)}
                myCircleList={myCircleList}
                currentUser={currentUser}
              />
            </div>
          ))
        )}
      </div>

      {/* Discussion Drawer Overlay for Vibes */}
      {activeDiscussionVibe && (
        <DiscussionDrawer
          key={activeDiscussionVibe.id}
          postId={activeDiscussionVibe.id}
          post={posts.find(p => p.id === activeDiscussionVibe.id) || activeDiscussionVibe}
          currentUser={currentUser}
          myCircleList={myCircleList}
          onClose={() => setActiveDiscussionVibe(null)}
          onUpdatePostComments={onUpdatePostComments}
          isOverlay={true}
        />
      )}

      {/* Share Deep-Link Modal */}
      {shareModalVibe && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 400,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 17, fontWeight: 900, color: '#09090b' }}>
              Share fieldVibe
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>
              Share this agricultural short-video advisory with your farming circles and WhatsApp groups.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/vibes/${shareModalVibe.id}`}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  background: '#f8fafc',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  background: isCopied ? '#166534' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {isCopied ? <IconCheck size={14} /> : null}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Direct WhatsApp Deep-Link Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌾 Watch this agricultural fieldVibe on KrishiSocial: ${shareModalVibe.englishContent || 'Farmer video advisory'} • ${window.location.origin}/vibes/${shareModalVibe.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px',
                background: '#25D366',
                color: '#ffffff',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                marginBottom: 14,
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
              <span>Share via WhatsApp</span>
            </a>

            {/* QR Code Graphic Representation */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 14
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5">
                <rect x="2" y="2" width="8" height="8" rx="1" />
                <rect x="4" y="4" width="4" height="4" fill="#111827" />
                <rect x="14" y="2" width="8" height="8" rx="1" />
                <rect x="16" y="4" width="4" height="4" fill="#111827" />
                <rect x="2" y="14" width="8" height="8" rx="1" />
                <rect x="4" y="16" width="4" height="4" fill="#111827" />
                <rect x="14" y="14" width="3" height="3" fill="#111827" />
                <rect x="19" y="14" width="3" height="3" fill="#111827" />
                <rect x="14" y="19" width="3" height="3" fill="#111827" />
                <rect x="19" y="19" width="3" height="3" fill="#111827" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#111827' }}>Scan QR Code on Field</p>
                <p style={{ margin: 0, fontSize: 10.5, color: '#64748b' }}>Instant mobile playback for community farmers</p>
              </div>
            </div>

            <button
              onClick={() => setShareModalVibe(null)}
              style={{
                width: '100%',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                padding: '10px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
