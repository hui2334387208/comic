import React from 'react'

function CoupletDescription({ description }: { description: string }) {
  return (
    <div className="whitespace-pre-line" style={{ lineHeight: '1.8' }}>
      {description}
    </div>
  )
}

export default CoupletDescription
