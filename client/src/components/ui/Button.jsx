import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  loading = false,
  disabled = false,
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5',
  }

  const variants = {
    primary:
      'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary-dark active:bg-primary-dark',
    secondary:
      'btn-secondary glass border border-white/10 text-text-primary hover:bg-white/10 hover:border-white/20 active:bg-white/15 dark:text-text-primary',
    success:
      'bg-success/20 text-success border border-success/20 hover:bg-success/30 hover:border-success/30 active:bg-success/40',
    danger:
      'bg-danger/20 text-danger border border-danger/20 hover:bg-danger/30 hover:border-danger/30 active:bg-danger/40',
    warning:
      'bg-warning/20 text-warning border border-warning/20 hover:bg-warning/30 hover:border-warning/30 active:bg-warning/40',
    ghost:
      'text-theme-secondary hover:text-theme-primary dark:hover:bg-white/5 hover:bg-black/5 active:bg-black/10 dark:active:bg-white/10',
    link:
      'text-primary hover:text-primary-light underline-offset-4 hover:underline p-0',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        rounded-pill transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/30
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${sizes[size]}
        ${variants[variant]}
        ${!disabled && !['ghost', 'link'].includes(variant) ? 'hover:-translate-y-0.5 active:translate-y-0' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
