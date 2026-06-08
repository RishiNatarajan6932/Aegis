import React from 'react'
import NaturalDisasterFeed from '../components/NaturalDisasterFeed'

function NaturalDisasterPage({ incidents }) {
  return (
    <div className="flex min-h-full w-full">
      <NaturalDisasterFeed incidents={incidents} className="flex min-h-full w-full flex-col" />
    </div>
  )
}

export default NaturalDisasterPage
