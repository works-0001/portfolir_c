'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const SECTION_IDS = ['hero', 'about', 'proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'contact']
const SLOT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789'

// ─── DotGrid ──────────────────────────────────────────────────────────────────

function DotGrid({ cols = 6, rows = 2, color = '#1A1A2E' }: { cols?: number; rows?: number; color?: string }) {
  const total = rows * cols
  const [scales, setScales] = useState<number[]>(() => Array.from({ length: total }, () => 1))
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pulseDot = (i: number) => {
      setScales(prev => { const n = [...prev]; n[i] = 1.4 + Math.random() * 0.8; return n })
      const hold = setTimeout(() => {
        setScales(prev => { const n = [...prev]; n[i] = 1; return n })
        const next = setTimeout(() => pulseDot(i), 8000 + Math.random() * 1000)
        timers.current.push(next)
      }, 600 + Math.random() * 800)
      timers.current.push(hold)
    }

    Array.from({ length: total }).forEach((_, i) => {
      const t = setTimeout(() => pulseDot(i), Math.random() * 6000)
      timers.current.push(t)
    })

    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
  }, [total])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 6px)`, gap: '5px' }}>
      {scales.map((s, i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%', display: 'block', background: color,
          opacity: 0.45,
          transform: `scale(${s})`,
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      ))}
    </div>
  )
}

// ─── AnimatedBars — scaleY from center ────────────────────────────────────────

function AnimatedBars({ color = 'rgba(255,255,255,0.6)' }: { color?: string }) {
  const [scales, setScales] = useState(() =>
    Array.from({ length: 10 }, () => 0.2 + Math.random() * 0.6)
  )
  useEffect(() => {
    const id = setInterval(() => {
      setScales(Array.from({ length: 10 }, () => 0.1 + Math.random() * 0.9))
    }, 130)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 32 }}>
      {scales.map((s, i) => (
        <div key={i} style={{
          width: 3, height: 28, background: color, borderRadius: 2,
          transform: `scaleY(${s})`, transformOrigin: 'center',
          transition: 'transform 0.12s ease',
        }} />
      ))}
    </div>
  )
}

// ─── SlotText ─────────────────────────────────────────────────────────────────
// speed: 'normal' (titles/labels) | 'fast' (body paragraphs)

type SlotSpeed = 'normal' | 'fast'

function SlotText({
  text, active, delay = 0, speed = 'normal',
}: {
  text: string; active: boolean; delay?: number; speed?: SlotSpeed
}) {
  const msPC  = speed === 'fast' ? 7  : 50   // ms between each char starting
  const cyInt = speed === 'fast' ? 28 : 42   // ms per cycle frame
  const cyMin = speed === 'fast' ? 3  : 4
  const cyRng = speed === 'fast' ? 2  : 7

  const [displayed, setDisplayed] = useState<string[]>(() =>
    text.split('').map(() => SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)])
  )
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    text.split('').forEach((target, i) => {
      const cycles = cyMin + Math.floor(Math.random() * cyRng)
      const order  = active ? i : text.length - 1 - i
      const startMs = delay * 1000 + order * msPC
      const finalChar = active
        ? target
        : SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]

      for (let c = 0; c < cycles; c++) {
        const t = setTimeout(() => {
          setDisplayed(prev => {
            const n = [...prev]
            n[i] = SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]
            return n
          })
        }, startMs + c * cyInt)
        timers.current.push(t)
      }
      const t = setTimeout(() => {
        setDisplayed(prev => { const n = [...prev]; n[i] = finalChar; return n })
      }, startMs + cycles * cyInt)
      timers.current.push(t)
    })

    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{displayed.join('')}</>
}

// ─── MetaRow with slot text ───────────────────────────────────────────────────

function MetaRow({
  label, value, active, rowDelay = 0,
}: {
  label: string; value: string; active: boolean; rowDelay?: number
}) {
  return (
    <div className="meta-row">
      <span className="meta-label">
        <SlotText text={label} active={active} delay={rowDelay} />
      </span>
      <span className="meta-val">
        <SlotText text={value} active={active} delay={rowDelay + 0.1} />
      </span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const [cursorPos, setCursorPos]     = useState({ x: -100, y: -100 })
  const [ringPos, setRingPos]         = useState({ x: -100, y: -100 })
  const [mouse, setMouse]             = useState({ x: 0, y: 0 })
  const [floatTime, setFloatTime]     = useState(0)
  const [hovering, setHovering]       = useState(false)
  const [activeSection, setActiveSection]   = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]))
  const [sectionActive, setSectionActive]   = useState<Record<number, boolean>>({})
  const [hoveredSection, setHoveredSection] = useState<number | null>(null)

  const ringTarget = useRef({ x: -100, y: -100 })
  const mouseRaw   = useRef({ x: 0, y: 0 })
  const rafRef     = useRef<number | null>(null)

  // Cursor + global mouse + float time
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY })
      ringTarget.current = { x: e.clientX, y: e.clientY }
      mouseRaw.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    const loop = () => {
      setRingPos(prev => ({
        x: prev.x + (ringTarget.current.x - prev.x) * 0.12,
        y: prev.y + (ringTarget.current.y - prev.y) * 0.12,
      }))
      setMouse(prev => ({
        x: prev.x + (mouseRaw.current.x - prev.x) * 0.07,
        y: prev.y + (mouseRaw.current.y - prev.y) * 0.07,
      }))
      setFloatTime(performance.now() / 1000)
      rafRef.current = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove)
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Section observer
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id, index) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(([entry]) => {
        setSectionActive(prev => ({ ...prev, [index]: entry.isIntersecting }))
        if (entry.isIntersecting) {
          setActiveSection(index)
          setVisibleSections(prev => new Set([...prev, index]))
        }
      }, { threshold: 0.45 })
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const isVis = (i: number) => visibleSections.has(i)
  const isAct = (i: number) => !!sectionActive[i]
  const go    = (i: number) => document.getElementById(SECTION_IDS[i])?.scrollIntoView({ behavior: 'smooth' })
  const hOn   = () => setHovering(true)
  const hOff  = () => setHovering(false)

  // Blob: idle float + mouse parallax
  const blobStyle = (mx: number, my = mx, phase = 0): React.CSSProperties => ({
    transform: `translate(${mouse.x * mx + Math.sin(floatTime * 0.38 + phase) * 20}px, ${mouse.y * my + Math.cos(floatTime * 0.29 + phase) * 14}px)`,
  })

  // Section image: idle float + hover mouse parallax (use with Next.js fill)
  const imgStyle = (sec: number, s: number, extra: React.CSSProperties = {}): React.CSSProperties => {
    const fx = Math.sin(floatTime * 0.32 + sec * 1.4) * 10
    const fy = Math.cos(floatTime * 0.25 + sec * 0.8) * 14
    const mx = hoveredSection === sec ? -mouse.x * s : 0
    const my = hoveredSection === sec ? -mouse.y * s : 0
    return {
      objectFit: 'cover',
      transform: `translate(${fx + mx}px, ${fy + my}px) scale(1.22)`,
      transition: 'none',
      ...extra,
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="cursor-dot"  style={{ left: cursorPos.x, top: cursorPos.y }} />
      <div className={`cursor-ring ${hovering ? 'hovering' : ''}`} style={{ left: ringPos.x, top: ringPos.y }} />

      <nav className="nav-dots">
        {SECTION_IDS.map((_, i) => (
          <button type="button" key={i} className={`nav-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => go(i)} aria-label={`セクション ${i + 1}`} />
        ))}
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section id="hero" className="fp-section" style={{ background: '#4ECDC4' }}>
        <div className="noise" />

        {/* Blobs — idle float + mouse parallax */}
        <div style={{ position: 'absolute', top: '8%',   right: '12%', width: 200, height: 200, background: '#FFD166', borderRadius: '50%', opacity: 0.6, filter: 'blur(40px)', ...blobStyle(-40, -30, 0) }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', width: 140, height: 140, background: '#FF6B6B', borderRadius: '50%', opacity: 0.5, filter: 'blur(30px)', ...blobStyle(50, 35, 2.1) }} />
        <div style={{ position: 'absolute', top: '30%',  left: '20%', width: 80,  height: 80,  background: '#FFADB5', borderRadius: '50%', opacity: 0.6, filter: 'blur(20px)', ...blobStyle(-25, 45, 4.3) }} />

        {/* Animated bars */}
        <div style={{ position: 'absolute', top: 40, left: 48 }}>
          <AnimatedBars />
        </div>

        {/* Top-right info */}
        <div style={{ position: 'absolute', top: 36, right: 60 }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
            <SlotText text="クリエイティブデザイナー" active={isAct(0)} />
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 2 }}>
            <SlotText text="isabellachen.design" active={isAct(0)} delay={0.1} />
          </p>
        </div>

        {/* Main text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <p className="font-elegant" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.3em', textTransform: 'uppercase', fontStyle: 'italic' }}>
            <SlotText text="— ビジュアル & ブランド —" active={isAct(0)} />
          </p>
          <h1 className="font-display" style={{ fontSize: 'clamp(100px, 16vw, 200px)', color: 'white', lineHeight: 0.9, textAlign: 'center', textShadow: '0 4px 40px rgba(0,0,0,0.12)' }}>
            <SlotText text="PORT"  active={isAct(0)} delay={0.05} /><br />
            <SlotText text="FOLIO" active={isAct(0)} delay={0.15} />
          </h1>
          <p className="font-elegant" style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em', marginTop: 8 }}>
            <SlotText text="Isabella Chen" active={isAct(0)} delay={0.3} />
          </p>
        </div>

        {/* Images — outer div: float+mouse parallax, inner div: CSS entrance anim */}
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', ...blobStyle(22, 18, 1.1) }}>
          <div className={`img-zoom anim-scale d5 ${isVis(0) ? '' : 'opacity-0'}`}
            onMouseEnter={hOn} onMouseLeave={hOff}
            style={{ width: 180, height: 180, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <Image src="/images/hero1.jpg"
              alt="カラフルなパイナップル" width={180} height={180} style={{ borderRadius: 12 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '22%', left: '6%', ...blobStyle(-28, 20, 3.2) }}>
          <div className={`img-zoom anim-scale d7 ${isVis(0) ? '' : 'opacity-0'}`}
            onMouseEnter={hOn} onMouseLeave={hOff}
            style={{ width: 130, height: 130, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
            <Image src="/images/hero2.jpg"
              alt="温かいコーヒー" width={130} height={130} style={{ borderRadius: 10 }} />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`anim-fade d8 ${isVis(0) ? '' : 'opacity-0'}`}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
            <SlotText text="スクロール" active={isAct(0)} delay={0.5} />
          </p>
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div className="scroll-line-fill" />
          </div>
        </div>
      </section>

      {/* ══════════════════ ABOUT ══════════════════ */}
      <section id="about" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}>
        <div style={{ width: '42%', background: '#F5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 40, left: 40 }}><DotGrid cols={5} rows={3} /></div>
          <div className={`anim-scale d1 ${isVis(1) ? '' : 'opacity-0'}`} onMouseEnter={hOn} onMouseLeave={hOff}>
            <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '6px solid white' }}>
              <Image src="/images/portrait.jpg"
                alt="Isabella Chen" width={240} height={240}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Sans', fontWeight: 600, fontSize: 18, color: '#1A1A2E' }}>
              <SlotText text="Isabella Chen" active={isAct(1)} delay={0.1} />
            </p>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
              <SlotText text="クリエイティブディレクター" active={isAct(1)} delay={0.2} />
            </p>
          </div>
        </div>

        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVis(1) ? '' : 'opacity-0'}`}><DotGrid cols={6} rows={2} /></div>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ECDC4', fontWeight: 600, marginTop: 24, marginBottom: 12 }}>
            <SlotText text="自己紹介" active={isAct(1)} delay={0.1} />
          </p>
          <h2 className="font-elegant" style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.15, color: '#1A1A2E', marginBottom: 28 }}>
            <SlotText text="記憶に残るブランドを" active={isAct(1)} delay={0.15} /><br />
            <em><SlotText text="つくる。" active={isAct(1)} delay={0.4} /></em>
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: '#666', maxWidth: 480, marginBottom: 20 }}>
            <SlotText speed="fast" active={isAct(1)} delay={0.3}
              text="東京を拠点にするクリエイティブディレクターとして、ブランドアイデンティティ、パッケージング、デジタル体験を専門にしています。8年以上の経験を通じて、美しく機能的なデザインを追求し続けています。" />
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: '#666', maxWidth: 480 }}>
            <SlotText speed="fast" active={isAct(1)} delay={0.5}
              text="すべてのプロジェクトはコラボレーション。創業者、マーケター、クリエイターと緊密に連携し、ビジョンを一貫したビジュアル言語へと昇華させます。" />
          </p>
          <div className={`anim-right d6 ${isVis(1) ? '' : 'opacity-0'}`}
            style={{ display: 'flex', gap: 48, marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {[
              ['8年+', '経験年数', 0.35],
              ['120+', 'プロジェクト', 0.45],
              ['40+',  'クライアント', 0.55],
            ].map(([num, label, d]) => (
              <div key={String(num)}>
                <p className="font-display" style={{ fontSize: 42, color: '#4ECDC4', lineHeight: 1 }}>
                  <SlotText text={String(num)} active={isAct(1)} delay={Number(d)} />
                </p>
                <p style={{ fontSize: 11, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  <SlotText text={String(label)} active={isAct(1)} delay={Number(d) + 0.1} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ BLOOM ══════════════════ */}
      <section id="proj1" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(2)} onMouseLeave={() => setHoveredSection(null)}>
        <div className={`anim-scale d1 ${isVis(2) ? '' : 'opacity-0'}`}
          style={{ width: '50%', background: '#FFADB5', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/images/bloom.jpg"
            alt="Bloom" fill sizes="50vw" style={imgStyle(2, 28)} />
        </div>
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-left d1 ${isVis(2) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}><DotGrid cols={6} rows={2} /></div>
          <span className="badge" style={{ color: '#FF6B6B', marginBottom: 20, alignSelf: 'flex-start' }}>
            <SlotText text="ブランドアイデンティティ" active={isAct(2)} />
          </span>
          <h2 className="font-elegant" style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Bloom" active={isAct(2)} /><br />
            <em><SlotText text="Botanicals" active={isAct(2)} delay={0.2} /></em>
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            <SlotText speed="fast" active={isAct(2)} delay={0.2}
              text="ボタニカルスキンケアブランドの完全なビジュアルアイデンティティ。花弁の幾何学、葉の構造、穏やかなグラデーションから着想を得たパッケージは、自然への瞑想のような美しさを持ちます。" />
          </p>
          <div className={`meta-table anim-left d5 ${isVis(2) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Bloom Botanicals"  active={isAct(2)} rowDelay={0.3} />
            <MetaRow label="クライアント"   value="中村 サラ"          active={isAct(2)} rowDelay={0.4} />
            <MetaRow label="カテゴリ"       value="ブランド / パッケージ" active={isAct(2)} rowDelay={0.5} />
            <MetaRow label="年"             value="2024 / 03"          active={isAct(2)} rowDelay={0.6} />
          </div>
        </div>
      </section>

      {/* ══════════════════ TEMPO ══════════════════ */}
      <section id="proj2" className="fp-section" style={{ background: '#FAFAFA', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(3)} onMouseLeave={() => setHoveredSection(null)}>
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVis(3) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}><DotGrid cols={6} rows={2} /></div>
          <span className="badge" style={{ color: '#FFD166', marginBottom: 20, alignSelf: 'flex-start' }}>
            <SlotText text="UI / UX デザイン" active={isAct(3)} />
          </span>
          <h2 className="font-elegant" style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Tempo" active={isAct(3)} /><br />
            <em><SlotText text="Music App" active={isAct(3)} delay={0.2} /></em>
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            <SlotText speed="fast" active={isAct(3)} delay={0.2}
              text="新進アーティストを支援する独立系音楽ストリーミングプラットフォームのエンドツーエンドUXデザイン。レコード店でビニールをめくる感触のような、温かみのある触覚的な美学を追求しました。" />
          </p>
          <div className={`meta-table anim-right d5 ${isVis(3) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Tempo App"            active={isAct(3)} rowDelay={0.3} />
            <MetaRow label="クライアント"   value="マシュー ブルックス"    active={isAct(3)} rowDelay={0.4} />
            <MetaRow label="カテゴリ"       value="UI/UX / プロダクトデザイン" active={isAct(3)} rowDelay={0.5} />
            <MetaRow label="年"             value="2024 / 06"            active={isAct(3)} rowDelay={0.6} />
          </div>
        </div>
        <div className={`anim-scale d1 ${isVis(3) ? '' : 'opacity-0'}`}
          style={{ width: '50%', background: '#FFD166', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/images/tempo.jpg"
            alt="Tempo" fill sizes="50vw" style={imgStyle(3, 28)} />
        </div>
      </section>

      {/* ══════════════════ LUMI ══════════════════ */}
      <section id="proj3" className="fp-section" style={{ background: '#1A1A2E', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(4)} onMouseLeave={() => setHoveredSection(null)}>
        <div style={{ flex: 1, padding: '80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 60, right: 60 }}><DotGrid cols={5} rows={4} color="rgba(255,255,255,0.3)" /></div>
          <span className="badge" style={{ color: '#95E1D3', marginBottom: 24, alignSelf: 'flex-start' }}>
            <SlotText text="ウェブデザイン" active={isAct(4)} />
          </span>
          <h2 className="font-elegant" style={{ fontSize: 60, fontWeight: 300, lineHeight: 1.05, color: 'white', marginBottom: 28 }}>
            <SlotText text="Lumi" active={isAct(4)} /><br />
            <em style={{ color: '#95E1D3' }}><SlotText text="Architecture" active={isAct(4)} delay={0.2} /></em>
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.55)', maxWidth: 440 }}>
            <SlotText speed="fast" active={isAct(4)} delay={0.2}
              text="大阪を拠点にするモダニストの建築スタジオのウェブサイトリデザイン。「光を素材として扱う」という哲学を、デジタル体験に翻訳することが使命でした。" />
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.55)', maxWidth: 440, marginTop: 16 }}>
            <SlotText speed="fast" active={isAct(4)} delay={0.45}
              text="WebGLを使ったカスタムスクロールナラティブを構築し、各セクションが光と影を通じてジオメトリを現す演出を実現しました。" />
          </p>
          <div className={`meta-table anim-up d5 ${isVis(4) ? '' : 'opacity-0'}`}
            style={{ marginTop: 36, maxWidth: 440, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            {([
              ['クライアント', '田中 浩',                    0.35],
              ['カテゴリ',     'ウェブデザイン / モーション', 0.45],
              ['年',           '2023 / 11',                   0.55],
            ] as [string, string, number][]).map(([l, v, d]) => (
              <div key={l} className="meta-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="meta-label" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <SlotText text={l} active={isAct(4)} delay={d} />
                </span>
                <span className="meta-val" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <SlotText text={v} active={isAct(4)} delay={d + 0.1} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={`anim-scale d2 ${isVis(4) ? '' : 'opacity-0'}`}
          style={{ width: '40%', background: '#0d1117', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/images/lumi.jpg"
            alt="Lumi" fill sizes="40vw" style={imgStyle(4, 28, { opacity: 0.75 })} />
        </div>
      </section>

      {/* ══════════════════ NECTAR ══════════════════ */}
      <section id="proj4" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(5)} onMouseLeave={() => setHoveredSection(null)}>
        <div className={`anim-scale d1 ${isVis(5) ? '' : 'opacity-0'}`}
          style={{ width: '50%', background: '#A8E6CF', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/images/nectar.jpg"
            alt="Nectar" fill sizes="50vw" style={imgStyle(5, 28)} />
        </div>
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-left d1 ${isVis(5) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}><DotGrid cols={6} rows={2} /></div>
          <span className="badge" style={{ color: '#4ECDC4', marginBottom: 20, alignSelf: 'flex-start' }}>
            <SlotText text="パッケージデザイン" active={isAct(5)} />
          </span>
          <h2 className="font-elegant" style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Nectar" active={isAct(5)} /><br />
            <em><SlotText text="Artisan Honey" active={isAct(5)} delay={0.2} /></em>
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            <SlotText speed="fast" active={isAct(5)} delay={0.2}
              text="北海道の家族経営の養蜂場のパッケージとビジュアルアイデンティティ。伝統的な日本の美学を現代感覚で昇華させ、専門食品棚でも輝く、温かく手作り感あふれるデザインに仕上げました。" />
          </p>
          <div className={`meta-table anim-left d5 ${isVis(5) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Nectar Honey"        active={isAct(5)} rowDelay={0.3} />
            <MetaRow label="クライアント"   value="山本 恵子"           active={isAct(5)} rowDelay={0.4} />
            <MetaRow label="カテゴリ"       value="パッケージ / アイデンティティ" active={isAct(5)} rowDelay={0.5} />
            <MetaRow label="年"             value="2024 / 01"           active={isAct(5)} rowDelay={0.6} />
          </div>
        </div>
      </section>

      {/* ══════════════════ PULSE ══════════════════ */}
      <section id="proj5" className="fp-section" style={{ background: '#FFF8F0', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(6)} onMouseLeave={() => setHoveredSection(null)}>
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVis(6) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}><DotGrid cols={6} rows={2} /></div>
          <span className="badge" style={{ color: '#FF6B6B', marginBottom: 20, alignSelf: 'flex-start' }}>
            <SlotText text="データビジュアライゼーション" active={isAct(6)} />
          </span>
          <h2 className="font-elegant" style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Pulse" active={isAct(6)} /><br />
            <em><SlotText text="Dashboard" active={isAct(6)} delay={0.2} /></em>
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            <SlotText speed="fast" active={isAct(6)} delay={0.2}
              text="患者の健康指標を追跡するヘルステックスタートアップ向けのデータリッチな分析ダッシュボード。密度の高い医療データを、患者にも医師にも直感的で温かみのある形で提供することに挑戦しました。" />
          </p>
          <div className={`meta-table anim-right d5 ${isVis(6) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Pulse Dashboard"      active={isAct(6)} rowDelay={0.3} />
            <MetaRow label="クライアント"   value="Dr. アレックス リベラ" active={isAct(6)} rowDelay={0.4} />
            <MetaRow label="カテゴリ"       value="UIデザイン / データ可視化" active={isAct(6)} rowDelay={0.5} />
            <MetaRow label="年"             value="2023 / 08"            active={isAct(6)} rowDelay={0.6} />
          </div>
        </div>
        <div className={`anim-scale d1 ${isVis(6) ? '' : 'opacity-0'}`}
          style={{ width: '50%', background: '#FFD166', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <Image src="/images/pulse.jpg"
            alt="Pulse" fill sizes="50vw" style={imgStyle(6, 28)} />
        </div>
      </section>

      {/* ══════════════════ MORE WORK ══════════════════ */}
      <section id="proj6" className="fp-section" style={{ background: '#FFFFFF', display: 'flex', flexDirection: 'column', padding: '60px 60px 40px' }}
        onMouseEnter={() => setHoveredSection(7)} onMouseLeave={() => setHoveredSection(null)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className={`anim-up d1 ${isVis(7) ? '' : 'opacity-0'}`} style={{ marginBottom: 12 }}><DotGrid cols={6} rows={2} /></div>
            <h2 className="font-elegant" style={{ fontSize: 40, fontWeight: 300, color: '#1A1A2E' }}>
              <SlotText text="その他の作品" active={isAct(7)} />
            </h2>
          </div>
          <p style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            <SlotText text="Selected Projects 2022–2024" active={isAct(7)} delay={0.2} />
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, flex: 1 }}>
          {([
            ['/images/wave.jpg', 'Wave Motion',     'モーションデザイン',       '#FFADB5', 0.1],
            ['/images/clockwork.jpg', 'Clockwork Brand', 'アイデンティティデザイン', '#C8B8E8', 0.2],
            ['/images/sweet.jpg', 'Sweet Studio',    'ECコマース',               '#A8E6CF', 0.3],
          ] as [string, string, string, string, number][]).map(([src, title, cat, color, d]) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'none' }}>
              <div style={{ flex: 1, borderRadius: 8, background: color, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                <Image src={src} alt={title} fill sizes="33vw"
                  style={imgStyle(7, 20, { borderRadius: 8 })} />
              </div>
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: 600, color: '#1A1A2E', marginBottom: 2 }}>
                  <SlotText text={title} active={isAct(7)} delay={d} />
                </p>
                <p style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <SlotText text={cat} active={isAct(7)} delay={d + 0.1} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ CONTACT ══════════════════ */}
      <section id="contact" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}
        onMouseEnter={() => setHoveredSection(8)} onMouseLeave={() => setHoveredSection(null)}>
        <div style={{ flex: 1, padding: '80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, background: '#4ECDC4', borderRadius: '50%', opacity: 0.08, ...blobStyle(30, 25, 1.7) }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: '#FFD166', borderRadius: '50%', opacity: 0.12, ...blobStyle(-22, 18, 3.9) }} />

          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ECDC4', fontWeight: 600, marginBottom: 16 }}>
            <SlotText text="一緒につくろう" active={isAct(8)} delay={0.05} />
          </p>
          <h2 className="font-display" style={{ fontSize: 'clamp(64px, 8vw, 110px)', color: '#1A1A2E', lineHeight: 0.92, marginBottom: 40 }}>
            <SlotText text="CONTACT" active={isAct(8)} delay={0.1} /><br />
            <SlotText text="US"      active={isAct(8)} delay={0.35} />
          </h2>

          <div className={`anim-up d3 ${isVis(8) ? '' : 'opacity-0'}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {([
              ['P', '+81 (0)3 1234 5678',               0.3],
              ['E', 'hello@isabellachen.design',          0.4],
              ['A', '東京都港区南青山3丁目12番地 107-0062', 0.5],
            ] as [string, string, number][]).map(([icon, label, d]) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: '0.05em', flexShrink: 0 }}>
                  {icon}
                </span>
                <span style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  <SlotText text={label} active={isAct(8)} delay={d} />
                </span>
              </div>
            ))}
          </div>

          <div className={`anim-fade d6 ${isVis(8) ? '' : 'opacity-0'}`} style={{ position: 'absolute', bottom: 50, right: 40 }}>
            <AnimatedBars color="rgba(26,26,46,0.2)" />
          </div>
        </div>

        <div style={{ width: '42%', display: 'grid', gridTemplateRows: '1fr 1fr', height: '100%' }}>
          <div className={`anim-scale d3 ${isVis(8) ? '' : 'opacity-0'}`}
            onMouseEnter={hOn} onMouseLeave={hOff} style={{ background: '#FFD166', position: 'relative', overflow: 'hidden' }}>
            <Image src="/images/contact1.jpg"
              alt="クリエイティブワークスペース" fill sizes="42vw" style={imgStyle(8, 20)} />
          </div>
          <div className={`anim-scale d5 ${isVis(8) ? '' : 'opacity-0'}`}
            onMouseEnter={hOn} onMouseLeave={hOff} style={{ background: '#FFADB5', position: 'relative', overflow: 'hidden' }}>
            <Image src="/images/contact2.jpg"
              alt="デザインプロセス" fill sizes="42vw" style={imgStyle(8, 20)} />
          </div>
        </div>
      </section>
    </>
  )
}
