import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Register service worker (if supported)
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		// Unregister existing SWs to fix reload issues
		navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
		// navigator.serviceWorker.register('/service-worker.js').then(reg => {
		// 	console.log('ServiceWorker registered:', reg.scope)
		// }).catch(err => console.warn('SW registration failed:', err))
	})
}

// Auto-detect language on first visit and persist in localStorage
;(function detectLang() {
	try {
		const key = 'krishi_lang'
		if (!localStorage.getItem(key)) {
			const supported = ['hi','kn','mr','bn','ta','te','gu','pa','ml','or','as','en']
			const nav = (navigator.language || navigator.userLanguage || 'hi').split('-')[0]
			const lang = supported.includes(nav) ? nav : 'hi'
			localStorage.setItem(key, lang)
		}
	} catch (e) { /* ignore */ }
})()

createRoot(document.getElementById('root')).render(<App />)
