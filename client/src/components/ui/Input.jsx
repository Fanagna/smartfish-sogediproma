import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-theme-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-theme-tertiary" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 text-sm text-theme-primary
            rounded-card
            placeholder:text-theme-muted
            transition-all duration-300 ease-out
            focus:border-primary focus:ring-2 focus:ring-primary/15
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-danger/50 focus:border-danger focus:ring-danger/15' : ''}
            ${className}
          `}
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger mt-1">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
