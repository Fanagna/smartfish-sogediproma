export default function Card({ children, className = '', variant = 'default', hover = true }) {
  const baseClasses = 'transition-all duration-300'

  const variants = {
    default: `${baseClasses} glass rounded-card shadow-card`,
    glass: `${baseClasses} glass-card`,
    elevated: `${baseClasses} glass-strong rounded-card shadow-elevated`,
    subtle: `${baseClasses} glass-light rounded-card-sm`,
    gradient: `${baseClasses} bg-animate-gradient rounded-card shadow-card border border-white/5`,
  }

  const hoverClasses = hover && variant !== 'subtle'
    ? 'hover:-translate-y-1 hover:shadow-card-hover'
    : ''

  return (
    <div className={`${variants[variant]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}
