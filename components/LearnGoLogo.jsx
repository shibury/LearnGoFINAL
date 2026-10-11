'use client'

import React from 'react'

// Ketiga file di bawah adalah ekspor vektor asli dari file desain di
// public/learngo. Semuanya SVG murni: tidak ada elemen <text> sehingga tampilan
// tidak bergantung font yang terpasang di perangkat, dan tidak ada raster
// tertanam sehingga tetap tajam di layar retina.
//
// Nama file mascot masih misspelled "laerngo" mengikuti nama berkas aslinya.
// URL ikut memakai ejaan itu supaya tidak perlu me-rename aset desain.
//
// Dipakai lewat <img> biasa, bukan next/image: next/image menolak SVG dari
// public/ kecuali dangerouslyAllowSVG diaktifkan di next.config.js, dan aset
// vektor tidak butuh optimasi gambar sama sekali.

export const BRAND_ASSETS = {
  goMark: '/images/learngo-go-mark.png',
  logo: '/images/logo-learngo.svg',
  wordmark: '/images/text-learngo.svg',
  mascot: '/images/mascot-laerngo.svg',
}

// Rasio dari viewBox masing-masing berkas, dipakai supaya <img> punya ukuran
// benar sejak render pertama dan halaman tidak melompat saat gambar selesai dimuat.
export const BRAND_RATIO = {
  goMark: 881 / 529,
  logo: 642 / 643,
  wordmark: 127 / 672,
  mascot: 603 / 560,
}

export function LearnGoWordmark({ className = '', markHeight = 16 }) {
  const markWidth = Math.round(markHeight * BRAND_RATIO.goMark)

  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <span className={className}>Learn</span>
      <img
        src={BRAND_ASSETS.goMark}
        alt="Go"
        width={markWidth}
        height={markHeight}
        style={{ width: markWidth, height: markHeight, display: 'block' }}
      />
    </span>
  )
}

// Logo mark tanpa wordmark. Dipakai di header, avatar, dan favicon.
export function LearnGoIcon({ size = 36 }) {
  return (
    <img
      src={BRAND_ASSETS.logo}
      alt="LearnGo"
      width={size}
      height={Math.round(size * BRAND_RATIO.logo)}
      style={{ width: size, height: Math.round(size * BRAND_RATIO.logo), display: 'block', flexShrink: 0 }}
    />
  )
}

// Logo mark + wordmark, disusun vertikal. Dipakai di layar onboarding.
export function LearnGoLogoFull({ size = 120 }) {
  const markSize = size
  const markHeight = Math.round(size * BRAND_RATIO.logo)
  const wordWidth = size
  const wordHeight = Math.round(size * BRAND_RATIO.wordmark)

  return (
    <div style={{ width: size, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <img
        src={BRAND_ASSETS.logo}
        alt="LearnGo"
        width={markSize}
        height={markHeight}
        style={{ width: markSize, height: markHeight, display: 'block' }}
      />
      <img
        src={BRAND_ASSETS.wordmark}
        alt="LearnGo"
        width={wordWidth}
        height={wordHeight}
        style={{ width: wordWidth, height: wordHeight, display: 'block' }}
      />
    </div>
  )
}

// Nama FoxFaceSVG dipertahankan karena HomeScreen mengimpornya.
export function FoxFaceSVG({ size = 80 }) {
  return <LearnGoIcon size={size} />
}