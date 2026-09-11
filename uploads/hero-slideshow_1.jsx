import React, { useState } from 'react';

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  
  const images = [
    "https://i.ibb.co/LBjCRRp/DSC00995.jpg",
    "https://i.ibb.co/tP3ktmvh/DSC01065.jpg",
    "https://i.ibb.co/r2t2ZkDZ/IMG-5376.jpg",
    "https://i.ibb.co/Fb1TrKSY/IMG-9201.jpg",
    "https://i.ibb.co/Q3RRyVLX/IMG-9221.jpg"
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '60vh', overflow: 'hidden' }}>
      <img
        src={images[current]}
        alt="hero"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      {/* Navigation Dots */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 30 : 12,
              height: 12,
              borderRadius: i === current ? 6 : '50%',
              background: i === current ? '#667eea' : 'rgba(255,255,255,0.6)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
}