import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import DiscussionDrawer, { countTotalComments } from './DiscussionDrawer'
import VibesFeed from './VibesFeed'
import MusicPickerModal from './MusicPickerModal'
import {
  IconLogo,
  IconSearch,
  IconHome,
  IconFieldVibes,
  IconPosts,
  IconCompass,
  IconPaperPlane,
  IconCropSprout,
  IconComment,
  IconReply,
  IconBookmark,
  IconPlus,
  IconDots,
  IconSettings,
  IconArrowLeft,
  IconVerified,
  IconImage,
  IconCamera,
  IconMic,
  IconVolume,
  IconCheck,
  IconClose,
  IconSend,
  IconFieldmates,
  IconUserPlus,
  IconFollow,
  IconFollowing,
  IconMyCircle,
  IconCalendar,
  IconMapPin,
  IconLeaf,
  IconTractor,
  IconMarket,
  IconWeather,
  IconScheme,
  IconSoil,
  IconLock,
  IconShield,
  IconMessageQueue,
  IconFilter,
  IconEdit,
  IconLightning,
  IconMusic,
  IconPhone,
  IconFlag,
  IconTrending,
  IconPlay,
  IconPause,
  IconDataSaver,
  IconHeart,
  IconDroplets,
  IconFruit,
  IconCow,
  IconBug,
  IconSprout,
  IconWarehouse,
  IconDrone,
  IconFlower
} from './SocialIcons'

// 15 Comprehensive Agricultural Categories with Realistic SVG Symbols (Strictly No Emojis in UI)
const CATEGORIES = [
  { id: 'all', label: 'All Updates', Icon: IconPosts },
  { id: 'Crop Care', label: 'Crop Care', Icon: IconLeaf },
  { id: 'Mandi Rates', label: 'Mandi Rates', Icon: IconMarket },
  { id: 'Organic Farming', label: 'Organic Farming', Icon: IconSprout },
  { id: 'Machinery & Tools', label: 'Machinery & Tools', Icon: IconTractor },
  { id: 'Weather & Climate', label: 'Weather & Climate', Icon: IconWeather },
  { id: 'Govt Schemes & Subsidies', label: 'Govt Schemes & Subsidies', Icon: IconScheme },
  { id: 'Soil Health & Testing', label: 'Soil Health & Testing', Icon: IconSoil },
  { id: 'Irrigation & Water Mgmt', label: 'Irrigation & Water Mgmt', Icon: IconDroplets },
  { id: 'Horticulture & Fruits', label: 'Horticulture & Fruits', Icon: IconFruit },
  { id: 'Dairy & Livestock', label: 'Dairy & Livestock', Icon: IconCow },
  { id: 'Pest & Weed Control', label: 'Pest & Weed Control', Icon: IconBug },
  { id: 'Seeds & Fertilizers', label: 'Seeds & Fertilizers', Icon: IconLeaf },
  { id: 'Post-Harvest & Storage', label: 'Post-Harvest & Storage', Icon: IconWarehouse },
  { id: 'Agri-Tech & Drones', label: 'Agri-Tech & Drones', Icon: IconDrone },
  { id: 'Floriculture & Sericulture', label: 'Floriculture & Sericulture', Icon: IconFlower }
]

