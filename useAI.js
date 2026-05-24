import { useState, useCallback } from 'react'

export function useAI() {
  const [loading, setLoading] = useState({})

  const call = useCallback(async (prompt, key) => {
    setLoading(p => ({ ...p, [key]: true }))
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'API error')
      return data.content.map(b => b.text || '').join('').trim()
    } catch (e) {
      console.error('AI error:', e)
      return null
    } finally {
      setLoading(p => ({ ...p, [key]: false }))
    }
  }, [])

  return { call, loading }
}
