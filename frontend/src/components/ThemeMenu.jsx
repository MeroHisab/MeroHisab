import React, { useEffect, useRef, useState } from 'react';
import { Palette, Sun, Moon, Monitor, Check, RotateCcw } from 'lucide-react';
import { ACCENTS, useTheme } from '../context/ThemeContext';

const MODES = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'Auto', Icon: Monitor },
];

export default function ThemeMenu() {
  const { mode, accent, setMode, setAccent, reset } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div className="theme-menu" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Appearance" aria-expanded={open} title="Appearance">
        <Palette size={18} />
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Appearance">
          <div className="popover-title">Appearance</div>
          <div className="segmented">
            {MODES.map(({ key, label, Icon }) => (
              <button key={key} className={mode === key ? 'on' : ''} onClick={() => setMode(key)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="popover-title" style={{ marginTop: 16 }}>Accent color</div>
          <div className="swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.value} className="swatch" style={{ background: a.value }}
                onClick={() => setAccent(a.value)} title={a.name} aria-label={a.name}
              >
                {accent.toLowerCase() === a.value.toLowerCase() && <Check size={14} color="#fff" />}
              </button>
            ))}
            <label className="swatch custom" title="Custom color">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
              <span style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
            </label>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={reset}><RotateCcw size={13} /> Reset</button>
        </div>
      )}
    </div>
  );
}
