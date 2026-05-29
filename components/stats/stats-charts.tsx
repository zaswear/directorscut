"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer,
} from "recharts";
import type { StatsData } from "@/app/(app)/stats/page";

// ─── Tooltip theme ────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   "var(--surface-hi)",
      border:       "1px solid var(--border-hi)",
      borderRadius: 6,
      padding:      "6px 12px",
    }}>
      {label && <p style={{ color: "var(--text-faint)", fontSize: 11, marginBottom: 2 }}>{label}</p>}
      <p style={{ color: "var(--accent)", fontFamily: "var(--font-space-mono)", fontWeight: 700, fontSize: 16 }}>
        {payload[0].value}
      </p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md px-6 py-5">
      <p className="font-mono text-[38px] leading-none font-bold" style={{ color: "var(--accent)" }}>
        {value ?? "—"}
      </p>
      <p className="text-[11px] uppercase tracking-widest text-text-faint mt-2">{label}</p>
      {sub && <p className="text-xs text-text-faint mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-[22px] italic text-text mb-4 pb-2 border-b border-[var(--border)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Common axis / grid props ─────────────────────────────────────────────────

const axisStyle = { fill: "var(--text-faint)", fontSize: 11, fontFamily: "var(--font-space-mono)" };
const gridStyle = { stroke: "var(--border)", strokeDasharray: "3 3" };

// ─── Main component ───────────────────────────────────────────────────────────

export function StatsCharts({ data }: { data: StatsData }) {
  // Evita SSR de Recharts (usa browser APIs)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { summary, byGenre, byMonth, byDirector, histogram, byYear } = data;

  return (
    <div className="space-y-12">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={summary.total}    label="Total en la base de datos" />
        <StatCard value={summary.watched}  label="Películas vistas" />
        <StatCard
          value={summary.avgMyRating ?? "—"}
          label="Mi puntuación media"
          sub={`sobre ${summary.totalWithRating} puntuadas`}
        />
        <StatCard
          value={summary.avgImdbRating ?? "—"}
          label="Puntuación media IMDb"
        />
      </div>

      {/* ── Por mes ── */}
      {mounted && byMonth.some((m) => m.count > 0) && (
        <Section title="Películas vistas por mes">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis
                dataKey="label"
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-hi)" }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Por año ── */}
      {mounted && byYear.length > 1 && (
        <Section title="Películas vistas por año">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byYear} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-hi)" }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Género + Directores ── */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Géneros */}
          {byGenre.length > 0 && (
            <Section title="Géneros más vistos">
              <ResponsiveContainer width="100%" height={Math.max(200, byGenre.length * 28)}>
                <BarChart
                  data={byGenre}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid horizontal={false} {...gridStyle} />
                  <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="genre"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-hi)" }} />
                  <Bar dataKey="count" fill="var(--accent)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          )}

          {/* Directores */}
          {byDirector.length > 0 && (
            <Section title="Top directores">
              <ResponsiveContainer width="100%" height={Math.max(200, byDirector.length * 28)}>
                <BarChart
                  data={byDirector}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid horizontal={false} {...gridStyle} />
                  <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="director"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-hi)" }} />
                  <Bar dataKey="count" fill="oklch(67% 0.12 155)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          )}
        </div>
      )}

      {/* ── Histograma de notas ── */}
      {mounted && summary.totalWithRating > 0 && (
        <Section title={`Distribución de mis notas (${summary.totalWithRating} puntuadas)`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogram} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis
                dataKey="label"
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-hi)" }} />
              <Bar
                dataKey="count"
                radius={[3, 3, 0, 0]}
                fill="var(--accent)"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-[10px] text-text-faint font-mono mt-1 px-1">
            <span>1 — Terrible</span>
            <span>5 — Regular</span>
            <span>10 — Obra maestra</span>
          </div>
        </Section>
      )}

      {/* Estado vacío */}
      {!mounted && (
        <div className="h-40 flex items-center justify-center text-text-faint text-sm">
          Cargando gráficos…
        </div>
      )}
    </div>
  );
}
