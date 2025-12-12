import React, { useState, useEffect, useRef, ChangeEvent } from 'react'
import { motion, AnimatePresence, easeInOut } from 'framer-motion'
import screenshotsData from '../screenshots.json'

// Define type for screenshots array items
interface ScreenshotItem {
  name: string;
  url: string;
  categories: string[];
  technologies: string[];
}

// Helper function to convert a string to kebab-case
function toKebabCase(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Cast screenshotsData to ScreenshotItem[]
const screenshots = screenshotsData as ScreenshotItem[]

// Derive unique categories and technologies from screenshots.json
const uniqueCategories = Array.from(new Set(screenshots.flatMap(item => item.categories)))
const uniqueTechnologies = Array.from(new Set(screenshots.flatMap(item => item.technologies)))

// Map screenshots data to portfolio items with full arrays for filters
const mappedPortfolios = screenshots.map((item, index) => ({
  id: index + 1,
  name: item.name,
  categories: item.categories,
  technologies: item.technologies,
  src: `/images/${toKebabCase(item.name)}.png`,
  link: item.url
}))

const getOffScreenPosition = () => {
  const { innerWidth, innerHeight } = window;
  const randomEdge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  switch(randomEdge) {
    case 0: return { x: Math.random() * innerWidth, y: -150 };
    case 1: return { x: innerWidth + 150, y: Math.random() * innerHeight };
    case 2: return { x: Math.random() * innerWidth, y: innerHeight + 150 };
    case 3: return { x: -150, y: Math.random() * innerHeight };
    default: return { x: -150, y: -150 };
  }
}

const Portfolio = () => {
  // Use new portfolios data instead of dummyPortfolios
  const [step, setStep] = useState<'intro' | 'loading' | 'gallery'>('intro')
  const [progress, setProgress] = useState(0)
  const [portfolios, setPortfolios] = useState(mappedPortfolios)
  const [filters, setFilters] = useState({ category: '', technology: '', name: '' })
  const [positions, setPositions] = useState<{ [key: number]: { x: number; y: number; depth: number } }>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const textInputTimeout = useRef<NodeJS.Timeout>()
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [firstAnimation, setFirstAnimation] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Preload images using portfolios state
  useEffect(() => {
    portfolios.forEach(item => {
      const img = new Image()
      img.src = item.src
      img.onload = () => {
        setProgress(prev => Math.min(prev + (100 / portfolios.length), 100))
      }
    })
  }, [portfolios])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setLoadingComplete(true)
      }, 500)
    }
  }, [progress])

  // Arrange images randomly using portfolios state
  const arrangeImages = () => {
    const newPositions: { [key: number]: { x: number; y: number; depth: number } } = {}
    const { innerWidth, innerHeight } = window
    portfolios.forEach(item => {
      newPositions[item.id] = {
        x: Math.random() * (innerWidth - 300),
        y: Math.random() * (innerHeight - 125),
        depth: Math.random() * 1
      }
    })
    setPositions(newPositions)
  }

  const resetPortfolio = () => {
    setFilters({ category: '', technology: '', name: '' });
    arrangeImages();
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'name') {
      if (textInputTimeout.current) clearTimeout(textInputTimeout.current)
      textInputTimeout.current = setTimeout(() => {
        setFilters(prev => ({ ...prev, [name]: value }))
      }, 300)
    } else {
      setFilters(prev => ({ ...prev, [name]: value }))
    }
  }

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        arrangeImages();
      }, 500);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        background: '#000',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      {/* Intro view */}
      <AnimatePresence>
        {step === 'intro' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100, transition: { duration: 0.5 } }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              textAlign: 'center',
              pointerEvents: 'all'
            }}
          >
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', fontSize: '4em', marginBottom: 0 }}>
              CL Selected Portfolio
            </h1>
            <p style={{ fontSize: '0.8em', color: '#fff', marginTop: 0 }}>updated 8 Feb 2025</p>
            <button
              style={{ marginTop: 20, background: '#fff', color: '#000', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
              onClick={() => {
                if (progress >= 100) {
                  setStep('gallery')
                  arrangeImages()
                } else {
                  setStep('loading')
                }
              }}
            >
              View
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading progress bar */}
      <AnimatePresence>
        {step === 'loading' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div style={{ width: '300px', border: '1px solid #fff', borderRadius: '8px', overflow: 'hidden', background: 'transparent' }}>
              <div style={{ width: `${progress}%`, height: '20px', background: '#fff', transition: 'width 0.2s' }}></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery view */}
      {step === 'gallery' && (
        <>
          {/* Page Title (top left) with higher z-index */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '28px',
              color: '#fff',
              userSelect: 'none',
              pointerEvents: 'none',
              margin: 0,
              zIndex: 10 // added z-index
            }}
          >
            CL Portfolio
          </motion.h1>
          {/* Filters (top right) with higher z-index */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              zIndex: 10 // added z-index
            }}
          >
            <select
              name="category"
              value={filters.category} // controlled value
              onChange={handleFilterChange}
              style={{ background: '#fff', border: '1px solid #fff', color: '#000', height: '32px' }} // updated
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              name="technology"
              value={filters.technology} // controlled value
              onChange={handleFilterChange}
              style={{ background: '#fff', border: '1px solid #fff', color: '#000', height: '32px' }} // updated
            >
              <option value="">All Tech</option>
              {uniqueTechnologies.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
            <input
              type="text"
              name="name"
              value={filters.name} // controlled value
              placeholder="Project name"
              onChange={handleFilterChange}
              style={{ background: '#fff', border: '1px solid #fff', color: '#000', padding: '5px', height: '32px' }} // updated
            />
            <button
              style={{ background: '#fff', color: '#000', border: 'none', padding: '5px 10px', cursor: 'pointer', height: '32px' }} // updated
              onClick={resetPortfolio}
            >
              Reset
            </button>
          </div>

          {/* Gallery Images container */}
          <div>
            {portfolios.map(item => {
              const baseX = positions[item.id]?.x || 0
              const baseY = positions[item.id]?.y || 0
              // console.log(baseX, baseY)
              const computedScale = 1 - ((positions[item.id]?.depth || 0) * 0.3)
              const offScreen = getOffScreenPosition()
              // Determine if the item matches the current filters
              const match =
                (!filters.category || item.categories.includes(filters.category)) &&
                (!filters.technology || item.technologies.includes(filters.technology)) &&
                (!filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase()));
              return (
                <motion.a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  drag
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDragStart={(e, info) => {
                    dragStart.current = info.point
                    isDragging.current = false
                  }}
                  onDrag={(e, info) => {
                    const dx = info.point.x - dragStart.current.x
                    const dy = info.point.y - dragStart.current.y
                    if (Math.sqrt(dx * dx + dy * dy) > 5) {
                      isDragging.current = true
                    }
                  }}
                  onClick={(e) => {
                    if (isDragging.current) {
                      e.preventDefault()
                      isDragging.current = false
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  initial={{ opacity: 0, x: offScreen.x, y: offScreen.y }}
                  animate={{
                    opacity: match ? 1 : 0.3,
                    x: baseX,  // Final X
                    y: baseY,  // Final Y
                    scale: computedScale,
                    transition: { duration: firstAnimation ? 2 : 0.5, ease: easeInOut }
                  }}
                  onAnimationComplete={() => {
                    if (firstAnimation) setFirstAnimation(false)
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    maxWidth: '250px'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={item.src} alt={item.name} style={{ width: '100%', height: 'auto', borderRadius: '8px', pointerEvents: 'none' }} />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        opacity: hoveredId === item.id ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <h3 style={{ color: '#fff', margin: 0 }}>{item.name}</h3>
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default Portfolio
