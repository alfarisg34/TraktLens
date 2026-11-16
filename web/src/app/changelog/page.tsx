'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Tag, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  Code2, 
  Bug, 
  Palette, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';

export default function ChangelogPage() {
  const [activeTab, setActiveTab] = useState<'releases' | 'rules'>('releases');

  return (
    <div className="min-h-screen bg-[#090c13] text-[#f0f3f8] antialiased">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1b2234] bg-[#0c101a]/95 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#8e9cae] hover:text-white transition py-1 px-2.5 rounded-lg hover:bg-[#141a27] border border-transparent hover:border-[#232d42]"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#ed1c24]" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#768496] font-medium hidden sm:inline">Versi Sistem Aktif:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ed1c24]/10 text-[#ed1c24] border border-[#ed1c24]/30 shadow-sm shadow-[#ed1c24]/20">
              <Tag className="w-3 h-3" />
              <span>v0.1.0</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-8">
        {/* Title Area */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#161c2b] border border-[#232d42] text-[10px] font-bold text-[#8e9cae] tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-[#ed1c24]" />
            <span>Catatan Pembaruan Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Release Notes & Log Versi
          </h1>
          <p className="text-xs sm:text-sm text-[#7e8d9f] max-w-2xl leading-relaxed">
            Dokumentasi resmi seluruh pembaruan fitur, peningkatan antarmuka, perbaikan bug, dan tata kelola versi pada ekosistem TraktLens.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-[#1b2234] pb-4">
          <button
            onClick={() => setActiveTab('releases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'releases'
                ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                : 'bg-[#121622] text-[#8e9cae] hover:text-white border border-[#1d2537]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rilis Versi Resmi</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                : 'bg-[#121622] text-[#8e9cae] hover:text-white border border-[#1d2537]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Aturan Versi (X.Y.Z)</span>
          </button>
        </div>

        {/* Tab Content: Rilis Versi Resmi */}
        {activeTab === 'releases' && (
          <div className="space-y-8">
            {/* Version Block v0.1.0 */}
            <article className="bg-[#121622] border border-[#1d2537] rounded-xl p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2234] pb-5">
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl font-black text-white px-3 py-1 rounded-lg bg-[#ed1c24] shadow-md shadow-[#ed1c24]/30">
                    v0.1.0
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">Version 0.1.0 (Initial Beta Release)</h2>
                    <div className="flex items-center gap-2 text-xs text-[#7e8d9f] mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5e6d80]" />
                      <span>2026-11-16</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    BETA / INITIAL
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  Inisialisasi TraktLens: Ekstensi Manifest V3, Web Dashboard Dark Mode Trakt, dan Filter Tahun Dinamis
                </h3>
              </div>

              {/* Items List */}
              <div className="space-y-5">
                {/* FEAT */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Code2 className="w-3 h-3" />
                      <span>FEAT</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Ekstensi Chrome Manifest V3 (TraktLens Sync)</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Mengekstrak riwayat tontonan langsung dari sesi aktif pengguna di <code>app.trakt.tv</code> via token OIDC di <code>localStorage</code>. Menangkap data yang tersembunyi dari kartu UI Trakt yaitu <b>jam tonton presisi (ISO timestamp)</b> dan <b>durasi tontonan (menit)</b>, lalu mengirimkannya via <code>POST /api/sync</code> dengan visual progress bar.
                  </p>
                </div>

                {/* FEAT */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Code2 className="w-3 h-3" />
                      <span>FEAT</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Arsitektur Dual-Storage (Neon PostgreSQL & Local Fallback)</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Otomatis beralih ke <b>Neon Serverless PostgreSQL</b> saat <code>DATABASE_URL</code> diset, atau tetap berjalan secara instan di mode lokal offline menggunakan <code>.data/history.json</code> tanpa perlu menginstall software database tambahan.
                  </p>
                </div>

                {/* FEAT */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Code2 className="w-3 h-3" />
                      <span>FEAT</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Filter Tahun Dinamis dari Riwayat Nyata</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Menggantikan filter statis dengan deteksi dinamis tahun yang ada di database. Otomatis menampilkan tombol preset per tahun (misal: <b>Tahun 2026, 2025, 2024, 2023, 2022</b>) berdasarkan 3.001 item riwayat yang tersimpan.
                  </p>
                </div>

                {/* UI */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <Palette className="w-3 h-3" />
                      <span>UI</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Desain Antarmuka & Kartu Trakt-Style</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Mengusung warna otentik Trakt.tv (Dark `#090c13`, kartu `#121622`, aksen merah `#ed1c24`), kartu 16:9 dengan floating frosted-glass tags untuk jam tonton lokal (WIB) dan durasi tontonan, serta kartu metrik ringkasan durasi total.
                  </p>
                </div>

                {/* DOCS */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <BookOpen className="w-3 h-3" />
                      <span>DOCS</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Penerbitan Suite Dokumentasi Teknis Lengkap</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Menyusun <code>PRD.md</code>, <code>DESIGN.md</code>, <code>ARCHITECTURE.md</code>, <code>TECH_STACK.md</code>, <code>SCHEMA.md</code>, <code>DATABASE.md</code>, <code>AGENTS.md</code>, dan <code>CHANGELOG.md</code> untuk standar kolaborasi dan pemeliharaan jangka panjang.
                  </p>
                </div>

                {/* TEST */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>TEST</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">Verifikasi Sinkronisasi Nyata & Build Next.js</h4>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed pl-7">
                    Berhasil memverifikasi sinkronisasi 3.001 item data nyata akun Trakt <code>@alfarisg34</code>, pengujian kompilasi <code>next build</code> lolos 100% tanpa galat TypeScript.
                  </p>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Tab Content: Aturan Versi */}
        {activeTab === 'rules' && (
          <div className="space-y-8">
            <section className="bg-[#121622] border border-[#1d2537] rounded-xl p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40">
              <div className="border-b border-[#1b2234] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Prinsip Semantic Versioning (vX.Y.Z)
                </h2>
                <p className="text-xs text-[#7e8d9f] mt-1">
                  TraktLens menerapkan aturan penomoran SemVer ketat untuk memastikan kejelasan setiap rilis kode:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0c101a] border border-[#1f2739] p-5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[#ed1c24]">MAJOR (X)</span>
                    <span className="text-[10px] font-semibold bg-[#ed1c24]/10 text-[#ed1c24] px-2 py-0.5 rounded">
                      x.0.0
                    </span>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed">
                    Dinaikkan saat terjadi perubahan besar arsitektur, modifikasi skema destruktif, atau *breaking changes* pada API.
                  </p>
                  <p className="text-[11px] text-[#5e6d80] italic">
                    *Saat ini versi 0 (v0.x.x) karena masih dalam tahap pengembangan awal/beta.
                  </p>
                </div>

                <div className="bg-[#0c101a] border border-[#1f2739] p-5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-400">MINOR (Y)</span>
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                      0.y.0
                    </span>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed">
                    Dinaikkan saat menambahkan fitur fungsional baru yang bersifat <i>backwards-compatible</i> (misal: filter tahun dinamis, grafik charting baru).
                  </p>
                </div>

                <div className="bg-[#0c101a] border border-[#1f2739] p-5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-400">PATCH (Z)</span>
                    <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                      0.0.z
                    </span>
                  </div>
                  <p className="text-xs text-[#8e9cae] leading-relaxed">
                    Dinaikkan untuk perbaikan bug (*bugfix*), perbaikan visual styling, optimasi kecil, dan perbaikan dokumentasi.
                  </p>
                </div>
              </div>

              {/* Tag Categories Table */}
              <div className="space-y-3 pt-4 border-t border-[#1b2234]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Standar Label Perubahan</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">FEAT</span>
                    <span className="text-xs text-[#8e9cae]">Fitur / Kapabilitas Baru</span>
                  </div>
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">FIX</span>
                    <span className="text-xs text-[#8e9cae]">Perbaikan Bug / Defek</span>
                  </div>
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">UI</span>
                    <span className="text-xs text-[#8e9cae]">Peningkatan Antarmuka</span>
                  </div>
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">DOCS</span>
                    <span className="text-xs text-[#8e9cae]">Dokumentasi Teknis</span>
                  </div>
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">PERF</span>
                    <span className="text-xs text-[#8e9cae]">Optimasi Performa</span>
                  </div>
                  <div className="bg-[#0c101a] border border-[#1c2436] p-3 rounded-lg flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">TEST</span>
                    <span className="text-xs text-[#8e9cae]">Verifikasi & Pengujian</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#171d2b] py-8 text-center text-xs text-[#5e6d80]">
        <p className="font-medium text-[#768496]">
          <span className="text-white font-semibold">Trakt</span>
          <span className="text-[#ed1c24] font-semibold">Lens</span> • Catatan Rilis & Log Sistem
        </p>
        <p className="mt-1">Ditenagai oleh Next.js, Vercel & Neon Database</p>
      </footer>
    </div>
  );
}
