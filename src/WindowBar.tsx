import { useEffect, useState } from 'react';
import { Copy, Minus, Square, Timer, X } from 'lucide-react';

export default function WindowBar() {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    let alive = true;
    const off = window.desktop?.onMaximized(setMaximized);
    void window.desktop?.isMaximized().then(value => { if (alive) setMaximized(value); });
    return () => { alive = false; off?.(); };
  }, []);
  if (!window.desktop) return null;
  return <div className="window-titlebar">
    <div className="window-brand"><Timer size={15}/><span>کارنگار</span></div>
    <div className="window-controls">
      <button className="window-close" aria-label="بستن پنجره" title="بستن پنجره و ادامه در سینی سیستم" onClick={() => void window.desktop?.windowControl('close')}><X size={17}/></button>
      <button aria-label={maximized ? 'بازگرداندن اندازهٔ پنجره' : 'بزرگ کردن پنجره'} title={maximized ? 'بازگرداندن اندازهٔ پنجره' : 'بزرگ کردن پنجره'} onClick={() => void window.desktop?.windowControl('maximize')}>{maximized ? <Copy size={14}/> : <Square size={14}/>}</button>
      <button aria-label="کوچک کردن پنجره" title="کوچک کردن پنجره" onClick={() => void window.desktop?.windowControl('minimize')}><Minus size={17}/></button>
    </div>
  </div>;
}
