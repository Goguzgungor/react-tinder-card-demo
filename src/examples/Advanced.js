import React, { useState, useMemo, useRef, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import Modal from 'react-modal'

Modal.setAppElement('#root')

function Advanced() {
  const [db, setDb] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastDirection, setLastDirection] = useState()
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings/?type=project&take=10')
        const data = await response.json()
        setDb(data)
        setCurrentIndex(data.length - 1)
      } catch (error) {
        console.error('Error fetching listings:', error)
      }
    }

    fetchListings()
  }, [])

  const fetchProjectDetail = async (slug) => {
    try {
      console.log('Fetching project detail:', slug)
      const response = await fetch(`/_next/data/mvGBLL2tEEy4aaHtBTZ8V/listings/project/${slug}.json?type=project&slug=${slug}`)
      const data = await response.json()
      setSelectedProject(data.pageProps.bounty)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching project detail:', error)
    }
  }

  const childRefs = useMemo(
      () =>
          Array(db.length)
              .fill(0)
              .map(() => React.createRef()),
      [db.length]
  )

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const canGoBack = currentIndex < db.length - 1
  const canSwipe = currentIndex >= 0

  const swiped = (direction, nameToDelete, index) => {
    setLastDirection(direction)
    updateCurrentIndex(index - 1)

    // Sağ swipe durumunda yönlendirme
    if (direction === 'right') {
      const currentProject = db[index] // Kaydırılan mevcut proje
      if (currentProject && currentProject.slug) {
        window.open(`https://earn.superteam.fun/listings/project/${currentProject.slug}`, '_blank')
      }
    }
  }

  const outOfFrame = (name, idx) => {
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current)
    currentIndexRef.current >= idx && childRefs[idx].current.restoreCard()
  }

  const swipe = async (dir) => {
    if (canSwipe && currentIndex < db.length) {
      await childRefs[currentIndex].current.swipe(dir)
    }
  }

  const goBack = async () => {
    if (!canGoBack) return
    const newIndex = currentIndex + 1
    updateCurrentIndex(newIndex)
    await childRefs[newIndex].current.restoreCard()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  return (
      <div className="relative">
        <div className='cardContainer'>
          {db.map((project, index) => (
              <TinderCard
                  ref={childRefs[index]}
                  className='swipe'
                  key={project.slug}
                  onSwipe={(dir) => swiped(dir, project.title, index)}
                  onCardLeftScreen={() => outOfFrame(project.title, index)}
              >
                <div className='card'>
                  {project.sponsor.logo && (
                      <img
                          src={project.sponsor.logo}
                          alt={project.sponsor.name}
                          className="sponsor-logo"
                      />
                  )}
                  <div className="project-details">
                    <p className="sponsor-name">
                      {project.sponsor.name}
                      <p>{project.title}</p>
                      {project.sponsor.isVerified && " ✓"}
                    </p>
                    {project.deadline && (
                        <p className="deadline">Deadline: {formatDate(project.deadline)}</p>
                    )}
                    {project.compensationType && (
                        <p className="compensation">
                          Compensation: {project.compensationType}
                          {project.token && ` in ${project.token}`}
                        </p>
                    )}
                    <button
                        onClick={(e) => {
                          e.preventDefault();
                          fetchProjectDetail(project.slug);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mt-2 transition-colors duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </TinderCard>
          ))}
        </div>

        <Modal
            isOpen={showModal && selectedProject !== null}
            onRequestClose={() => setShowModal(false)}
            style={{
              overlay: {
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              content: {
                position: 'static',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '8px',
                padding: '20px'
              }
            }}
        >
          {selectedProject && (
              <>
                <button
                    onClick={() => setShowModal(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer'
                    }}
                >
                  ✕
                </button>
                <div style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedProject.sponsor?.logo && (
                        <img
                            src={selectedProject.sponsor.logo}
                            alt={selectedProject.sponsor.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                        />
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedProject.title}</h3>
                      <p style={{ color: '#4a4a4a' }}>
                        {selectedProject.sponsor?.name}
                        {selectedProject.sponsor?.isVerified && " ✓"}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p><strong>Status:</strong> {selectedProject.status}</p>
                    <p><strong>Deadline:</strong> {formatDate(selectedProject.deadline)}</p>
                    <p><strong>Compensation:</strong> {selectedProject.compensationType} {selectedProject.token}</p>
                    {selectedProject.isFeatured && (
                        <p style={{ color: '#d97706' }}>⭐ Featured Project</p>
                    )}
                    <p><strong>Comments:</strong> {selectedProject._count?.Comments || 0}</p>
                    {selectedProject.pocSocials && (
                        <p><strong>POC Socials:</strong> {selectedProject.pocSocials}</p>
                    )}
                    {selectedProject.skills && selectedProject.skills.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <p><strong>Skills:</strong></p>
                          {selectedProject.skills.map((skillObj, idx) => (
                              <div key={idx} style={{ marginBottom: '5px' }}>
                                <p><strong>{skillObj.skills}</strong></p>
                                {skillObj.subskills && skillObj.subskills.length > 0 && (
                                    <ul style={{ marginLeft: '20px', listStyle: 'disc' }}>
                                      {skillObj.subskills.map((subskill, sIdx) => (
                                          <li key={sIdx}>{subskill}</li>
                                      ))}
                                    </ul>
                                )}
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </div>
              </>
          )}
        </Modal>

        <div className='buttons'>
          <button style={{ backgroundColor: !canSwipe && '#c3c4d3' }} onClick={() => swipe('left')}>Pass</button>
          <button style={{ backgroundColor: !canGoBack && '#c3c4d3' }} onClick={() => goBack()}>Undo</button>
          <button
              style={{ backgroundColor: !canSwipe && '#c3c4d3' }}
              onClick={() => swipe('right')}
          >
            Like
          </button>
        </div>
        {lastDirection ? (
            <h2 key={lastDirection} className='infoText'>
              You swiped {lastDirection}
            </h2>
        ) : (
            <h2 className='infoText'>
              Swipe a card or use buttons to interact!
            </h2>
        )}
      </div>
  )
}

export default Advanced
