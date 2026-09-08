import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import {
  IconComment,
  IconClose,
  IconSend,
  IconReply,
  IconHeart,
  IconMic,
  IconPlay
} from './SocialIcons'

// Single Source of Truth Recursive Helper: Dynamic Comment Count Calculation
export const countTotalComments = (comments = []) => {
  if (!Array.isArray(comments)) return 0
  return comments.reduce((acc, c) => acc + 1 + countTotalComments(c.replies || []), 0)
}

// Recursive Helper: Insert Nested Reply into Comment Hierarchy
export const insertNestedReply = (commentsList, targetCommentId, newReply) => {
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

// Recursive Helper: Toggle Comment Like
export const toggleNestedCommentLike = (commentsList, targetCommentId) => {
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

// Recursive Comment Node Component
function CommentTreeNode({
  comment,
  depth = 0,
  myCircleList = [],
  currentUser,
  onReplyClick,
  onToggleLike
}) {
  const inCircle = myCircleList.includes(comment.username)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginLeft: depth > 0 ? 18 : 0,
      marginTop: depth > 0 ? 6 : 0
    }}>
      <div style={{
        background: depth > 0 ? '#f0fdf4' : '#f8fafc',
        borderLeft: depth > 0 ? '2px solid #16a34a' : 'none',
        padding: '10px 12px',
        borderRadius: 10
      }}>
        {/* Author Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <img
            src={comment.avatar || currentUser?.avatar}
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
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{comment.time || 'Just now'}</span>
          </div>
        </div>

        {/* Comment Text or Voice Note Audio */}
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
          <p style={{ margin: '4px 0 6px 0', fontSize: 13, color: '#1e293b', lineHeight: 1.45 }}>{comment.text}</p>
        )}

        {/* Action Bar: Nested Reply + Minimalist Heart Like */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
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

      {/* Recursive Multi-Level Sub-Replies */}
      {(comment.replies || []).map(subReply => (
        <CommentTreeNode
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

export default function DiscussionDrawer({
  postId,
  post,
  currentUser,
  myCircleList = [],
  onClose,
  onUpdatePostComments,
  isOverlay = false
}) {
  const [commentInputText, setCommentInputText] = useState('')
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyingToAuthorName, setReplyingToAuthorName] = useState('')

  // Voice Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  const comments = post?.comments || []
  const totalCount = countTotalComments(comments)

  // Reset reply target on new comment post
  useEffect(() => {
    setCommentInputText('')
    setReplyingToCommentId(null)
    setReplyingToAuthorName('')
  }, [postId])

  const handleStartAudio = () => {
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
          handleAddVoiceNote(audioUrl)
          stream.getTracks().forEach(t => t.stop())
        }

        mediaRecorderRef.current.start()
        setIsRecordingAudio(true)
        setRecordingDuration(0)

        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
      })
      .catch(() => {
        const mockVoice = 'https://actions.google.com/sounds/v1/nature/wind_and_leaves.ogg'
        handleAddVoiceNote(mockVoice)
      })
  }

  const handleStopAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudio(false)
      clearInterval(recordingTimerRef.current)
    }
  }

  const handleCancelAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudio(false)
      clearInterval(recordingTimerRef.current)
      audioChunksRef.current = []
    }
  }

  const handleAddTextComment = () => {
    if (!commentInputText.trim()) return

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser?.name || 'Farmer',
      username: currentUser?.username || '@farmer',
      avatar: currentUser?.avatar,
      text: commentInputText.trim(),
      audioUrl: null,
      likes: 0,
      isLiked: false,
      time: 'Just now',
      replies: []
    }

    let updatedComments = [...comments]
    if (replyingToCommentId) {
      updatedComments = insertNestedReply(updatedComments, replyingToCommentId, newComment)
    } else {
      updatedComments.push(newComment)
    }

    onUpdatePostComments(postId, updatedComments)
    setCommentInputText('')
    setReplyingToCommentId(null)
    setReplyingToAuthorName('')

    axios.post(`${API_BASE_URL}/api/social/posts/${postId}/comments`, {
      author: currentUser,
      text: newComment.text,
      parentCommentId: replyingToCommentId
    }).catch(() => {})
  }

  const handleAddVoiceNote = (audioUrl) => {
    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser?.name || 'Farmer',
      username: currentUser?.username || '@farmer',
      avatar: currentUser?.avatar,
      text: 'Voice note discussion',
      audioUrl,
      likes: 0,
      isLiked: false,
      time: 'Just now',
      replies: []
    }

    let updatedComments = [...comments]
    if (replyingToCommentId) {
      updatedComments = insertNestedReply(updatedComments, replyingToCommentId, newComment)
    } else {
      updatedComments.push(newComment)
    }

    onUpdatePostComments(postId, updatedComments)
    setReplyingToCommentId(null)
    setReplyingToAuthorName('')

    axios.post(`${API_BASE_URL}/api/social/posts/${postId}/comments`, {
      author: currentUser,
      text: 'Voice Note',
      audioUrl,
      parentCommentId: replyingToCommentId
    }).catch(() => {})
  }

  const handleToggleLike = (commentId) => {
    const updated = toggleNestedCommentLike(comments, commentId)
    onUpdatePostComments(postId, updated)
  }

  const handleReplyClick = (commentId, authorName, username) => {
    setReplyingToCommentId(commentId)
    setReplyingToAuthorName(authorName)
    setCommentInputText(`@${username || authorName} `)
  }

  return (
    <aside style={{
      width: isOverlay ? '100%' : 380,
      maxWidth: isOverlay ? 440 : 380,
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid #e2e8f0',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: isOverlay ? '80vh' : 'calc(100vh - 120px)',
      position: isOverlay ? 'fixed' : 'sticky',
      bottom: isOverlay ? 20 : 'auto',
      right: isOverlay ? 20 : 'auto',
      top: isOverlay ? 'auto' : 80,
      zIndex: isOverlay ? 1200 : 50,
      overflow: 'hidden'
    }}>
      {/* Header with Exact Dynamic Count */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconComment size={18} color="#16a34a" />
          <span style={{ fontWeight: 900, fontSize: 15, color: '#09090b' }}>
            Discussion ({totalCount})
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <IconClose size={18} />
        </button>
      </div>

      {/* Recursive Comment Tree List */}
      <div style={{
        flex: 1,
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '40px 0' }}>
            No comments yet. Share your agricultural experience or ask a question!
          </div>
        ) : (
          comments.map(c => (
            <CommentTreeNode
              key={c.id}
              comment={c}
              depth={0}
              myCircleList={myCircleList}
              currentUser={currentUser}
              onReplyClick={handleReplyClick}
              onToggleLike={handleToggleLike}
            />
          ))
        )}
      </div>

      {/* Comment Composer */}
      <div style={{ padding: 14, borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
        {replyingToCommentId && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#16a34a',
            fontWeight: 700,
            marginBottom: 6
          }}>
            <span>Replying to {replyingToAuthorName || 'comment thread'}</span>
            <button
              onClick={() => {
                setReplyingToCommentId(null)
                setReplyingToAuthorName('')
                setCommentInputText('')
              }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}

        {isRecordingAudio ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fef2f2',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #fecaca'
          }}>
            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 12 }}>
              Recording ({recordingDuration}s)...
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleStopAudio}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Add Note
              </button>
              <button
                onClick={handleCancelAudio}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={commentInputText}
              onChange={(e) => setCommentInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTextComment() }}
              placeholder="Write a constructive reply..."
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none'
              }}
            />

            <button
              onClick={handleStartAudio}
              title="Record Voice Note"
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '9px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconMic size={16} color="#16a34a" />
            </button>

            <button
              onClick={handleAddTextComment}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '9px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconSend size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
