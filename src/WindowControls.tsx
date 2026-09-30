import { useEffect, useState } from 'react';
import { Copy, Maximize2, Minimize2, Minus, Square, X } from 'lucide-react';

export default function WindowControls({ compact, onWidget }: { compact: boolean; onWidget: () => void }) {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    let alive = true;
    const off = window.desktop?.onMaximized(setMaximized);
    void window.desktop?.isMaximized().then(value => { if (alive) setMaximized(value); });
    return () => { alive = false; off?.(); };
  }, []);
  return <div className="window-controls" aria-label="کنترل‌های پنجره">
      {window.desktop && <>
      <button className="window-close" aria-label="بستن پنجره" title="بستن پنجره و ادامه در سینی سیستم" onClick={() => void window.desktop?.windowControl('close')}><X size={17}/></button>
      <button aria-label={maximized ? 'بازگرداندن اندازهٔ پنجره' : 'بزرگ کردن پنجره'} title={maximized ? 'بازگرداندن اندازهٔ پنجره' : 'بزرگ کردن پنجره'} onClick={() => void window.desktop?.windowControl('maximize')}>{maximized ? <Copy size={14}/> : <Square size={14}/>}</button>
      <button aria-label="کوچک کردن پنجره" title="کوچک کردن پنجره" onClick={() => void window.desktop?.windowControl('minimize')}><Minus size={17}/></button>
      </>}
      <button className="widget-toggle" aria-label={compact ? 'نمای کامل' : 'ویجت کوچک'} title={compact ? 'نمای کامل' : 'ویجت کوچک'} onClick={onWidget}>{compact ? <Maximize2 size={17}/> : <Minimize2 size={17}/>}</button>
  </div>;
}
