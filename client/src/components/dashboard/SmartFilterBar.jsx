import { useState } from 'react'
import { FiSearch, FiX, FiFilter, FiCalendar } from 'react-icons/fi'

export default function SmartFilterBar({
  filters = [],
  activeFilters = [],
  onFilterChange,
  onSearch,
  searchPlaceholder = 'Rechercher...',
  dateRange,
  onDateRangeChange,
}) {
  const [searchValue, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (value) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const toggleFilter = (filterKey) => {
    const newFilters = activeFilters.includes(filterKey)
      ? activeFilters.filter(f => f !== filterKey)
      : [...activeFilters, filterKey]
    onFilterChange?.(newFilters)
  }

  const clearAll = () => {
    setSearchValue('')
    onFilterChange?.([])
    onSearch?.('')
  }

  const hasActive = activeFilters.length > 0 || searchValue

  return (
    <div className="space-y-3">
      {/* Search row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-theme-primary placeholder:text-theme-muted focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-300"
            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)' }}
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary hover:text-theme-secondary"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all duration-300 ${
            showFilters || hasActive
              ? 'bg-primary/15 border-primary/20 text-primary'
              : 'text-theme-tertiary hover:text-theme-secondary'
          }`}
          style={!showFilters && !hasActive ? {
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
          } : {}}
        >
          <FiFilter className="w-4 h-4" />
        </button>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-slide-down">
          {filters.map((filter) => {
            const isActive = activeFilters.includes(filter.key)
            return (
              <button
                key={filter.key}
                onClick={() => toggleFilter(filter.key)}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200
                  ${isActive
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'text-theme-tertiary hover:text-theme-secondary'
                  }
                `}
                style={!isActive ? {
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                } : {}}
              >
                {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
                {filter.label}
                {filter.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isActive ? 'bg-primary/20' : 'bg-white/10'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Active filter summary */}
      {hasActive && !showFilters && (
        <div className="flex items-center gap-2 text-xs text-theme-tertiary">
          <span>Filtres actifs :</span>
          {activeFilters.map(key => {
            const filter = filters.find(f => f.key === key)
            return filter ? (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full"
              >
                {filter.label}
                <button onClick={() => toggleFilter(key)}>
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ) : null
          })}
          {searchValue && (
            <span className="text-text-muted">
              Recherche : "{searchValue}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}
