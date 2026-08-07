import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Calculator from './components/Calculator'
import About from './components/About'
import Clients from './components/Clients'
import Licenses from './components/Licenses'
import Contacts from './components/Contacts'
import Footer from './components/Footer'
import Modal from './components/Modal'
import ManagementDashboard from './components/ManagementDashboard'
import GanttPlanner from './components/GanttPlanner'
import TravelAllowanceCalculator from './components/TravelAllowanceCalculator'
import EngineerDashboard from './components/EngineerDashboard'
import LoginModal from './components/LoginModal'
import { StorageService } from './services/storage'
import { CloudSyncService } from './services/cloudSync'

export default function App() {
  const [currentUser, setCurrentUser] = useState(StorageService.getCurrentUser())
  const [authenticatedUser, setAuthenticatedUser] = useState(StorageService.getAuthUser() || currentUser)
  const [users, setUsers] = useState(StorageService.getUsers())
  const [tasks, setTasks] = useState(StorageService.getTasks())
  const [activeTab, setActiveTab] = useState('planning') // 'planning' | 'travel' | 'site'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDashOpen, setIsDashOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!StorageService.getIsAuthenticated())
  const [currentTheme, setCurrentTheme] = useState(StorageService.getTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  // Realtime Cloud Sync Subscription across devices and profiles
  useEffect(() => {
    const unsubscribe = CloudSyncService.subscribe(({ source }) => {
      if (source === 'remote' || source === 'cloud') {
        handleDataRefresh()
      }
    })
    return unsubscribe
  }, [])

  const handleDataRefresh = () => {
    setUsers(StorageService.getUsers())
    setTasks(StorageService.getTasks())
    setCurrentUser(StorageService.getCurrentUser())
  }

  const handleLoginSuccess = (user) => {
    StorageService.setCurrentUser(user)
    StorageService.setAuthUser(user)
    setCurrentUser(user)
    setAuthenticatedUser(user)
    setIsLoginModalOpen(false)
  }

  const handleSelectUser = (user) => {
    if (authenticatedUser?.role === 'Admin' || user.id === authenticatedUser?.id) {
      StorageService.setCurrentUser(user)
      setCurrentUser(user)
    }
  }

  const handleLogout = () => {
    StorageService.logout()
    setAuthenticatedUser(null)
    setIsLoginModalOpen(true)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  const handleOpenDash = () => {
    setIsDashOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const handleCloseDash = () => {
    setIsDashOpen(false)
    document.body.style.overflow = 'auto'
  }

  return (
    <div className="app-wrapper min-h-screen bg-[var(--bg-main,#0b1120)] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        authenticatedUser={authenticatedUser}
        users={users}
        onSelectUser={handleSelectUser}
        onOpenAvatarModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={currentTheme}
        onThemeChange={(t) => {
          StorageService.setTheme(t)
          setCurrentTheme(t)
        }}
        onContactClick={handleOpenModal}
        onManagementClick={handleOpenDash}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Render Planning / Gantt view for Directors / Admins / Vice Directors */}
        {(currentUser.role === 'Director' || currentUser.role === 'ViceDirector' || authenticatedUser?.role === 'Admin') && (
          <>
            {activeTab === 'planning' && (
              <GanttPlanner
                tasks={tasks}
                users={users}
                currentUser={currentUser}
                onTasksUpdated={handleDataRefresh}
              />
            )}
            {activeTab === 'travel' && (
              <TravelAllowanceCalculator
                users={users}
                currentUser={currentUser}
                onDataUpdated={handleDataRefresh}
              />
            )}
          </>
        )}

        {/* Render Engineer Dashboard for Engineers / Pto / Prorab */}
        {currentUser.role === 'Engineer' && authenticatedUser?.role !== 'Admin' && (
          <EngineerDashboard
            currentUser={currentUser}
            tasks={tasks.filter(t => t.assignedToIds?.includes(currentUser.id) || t.assignedToId === currentUser.id)}
            onTasksUpdated={handleDataRefresh}
          />
        )}

        {/* Public Website & Management Features */}
        {activeTab === 'site' && (
          <>
            <Hero onContactClick={handleOpenModal} onManagementClick={handleOpenDash} />
            <Services />
            <Calculator onOrderClick={handleOpenModal} />
            <About />
            <Clients />
            <Licenses />
            <Contacts />
          </>
        )}
      </main>

      <Footer />

      {/* Modals & Dialogs */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} />
      <ManagementDashboard isOpen={isDashOpen} onClose={handleCloseDash} />
      
      {isLoginModalOpen && (
        <LoginModal
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      <style>{`
        .app-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  )
}
