'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTION_IDS = ['hero', 'about', 'proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'contact']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DotGrid({ cols = 6, rows = 2, color = '#1A1A2E' }: { cols?: number; rows?: number; color?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 6px)`, gap: '5px' }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', display: 'block', background: color, opacity: 0.45 }} />
      ))}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-val">{value}</span>
    </div>
  )
}

// ─── Animated Sound Bars ─────────────────────────────────────────────────────

function AnimatedBars({ color = 'rgba(255,255,255,0.6)' }: { color?: string }) {
  const BASE = [18, 28, 14, 22, 10, 26, 16, 20, 12, 24]
  const [heights, setHeights] = useState(BASE)

  useEffect(() => {
    const id = setInterval(() => {
      setHeights(BASE.map(() => Math.floor(Math.random() * 24) + 6))
    }, 130)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
      {heights.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, background: color, borderRadius: 1, transition: 'height 0.12s ease' }} />
      ))}
    </div>
  )
}

// ─── Slot Machine Text ────────────────────────────────────────────────────────

const SLOT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789'

function SlotText({ text, trigger, delay = 0 }: { text: string; trigger: boolean; delay?: number }) {
  const [chars, setChars] = useState<string[]>(text.split('').map(() => '\u00A0'))
  const didRun = useRef(false)

  useEffect(() => {
    if (!trigger || didRun.current) return
    didRun.current = true
    const timeouts: ReturnType<typeof setTimeout>[] = []

    text.split('').forEach((target, i) => {
      if (target === ' ' || target === '\n') {
        setChars(prev => { const n = [...prev]; n[i] = target; return n })
        return
      }
      const cycles = 6 + Math.floor(Math.random() * 6)
      const startMs = delay * 1000 + i * 55

      for (let c = 0; c < cycles; c++) {
        const t = setTimeout(() => {
          setChars(prev => {
            const n = [...prev]
            n[i] = SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)]
            return n
          })
        }, startMs + c * 45)
        timeouts.push(t)
      }
      const t = setTimeout(() => {
        setChars(prev => { const n = [...prev]; n[i] = target; return n })
      }, startMs + cycles * 45)
      timeouts.push(t)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [trigger])

  return <>{chars.join('')}</>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Portfolio() {
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 })
  const [mouse, setMouse] = useState({ x: 0, y: 0 }) // -1 to 1 normalized
  const [hovering, setHovering] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]))

  const ringTarget = useRef({ x: -100, y: -100 })
  const mouseRaw = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  // Cursor + mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY })
      ringTarget.current = { x: e.clientX, y: e.clientY }
      mouseRaw.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    const loop = () => {
      setRingPos(prev => ({
        x: prev.x + (ringTarget.current.x - prev.x) * 0.12,
        y: prev.y + (ringTarget.current.y - prev.y) * 0.12,
      }))
      setMouse(prev => ({
        x: prev.x + (mouseRaw.current.x - prev.x) * 0.08,
        y: prev.y + (mouseRaw.current.y - prev.y) * 0.08,
      }))
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
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(index)
            setVisibleSections(prev => new Set([...prev, index]))
          }
        },
        { threshold: 0.45 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const isVisible = (i: number) => visibleSections.has(i)
  const scrollTo = (i: number) => document.getElementById(SECTION_IDS[i])?.scrollIntoView({ behavior: 'smooth' })
  const hoverOn = () => setHovering(true)
  const hoverOff = () => setHovering(false)

  // Parallax helpers
  const blobPx = (sx: number, sy = sx) => ({
    transform: `translate(${mouse.x * sx}px, ${mouse.y * sy}px)`,
    transition: 'transform 0.05s linear',
  })
  const imgPx = (s: number) => ({
    transform: `translate(${-mouse.x * s}px, ${-mouse.y * s}px) scale(1.08)`,
    transition: 'transform 0.1s linear',
  })

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Custom cursor */}
      <div className="cursor-dot" style={{ left: cursorPos.x, top: cursorPos.y }} />
      <div className={`cursor-ring ${hovering ? 'hovering' : ''}`} style={{ left: ringPos.x, top: ringPos.y }} />

      {/* Side nav dots */}
      <nav className="nav-dots">
        {SECTION_IDS.map((_, i) => (
          <button key={i} className={`nav-dot ${activeSection === i ? 'active' : ''}`} onClick={() => scrollTo(i)} aria-label={`セクション ${i + 1}`} />
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════
          SECTION 1: HERO
      ═══════════════════════════════════════════════════ */}
      <section id="hero" className="fp-section" style={{ background: '#4ECDC4' }}>
        <div className="noise" />

        {/* Floating blobs with mouse parallax */}
        <div style={{ position: 'absolute', top: '8%', right: '12%', width: 200, height: 200, background: '#FFD166', borderRadius: '50%', opacity: 0.6, filter: 'blur(40px)', ...blobPx(-18, -14) }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', width: 140, height: 140, background: '#FF6B6B', borderRadius: '50%', opacity: 0.5, filter: 'blur(30px)', ...blobPx(22, 16) }} />
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: 80, height: 80, background: '#FFADB5', borderRadius: '50%', opacity: 0.6, filter: 'blur(20px)', ...blobPx(-10, 20) }} />

        {/* Animated sound bars top-left */}
        <div style={{ position: 'absolute', top: 40, left: 48 }}>
          <AnimatedBars />
        </div>

        {/* Name top right */}
        <div style={{ position: 'absolute', top: 36, right: 60 }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
            クリエイティブデザイナー
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 2 }}>
            isabellachen.design
          </p>
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <p className={`font-elegant anim-fade d2 ${isVisible(0) ? '' : 'opacity-0'}`}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.3em', textTransform: 'uppercase', fontStyle: 'italic' }}>
            — ビジュアル & ブランド —
          </p>
          <h1 className={`font-display anim-up d1 ${isVisible(0) ? '' : 'opacity-0'}`}
            style={{ fontSize: 'clamp(100px, 16vw, 200px)', color: 'white', lineHeight: 0.9, textAlign: 'center', textShadow: '0 4px 40px rgba(0,0,0,0.12)' }}>
            PORT<br />FOLIO
          </h1>
          <p className={`font-elegant anim-fade d4 ${isVisible(0) ? '' : 'opacity-0'}`}
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em', marginTop: 8 }}>
            Isabella Chen
          </p>
        </div>

        {/* Decorative image blocks with mouse parallax */}
        <div className={`img-zoom anim-scale d5 ${isVisible(0) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ position: 'absolute', bottom: '10%', right: '10%', width: 180, height: 180, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', ...blobPx(10, 8) }}>
          <Image
            src="https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=400&fit=crop&auto=format&q=80"
            alt="カラフルなパイナップル"
            width={180} height={180}
            style={{ borderRadius: 12 }}
          />
        </div>
        <div className={`img-zoom anim-scale d7 ${isVisible(0) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ position: 'absolute', bottom: '22%', left: '6%', width: 130, height: 130, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', ...blobPx(-12, 10) }}>
          <Image
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop&auto=format&q=80"
            alt="温かいコーヒー"
            width={130} height={130}
            style={{ borderRadius: 10 }}
          />
        </div>

        {/* Animated scroll hint */}
        <div className={`anim-fade d8 ${isVisible(0) ? '' : 'opacity-0'}`}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>スクロール</p>
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div className="scroll-line-fill" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: ABOUT
      ═══════════════════════════════════════════════════ */}
      <section id="about" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}>
        {/* Left: profile image column */}
        <div style={{ width: '42%', background: '#F5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 40, left: 40 }}>
            <DotGrid cols={5} rows={3} />
          </div>
          <div className={`anim-scale d1 ${isVisible(1) ? '' : 'opacity-0'}`}
            onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '6px solid white' }}>
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=480&h=480&fit=crop&crop=face&auto=format&q=85"
                alt="Isabella Chen"
                width={240} height={240}
                style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(6) }}
              />
            </div>
            <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Sans', fontWeight: 600, fontSize: 18, color: '#1A1A2E' }}>Isabella Chen</p>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>クリエイティブディレクター</p>
          </div>
        </div>

        {/* Right: bio text */}
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVisible(1) ? '' : 'opacity-0'}`}>
            <DotGrid cols={6} rows={2} />
          </div>
          <p className={`anim-right d2 ${isVisible(1) ? '' : 'opacity-0'}`}
            style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ECDC4', fontWeight: 600, marginTop: 24, marginBottom: 12 }}>
            自己紹介
          </p>
          <h2 className={`font-elegant anim-right d3 ${isVisible(1) ? '' : 'opacity-0'}`}
            style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.15, color: '#1A1A2E', marginBottom: 28 }}>
            <SlotText text="記憶に残るブランドを" trigger={isVisible(1)} />
            <br />
            <em><SlotText text="つくる。" trigger={isVisible(1)} delay={0.3} /></em>
          </h2>
          <p className={`anim-right d4 ${isVisible(1) ? '' : 'opacity-0'}`}
            style={{ fontSize: 14, lineHeight: 1.9, color: '#666', maxWidth: 480, marginBottom: 20 }}>
            東京を拠点にするクリエイティブディレクターとして、ブランドアイデンティティ、パッケージング、デジタル体験を専門にしています。8年以上の経験を通じて、美しく機能的なデザインを追求し続けています。
          </p>
          <p className={`anim-right d5 ${isVisible(1) ? '' : 'opacity-0'}`}
            style={{ fontSize: 14, lineHeight: 1.9, color: '#666', maxWidth: 480 }}>
            すべてのプロジェクトはコラボレーション。創業者、マーケター、クリエイターと緊密に連携し、ビジョンを一貫したビジュアル言語へと昇華させます。
          </p>

          {/* Stats */}
          <div className={`anim-right d6 ${isVisible(1) ? '' : 'opacity-0'}`}
            style={{ display: 'flex', gap: 48, marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {[['8年+', '経験年数'], ['120+', 'プロジェクト'], ['40+', 'クライアント']].map(([num, label]) => (
              <div key={num}>
                <p className="font-display" style={{ fontSize: 42, color: '#4ECDC4', lineHeight: 1 }}>{num}</p>
                <p style={{ fontSize: 11, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: PROJECT — BLOOM IDENTITY
      ═══════════════════════════════════════════════════ */}
      <section id="proj1" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}>
        {/* Image with parallax */}
        <div className={`img-zoom anim-scale d1 ${isVisible(2) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ width: '50%', height: '100%', background: '#FFADB5' }}>
          <Image
            src="https://images.unsplash.com/photo-1519710164239-da21be2b6a4b?w=800&h=900&fit=crop&auto=format&q=80"
            alt="Bloom Brand Identity"
            width={800} height={900}
            style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(12) }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-left d1 ${isVisible(2) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}>
            <DotGrid cols={6} rows={2} />
          </div>
          <span className={`badge anim-left d2 ${isVisible(2) ? '' : 'opacity-0'}`}
            style={{ color: '#FF6B6B', marginBottom: 20, alignSelf: 'flex-start' }}>
            ブランドアイデンティティ
          </span>
          <h2 className={`font-elegant anim-left d3 ${isVisible(2) ? '' : 'opacity-0'}`}
            style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Bloom" trigger={isVisible(2)} /><br />
            <em><SlotText text="Botanicals" trigger={isVisible(2)} delay={0.2} /></em>
          </h2>
          <p className={`anim-left d4 ${isVisible(2) ? '' : 'opacity-0'}`}
            style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            ボタニカルスキンケアブランドの完全なビジュアルアイデンティティ。花弁の幾何学、葉の構造、穏やかなグラデーションから着想を得たパッケージは、自然への瞑想のような美しさを持ちます。
          </p>
          <div className={`meta-table anim-left d5 ${isVisible(2) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Bloom Botanicals" />
            <MetaRow label="クライアント" value="中村 サラ" />
            <MetaRow label="カテゴリ" value="ブランド / パッケージ" />
            <MetaRow label="年" value="2024 / 03" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: PROJECT — TEMPO APP
      ═══════════════════════════════════════════════════ */}
      <section id="proj2" className="fp-section" style={{ background: '#FAFAFA', display: 'flex' }}>
        {/* Text */}
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVisible(3) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}>
            <DotGrid cols={6} rows={2} />
          </div>
          <span className={`badge anim-right d2 ${isVisible(3) ? '' : 'opacity-0'}`}
            style={{ color: '#FFD166', marginBottom: 20, alignSelf: 'flex-start' }}>
            UI / UX デザイン
          </span>
          <h2 className={`font-elegant anim-right d3 ${isVisible(3) ? '' : 'opacity-0'}`}
            style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Tempo" trigger={isVisible(3)} /><br />
            <em><SlotText text="Music App" trigger={isVisible(3)} delay={0.2} /></em>
          </h2>
          <p className={`anim-right d4 ${isVisible(3) ? '' : 'opacity-0'}`}
            style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            新進アーティストを支援する独立系音楽ストリーミングプラットフォームのエンドツーエンドUXデザイン。レコード店でビニールをめくる感触のような、温かみのある触覚的な美学を追求しました。
          </p>
          <div className={`meta-table anim-right d5 ${isVisible(3) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Tempo App" />
            <MetaRow label="クライアント" value="マシュー ブルックス" />
            <MetaRow label="カテゴリ" value="UI/UX / プロダクトデザイン" />
            <MetaRow label="年" value="2024 / 06" />
          </div>
        </div>

        {/* Image */}
        <div className={`img-zoom anim-scale d1 ${isVisible(3) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ width: '50%', height: '100%', background: '#FFD166' }}>
          <Image
            src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&h=900&fit=crop&auto=format&q=80"
            alt="Tempo Music App"
            width={800} height={900}
            style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(12) }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: PROJECT — LUMI ARCHITECTURE
      ═══════════════════════════════════════════════════ */}
      <section id="proj3" className="fp-section" style={{ background: '#1A1A2E', display: 'flex' }}>
        {/* Text */}
        <div style={{ flex: 1, padding: '80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 60, right: 60 }}>
            <DotGrid cols={5} rows={4} color="rgba(255,255,255,0.3)" />
          </div>
          <span className={`badge anim-up d1 ${isVisible(4) ? '' : 'opacity-0'}`}
            style={{ color: '#95E1D3', marginBottom: 24, alignSelf: 'flex-start' }}>
            ウェブデザイン
          </span>
          <h2 className={`font-elegant anim-up d2 ${isVisible(4) ? '' : 'opacity-0'}`}
            style={{ fontSize: 60, fontWeight: 300, lineHeight: 1.05, color: 'white', marginBottom: 28 }}>
            <SlotText text="Lumi" trigger={isVisible(4)} /><br />
            <em style={{ color: '#95E1D3' }}><SlotText text="Architecture" trigger={isVisible(4)} delay={0.2} /></em>
          </h2>
          <p className={`anim-up d3 ${isVisible(4) ? '' : 'opacity-0'}`}
            style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.55)', maxWidth: 440 }}>
            大阪を拠点にするモダニストの建築スタジオのウェブサイトリデザイン。「光を素材として扱う」という哲学を、デジタル体験に翻訳することが使命でした。
          </p>
          <p className={`anim-up d4 ${isVisible(4) ? '' : 'opacity-0'}`}
            style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(255,255,255,0.55)', maxWidth: 440, marginTop: 16 }}>
            WebGLを使ったカスタムスクロールナラティブを構築し、各セクションが光と影を通じてジオメトリを現す演出を実現しました。
          </p>
          <div className={`meta-table anim-up d5 ${isVisible(4) ? '' : 'opacity-0'}`}
            style={{ marginTop: 36, maxWidth: 440, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="meta-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="meta-label" style={{ color: 'rgba(255,255,255,0.3)' }}>クライアント</span>
              <span className="meta-val" style={{ color: 'rgba(255,255,255,0.8)' }}>田中 浩</span>
            </div>
            <div className="meta-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="meta-label" style={{ color: 'rgba(255,255,255,0.3)' }}>カテゴリ</span>
              <span className="meta-val" style={{ color: 'rgba(255,255,255,0.8)' }}>ウェブデザイン / モーション</span>
            </div>
            <div className="meta-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="meta-label" style={{ color: 'rgba(255,255,255,0.3)' }}>年</span>
              <span className="meta-val" style={{ color: 'rgba(255,255,255,0.8)' }}>2023 / 11</span>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className={`img-zoom anim-scale d2 ${isVisible(4) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ width: '40%', height: '100%', background: '#0d1117' }}>
          <Image
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=700&h=900&fit=crop&auto=format&q=80"
            alt="Lumi Architecture"
            width={700} height={900}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, ...imgPx(10) }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: PROJECT — NECTAR PACKAGING
      ═══════════════════════════════════════════════════ */}
      <section id="proj4" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}>
        {/* Image */}
        <div className={`img-zoom anim-scale d1 ${isVisible(5) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ width: '50%', height: '100%', background: '#A8E6CF' }}>
          <Image
            src="https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=900&fit=crop&auto=format&q=80"
            alt="Nectar Packaging"
            width={800} height={900}
            style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(12) }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-left d1 ${isVisible(5) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}>
            <DotGrid cols={6} rows={2} />
          </div>
          <span className={`badge anim-left d2 ${isVisible(5) ? '' : 'opacity-0'}`}
            style={{ color: '#4ECDC4', marginBottom: 20, alignSelf: 'flex-start' }}>
            パッケージデザイン
          </span>
          <h2 className={`font-elegant anim-left d3 ${isVisible(5) ? '' : 'opacity-0'}`}
            style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Nectar" trigger={isVisible(5)} /><br />
            <em><SlotText text="Artisan Honey" trigger={isVisible(5)} delay={0.2} /></em>
          </h2>
          <p className={`anim-left d4 ${isVisible(5) ? '' : 'opacity-0'}`}
            style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            北海道の家族経営の養蜂場のパッケージとビジュアルアイデンティティ。伝統的な日本の美学を現代感覚で昇華させ、専門食品棚の中でも輝く、温かく手作り感あふれるデザインに仕上げました。
          </p>
          <div className={`meta-table anim-left d5 ${isVisible(5) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Nectar Honey" />
            <MetaRow label="クライアント" value="山本 恵子" />
            <MetaRow label="カテゴリ" value="パッケージ / アイデンティティ" />
            <MetaRow label="年" value="2024 / 01" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: PROJECT — PULSE DASHBOARD
      ═══════════════════════════════════════════════════ */}
      <section id="proj5" className="fp-section" style={{ background: '#FFF8F0', display: 'flex' }}>
        {/* Text */}
        <div style={{ flex: 1, padding: '80px 70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className={`anim-right d1 ${isVisible(6) ? '' : 'opacity-0'}`} style={{ marginBottom: 20 }}>
            <DotGrid cols={6} rows={2} />
          </div>
          <span className={`badge anim-right d2 ${isVisible(6) ? '' : 'opacity-0'}`}
            style={{ color: '#FF6B6B', marginBottom: 20, alignSelf: 'flex-start' }}>
            データビジュアライゼーション
          </span>
          <h2 className={`font-elegant anim-right d3 ${isVisible(6) ? '' : 'opacity-0'}`}
            style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.1, color: '#1A1A2E', marginBottom: 24 }}>
            <SlotText text="Pulse" trigger={isVisible(6)} /><br />
            <em><SlotText text="Dashboard" trigger={isVisible(6)} delay={0.2} /></em>
          </h2>
          <p className={`anim-right d4 ${isVisible(6) ? '' : 'opacity-0'}`}
            style={{ fontSize: 13.5, lineHeight: 1.85, color: '#777', maxWidth: 380 }}>
            患者の健康指標を追跡するヘルステックスタートアップ向けのデータリッチな分析ダッシュボード。密度の高い医療データを、患者にも医師にも直感的で温かみのある形で提供することに挑戦しました。
          </p>
          <div className={`meta-table anim-right d5 ${isVisible(6) ? '' : 'opacity-0'}`} style={{ marginTop: 32, maxWidth: 380 }}>
            <MetaRow label="プロジェクト名" value="Pulse Dashboard" />
            <MetaRow label="クライアント" value="Dr. アレックス リベラ" />
            <MetaRow label="カテゴリ" value="UIデザイン / データ可視化" />
            <MetaRow label="年" value="2023 / 08" />
          </div>
        </div>

        {/* Image */}
        <div className={`img-zoom anim-scale d1 ${isVisible(6) ? '' : 'opacity-0'}`}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
          style={{ width: '50%', height: '100%', background: '#FFD166' }}>
          <Image
            src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&h=900&fit=crop&auto=format&q=80"
            alt="Pulse Dashboard"
            width={800} height={900}
            style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(12) }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8: PROJECT GRID
      ═══════════════════════════════════════════════════ */}
      <section id="proj6" className="fp-section" style={{ background: '#FFFFFF', display: 'flex', flexDirection: 'column', padding: '60px 60px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className={`anim-up d1 ${isVisible(7) ? '' : 'opacity-0'}`} style={{ marginBottom: 12 }}>
              <DotGrid cols={6} rows={2} />
            </div>
            <h2 className={`font-elegant anim-up d2 ${isVisible(7) ? '' : 'opacity-0'}`}
              style={{ fontSize: 40, fontWeight: 300, color: '#1A1A2E' }}>
              その他の<em>作品</em>
            </h2>
          </div>
          <p className={`anim-fade d3 ${isVisible(7) ? '' : 'opacity-0'}`}
            style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Selected Projects 2022–2024
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, flex: 1 }}>
          {[
            {
              src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=500&fit=crop&auto=format&q=80',
              title: 'Wave Motion',
              cat: 'モーションデザイン',
              color: '#FFADB5',
              delay: 'd2',
            },
            {
              src: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&h=500&fit=crop&auto=format&q=80',
              title: 'Clockwork Brand',
              cat: 'アイデンティティデザイン',
              color: '#C8B8E8',
              delay: 'd4',
            },
            {
              src: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&h=500&fit=crop&auto=format&q=80',
              title: 'Sweet Studio',
              cat: 'ECコマース',
              color: '#A8E6CF',
              delay: 'd6',
            },
          ].map((p) => (
            <div key={p.title} className={`anim-up ${p.delay} ${isVisible(7) ? '' : 'opacity-0'}`}
              onMouseEnter={hoverOn} onMouseLeave={hoverOff}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'none' }}>
              <div className="img-zoom" style={{ flex: 1, borderRadius: 8, background: p.color, minHeight: 0 }}>
                <Image
                  src={p.src}
                  alt={p.title}
                  width={600} height={500}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, ...imgPx(8) }}
                />
              </div>
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: 600, color: '#1A1A2E', marginBottom: 2 }}>{p.title}</p>
                <p style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 9: CONTACT
      ═══════════════════════════════════════════════════ */}
      <section id="contact" className="fp-section" style={{ background: '#FFFFFF', display: 'flex' }}>
        {/* Left: large text */}
        <div style={{ flex: 1, padding: '80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* bg accent blobs with parallax */}
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, background: '#4ECDC4', borderRadius: '50%', opacity: 0.08, ...blobPx(-20, -16) }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: '#FFD166', borderRadius: '50%', opacity: 0.12, ...blobPx(16, -12) }} />

          <p className={`anim-up d1 ${isVisible(8) ? '' : 'opacity-0'}`}
            style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ECDC4', fontWeight: 600, marginBottom: 16 }}>
            一緒につくろう
          </p>
          <h2 className={`font-display anim-up d2 ${isVisible(8) ? '' : 'opacity-0'}`}
            style={{ fontSize: 'clamp(64px, 8vw, 110px)', color: '#1A1A2E', lineHeight: 0.92, marginBottom: 40 }}>
            <SlotText text="CONTACT" trigger={isVisible(8)} /><br />
            <SlotText text="US" trigger={isVisible(8)} delay={0.3} />
          </h2>

          <div className={`anim-up d3 ${isVisible(8) ? '' : 'opacity-0'}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'P', label: '+81 (0)3 1234 5678' },
              { icon: 'E', label: 'hello@isabellachen.design' },
              { icon: 'A', label: '東京都港区南青山3丁目12番地 107-0062' },
            ].map(({ icon, label }) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#1A1A2E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: '0.05em', flexShrink: 0,
                }}>
                  {icon}
                </span>
                <span style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Animated bars decoration */}
          <div className={`anim-fade d6 ${isVisible(8) ? '' : 'opacity-0'}`}
            style={{ position: 'absolute', bottom: 50, right: 40 }}>
            <AnimatedBars color="rgba(26,26,46,0.2)" />
          </div>
        </div>

        {/* Right: split images */}
        <div style={{ width: '42%', display: 'grid', gridTemplateRows: '1fr 1fr', height: '100%' }}>
          <div className={`img-zoom anim-scale d3 ${isVisible(8) ? '' : 'opacity-0'}`}
            onMouseEnter={hoverOn} onMouseLeave={hoverOff}
            style={{ background: '#FFD166' }}>
            <Image
              src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&h=500&fit=crop&auto=format&q=80"
              alt="クリエイティブワークスペース"
              width={700} height={500}
              style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(10) }}
            />
          </div>
          <div className={`img-zoom anim-scale d5 ${isVisible(8) ? '' : 'opacity-0'}`}
            onMouseEnter={hoverOn} onMouseLeave={hoverOff}
            style={{ background: '#FFADB5' }}>
            <Image
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=500&fit=crop&auto=format&q=80"
              alt="デザインプロセス"
              width={700} height={500}
              style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgPx(10) }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