// Curated Public Music & Movie Tracks Library for Agricultural Videos & Posts
const MUSIC_LIBRARY = [
  { id: 'm-1', title: 'Saranga Dariya (Folk Beats)', artist: 'Love Story Movie', category: 'Movie Songs', duration: '0:55', audioUrl: 'https://actions.google.com/sounds/v1/foley/wind_chimes_breeze.ogg' },
  { id: 'm-2', title: 'Butta Bomma (Acoustic Rhythm)', artist: 'Ala Vaikunthapurramuloo', category: 'Movie Songs', duration: '1:00', audioUrl: 'https://actions.google.com/sounds/v1/foley/water_lapping.ogg' },
  { id: 'm-3', title: 'Monsoon Dew & Flute Melody', artist: 'Krishi Folk Heritage', category: 'Instrumental', duration: '0:45', audioUrl: 'https://actions.google.com/sounds/v1/nature/rain_heavy.ogg' },
  { id: 'm-4', title: 'Harvest Celebration Dhol Beats', artist: 'Punjab Farm Rhythms', category: 'Folk Rhythms', duration: '1:00', audioUrl: 'https://actions.google.com/sounds/v1/nature/wind_and_leaves.ogg' },
  { id: 'm-5', title: 'Morning Sunrise Birdsong & Veena', artist: 'South Agro Acoustic', category: 'Nature & Calm', duration: '0:50', audioUrl: 'https://actions.google.com/sounds/v1/nature/forest_birds_morning.ogg' },
  { id: 'm-6', title: 'Jai Jawan Jai Kisan (Anthem)', artist: 'Desh Patriotic Ensemble', category: 'Patriotic & Farming', duration: '1:00', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_park_breeze.ogg' },
  { id: 'm-7', title: 'Kisan Power Tractor Bass', artist: 'Desi Village Mix', category: 'Folk Rhythms', duration: '0:40', audioUrl: 'https://actions.google.com/sounds/v1/vehicles/tractor_idle.ogg' }
]

// Initial seed posts
const INITIAL_SEED_POSTS = [
  {
    id: 'post-1',
    author: {
      id: 'farmer-rajesh',
      name: 'Rajesh Choudhary',
      username: '@rajesh_wheat',
      village: 'Khanna, Ludhiana',
      district: 'Ludhiana, Punjab',
      state: 'Punjab',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true,
      joinDate: 'March 2021',
      primaryCategory: 'Crop Care'
    },
    category: 'Crop Care',
    district: 'Ludhiana, Punjab',
    circle: 'crop-care',
    contentType: 'post',
    audioTrack: null,
    timestamp: '25 mins ago',
    reach: '3.6k',
    boostedReach: true,
    englishContent: 'Completed the second irrigation for our wheat crop today. Applied bio-potash along with liquid zinc. The tillering is remarkable with 8-10 shoots per plant! Fellow farmers, avoid excess nitrogen right now to prevent lodging during unexpected winds.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    reactions: { shabaash: 142 },
    userReaction: null,
    saved: false,
    comments: [
      {
        id: 'c-1',
        author: 'Harpreet Singh',
        username: '@harpreet_p',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
        text: 'Brother, which bio-potash formula gave you this result? Looking for our farm.',
        time: '15m ago',
        audioUrl: null,
        likes: 6,
        isLiked: false,
        replies: [
          {
            id: 'c-1-r1',
            author: 'Rajesh Choudhary',
            username: '@rajesh_wheat',
            avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
            text: 'I used molasses-fermented bio-potash (1 liter/acre through drip irrigation). Very effective!',
            time: '10m ago',
            audioUrl: null,
            likes: 4,
            isLiked: false,
            replies: [
              {
                id: 'c-1-r1-sub1',
                author: 'Sunkara Ravi',
                username: '@ravi_paddy',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                text: 'Can this also be applied to second crop paddy in clay-loam soils?',
                time: '5m ago',
                audioUrl: null,
                likes: 2,
                isLiked: false,
                replies: []
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'post-2',
    author: {
      id: 'farmer-venkata',
      name: 'Venkata Subba Rao',
      username: '@venkata_chilli',
      village: 'Tenali, Guntur',
      district: 'Guntur, Andhra Pradesh',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: false,
      joinDate: 'January 2022',
      primaryCategory: 'Mandi Rates'
    },
    category: 'Mandi Rates',
    district: 'Guntur, Andhra Pradesh',
    circle: 'mandi-rates',
    contentType: 'post',
    audioTrack: 'Saranga Dariya (Folk Beats)',
    timestamp: '1 hour ago',
    reach: '510',
    boostedReach: false,
    englishContent: 'Arrivals of premium Teja Red Chilli surged at Guntur market yard today. The modal benchmark price touched Rs 19,800/quintal for premium grade sun-dried stock. Keep moisture below 10% before bagging.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    reactions: { shabaash: 89 },
    userReaction: 'shabaash',
    saved: true,
    comments: []
  },
  {
    id: 'post-3',
    author: {
      id: 'farmer-manpreet',
      name: 'Manpreet Kaur',
      username: '@manpreet_dairy',
      village: 'Kapurthala',
      district: 'Kapurthala, Punjab',
      state: 'Punjab',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true,
      joinDate: 'July 2020',
      primaryCategory: 'Organic Farming'
    },
    category: 'Organic Farming',
    district: 'Kapurthala, Punjab',
    circle: 'organic-farming',
    contentType: 'fieldVibe',
    audioTrack: 'Harvest Celebration Dhol Beats',
    timestamp: '2 hours ago',
    reach: '7.2k',
    boostedReach: true,
    englishContent: 'Quick field demonstration of our zero-budget natural Jeevamrutha preparation using indigenous cow dung and jaggery. Soil microbes multiply 100x within 48 hours!',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    reactions: { shabaash: 260 },
    userReaction: null,
    saved: false,
    comments: [
      {
        id: 'c-vibe-1',
        author: 'Dr. Arvind Sharma',
        username: '@dr_arvind_kvk',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        text: 'Excellent practice Manpreet ji! Ensure the solution is stirred clockwise twice daily.',
        time: '1h ago',
        audioUrl: null,
        likes: 12,
        isLiked: false,
        replies: []
      }
    ]
  },
  {
    id: 'post-4',
    author: {
      id: 'farmer-rajesh',
      name: 'Rajesh Choudhary',
      username: '@rajesh_wheat',
      village: 'Khanna, Ludhiana',
      district: 'Ludhiana, Punjab',
      state: 'Punjab',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true,
      joinDate: 'March 2021',
      primaryCategory: 'Crop Care'
    },
    category: 'Crop Care',
    district: 'Ludhiana, Punjab',
    circle: 'crop-care',
    contentType: 'fieldVibe',
    audioTrack: 'Saranga Dariya (Folk Beats)',
    timestamp: '4 hours ago',
    reach: '5.1k',
    boostedReach: true,
    englishContent: 'Drone spraying demonstration over our golden mustard crop. 10 acres covered in just 25 minutes with uniform ultra-low volume droplet distribution!',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    reactions: { shabaash: 184 },
    userReaction: null,
    saved: true,
    comments: []
  },
  {
    id: 'post-5',
    author: {
      id: 'farmer-venkata',
      name: 'Venkata Subba Rao',
      username: '@venkata_chilli',
      village: 'Tenali, Guntur',
      district: 'Guntur, Andhra Pradesh',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: false,
      joinDate: 'January 2022',
      primaryCategory: 'Mandi Rates'
    },
    category: 'Mandi Rates',
    district: 'Guntur, Andhra Pradesh',
    circle: 'mandi-rates',
    contentType: 'fieldVibe',
    audioTrack: 'Butta Bomma (Acoustic Rhythm)',
    timestamp: '6 hours ago',
    reach: '890',
    boostedReach: false,
    englishContent: 'Live APMC market yard report from Tenali on spice grading benchmarks and direct buyer auctions.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    reactions: { shabaash: 92 },
    userReaction: 'shabaash',
    saved: false,
    comments: []
  }
]

// Initial Fieldmates Directory
const INITIAL_FIELDMATE_PROFILES = [
  {
    id: 'fm-1',
    name: 'Rajesh Choudhary',
    username: '@rajesh_wheat',
    village: 'Khanna, Ludhiana',
    district: 'Ludhiana, Punjab',
    state: 'Punjab',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    hasGreenTick: true,
    mutualCount: 14,
    joinDate: 'March 2021',
    primaryCategory: 'Crop Care',
    bio: 'Progressive wheat & mustard grower practicing balanced micro-nutrient fertilization.'
  },
  {
    id: 'fm-2',
    name: 'Venkata Subba Rao',
    username: '@venkata_chilli',
    village: 'Tenali, Guntur',
    district: 'Guntur, Andhra Pradesh',
    state: 'Andhra Pradesh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    hasGreenTick: false,
    mutualCount: 8,
    joinDate: 'January 2022',
    primaryCategory: 'Mandi Rates',
    bio: 'Spice grower & Guntur APMC market yard price observer.'
  },
  {
    id: 'fm-3',
    name: 'Dr. Arvind Sharma',
    username: '@dr_arvind_kvk',
    village: 'Hisar, Haryana',
    district: 'Hisar, Haryana',
    state: 'Haryana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    hasGreenTick: true,
    mutualCount: 22,
    joinDate: 'August 2019',
    primaryCategory: 'Soil Health',
    bio: 'Senior Agronomist at Krishi Vigyan Kendra. Plant protection & soil health advisor.'
  },
  {
    id: 'fm-4',
    name: 'Manpreet Kaur',
    username: '@manpreet_dairy',
    village: 'Kapurthala',
    district: 'Kapurthala, Punjab',
    state: 'Punjab',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    hasGreenTick: true,
    mutualCount: 5,
    joinDate: 'July 2020',
    primaryCategory: 'Organic Farming',
    bio: 'Organic farmer & sustainable dairy innovator.'
  }
]

export const getWebsiteRegisteredFarmer = () => {
  let regName = ''
  let regVillage = ''
  let regState = ''

  try {
    const token = localStorage.getItem('farmer_token')
    if (token) {
      const parts = token.split('.')
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload?.name) regName = payload.name.trim()
        if (payload?.village) regVillage = payload.village.trim()
        if (payload?.state) regState = payload.state.trim()
      }
    }
  } catch (e) {}

  if (!regName) {
    const nameDirect = localStorage.getItem('farmer_name') || localStorage.getItem('farmer_registered_name')
    if (nameDirect) regName = nameDirect.trim()
  }
  if (!regVillage) {
    const villDirect = localStorage.getItem('farmer_village')
    if (villDirect) regVillage = villDirect.trim()
  }
  if (!regState) {
    const stateDirect = localStorage.getItem('farmer_state')
    if (stateDirect) regState = stateDirect.trim()
  }

  return {
    name: regName || 'Greeshmanth Manne',
    username: '@greeshmanth_m',
    village: regVillage || 'Eluru',
    district: 'Eluru, Andhra Pradesh',
    state: regState || 'Andhra Pradesh',
    joinDate: 'January 11, 2021',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    coverPhoto: null,
    bio: 'Farmer & Agrotechnology enthusiast. Dedicated to precision agriculture and community collaboration.',
    primaryCategory: 'Crop Care'
  }
}

// Recursive Helper: Insert a reply at any nested level in the comment tree
const insertNestedReply = (commentsList, targetCommentId, newReply) => {
  return commentsList.map(item => {
    if (item.id === targetCommentId) {
      return {
        ...item,
        replies: [...(item.replies || []), newReply]
      }
    }
    if (item.replies && item.replies.length > 0) {
      return {
        ...item,
        replies: insertNestedReply(item.replies, targetCommentId, newReply)
      }
    }
    return item
  })
}

// Recursive Helper: Toggle like on any comment or nested reply
const toggleNestedCommentLike = (commentsList, targetCommentId) => {
  return commentsList.map(item => {
    if (item.id === targetCommentId) {
      const isCurrentlyLiked = Boolean(item.isLiked)
      const currentLikes = item.likes || 0
      return {
        ...item,
        isLiked: !isCurrentlyLiked,
        likes: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
      }
    }
    if (item.replies && item.replies.length > 0) {
      return {
        ...item,
        replies: toggleNestedCommentLike(item.replies, targetCommentId)
      }
    }
    return item
  })
}

// Recursive Component: Render Comment Tree with Deep Nesting and Minimalist Heart Likes
function RecursiveCommentNode({
  comment,
  depth = 0,
  myCircleList,
  currentUser,
  onReplyClick,
  onToggleLike
}) {
  const inCircle = myCircleList.includes(comment.username)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: depth > 0 ? 18 : 0, marginTop: depth > 0 ? 6 : 0 }}>
      {/* Comment Body */}
      <div style={{
        background: depth > 0 ? '#f0fdf4' : '#f8fafc',
        borderLeft: depth > 0 ? '2px solid #16a34a' : 'none',
        padding: '10px 12px',
        borderRadius: 10
      }}>
        {/* Author Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <img
            src={comment.avatar || currentUser.avatar}
            alt={comment.author}
            style={{
              width: depth > 0 ? 24 : 28,
              height: depth > 0 ? 24 : 28,
              borderRadius: '50%',
              objectFit: 'cover',
              border: inCircle ? '2px solid #f97316' : 'none'
            }}
          />
          <div>
            <span style={{ fontSize: depth > 0 ? 12 : 13, fontWeight: 800, color: depth > 0 ? '#166534' : '#09090b' }}>
              {comment.author}
            </span>
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{comment.time}</span>
          </div>
        </div>

        {/* Comment Text or Voice Note */}
        {comment.audioUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
            <button
              onClick={() => {
                const audio = new Audio(comment.audioUrl)
                audio.play().catch(() => {})
              }}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <IconPlay size={11} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Voice Note Discussion</span>
          </div>
        ) : (
          <p style={{ margin: '4px 0 6px 0', fontSize: 13, color: '#1e293b', lineHeight: 1.4 }}>{comment.text}</p>
        )}

        {/* Action Bar: Nested Reply + Minimalist Heart Like Icon SVG */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          {/* Reply Button */}
          <button
            onClick={() => onReplyClick(comment.id, comment.author, comment.username)}
            style={{
              background: 'none',
              border: 'none',
              color: '#16a34a',
              fontWeight: 800,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            <IconReply size={13} color="#16a34a" />
            <span>Reply</span>
          </button>

          {/* Minimalist Heart Icon for Comment Likes */}
          <button
            onClick={() => onToggleLike(comment.id)}
            title="Like comment"
            style={{
              background: 'none',
              border: 'none',
              color: comment.isLiked ? '#16a34a' : '#64748b',
              fontWeight: 700,
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            <IconHeart size={13} filled={Boolean(comment.isLiked)} color={comment.isLiked ? '#16a34a' : '#94a3b8'} />
            <span style={{ fontSize: 11 }}>{comment.likes || 0}</span>
          </button>
        </div>
      </div>

      {/* Deeply Nested Sub-Replies (Recursive Rendering) */}
      {(comment.replies || []).map(subReply => (
        <RecursiveCommentNode
          key={subReply.id}
          comment={subReply}
          depth={depth + 1}
          myCircleList={myCircleList}
          currentUser={currentUser}
          onReplyClick={onReplyClick}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  )
}

export default function KisanSocial({ onBack }) {
  const currentUser = getWebsiteRegisteredFarmer()

  // Navigation & View state: 'feed' | 'fieldVibes' | 'search' | 'messages' | 'profile' | 'settings'
  const [activeTab, setActiveTab] = useState('feed')
  const [activeCategory, setActiveCategory] = useState('all')
  const [locationSearchFilter, setLocationSearchFilter] = useState('')
  const [selectedProfileUser, setSelectedProfileUser] = useState(null)
  const [profileSubTab, setProfileSubTab] = useState('All')

  // Route-based Scroll Restoration State: Tracks scroll position per tab to avoid scroll bleed
  const scrollPositionsRef = useRef({
    feed: 0,
    fieldVibes: 0,
    search: 0,
    messages: 0,
    profile: 0,
    settings: 0
  })

  // Handle Tab Change with Independent Scroll Restoration
  const handleTabSwitch = (newTab, profileUser = null) => {
    // Record current scroll position
    scrollPositionsRef.current[activeTab] = window.scrollY || document.documentElement.scrollTop

    setActiveTab(newTab)
    setSelectedProfileUser(profileUser)

    // Reset or restore scroll to top (Y: 0) for the target tab
    requestAnimationFrame(() => {
      const targetScroll = profileUser ? 0 : (scrollPositionsRef.current[newTab] || 0)
      window.scrollTo({ top: targetScroll, behavior: 'instant' })
    })
  }

  // Scroll to top whenever tab or selected profile user switches
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab, selectedProfileUser])

  // Posts & fieldVibes state
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_posts_v5')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return INITIAL_SEED_POSTS
  })

  // Followers, Fieldmates & My Circle state
  const [followingList, setFollowingList] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_following_v5')
      return saved ? JSON.parse(saved) : ['@rajesh_wheat']
    } catch (e) {
      return ['@rajesh_wheat']
    }
  })

  const [fieldmatesList, setFieldmatesList] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_fieldmates_v5')
      return saved ? JSON.parse(saved) : ['@rajesh_wheat', '@dr_arvind_kvk', '@manpreet_dairy']
    } catch (e) {
      return ['@rajesh_wheat', '@dr_arvind_kvk', '@manpreet_dairy']
    }
  })

  const [myCircleList, setMyCircleList] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_mycircle_v5')
      return saved ? JSON.parse(saved) : ['@rajesh_wheat']
    } catch (e) {
      return ['@rajesh_wheat']
    }
  })

  const [pendingFieldmateRequests, setPendingFieldmateRequests] = useState([
    {
      id: 'freq-101',
      fromUser: {
        name: 'Sunkara Ravi Kumar',
        username: '@ravi_paddy',
        village: 'Vijayawada, AP',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        mutualCount: 10
      },
      message: 'Namaste brother, let us connect as Fieldmates for paddy seed exchange.'
    }
  ])

  // Chat Permissions Privacy Setting: 'Everyone' | 'Fieldmates' | 'Followers'
  const [chatPermission, setChatPermission] = useState(() => {
    return localStorage.getItem('krishi_chat_perm_v5') || 'Everyone'
  })

  // Backend Green Tick Verification Flag
  const [hasGreenTick, setHasGreenTick] = useState(() => {
    return localStorage.getItem('krishi_green_tick_v5') === 'true'
  })

  // Low-Bandwidth / Data Saver Mode
  const [dataSaverMode, setDataSaverMode] = useState(() => {
    return localStorage.getItem('krishi_data_saver_v5') === 'true'
  })

  // Message Request Queue
  const [messageRequests, setMessageRequests] = useState([
    {
      id: 'mreq-1',
      sender: {
        name: 'Kisan Trader Agro',
        username: '@kisan_trader',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
      },
      timestamp: '2 hours ago',
      hiddenMessage: 'We have bulk buyer demand for your harvest at competitive benchmark rates.',
      status: 'pending'
    }
  ])

  // Direct Chat Threads
  const [chatThreads, setChatThreads] = useState({
    '@rajesh_wheat': [
      { sender: '@rajesh_wheat', text: 'Namaste brother! How is the crop condition in your village?', time: '10:30 AM', audioUrl: null },
      { sender: currentUser.username, text: 'Doing well Rajesh ji! Applied bio-fertilizer as you suggested.', time: '10:32 AM', audioUrl: null }
    ]
  })
  const [activeChatRecipient, setActiveChatRecipient] = useState('@rajesh_wheat')
  const [chatInputText, setChatInputText] = useState('')
  const [activeMessageTab, setActiveMessageTab] = useState('chats')

  // Voice Notes Recorder State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [activeAudioTarget, setActiveAudioTarget] = useState(null)
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  // Direct Voice Calling Modal State
  const [activeVoiceCall, setActiveVoiceCall] = useState(null)
  const [isCallMuted, setIsCallMuted] = useState(false)
  const callTimerRef = useRef(null)

  // Side Comments Drawer State
  const [activeSideCommentPostId, setActiveSideCommentPostId] = useState(null)
  const [commentInputText, setCommentInputText] = useState('')
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyingToAuthorName, setReplyingToAuthorName] = useState('')

  // Derive Active Side Comment Post dynamically based on active post ID (Fixes comment bleeding)
  const activeSideCommentPost = posts.find(p => p.id === activeSideCommentPostId) || null

  // Modals & Menu State
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [showFieldmatesModal, setShowFieldmatesModal] = useState(false)
  const [fieldmatesModalUser, setFieldmatesModalUser] = useState(null)
  const [fieldmatesSearchQuery, setFieldmatesSearchQuery] = useState('')
  const [fieldmatesModalTab, setFieldmatesModalTab] = useState('all')
  const [activePostMenuId, setActivePostMenuId] = useState(null)
  const [reportModalPost, setReportModalPost] = useState(null)
  const [reportReason, setReportReason] = useState('Misleading crop protection advisory or fake pesticide recipe')

  // Music Integration Modal State
  const [showMusicPickerModal, setShowMusicPickerModal] = useState(false)
  const [musicSearchQuery, setMusicSearchQuery] = useState('')
  const [musicFilterCategory, setMusicFilterCategory] = useState('All')
  const [activePreviewTrackId, setActivePreviewTrackId] = useState(null)
  const previewAudioRef = useRef(null)

  // Seasonal Trending Topics
  const [trendingTopics, setTrendingTopics] = useState([
    { id: 't-1', tag: '#WheatTillering', category: 'Crop Care', postsCount: 1420, trend: '+45% this week' },
    { id: 't-2', tag: '#GunturChilliRates', category: 'Mandi Rates', postsCount: 980, trend: '+32% this week' },
    { id: 't-3', tag: '#JeevamruthaPrep', category: 'Organic Farming', postsCount: 750, trend: '+28% this week' },
    { id: 't-4', tag: '#DripIrrigationSubsidy', category: 'Govt Schemes & Subsidies', postsCount: 620, trend: '+19% this week' },
    { id: 't-5', tag: '#MustardAphidAlert', category: 'Crop Care', postsCount: 540, trend: '+55% this week' },
    { id: 't-6', tag: '#SoilBioPotash', category: 'Soil Health & Testing', postsCount: 410, trend: '+14% this week' }
  ])

  // Search Screen State
  const [searchQuery, setSearchQuery] = useState('')

  // Create Post Form State
  const [newPostCategory, setNewPostCategory] = useState('Crop Care')
  const [newPostLocation, setNewPostLocation] = useState('') // Free-text location input
  const [newPostType, setNewPostType] = useState('post') // 'post' | 'fieldVibe'
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImagePreview, setNewPostImagePreview] = useState(null)
  const [newPostVideoDuration, setNewPostVideoDuration] = useState(null)
  const [newPostAttachedMusic, setNewPostAttachedMusic] = useState(null) // Attached audio track object
  const fileInputRef = useRef(null)

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('krishi_posts_v5', JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem('krishi_following_v5', JSON.stringify(followingList))
  }, [followingList])

  useEffect(() => {
    localStorage.setItem('krishi_fieldmates_v5', JSON.stringify(fieldmatesList))
  }, [fieldmatesList])

  useEffect(() => {
    localStorage.setItem('krishi_mycircle_v5', JSON.stringify(myCircleList))
  }, [myCircleList])

  useEffect(() => {
    localStorage.setItem('krishi_chat_perm_v5', chatPermission)
  }, [chatPermission])

  useEffect(() => {
    localStorage.setItem('krishi_green_tick_v5', hasGreenTick ? 'true' : 'false')
  }, [hasGreenTick])

  useEffect(() => {
    localStorage.setItem('krishi_data_saver_v5', dataSaverMode ? 'true' : 'false')
  }, [dataSaverMode])

  // Reset comment input state whenever active comment post changes (Fixes comment bleeding)
  useEffect(() => {
    setCommentInputText('')
    setReplyingToCommentId(null)
    setReplyingToAuthorName('')
  }, [activeSideCommentPostId])

  // Media Attachment Handler with Strict Video Duration File Validation
  const handleMediaFileSelection = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (isVideo) {
      // Validate Video Duration: fieldVibes <= 1 min (60s), Posts <= 10 min (600s)
      const tempVideo = document.createElement('video')
      tempVideo.preload = 'metadata'
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src)
        const duration = Math.round(tempVideo.duration)
        setNewPostVideoDuration(duration)

        if (newPostType === 'fieldVibe' && duration > 60) {
          alert(`Strict File Validation: "fieldVibes" short videos are strictly restricted to 1 minute (60 seconds) or less. Selected video duration is ${duration} seconds.`)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }

        if (newPostType === 'post' && duration > 600) {
          alert(`Strict File Validation: Standard "Posts" videos cannot exceed 10 minutes (600 seconds). Selected video duration is ${Math.round(duration / 60)} minutes.`)
          if (fileInputRef.current) fileInputRef.current.value = ''
          return
        }

        // Valid video duration -> read DataURL
        const reader = new FileReader()
        reader.onload = (ev) => setNewPostImagePreview(ev.target?.result)
        reader.readAsDataURL(file)
      }
      tempVideo.src = URL.createObjectURL(file)
    } else if (isImage) {
      setNewPostVideoDuration(null)
      const reader = new FileReader()
      reader.onload = (ev) => setNewPostImagePreview(ev.target?.result)
      reader.readAsDataURL(file)
    } else {
      alert('Please attach an image or video file.')
    }
  }

  // Audio Recording Handlers (MediaRecorder)
  const startAudioRecording = (target) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported in this browser.')
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioUrl = URL.createObjectURL(audioBlob)

          if (target === 'comment') {
            handleAddVoiceNoteComment(audioUrl)
          } else if (target === 'chat') {
            handleSendVoiceNoteChatMessage(audioUrl)
          }

          stream.getTracks().forEach(t => t.stop())
        }

        mediaRecorderRef.current.start()
        setIsRecordingAudio(true)
        setActiveAudioTarget(target)
        setRecordingDuration(0)

        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
      })
      .catch(() => {
        const mockVoiceNote = `https://actions.google.com/sounds/v1/nature/wind_and_leaves.ogg`
        if (target === 'comment') {
          handleAddVoiceNoteComment(mockVoiceNote)
        } else if (target === 'chat') {
          handleSendVoiceNoteChatMessage(mockVoiceNote)
        }
      })
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudio(false)
      clearInterval(recordingTimerRef.current)
    }
  }

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudio(false)
      clearInterval(recordingTimerRef.current)
      audioChunksRef.current = []
    }
  }

  // Voice Calling Engine
  const handleInitiateVoiceCall = (recipientUsername) => {
    const isFieldmate = fieldmatesList.includes(recipientUsername)
    if (!isFieldmate) {
      alert('Direct Voice Calling is strictly permitted between accepted Fieldmates only.')
      return
    }

    setActiveVoiceCall({
      recipient: recipientUsername,
      status: 'ringing',
      duration: 0
    })

    setTimeout(() => {
      setActiveVoiceCall(prev => prev ? { ...prev, status: 'connected' } : null)
      callTimerRef.current = setInterval(() => {
        setActiveVoiceCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null)
      }, 1000)
    }, 2500)
  }

  const handleEndVoiceCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    setActiveVoiceCall(null)
    setIsCallMuted(false)
  }

  // "shabaash!" Reaction Handler
  const handleShabaash = (postId) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const isCurrentlyShabaash = p.userReaction === 'shabaash'
          const currentCount = p.reactions?.shabaash || 0
          return {
            ...p,
            userReaction: isCurrentlyShabaash ? null : 'shabaash',
            reactions: {
              ...p.reactions,
              shabaash: isCurrentlyShabaash ? Math.max(0, currentCount - 1) : currentCount + 1
            }
          }
        }
        return p
      })
    )

    axios.post(`${API_BASE_URL}/api/social/posts/${postId}/react`, { reactionType: 'shabaash' }).catch(() => {})
  }

  // Bookmark / Save Post to "My Barn"
  const handleToggleSavePost = (postId) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return { ...p, saved: !p.saved }
        }
        return p
      })
    )

    axios.post(`${API_BASE_URL}/api/social/posts/${postId}/save`, { username: currentUser.username }).catch(() => {})
  }

  // Follow / Unfollow Toggle
  const handleToggleFollow = (targetUsername) => {
    setFollowingList(prev => {
      const isFollowing = prev.includes(targetUsername)
      if (isFollowing) {
        return prev.filter(u => u !== targetUsername)
      } else {
        return [...prev, targetUsername]
      }
    })
    axios.post(`${API_BASE_URL}/api/social/follow`, {
      followerUsername: currentUser.username,
      targetUsername
    }).catch(() => {})
  }

  // Fieldmate Connection Handlers
  const handleSendFieldmateRequest = (targetUser) => {
    alert(`Fieldmate request sent to ${targetUser.name}! Once accepted, you will become mutual Fieldmates.`)
    axios.post(`${API_BASE_URL}/api/social/fieldmate-requests`, {
      fromUser: currentUser,
      toUser: targetUser
    }).catch(() => {})
  }

  const handleRespondFieldmateRequest = (requestId, action, senderUsername) => {
    setPendingFieldmateRequests(prev => prev.filter(r => r.id !== requestId))
    if (action === 'accept') {
      setFieldmatesList(prev => [...prev, senderUsername])
    }
    axios.post(`${API_BASE_URL}/api/social/fieldmate-requests/${requestId}/respond`, { action }).catch(() => {})
  }

  // Toggle "My Circle"
  const handleToggleMyCircle = (targetUsername) => {
    setMyCircleList(prev => {
      if (prev.includes(targetUsername)) {
        return prev.filter(u => u !== targetUsername)
      } else {
        return [...prev, targetUsername]
      }
    })
    axios.post(`${API_BASE_URL}/api/social/my-circle/toggle`, {
      username: currentUser.username,
      targetUsername
    }).catch(() => {})
  }

  // Post Submission (Free-text Location + Strict Category)
  const handleCreatePostSubmit = (e) => {
    e.preventDefault()
    if (!newPostContent.trim() && !newPostImagePreview) {
      alert('Please add some thoughts or media.')
      return
    }

    const baseReach = newPostType === 'fieldVibe' ? 840 : 420
    const computedReach = hasGreenTick ? `${(baseReach * 3 / 1000).toFixed(1)}k` : `${baseReach}`

    const newPost = {
      id: `post-${Date.now()}`,
      author: {
        id: 'self',
        name: currentUser.name,
        username: currentUser.username,
        village: currentUser.village,
        district: newPostLocation || currentUser.district,
        state: currentUser.state,
        avatar: currentUser.avatar,
        hasGreenTick: hasGreenTick,
        joinDate: currentUser.joinDate,
        primaryCategory: newPostCategory
      },
      category: newPostCategory,
      district: newPostLocation.trim() || currentUser.district,
      circle: newPostCategory.toLowerCase().replace(/\s+/g, '-'),
      contentType: newPostType,
      audioTrack: newPostAttachedMusic ? newPostAttachedMusic.title : null,
      timestamp: 'Just now',
      reach: computedReach,
      boostedReach: hasGreenTick,
      englishContent: newPostContent.trim(),
      originalContent: newPostContent.trim(),
      image: newPostImagePreview,
      reactions: { shabaash: 0 },
      userReaction: null,
      saved: false,
      comments: []
    }

    setPosts(prev => [newPost, ...prev])
    setShowCreatePostModal(false)
    setNewPostContent('')
    setNewPostImagePreview(null)
    setNewPostLocation('')
    setNewPostAttachedMusic(null)
    setNewPostCategory('Crop Care')

    axios.post(`${API_BASE_URL}/api/social/posts`, {
      author: currentUser,
      category: newPostCategory,
      district: newPostLocation.trim() || currentUser.district,
      contentType: newPostType,
      audioTrack: newPostAttachedMusic ? newPostAttachedMusic.title : null,
      englishContent: newPostContent.trim(),
      image: newPostImagePreview
    }).catch(() => {})
  }

  // Add Comment or Deep Nested Reply
  const handleAddComment = () => {
    if (!commentInputText.trim() || !activeSideCommentPostId) return

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text: commentInputText.trim(),
      audioUrl: null,
      likes: 0,
      isLiked: false,
      time: 'Just now',
      replies: []
    }

    setPosts(prev =>
      prev.map(p => {
        if (p.id === activeSideCommentPostId) {
          let updatedComments = [...(p.comments || [])]
          if (replyingToCommentId) {
            updatedComments = insertNestedReply(updatedComments, replyingToCommentId, newComment)
          } else {
            updatedComments.push(newComment)
          }
          return { ...p, comments: updatedComments }
        }
        return p
      })
    )

    setCommentInputText('')
    setReplyingToCommentId(null)
    setReplyingToAuthorName('')
  }

  // Add Voice Note Comment
  const handleAddVoiceNoteComment = (audioUrl) => {
    if (!activeSideCommentPostId) return

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text: 'Voice note discussion',
      audioUrl: audioUrl,
      likes: 0,
      isLiked: false,
      time: 'Just now',
      replies: []
    }

    setPosts(prev =>
      prev.map(p => {
        if (p.id === activeSideCommentPostId) {
          let updatedComments = [...(p.comments || [])]
          if (replyingToCommentId) {
            updatedComments = insertNestedReply(updatedComments, replyingToCommentId, newComment)
          } else {
            updatedComments.push(newComment)
          }
          return { ...p, comments: updatedComments }
        }
        return p
      })
    )

    setReplyingToCommentId(null)
    setReplyingToAuthorName('')
  }

  // Toggle Comment Like (Heart SVG)
  const handleToggleCommentLike = (commentId) => {
    if (!activeSideCommentPostId) return

    setPosts(prev =>
      prev.map(p => {
        if (p.id === activeSideCommentPostId) {
          const updatedComments = toggleNestedCommentLike(p.comments || [], commentId)
          return { ...p, comments: updatedComments }
        }
        return p
      })
    )
  }

  // Set Reply Target (Works at any deep level)
  const handleInitiateReply = (commentId, authorName, username) => {
    setReplyingToCommentId(commentId)
    setReplyingToAuthorName(authorName)
    setCommentInputText(`@${username || authorName} `)
  }

  // Direct Chat Message Sending
  const handleSendChatMessage = () => {
    if (!chatInputText.trim()) return

    const newMsg = {
      sender: currentUser.username,
      text: chatInputText.trim(),
      audioUrl: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setChatThreads(prev => ({
      ...prev,
      [activeChatRecipient]: [...(prev[activeChatRecipient] || []), newMsg]
    }))

    setChatInputText('')

    axios.post(`${API_BASE_URL}/api/social/messages`, {
      sender: currentUser,
      receiver: { username: activeChatRecipient },
      text: chatInputText.trim()
    }).catch(() => {})
  }

  const handleSendVoiceNoteChatMessage = (audioUrl) => {
    const newMsg = {
      sender: currentUser.username,
      text: 'Voice Note',
      audioUrl: audioUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setChatThreads(prev => ({
      ...prev,
      [activeChatRecipient]: [...(prev[activeChatRecipient] || []), newMsg]
    }))

    axios.post(`${API_BASE_URL}/api/social/messages`, {
      sender: currentUser,
      receiver: { username: activeChatRecipient },
      text: 'Voice Note',
      audioUrl
    }).catch(() => {})
  }

  // Accept Message Request
  const handleAcceptMessageRequest = (req) => {
    setMessageRequests(prev => prev.filter(r => r.id !== req.id))
    setChatThreads(prev => ({
      ...prev,
      [req.sender.username]: [
        { sender: req.sender.username, text: req.hiddenMessage, time: 'Just now', audioUrl: null }
      ]
    }))
    setActiveChatRecipient(req.sender.username)
    setActiveMessageTab('chats')
  }

  // Misinformation Report Submission
  const handleSubmitMisinformationReport = () => {
    if (!reportModalPost) return

    axios.post(`${API_BASE_URL}/api/social/posts/${reportModalPost.id}/report-misinformation`, {
      reportedBy: currentUser.username,
      reason: reportReason,
      contentType: reportModalPost.contentType
    }).catch(() => {})

    alert('Thank you for protecting our farming community. This update has been flagged and routed to agricultural moderation.')
    setReportModalPost(null)
    setActivePostMenuId(null)
  }

  // Audio Track Preview Player Handler
  const handlePlayPreviewMusic = (track) => {
    if (activePreviewTrackId === track.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      setActivePreviewTrackId(null)
      return
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }

    const audio = new Audio(track.audioUrl)
    audio.play().catch(() => {})
    previewAudioRef.current = audio
    setActivePreviewTrackId(track.id)

    audio.onended = () => setActivePreviewTrackId(null)
  }

  // Profile Data Resolution
  const viewingProfile = selectedProfileUser || currentUser
  const isViewingSelf = !selectedProfileUser || selectedProfileUser.username === currentUser.username
  const isProfileInMyCircle = myCircleList.includes(viewingProfile.username)
  const isProfileFieldmate = fieldmatesList.includes(viewingProfile.username)
  const isProfileFollowing = followingList.includes(viewingProfile.username)

  const profilePosts = posts.filter(p => (p.author?.username || '').toLowerCase() === viewingProfile.username.toLowerCase())
  const savedBarnPosts = posts.filter(p => p.saved)

  // Filtered Feed (15 Categories + Free-Text Location)
  const displayPosts = posts.filter(p => {
    if (activeTab === 'fieldVibes' && p.contentType !== 'fieldVibe') return false
    if (activeTab === 'feed' && activeCategory !== 'all' && p.category !== activeCategory) return false
    if (locationSearchFilter.trim()) {
      const locMatch = (p.district || '').toLowerCase().includes(locationSearchFilter.toLowerCase().trim()) ||
                       (p.author?.village || '').toLowerCase().includes(locationSearchFilter.toLowerCase().trim())
      if (!locMatch) return false
    }
    return true
  })

  // Format Call Timer
  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#09090b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* 1. TOP GLOBAL NAVIGATION */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: '#f0fdf4',
                border: 'none',
                color: '#166534',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: 13
              }}
            >
              <IconArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          <div 
            onClick={() => handleTabSwitch('feed', null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <IconLogo size={32} color="#16a34a" />
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#09090b', letterSpacing: '-0.5px' }}>
                Krishi<span style={{ color: '#16a34a' }}>Social</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Primary Tab Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => handleTabSwitch('feed', null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'feed' && !selectedProfileUser ? '#16a34a' : 'transparent',
              color: activeTab === 'feed' && !selectedProfileUser ? '#ffffff' : '#09090b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <IconHome size={18} active={activeTab === 'feed' && !selectedProfileUser} />
            <span>Posts</span>
          </button>

          <button
            onClick={() => handleTabSwitch('fieldVibes', null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'fieldVibes' && !selectedProfileUser ? '#16a34a' : 'transparent',
              color: activeTab === 'fieldVibes' && !selectedProfileUser ? '#ffffff' : '#09090b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <IconFieldVibes size={18} active={activeTab === 'fieldVibes' && !selectedProfileUser} />
            <span>fieldVibes</span>
          </button>

          <button
            onClick={() => handleTabSwitch('search', null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'search' && !selectedProfileUser ? '#16a34a' : 'transparent',
              color: activeTab === 'search' && !selectedProfileUser ? '#ffffff' : '#09090b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <IconSearch size={18} color={activeTab === 'search' && !selectedProfileUser ? '#ffffff' : '#09090b'} />
            <span>Explore</span>
          </button>

          <button
            onClick={() => handleTabSwitch('messages', null)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'messages' ? '#16a34a' : 'transparent',
              color: activeTab === 'messages' ? '#ffffff' : '#09090b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <IconPaperPlane size={18} />
            <span>Messages</span>
            {messageRequests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: '#16a34a',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 900,
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {messageRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Right User & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowCreatePostModal(true)}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)'
            }}
          >
            <IconPlus size={16} color="#ffffff" strokeWidth={3} />
            <span>Create</span>
          </button>

          <button
            onClick={() => handleTabSwitch('settings', null)}
            title="Privacy & Settings"
            style={{
              background: activeTab === 'settings' ? '#dcfce7' : '#f8fafc',
              border: 'none',
              color: '#09090b',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <IconSettings size={18} />
          </button>

          {/* Current User Avatar */}
          <div
            onClick={() => handleTabSwitch('profile', null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                border: isProfileInMyCircle ? '3px solid #f97316' : 'none'
              }}
            />
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER LAYOUT */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px', display: 'flex', gap: 24, position: 'relative' }}>
        
        {/* LEFT COLUMN / FEED / PROFILE CONTENT */}
        <main style={{ flex: 1, minWidth: 0 }}>
          
          {/* ================================================================ */}
          {/* VIEW: FIELDVIBES VERTICAL SNAP-SCROLL VIDEO REELS */}
          {/* ================================================================ */}
          {activeTab === 'fieldVibes' && !selectedProfileUser && (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <VibesFeed
                vibes={posts.filter(p => p.contentType === 'fieldVibe')}
                currentUser={currentUser}
                myCircleList={myCircleList}
                onShabaash={handleReaction}
                onUpdatePostComments={(postId, newComments) => {
                  setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: newComments } : p))
                }}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: POSTS FEED */}
          {/* ================================================================ */}
          {activeTab === 'feed' && !selectedProfileUser && (
            <div>
              
              {/* 15 Agricultural Categories Pills & Free-Text Location Filter Bar */}
              <div style={{ marginBottom: 16 }}>
                {/* Horizontal Scrolling Category Chips */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  scrollbarWidth: 'none'
                }}>
                  {CATEGORIES.map(cat => {
                    const CatIcon = cat.Icon
                    const isSelected = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 20,
                          border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                          background: isSelected ? '#dcfce7' : '#ffffff',
                          color: isSelected ? '#166534' : '#09090b',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <CatIcon size={15} color={isSelected ? '#166534' : '#64748b'} />
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Free-Text Location Filter Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    maxWidth: 320,
                    width: '100%'
                  }}>
                    <IconMapPin size={15} color="#16a34a" />
                    <input
                      type="text"
                      value={locationSearchFilter}
                      onChange={(e) => setLocationSearchFilter(e.target.value)}
                      placeholder="Filter by location (e.g. Guntur, Ludhiana)..."
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, width: '100%', color: '#1e293b' }}
                    />
                    {locationSearchFilter && (
                      <button onClick={() => setLocationSearchFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                        <IconClose size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Feed Posts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {displayPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                    <IconPosts size={40} color="#cbd5e1" />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginTop: 12 }}>No updates found in this category or location</h3>
                    <p style={{ fontSize: 13, color: '#64748b' }}>Try selecting "All Updates" or clearing the location filter.</p>
                  </div>
                ) : (
                  displayPosts.map(post => {
                    const isAuthorFollowed = followingList.includes(post.author?.username)
                    const isAuthorInMyCircle = myCircleList.includes(post.author?.username)
                    const isAuthorSelf = (post.author?.username || '').toLowerCase() === currentUser.username.toLowerCase()
                    const isShabaashActive = post.userReaction === 'shabaash'
                    const commentsCount = countTotalComments(post.comments || [])

                    return (
                      <article
                        key={post.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: 14,
                          padding: 18,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          border: '1px solid #f1f5f9',
                          position: 'relative'
                        }}
                      >
                        {/* Post Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div
                            onClick={() => handleTabSwitch('profile', post.author)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          >
                            <img
                              src={post.author?.avatar}
                              alt={post.author?.name}
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: isAuthorInMyCircle ? '3px solid #f97316' : 'none'
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: '#09090b' }}>
                                  {post.author?.name}
                                </span>
                                {post.author?.hasGreenTick && (
                                  <span title="Verified Green Tick (3x Reach Active)">
                                    <IconVerified size={16} color="#16a34a" />
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{post.author?.username}</span>
                                <span>•</span>
                                <span>{post.timestamp}</span>
                                {post.district && (
                                  <>
                                    <span>•</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                      <IconMapPin size={11} color="#64748b" />
                                      {post.district}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Header Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {!isAuthorSelf && (
                              <button
                                onClick={() => handleToggleFollow(post.author?.username)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 14px',
                                  borderRadius: 20,
                                  border: isAuthorFollowed ? '1px solid #cbd5e1' : 'none',
                                  background: isAuthorFollowed ? '#ffffff' : '#16a34a',
                                  color: isAuthorFollowed ? '#09090b' : '#ffffff',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  transition: 'all 0.18s ease'
                                }}
                              >
                                {isAuthorFollowed ? (
                                  <>
                                    <IconFollowing size={14} color="#16a34a" />
                                    <span>Following</span>
                                  </>
                                ) : (
                                  <>
                                    <IconFollow size={14} color="#ffffff" />
                                    <span>Follow</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Three-Dot Options Menu */}
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                                style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#64748b' }}
                              >
                                <IconDots size={18} />
                              </button>

                              {activePostMenuId === post.id && (
                                <div style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 30,
                                  background: '#ffffff',
                                  borderRadius: 10,
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                  border: '1px solid #e2e8f0',
                                  width: 220,
                                  zIndex: 50,
                                  overflow: 'hidden'
                                }}>
                                  <button
                                    onClick={() => {
                                      setReportModalPost(post)
                                      setActivePostMenuId(null)
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: 'none',
                                      background: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      color: '#b91c1c',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <IconFlag size={16} color="#b91c1c" />
                                    <span>Report Misinformation</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleSavePost(post.id)
                                      setActivePostMenuId(null)
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: 'none',
                                      borderTop: '1px solid #f1f5f9',
                                      background: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      color: '#334155',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <IconBookmark size={16} filled={post.saved} color={post.saved ? '#16a34a' : '#64748b'} />
                                    <span>{post.saved ? 'Remove from Barn' : 'Save to My Barn'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Category & Audio Track Overlay Tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#f0fdf4',
                            color: '#166534',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            <IconLeaf size={12} color="#166534" />
                            <span>{post.category}</span>
                          </span>

                          {post.audioTrack && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#f8fafc',
                              color: '#334155',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 6
                            }}>
                              <IconMusic size={12} color="#16a34a" />
                              <span>{post.audioTrack}</span>
                            </span>
                          )}
                        </div>

                        {/* Post Content */}
                        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#1e293b', marginBottom: 12 }}>
                          {post.englishContent || post.originalContent}
                        </p>

                        {/* Media Attachment */}
                        {post.image && (
                          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: '#09090b', position: 'relative' }}>
                            <img
                              src={post.image}
                              alt="Post Media"
                              style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }}
                            />
                            {post.contentType === 'fieldVibe' && (
                              <div style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                background: 'rgba(0,0,0,0.65)',
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: 11.5,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                backdropFilter: 'blur(4px)'
                              }}>
                                <IconFieldVibes size={14} color="#16a34a" />
                                <span>fieldVibe (1 min)</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reach & Stats Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 10, fontSize: 12, color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {post.boostedReach && <IconLightning size={14} color="#16a34a" />}
                            <span>{post.reach} algorithmic reach</span>
                          </div>
                          <div>
                            <span>{commentsCount} comments</span>
                          </div>
                        </div>

                        {/* Post Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                          
                          {/* Left: "shabaash!" + Bookmark ("My Barn") */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => handleShabaash(post.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: isShabaashActive ? '#dcfce7' : '#f8fafc',
                                color: isShabaashActive ? '#166534' : '#475569',
                                fontWeight: isShabaashActive ? 900 : 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <IconCropSprout size={20} filled={isShabaashActive} color={isShabaashActive ? '#166534' : '#64748b'} />
                              <span>shabaash!</span>
                              <span style={{ fontSize: 12, opacity: 0.85 }}>({post.reactions?.shabaash || 0})</span>
                            </button>

                            <button
                              onClick={() => handleToggleSavePost(post.id)}
                              title={post.saved ? 'Saved in My Barn' : 'Save to My Barn'}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: 'none',
                                background: post.saved ? '#dcfce7' : '#f8fafc',
                                color: post.saved ? '#166534' : '#64748b',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <IconBookmark size={18} filled={post.saved} color={post.saved ? '#16a34a' : '#64748b'} />
                              <span>{post.saved ? 'Saved' : 'Barn'}</span>
                            </button>
                          </div>

                          {/* Right: Comments Side Drawer Trigger */}
                          <button
                            onClick={() => setActiveSideCommentPostId(activeSideCommentPostId === post.id ? null : post.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: activeSideCommentPostId === post.id ? '#f1f5f9' : '#f8fafc',
                              color: '#475569',
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: 'pointer'
                            }}
                          >
                            <IconComment size={18} color="#64748b" />
                            <span>Comments</span>
                          </button>

                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: SEARCH / SUGGESTIONS & SEASONAL TRENDING TOPICS */}
          {/* ================================================================ */}
          {activeTab === 'search' && !selectedProfileUser && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <IconSearch size={20} color="#64748b" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search farmers, crop advisories, mandi rates, or discussions..."
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: 14 }}
                />
              </div>

              {/* 1. HORIZONTAL SCROLLING CAROUSEL: Seasonal Trending Topics */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <IconTrending size={20} color="#16a34a" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Seasonal Trending Topics (Last 7 Days)</h3>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 12,
                  overflowX: 'auto',
                  paddingBottom: 10,
                  scrollbarWidth: 'none'
                }}>
                  {trendingTopics.map(topic => (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setActiveCategory(topic.category)
                        handleTabSwitch('feed', null)
                      }}
                      style={{
                        minWidth: 200,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>
                        {topic.category}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#09090b', marginBottom: 6 }}>
                        {topic.tag}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
                        <span>{topic.postsCount} posts</span>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>{topic.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SUGGESTED FIELDMATE CONNECTIONS */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>Suggested Fieldmates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {INITIAL_FIELDMATE_PROFILES.map(fm => {
                    const isFollowing = followingList.includes(fm.username)
                    const isFieldmate = fieldmatesList.includes(fm.username)
                    return (
                      <div
                        key={fm.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          borderRadius: 14,
                          padding: 16,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <img
                            src={fm.avatar}
                            alt={fm.name}
                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#09090b' }}>{fm.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{fm.village}, {fm.state}</div>
                          </div>
                        </div>

                        <p style={{ fontSize: 12.5, color: '#475569', marginBottom: 14, minHeight: 36 }}>
                          {fm.bio}
                        </p>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              if (!isFieldmate) handleSendFieldmateRequest(fm)
                            }}
                            style={{
                              flex: 1,
                              background: isFieldmate ? '#dcfce7' : '#16a34a',
                              color: isFieldmate ? '#166534' : '#ffffff',
                              border: 'none',
                              padding: '8px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isFieldmate ? 'Fieldmate' : '+ Add Fieldmate'}
                          </button>
                          <button
                            onClick={() => handleToggleFollow(fm.username)}
                            style={{
                              flex: 1,
                              background: isFollowing ? '#f8fafc' : '#ffffff',
                              color: '#09090b',
                              border: '1px solid #cbd5e1',
                              padding: '8px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: PROFILE PAGE */}
          {/* ================================================================ */}
          {activeTab === 'profile' && (
            <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              
              {/* Cover Photo */}
              <div style={{
                height: 200,
                background: viewingProfile.coverPhoto ? `url(${viewingProfile.coverPhoto}) center/cover` : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
                position: 'relative'
              }}>
                {isViewingSelf && (
                  <button
                    onClick={() => alert('Cover photo update.')}
                    style={{
                      position: 'absolute',
                      bottom: 14,
                      right: 14,
                      background: '#ffffff',
                      border: 'none',
                      color: '#09090b',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <IconCamera size={16} />
                    <span>Edit cover</span>
                  </button>
                )}
              </div>

              {/* Profile Details Header */}
              <div style={{ padding: '0 24px 20px 24px', position: 'relative' }}>
                
                {/* Overlapping Avatar */}
                <div style={{ marginTop: -50, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={viewingProfile.avatar}
                      alt={viewingProfile.name}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        background: '#ffffff',
                        border: isProfileInMyCircle ? '4px solid #f97316' : 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    />
                  </div>
                </div>

                {/* Profile Identity */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#09090b' }}>
                      {viewingProfile.name}
                    </h1>
                    {viewingProfile.hasGreenTick && (
                      <span title="Verified Green Tick">
                        <IconVerified size={20} color="#16a34a" />
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14, fontWeight: 600 }}>
                    {viewingProfile.username}
                  </p>
                </div>

                {/* Fieldmates & Posts Count Trigger Modal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <button
                    onClick={() => {
                      setFieldmatesModalUser(viewingProfile)
                      setShowFieldmatesModal(true)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#09090b',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ color: '#16a34a', fontWeight: 900 }}>{fieldmatesList.length}</span>
                    <span style={{ textDecoration: 'underline' }}>fieldmates</span>
                  </button>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                    {profilePosts.length} posts
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  {isViewingSelf ? (
                    <>
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        style={{
                          flex: 1,
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        <IconPlus size={18} color="#ffffff" strokeWidth={3} />
                        <span>Create Post</span>
                      </button>
                      <button
                        onClick={() => handleTabSwitch('settings', null)}
                        style={{
                          flex: 1,
                          background: '#f8fafc',
                          color: '#09090b',
                          border: '1px solid #e2e8f0',
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        <IconSettings size={16} />
                        <span>Settings</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (!isProfileFieldmate) handleSendFieldmateRequest(viewingProfile)
                        }}
                        style={{
                          flex: 1,
                          background: isProfileFieldmate ? '#dcfce7' : '#16a34a',
                          color: isProfileFieldmate ? '#166534' : '#ffffff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        <IconFieldmates size={18} color={isProfileFieldmate ? '#166534' : '#ffffff'} />
                        <span>{isProfileFieldmate ? 'Fieldmate' : 'Add Fieldmate'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleFollow(viewingProfile.username)}
                        style={{
                          flex: 1,
                          background: isProfileFollowing ? '#f8fafc' : '#ffffff',
                          color: '#09090b',
                          border: '1px solid #cbd5e1',
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {isProfileFollowing ? <IconFollowing size={16} /> : <IconFollow size={16} />}
                        <span>{isProfileFollowing ? 'Following' : 'Follow'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleMyCircle(viewingProfile.username)}
                        title="Toggle My Circle (Orange Profile Border)"
                        style={{
                          background: isProfileInMyCircle ? '#ffedd5' : '#f8fafc',
                          color: isProfileInMyCircle ? '#c2410c' : '#64748b',
                          border: isProfileInMyCircle ? '1.5px solid #f97316' : '1px solid #e2e8f0',
                          padding: '10px 14px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer'
                        }}
                      >
                        <IconMyCircle size={18} color="#f97316" />
                        <span>{isProfileInMyCircle ? 'In My Circle' : 'Add to Circle'}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Profile Navigation Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
                  {(isViewingSelf ? ['All', 'Photos', 'fieldVibes', 'Saved'] : ['All', 'Photos', 'fieldVibes']).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setProfileSubTab(tab)}
                      style={{
                        padding: '12px 20px',
                        border: 'none',
                        borderBottom: profileSubTab === tab ? '3px solid #16a34a' : '3px solid transparent',
                        background: 'transparent',
                        color: profileSubTab === tab ? '#166534' : '#64748b',
                        fontWeight: profileSubTab === tab ? 900 : 700,
                        fontSize: 14,
                        cursor: 'pointer'
                      }}
                    >
                      {tab === 'Saved' ? 'Saved (My Barn)' : tab}
                    </button>
                  ))}
                </div>

                {/* Personal Details Section */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 900, color: '#09090b' }}>
                    Personal Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#334155' }}>
                      <IconCalendar size={18} color="#64748b" />
                      <span>Member since <strong>{viewingProfile.joinDate || 'January 2021'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#334155' }}>
                      <IconMapPin size={18} color="#64748b" />
                      <span>Location: <strong>{viewingProfile.village}, {viewingProfile.state}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#334155' }}>
                      <IconLeaf size={18} color="#16a34a" />
                      <span>Primary Category: <strong>{viewingProfile.primaryCategory || 'Crop Care'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab Content Rendering */}
                {profileSubTab === 'Saved' ? (
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#09090b', marginBottom: 14 }}>
                      Saved Posts ("My Barn")
                    </h3>
                    {savedBarnPosts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: 12 }}>
                        No saved posts in your Barn yet. Click the bookmark icon below any post to save for offline reference.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {savedBarnPosts.map(post => (
                          <div key={post.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>{post.author?.name} ({post.category})</span>
                              <button
                                onClick={() => handleToggleSavePost(post.id)}
                                style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                              >
                                Remove
                              </button>
                            </div>
                            <p style={{ fontSize: 13.5, color: '#1e293b', margin: '0 0 10px 0' }}>{post.englishContent}</p>
                            {post.image && <img src={post.image} alt="Media" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8 }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#09090b', marginBottom: 14 }}>
                      Posts & fieldVibes
                    </h3>
                    {profilePosts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: 12 }}>
                        No updates posted yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {profilePosts.map(post => (
                          <div key={post.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                            <p style={{ fontSize: 14, color: '#1e293b', marginBottom: 10 }}>
                              {post.englishContent}
                            </p>
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post"
                                style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: DIRECT MESSAGES & MESSAGE REQUEST QUEUE */}
          {/* ================================================================ */}
          {activeTab === 'messages' && (
            <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 600 }}>
              
              {/* Left Chat Sidebar */}
              <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 900 }}>Direct Chat</h2>
                  
                  {/* Chat vs Requests Tabs */}
                  <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 8 }}>
                    <button
                      onClick={() => setActiveMessageTab('chats')}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: activeMessageTab === 'chats' ? '#ffffff' : 'transparent',
                        color: activeMessageTab === 'chats' ? '#166534' : '#64748b',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Active ({Object.keys(chatThreads).length})
                    </button>
                    <button
                      onClick={() => setActiveMessageTab('requests')}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: activeMessageTab === 'requests' ? '#ffffff' : 'transparent',
                        color: activeMessageTab === 'requests' ? '#166534' : '#64748b',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Requests ({messageRequests.length})
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {activeMessageTab === 'chats' ? (
                    Object.keys(chatThreads).map(uHandle => {
                      const userObj = INITIAL_FIELDMATE_PROFILES.find(p => p.username === uHandle) || { name: uHandle, avatar: currentUser.avatar }
                      const isSelected = activeChatRecipient === uHandle
                      const inCircle = myCircleList.includes(uHandle)
                      return (
                        <div
                          key={uHandle}
                          onClick={() => setActiveChatRecipient(uHandle)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f8fafc',
                            background: isSelected ? '#dcfce7' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                          }}
                        >
                          <img
                            src={userObj.avatar || currentUser.avatar}
                            alt={userObj.name}
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: inCircle ? '2px solid #f97316' : 'none'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#09090b' }}>{userObj.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{uHandle}</div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    messageRequests.map(req => (
                      <div
                        key={req.id}
                        style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <img
                            src={req.sender.avatar}
                            alt={req.sender.name}
                            style={{ width: 36, height: 36, borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>{req.sender.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{req.timestamp}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 10 }}>
                          🔒 Content hidden until accepted (Privacy restricted to Fieldmates)
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAcceptMessageRequest(req)}
                            style={{
                              flex: 1,
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setMessageRequests(prev => prev.filter(r => r.id !== req.id))}
                            style={{
                              flex: 1,
                              background: '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              padding: '6px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Active Chat Pane */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Chat Header with Direct Voice Calling Receiver Icon */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>Chatting with {activeChatRecipient}</span>
                    {fieldmatesList.includes(activeChatRecipient) && (
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                        Fieldmate
                      </span>
                    )}
                  </div>

                  {fieldmatesList.includes(activeChatRecipient) && (
                    <button
                      onClick={() => handleInitiateVoiceCall(activeChatRecipient)}
                      title="Start Direct Voice Call"
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#16a34a',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <IconPhone size={18} color="#16a34a" />
                    </button>
                  )}
                </div>

                {/* Messages Feed */}
                <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(chatThreads[activeChatRecipient] || []).map((msg, idx) => {
                    const isMe = msg.sender === currentUser.username
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          background: isMe ? '#16a34a' : '#f8fafc',
                          color: isMe ? '#ffffff' : '#09090b',
                          padding: '10px 14px',
                          borderRadius: 12,
                          fontSize: 13.5
                        }}
                      >
                        {msg.audioUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => {
                                setPlayingAudioId(playingAudioId === idx ? null : idx)
                                const audio = new Audio(msg.audioUrl)
                                audio.play().catch(() => {})
                              }}
                              style={{
                                background: isMe ? '#ffffff' : '#16a34a',
                                color: isMe ? '#16a34a' : '#ffffff',
                                border: 'none',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              {playingAudioId === idx ? <IconPause size={14} /> : <IconPlay size={14} />}
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>Voice Message (0:12)</span>
                          </div>
                        ) : (
                          <p style={{ margin: 0 }}>{msg.text}</p>
                        )}
                        <span style={{ fontSize: 10, opacity: 0.75, display: 'block', textAlign: 'right', marginTop: 4 }}>
                          {msg.time}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Direct Message Input Composer */}
                <div style={{ padding: 14, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {isRecordingAudio && activeAudioTarget === 'chat' ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '8px 14px', borderRadius: 8, border: '1px solid #fecaca' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 800, fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, background: '#dc2626', borderRadius: '50%' }} />
                        <span>Recording Voice Note ({recordingDuration}s)...</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={stopAudioRecording} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                          Send
                        </button>
                        <button onClick={cancelAudioRecording} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage() }}
                        placeholder="Type a message (emojis supported here)..."
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none'
                        }}
                      />

                      <button
                        onClick={() => startAudioRecording('chat')}
                        title="Record Voice Note"
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#16a34a',
                          padding: '10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconMic size={18} color="#16a34a" />
                      </button>

                      <button
                        onClick={handleSendChatMessage}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconSend size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW: SETTINGS */}
          {/* ================================================================ */}
          {activeTab === 'settings' && (
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Privacy & Account Settings</h2>
              
              {/* 1. Data Saver Mode Toggle */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconDataSaver size={18} color="#16a34a" />
                  <span>Data Saver Mode (Low-Bandwidth Optimization)</span>
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                  Caches loaded feed texts and compresses images locally before uploading to optimize field connectivity.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="checkbox"
                    id="dataSaverCheckbox"
                    checked={dataSaverMode}
                    onChange={(e) => setDataSaverMode(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <label htmlFor="dataSaverCheckbox" style={{ fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                    Enable Data Saver (Low-bandwidth caching & image compression)
                  </label>
                </div>
              </div>

              {/* 2. Chat Privacy Setting */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconLock size={18} color="#16a34a" />
                  <span>Incoming Chat Permissions</span>
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                  Restrict incoming direct messages. Unpermitted messages are routed to your Message Request Queue with text hidden until accepted.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Everyone', 'Fieldmates', 'Followers'].map(perm => (
                    <button
                      key={perm}
                      onClick={() => setChatPermission(perm)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 8,
                        border: chatPermission === perm ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        background: chatPermission === perm ? '#dcfce7' : '#ffffff',
                        color: chatPermission === perm ? '#166534' : '#09090b',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Hidden Discrete Green Tick Verification Engine */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconShield size={18} color="#16a34a" />
                  <span>Verified Creator Status</span>
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                  Backend verification flag granting 3x algorithmic reach multiplier and an ad-free experience.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="checkbox"
                    id="greenTickCheckbox"
                    checked={hasGreenTick}
                    onChange={(e) => setHasGreenTick(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <label htmlFor="greenTickCheckbox" style={{ fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                    Enable Green Tick (3x algorithmic distribution + zero sponsored banners)
                  </label>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ================================================================ */}
        {/* SIDEBAR: THREADED COMMENTS DRAWER (Shifted to side with Deep Nesting) */}
        {/* ================================================================ */}
        {activeSideCommentPost && (
          <DiscussionDrawer
            key={activeSideCommentPost.id}
            post={activeSideCommentPost}
            currentUser={currentUser}
            myCircleList={myCircleList}
            onClose={() => setActiveSideCommentPostId(null)}
            onUpdatePostComments={(postId, newComments) => {
              setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: newComments } : p))
            }}
          />
        )}

      </div>

      {/* ================================================================ */}
      {/* MODAL 1: CREATE POST / FIELDVIBE */}
      {/* ================================================================ */}
      {showCreatePostModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>Create New Update</h3>
              <button
                onClick={() => setShowCreatePostModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePostSubmit} style={{ padding: 20 }}>
              
              {/* Content Type Selector (Post vs fieldVibe) */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => { setNewPostType('post'); setNewPostVideoDuration(null) }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: newPostType === 'post' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: newPostType === 'post' ? '#dcfce7' : '#ffffff',
                    color: newPostType === 'post' ? '#166534' : '#09090b',
                    fontWeight: 800,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <IconPosts size={16} />
                  <span>Standard Post (Video ≤ 10m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setNewPostType('fieldVibe'); setNewPostVideoDuration(null) }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: newPostType === 'fieldVibe' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: newPostType === 'fieldVibe' ? '#dcfce7' : '#ffffff',
                    color: newPostType === 'fieldVibe' ? '#166534' : '#09090b',
                    fontWeight: 800,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <IconFieldVibes size={16} />
                  <span>fieldVibe (Video ≤ 1m)</span>
                </button>
              </div>

              {/* PROMPT 1: 15 Agricultural Categories Dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#09090b', marginBottom: 6 }}>
                  Select Category (15 Domains) *
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #16a34a',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#166534',
                    background: '#f0fdf4',
                    outline: 'none'
                  }}
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* PROMPT 2: Simple Free-Text Location / District Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#09090b', marginBottom: 6 }}>
                  Location / District (Free-Text Input)
                </label>
                <input
                  type="text"
                  value={newPostLocation}
                  onChange={(e) => setNewPostLocation(e.target.value)}
                  placeholder="e.g. Tenali, Guntur, AP or Khanna, Ludhiana..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Audio / Music Overlay Tool (For both Posts and fieldVibes) */}
              <div style={{ marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconMusic size={16} color="#16a34a" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#09090b' }}>
                      {newPostType === 'fieldVibe' ? 'Audio Track (Required)' : 'Music Overlay (Optional)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMusicPickerModal(true)}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {newPostAttachedMusic ? 'Change Track' : '+ Browse Songs'}
                  </button>
                </div>

                {newPostAttachedMusic ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconMusic size={14} color="#16a34a" />
                      <span>{newPostAttachedMusic.title} ({newPostAttachedMusic.artist})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewPostAttachedMusic(null)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Choose movie songs, folk rhythms, or private audio tracks to overlay on your content.
                  </div>
                )}
              </div>

              {/* Post Description Input */}
              <div style={{ marginBottom: 16 }}>
                <textarea
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share insights, farming observations, or field techniques..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Photo / Video Media Attachment with Strict Duration Check */}
              <div style={{ marginBottom: 20 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleMediaFileSelection}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px dashed #16a34a',
                    background: '#f0fdf4',
                    color: '#166534',
                    fontWeight: 800,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <IconImage size={18} color="#16a34a" />
                  <span>{newPostImagePreview ? 'Change Media File' : `Attach Photo or Video (Max ${newPostType === 'fieldVibe' ? '1 min' : '10 min'})`}</span>
                </button>

                {newPostImagePreview && (
                  <div style={{ marginTop: 10, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={newPostImagePreview} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />
                    {newPostVideoDuration && (
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#ffffff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        Duration: {newPostVideoDuration}s
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Publish to Krishi Community
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: MUSIC & MOVIE SONGS LIBRARY SELECTOR (iTunes API) */}
      {/* ================================================================ */}
      <MusicPickerModal
        isOpen={showMusicPickerModal}
        onClose={() => setShowMusicPickerModal(false)}
        onSelectTrack={(track) => {
          setNewPostAttachedMusic(track)
          setShowMusicPickerModal(false)
        }}
        selectedTrackId={newPostAttachedMusic?.id}
      />

      {/* ================================================================ */}
      {/* MODAL: FIELDMATE LIST MODAL */}
      {/* ================================================================ */}
      {showFieldmatesModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                  Network ({fieldmatesList.length} fieldmates)
                </h3>
                <button
                  onClick={() => setShowFieldmatesModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <IconClose size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 8 }}>
                {[
                  { id: 'all', label: `Fieldmates (${fieldmatesList.length})` },
                  { id: 'circle', label: `My Circle (${myCircleList.length})` }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFieldmatesModalTab(t.id)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: 6,
                      border: 'none',
                      background: fieldmatesModalTab === t.id ? '#ffffff' : 'transparent',
                      color: fieldmatesModalTab === t.id ? '#166534' : '#64748b',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
                <IconSearch size={16} color="#64748b" />
                <input
                  type="text"
                  value={fieldmatesSearchQuery}
                  onChange={(e) => setFieldmatesSearchQuery(e.target.value)}
                  placeholder="Search fieldmates by name or state..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, width: '100%' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {INITIAL_FIELDMATE_PROFILES
                .filter(p => {
                  if (fieldmatesModalTab === 'circle' && !myCircleList.includes(p.username)) return false
                  const query = fieldmatesSearchQuery.toLowerCase()
                  return p.name.toLowerCase().includes(query) || p.state.toLowerCase().includes(query) || p.village.toLowerCase().includes(query)
                })
                .map(fm => {
                  const inMyCircle = myCircleList.includes(fm.username)
                  return (
                    <div
                      key={fm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid #f8fafc'
                      }}
                    >
                      <div
                        onClick={() => {
                          handleTabSwitch('profile', fm)
                          setShowFieldmatesModal(false)
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      >
                        <img
                          src={fm.avatar}
                          alt={fm.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: inMyCircle ? '3px solid #f97316' : 'none'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#09090b' }}>{fm.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{fm.village}, {fm.state} • {fm.mutualCount} mutual</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleToggleMyCircle(fm.username)}
                          title="Toggle My Circle (Orange Profile Ring)"
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: inMyCircle ? '1.5px solid #f97316' : '1px solid #cbd5e1',
                            background: inMyCircle ? '#ffedd5' : '#ffffff',
                            color: inMyCircle ? '#c2410c' : '#475569',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {inMyCircle ? 'In My Circle' : '+ Circle'}
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: MISINFORMATION REPORTING */}
      {/* ================================================================ */}
      {reportModalPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 480,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconFlag size={18} color="#b91c1c" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Report Misinformation</h3>
              </div>
              <button onClick={() => setReportModalPost(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <IconClose size={20} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 16px 0' }}>
                Select the primary safety reason for flagging this agricultural post to our community moderation table:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  'Inaccurate / unverified chemical formulation recipe',
                  'Misleading crop disease diagnosis',
                  'Fraudulent market price / mandi rate claim',
                  'Counterfeit fertilizer or seed seller promotion'
                ].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reportReasonRadio"
                      checked={reportReason === r}
                      onChange={() => setReportReason(r)}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleSubmitMisinformationReport}
                  style={{
                    flex: 1,
                    background: '#b91c1c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Submit Flag to Moderation
                </button>
                <button
                  onClick={() => setReportModalPost(null)}
                  style={{
                    flex: 1,
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
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: DIRECT VOICE CALLING OVERLAY */}
      {/* ================================================================ */}
      {activeVoiceCall && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 360,
            width: '100%',
            padding: 30,
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', color: '#166534', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPhone size={36} color="#166534" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px 0' }}>
              {activeVoiceCall.recipient}
            </h3>
            <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 20px 0' }}>
              {activeVoiceCall.status === 'ringing' ? 'Connecting secure audio stream...' : `Call Active • ${formatCallTime(activeVoiceCall.duration)}`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                style={{
                  background: isCallMuted ? '#fee2e2' : '#f1f5f9',
                  color: isCallMuted ? '#dc2626' : '#475569',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {isCallMuted ? 'Unmute' : 'Mute'}
              </button>

              <button
                onClick={handleEndVoiceCall}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
