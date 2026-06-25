export default function Spinner({ className = '', size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  }

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        border-white/10
        border-t-primary
        border-r-accent/50
        animate-spin
        ${className}
      `}
    />
  )
}
