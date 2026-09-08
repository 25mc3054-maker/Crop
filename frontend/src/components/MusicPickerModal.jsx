import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  IconMusic,
  IconSearch,
  IconClose,
  IconPlay,
  IconPause
} from './SocialIcons'

// Curated Regional Indian & Agricultural Audio Tracks Library
const CURATED_DEFAULT_TRACKS = [
  {
    id: 'itunes-curated-1',
    title: 'Saranga Dariya',
    artist: 'Mangli (Love Story)',
    category: 'Telugu Hits',
    duration: '0:30',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/91/9f/8e/919f8e40-a15d-0fa6-ee40-27bb12461971/mzaf_6452292723659223846.plus.aac.p.m4a',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'itunes-curated-2',
    title: 'Butta Bomma',
    artist: 'Armaan Malik (Ala Vaikunthapurramuloo)',
    category: 'Telugu Hits',
    duration: '0:30',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/92/8a/80/928a8039-446a-7963-c3c2-d3a3390c5836/mzaf_10515152345511110057.plus.aac.p.m4a',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'itunes-curated-3',
    title: 'Genda Phool (Folk Rhythm)',
    artist: 'Badshah & Payal Dev',
    category: 'Hindi Classics',
    duration: '0:30',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/44/d5/90/44d590e8-0aa3-db7d-1768-45ba3c6e94a8/mzaf_12948777977469499876.plus.aac.p.m4a',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'itunes-curated-4',
    title: 'Rangabati (Desi Beats)',
    artist: 'Sona Mohapatra & Rituraj',
    category: 'Folk Rhythms',
    duration: '0:30',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/1e/8c/fb/1e8cfb53-488f-16c5-f823-3dbd54a2a16a/mzaf_676508939798782638.plus.aac.p.m4a',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'itunes-curated-5',
    title: 'Monsoon Dew & Flute Melody',
    artist: 'Krishi Folk Heritage',
    category: 'Agri & Nature',
    duration: '0:45',
    audioUrl: 'https://actions.google.com/sounds/v1/nature/rain_heavy.ogg',
    artwork: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'
  },
  {
    id: 'itunes-curated-6',
    title: 'Harvest Dhol Celebration',
    artist: 'Punjab Farm Ensemble',
    category: 'Punjabi Folk',
    duration: '0:40',
    audioUrl: 'https://actions.google.com/sounds/v1/nature/wind_and_leaves.ogg',
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=120&q=80'
  }
]

export default function MusicPickerModal({
  onSelectTrack,
  onClose,
  currentAttachedTrack = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [previewTrackId, setPreviewTrackId] = useState(null)
  const audioRef = useRef(null)

  // Search Live Public Music API (iTunes Public Search API with Regional Queries)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      setIsLoading(true)
      const encodedQuery = encodeURIComponent(searchQuery.trim())
      axios.get(`https://itunes.apple.com/search?media=music&entity=song&limit=25&term=${encodedQuery}`)
        .then(res => {
          if (res.data?.results) {
            const mapped = res.data.results
              .filter(item => Boolean(item.previewUrl))
              .map(item => ({
                id: `itunes-${item.trackId}`,
                title: item.trackName || 'Song Track',
                artist: item.artistName || 'Unknown Artist',
                category: item.primaryGenreName || 'Music',
                duration: '0:30',
                audioUrl: item.previewUrl,
                artwork: item.artworkUrl100 || item.artworkUrl60 || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=120&q=80'
              }))
            setSearchResults(mapped)
          }
        })
        .catch(() => {
          // Fallback local search if network fails
          const localFiltered = CURATED_DEFAULT_TRACKS.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.artist.toLowerCase().includes(searchQuery.toLowerCase())
          )
          setSearchResults(localFiltered)
        })
        .finally(() => setIsLoading(false))
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Stop audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleTogglePreview = (track) => {
    if (previewTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPreviewTrackId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(track.audioUrl)
    audio.play().catch(() => {})
    audioRef.current = audio
    setPreviewTrackId(track.id)

    audio.onended = () => setPreviewTrackId(null)
  }

  const handleSelectAndClose = (track) => {
    if (audioRef.current) audioRef.current.pause()
    setPreviewTrackId(null)
    onSelectTrack(track)
    onClose()
  }

  // Display tracks based on search or category
  const displayTracks = searchQuery.trim() ? searchResults : CURATED_DEFAULT_TRACKS.filter(t => {
    if (activeCategory === 'All') return true
    return t.category === activeCategory
  })

  return (
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
        maxWidth: 520,
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconMusic size={20} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#09090b' }}>
              Music & Audio Engine
            </h3>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause()
              setPreviewTrackId(null)
              onClose()
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Search Bar & Categories */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f8fafc',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 10,
            border: '1px solid #e2e8f0'
          }}>
            <IconSearch size={16} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movie songs, Telugu/Hindi hits, folk tracks..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: '#09090b' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                <IconClose size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {['All', 'Telugu Hits', 'Hindi Classics', 'Punjabi Folk', 'Folk Rhythms', 'Agri & Nature'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  if (!searchQuery && cat !== 'All') {
                    setSearchQuery(cat.replace('Hits', '').replace('Classics', '').trim())
                  }
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  border: 'none',
                  background: activeCategory === cat ? '#dcfce7' : '#f1f5f9',
                  color: activeCategory === cat ? '#166534' : '#64748b',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Track List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', background: '#ffffff' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#16a34a', fontWeight: 800, fontSize: 13 }}>
              Searching audio library...
            </div>
          ) : displayTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>
              No tracks found for "{searchQuery}". Try another song name or artist.
            </div>
          ) : (
            displayTracks.map(track => {
              const isPlaying = previewTrackId === track.id
              const isSelected = currentAttachedTrack?.title === track.title

              return (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Album Artwork with Play Overlay */}
                    <div
                      onClick={() => handleTogglePreview(track)}
                      style={{
                        position: 'relative',
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#09090b',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={track.artwork}
                        alt={track.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isPlaying ? 0.7 : 1 }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isPlaying ? 'rgba(22, 163, 74, 0.65)' : 'rgba(0,0,0,0.3)',
                        color: '#ffffff'
                      }}>
                        {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#09090b', lineHeight: 1.3 }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {track.artist} • {track.duration}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectAndClose(track)}
                    style={{
                      background: isSelected ? '#dcfce7' : '#16a34a',
                      color: isSelected ? '#166534' : '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {isSelected ? 'Selected' : 'Use Track'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
