import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const leave = () => { timer.current = setTimeout(() => setOpen(false), 140); };
  useLayoutEffect(() => {
    if (!open || !anchor.current || !popup.current) return;
    const button = anchor.current.getBoundingClientRect();
    const tip = popup.current.getBoundingClientRect();
    setPosition({
      left: Math.max(16, Math.min(button.right - tip.width, window.innerWidth - tip.width - 16)),
      top: button.top > tip.height + 12 ? button.top - tip.height - 8 : button.bottom + 8
    });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  return <span className="help-tip">
    <button ref={anchor} type="button" className="help-button" aria-label={`About ${label}`}
      aria-describedby={open ? id : undefined} aria-expanded={open} onClick={show}
      onPointerEnter={e => { if (e.pointerType === 'mouse') show(); }} onPointerLeave={leave}
      onFocus={show} onBlur={() => setOpen(false)} onKeyDown={e => {
        if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
      }}><Info size={16} aria-hidden="true" /></button>
    {open && anchor.current && createPortal(<span ref={popup} className="tip-content" role="tooltip" id={id}
      style={position} onPointerEnter={show} onPointerLeave={leave}>{children}</span>, anchor.current.closest('dialog') || document.body)}
  </span>;
}
