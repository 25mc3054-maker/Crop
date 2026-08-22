import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload'

export default function CommunityForum({ onBack }) {
  const cachedNews = readLiveCache(CACHE_KEYS.communityNews, 15 * 60 * 1000)
  const [newsItems, setNewsItems] = useState(cachedNews?.data?.news || [])
  const [loading, setLoading] = useState(!cachedNews)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(cachedNews?.data?.fetchedAt || null)

  useEffect(() => {
    fetchCommunityNews()

    const refreshNews = () => fetchCommunityNews(false)
    const interval = setInterval(refreshNews, 60000)
    const onFocus = () => refreshNews()
    const onOnline = () => refreshNews()
    const onVisibility = () => {
      if (!document.hidden) refreshNews()
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const fetchCommunityNews = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)
      const res = await axios.get(`${API_BASE_URL}/community-news`)
      setNewsItems(res.data.news || [])
      setFetchedAt(res.data.fetchedAt || null)
      writeLiveCache(CACHE_KEYS.communityNews, res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load live news. Please try again.')
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  const formatTime = (value) => {
    if (!value) return 'Recently updated'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Recently updated'
    return date.toLocaleString()
  }

  return (
    <div className="container">
      <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
        &larr; Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h1 style={{ margin: 0 }}>Community News</h1>
        <button onClick={fetchCommunityNews} className="btn btn-primary">
          Refresh News
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
        Real-time updates about farmers, crops, agriculture policy, and rural issues in India.
      </p>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: '18px', fontSize: '13px' }}>
        Live updates every 60 seconds • Last updated: {formatTime(fetchedAt)}
      </p>

      {loading && <p>Loading live farmer news...</p>}

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--error)', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {!loading && !error && newsItems.length === 0 && (
        <div className="card">No news available right now. Please try refresh.</div>
      )}

      {!loading && !error && newsItems.map((item) => (
        <div key={item.id} className="card" style={{ borderLeft: '4px solid var(--accent-2)' }}>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{item.title}</h3>
          <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>{item.summary || 'Tap below to read full article.'}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
              <span>{item.source}</span>
              {item.publishedAt ? <span> • {new Date(item.publishedAt).toLocaleString()}</span> : null}
            </div>
            <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Read Full News
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
