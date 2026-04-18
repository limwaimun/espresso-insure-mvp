'use client'

import { useState, useEffect } from 'react'

interface GreetingProps {
  name?: string
}

export default function Greeting({ name }: GreetingProps) {
  const [greeting, setGreeting] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    setGreeting(name ? `${greet}, ${name}` : greet)
    setDate(now.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [name])

  return (
    <div>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 500, color: '#1A1410', margin: '0 0 2px' }}>
        {greeting || '\u00A0'}
      </h1>
      {date && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}>
          {date}
        </div>
      )}
    </div>
  )
}
