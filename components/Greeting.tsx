'use client'

import { useState, useEffect } from 'react'

interface GreetingProps {
  name?: string
}

export default function Greeting({ name }: GreetingProps) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const firstName = name?.split(' ')[0] || ''
    setText(firstName ? `${greet}, ${firstName}` : greet)
    setDate(now.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [name])

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410' }}>
      <span style={{ fontWeight: 500 }}>{text}</span>
      {date && <span style={{ color: '#5F5A57' }}> &nbsp;·&nbsp; {date}</span>}
    </div>
  )
}
