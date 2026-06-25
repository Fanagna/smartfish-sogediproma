import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../services/authService'
import logo from '../logo.jpg'
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiTrendingUp, FiGlobe, FiCheckCircle, FiDroplet, FiArrowRight } from 'react-icons/fi'

// ═══════════════════════════════════════════════════════════════════════
//  ANIMATED PARTICLES (Canvas)
// ═══════════════════════════════════════════════════════════════════════
function ParticleCanvas({ color = '0, 188, 212', count = 40 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    let running = true
    let pts = []
    const resize = () => { c.width = c.clientWidth * 2; c.height = c.clientHeight * 2 }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c.parentElement)
    for (let i = 0; i < count; i++) pts.push({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 2 + 1, a: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.5 + 0.5
    })
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, c.width, c.height)
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > c.width) p.vx *= -1
        if (p.y < 0 || p.y > c.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.a})`
        ctx.fill()
      })
      requestAnimationFrame(draw)
    }
    draw()
    return () => { running = false; ro.disconnect() }
  }, [color, count])
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ═══════════════════════════════════════════════════════════════════════
//  FLOATING LABEL INPUT
// ═══════════════════════════════════════════════════════════════════════
function FloatingInput({ label, icon: Icon, type = 'text', register: reg, error, ...props }) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type
  const isFloating = focused || hasValue

  // Extract RHF ref + name manually so we don't spread {...reg} (which would
  // override our custom onChange/onBlur handlers and break RHF validation)
  const rhfRef = reg?.ref
  const fieldName = reg?.name

  return (
    <div className="space-y-1">
      <div className={`relative group transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
        {/* Icon */}
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${isFloating ? 'top-5' : ''}`}>
          <Icon className={`w-[18px] h-[18px] transition-colors duration-300 ${isFloating ? 'text-primary' : 'text-theme-tertiary'}`} />
        </div>

        {/* Label flottant */}
        <label className={`absolute left-12 pointer-events-none transition-all duration-300 z-10 select-none
          ${isFloating
            ? '-top-2.5 text-[10px] font-semibold text-primary'
            : 'top-1/2 -translate-y-1/2 text-sm text-theme-muted'}`}>
          {label}
        </label>

        {/* Input */}
        <input
          name={fieldName}
          ref={rhfRef}
          type={inputType}
          className={`w-full bg-transparent rounded-2xl text-sm font-medium transition-all duration-300 outline-none
            ${isPassword ? 'pl-12 pr-12' : 'pl-12 pr-4'} py-4
            ${error ? 'text-danger border-danger/40' : 'text-theme-primary border-theme-subtle'}
            ${focused ? 'border-primary/40' : 'hover:border-theme'}
            placeholder:text-transparent`}            style={{
              border: `1px solid ${
                error ? 'var(--color-danger)' :
                focused ? 'var(--color-primary)' :
                'var(--border-input)'
              }`,
              boxShadow: focused
                ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent), inset 0 1px 2px rgba(0,0,0,0.05)'
                : 'inset 0 1px 2px rgba(0,0,0,0.05)',
              background: focused
                ? 'color-mix(in srgb, var(--bg-input) 80%, var(--color-primary) 2%)'
                : 'var(--bg-input)',
            }}
            onChange={(e) => {
              reg?.onChange?.(e)  // → React Hook Form reçoit la valeur
              setHasValue(!!e.target.value)
            }}
            onBlur={(e) => {
              reg?.onBlur?.(e)    // → React Hook Form marque le champ touché
              setFocused(false)
              setHasValue(!!e.target.value)
            }}
            onFocus={() => setFocused(true)}
            {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-theme-tertiary hover:text-theme-secondary transition-colors"
            tabIndex={-1} aria-label={showPwd ? 'Masquer' : 'Afficher'}>
            {showPwd ? <FiEyeOff className="w-[18px] h-[18px]" /> : <FiEye className="w-[18px] h-[18px]" />}
          </button>
        )}

        {/* Focus ring glow */}
        {focused && (
          <div className="absolute -inset-[1px] rounded-2xl pointer-events-none opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              filter: 'blur(6px)',
              zIndex: -1,
            }} />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] flex items-center gap-1 pl-1 text-danger">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error.message}
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  RIGHT — BRAND SIDE (Refined)
// ═══════════════════════════════════════════════════════════════════════
function BrandSide() {
  const features = [
    { icon: FiShield, text: 'Gestion sécurisée de la flotte' },
    { icon: FiTrendingUp, text: 'Analytics & IA prédictive' },
    { icon: FiGlobe, text: 'Traçabilité export internationale' },
    { icon: FiDroplet, text: 'Stock & logistique intelligents' },
  ]

  // Live stats ticker
  const stats = [
    { label: 'Bateaux connectés', value: '24' },
    { label: 'Tonnes traitées', value: '1 280' },
    { label: 'Exportations', value: '156' },
  ]
  const counters = useRef([])
  useEffect(() => {
    const intervals = []
    stats.forEach((s, i) => {
      const el = counters.current[i]
      if (!el) return
      const target = parseInt(s.value.replace(/\s/g, ''))
      let current = 0
      const step = Math.ceil(target / 40)
      const interval = setInterval(() => {
        current += step
        if (current >= target) { current = target; clearInterval(interval) }
        el.textContent = s.value.includes(' ') ? current.toLocaleString('fr-FR') : current
      }, 40)
      intervals.push(interval)
    })
    return () => intervals.forEach(clearInterval)
    // eslint-disable-next-line
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-10 lg:px-16 xl:px-20 py-16 z-10">

      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%)' }} />

      {/* Logo */}
      <div className="relative mb-6" style={{ animation: 'fadeSlideUp 1s ease-out' }}>
        <div className="absolute inset-0 blur-[60px] opacity-30"
          style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--color-primary) 25%, transparent) 0%, transparent 70%)' }} />
        <div className="relative rounded-full p-[2px]"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 30%, transparent), color-mix(in srgb, var(--color-accent) 30%, transparent))',
          }}>
          <div className="rounded-full p-1" style={{ background: 'var(--bg-deeper)' }}>
            <img src={logo} alt="Smartfish - SOGEDIPROMA"
              className="w-28 h-28 lg:w-32 lg:h-32 object-contain rounded-full"
              style={{ filter: 'drop-shadow(0 0 30px color-mix(in srgb, var(--color-accent) 15%, transparent))' }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-4xl lg:text-5xl font-black text-center leading-tight mb-1"
        style={{ animation: 'fadeSlideUp 1s ease-out 0.15s both' }}>
        <span className="brand-gradient-text">Smartfish</span>
      </h2>
      <p className="text-xs lg:text-sm font-bold tracking-[0.35em] uppercase mb-6"
        style={{ color: 'var(--text-tertiary)', animation: 'fadeSlideUp 1s ease-out 0.25s both' }}>
        SOGEDIPROMA
      </p>

      {/* Description */}
      <p className="max-w-md text-center leading-relaxed mb-8 text-xs lg:text-sm"
        style={{ color: 'var(--text-secondary)', animation: 'fadeSlideUp 1s ease-out 0.35s both' }}>
        Plateforme de gestion intelligente de la flotte de pêche —
        Pilotage en temps réel, analyses prédictives, et optimisation de
        toute la chaîne de valeur maritime.
      </p>

      {/* Features */}
      <div className="space-y-3 w-full max-w-sm"
        style={{ animation: 'fadeSlideUp 1s ease-out 0.45s both' }}>
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 group cursor-default">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
              }}>
              <f.icon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <span className="text-xs font-medium text-theme-secondary group-hover:text-theme-primary transition-colors duration-300">
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {/* Live Stats */}
      <div className="flex items-center justify-center gap-8 mt-10"
        style={{ animation: 'fadeSlideUp 1s ease-out 0.55s both' }}>
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-lg lg:text-xl font-black" style={{ color: 'var(--color-primary-light)' }}>
              <span ref={el => counters.current[i] = el}>0</span>
              {s.label === 'Tonnes traitées' ? ' t' : ''}
            </div>
            <div className="text-[10px] font-medium text-theme-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex items-center gap-6 mt-8 px-5 py-2.5 rounded-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          animation: 'fadeSlideUp 1s ease-out 0.65s both',
        }}>
        {[
          { icon: FiShield, label: 'ISO 27001' },
          { icon: FiCheckCircle, label: 'SSL 256-bit' },
          { label: 'Sécurisé', dot: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {item.icon ? (
              <item.icon className="w-3 h-3 text-success" />
            ) : item.dot ? (
              <div className="w-3 h-3 rounded-full bg-success/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
            ) : null}
            <span className="text-[9px] text-theme-muted font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <p className="absolute bottom-6 text-[9px] text-theme-muted text-center">
        &copy; {new Date().getFullYear()} SOGEDIPROMA — Smartfish. v2.1.0
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  LEFT — LOGIN FORM (Material Design, Floating Labels)
// ═══════════════════════════════════════════════════════════════════════
function LoginForm() {
  const [remember, setRemember] = useState(false)
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const r = await login(data.email, data.password)
      setAuth(r.user, r.token)
      toast.success('Connexion réussie')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Identifiants incorrects')
    }
  }

  return (
    <div className="flex flex-col justify-center h-full px-8 lg:px-14 xl:px-20 py-12 max-w-[460px] mx-auto w-full">

      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.05s both' }}>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-[9px] font-bold tracking-widest uppercase"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary-light)',
          }}>
          <FiShield className="w-2.5 h-2.5" />
          Plateforme sécurisée
        </div>

        <h2 className="text-[28px] lg:text-[32px] font-extrabold leading-tight mb-1.5 text-theme-primary"
          style={{ letterSpacing: '-0.03em' }}>
          Connexion
        </h2>
        <p className="text-sm text-theme-tertiary">
          Accédez à votre tableau de bord de gestion
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5"
        style={{ animation: 'fadeSlideUp 0.8s ease-out 0.1s both' }}>

        {/* Email */}
        <FloatingInput
          label="Adresse email professionnelle"
          icon={FiMail}
          type="email"
          autoComplete="email"
          error={errors.email}
          register={register('email', {
            required: 'Email requis',
            pattern: { value: /^\S+@\S+$/i, message: 'Format email invalide' }
          })}
        />

        {/* Password */}
        <FloatingInput
          label="Mot de passe"
          icon={FiLock}
          type="password"
          autoComplete="current-password"
          error={errors.password}
          register={register('password', {
            required: 'Mot de passe requis',
            minLength: { value: 6, message: 'Minimum 6 caractères' }
          })}
        />

        {/* Options */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="sr-only" />
              <div className={`w-[16px] h-[16px] rounded-[5px] border-2 transition-all duration-200 flex items-center justify-center
                ${remember ? 'bg-primary border-primary' : 'border-[color-mix(in srgb,var(--border-strong),50%_var(--bg-surface))] group-hover:border-theme'}`}>
                {remember && (
                  <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs font-medium cursor-pointer select-none text-theme-secondary group-hover:text-theme-primary transition-colors">
              Se souvenir de moi
            </span>
          </label>
          <button type="button" className="text-xs font-semibold text-primary hover:text-primary-light transition-colors">
            Mot de passe oublié ?
          </button>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button type="submit" disabled={isSubmitting}
            className="relative w-full py-[14px] rounded-2xl text-sm font-bold text-white overflow-hidden transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.98] group"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-dark))',
              boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 25%, transparent)',
            }}>
            {/* Hover shimmer */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-accent))' }} />

            {/* Loading dots */}
            {isSubmitting ? (
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Connexion en cours</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                Se connecter
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </button>
        </div>

        {/* Security footer */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[9px] text-theme-muted font-medium">SSL 256-bit</span>
          </div>
          <div className="w-px h-2.5" style={{ background: 'var(--border-default)' }} />
          <span className="text-[9px] text-theme-muted">Connexion sécurisée</span>
          <div className="w-px h-2.5" style={{ background: 'var(--border-default)' }} />
          <span className="text-[9px] text-theme-muted">Cloud privé</span>
        </div>
      </form>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function Login() {
  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'var(--bg-deeper)' }}>

      {/* ─── LEFT ─── */}
      <div className="relative z-10 w-full lg:w-[45%] xl:w-[42%] flex flex-col min-h-screen"
        style={{
          background: 'linear-gradient(135deg, var(--bg-deeper) 0%, var(--bg-base) 40%, var(--bg-surface) 100%)',
        }}>

        {/* Brand mark */}
        <div className="absolute top-6 left-8 z-20 space-y-0.5"
          style={{ animation: 'fadeSlideUp 0.8s ease-out forwards' }}>
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-theme-muted block">
            SmartFish
          </span>
          <span className="text-[8px] font-semibold tracking-[0.15em] text-theme-muted/60 block">
            SOGEDIPROMA
          </span>
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.012] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px',
          }} />

        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* ─── DIVIDER ─── */}
      <div className="hidden lg:block relative z-20 w-px min-h-screen">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-primary) 25%, transparent) 25%, color-mix(in srgb, var(--color-accent) 20%, transparent) 50%, color-mix(in srgb, var(--color-primary) 25%, transparent) 75%, transparent 100%)',
            }} />
          {/* Center dot */}
          <div className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />
        </div>
      </div>

      {/* ─── RIGHT ─── */}
      <div className="hidden lg:block relative z-10 flex-1 min-h-screen overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--bg-deeper) 0%, color-mix(in srgb, var(--color-primary) 4%, var(--bg-base)) 30%, color-mix(in srgb, var(--color-accent) 3%, var(--bg-base)) 50%, color-mix(in srgb, var(--color-primary) 4%, var(--bg-base)) 70%, var(--bg-deeper) 100%)`,
        }}>

        {/* Gradient layers */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 25% 0%, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, transparent 55%),
              radial-gradient(ellipse at 75% 25%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 45%),
              radial-gradient(ellipse at 50% 75%, color-mix(in srgb, var(--color-primary) 5%, transparent) 0%, transparent 45%),
              radial-gradient(ellipse at 20% 90%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 45%)
            `,
          }} />

        {/* Glow accents */}
        <div className="absolute top-[30%] left-[30%] w-[250px] h-[250px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 6%, transparent), transparent 70%)' }} />
        <div className="absolute bottom-[30%] right-[25%] w-[250px] h-[250px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent 70%)' }} />

        <ParticleCanvas color="0, 188, 212" count={35} />
        <BrandSide />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .brand-gradient-text {
          background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-accent) 40%, var(--color-primary-light) 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 100%;
          animation: shimmerText 6s ease-in-out infinite;
        }
        @keyframes shimmerText {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
