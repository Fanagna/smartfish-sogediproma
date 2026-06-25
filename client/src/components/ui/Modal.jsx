export default function Modal({ isOpen, onClose, children, title, className = '' }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div 
        className={`rounded-card w-full ${className || 'max-w-lg'}`}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-elevated)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {title && (
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
