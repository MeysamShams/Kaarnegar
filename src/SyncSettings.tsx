import { useEffect, useState } from 'react';
import { Cloud, FolderOpen, RefreshCw, X } from 'lucide-react';
import type { State } from './model';
import type { SyncStatus } from './global';
import { t } from './i18n';

export default function SyncSettings({adopt}:{adopt:(s:State)=>void}) {
  const [status,setStatus]=useState<SyncStatus|null>(null), [busy,setBusy]=useState(false), [error,setError]=useState('');
  useEffect(()=>{const d=window.desktop;if(!d)return;void d.syncStatus().then(setStatus);const off=d.onSyncStatus(setStatus);return off},[]);
  if(!window.desktop)return null;
  async function run(action:()=>Promise<SyncStatus>){setBusy(true);setError('');try{setStatus(await action())}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  const when=status?.lastSync?new Date(status.lastSync).toLocaleString(t('en-US')):'';
  return <section className="card settings-card sync-card">
    <div className="section-heading"><div><h2>{t('Cloud sync')}</h2><p>{t('Share your work time between computers through Dropbox, Google Drive, or any synced folder.')}</p></div><Cloud size={22}/></div>
    {status?.enabled?<>
      <p className="settings-description" dir="ltr">{status.folder}</p>
      <p className="muted">{status.error?<span className="field-error" role="alert">{status.error}</span>:when?t('Last synced {0} · {1} other device(s)',when,status.devices):t('Not synced yet.')}</p>
      <div className="modal-actions"><button className="primary" disabled={busy} onClick={()=>void run(async()=>{const s=await window.desktop!.syncNow();return s})}><RefreshCw size={16}/>{t('Sync now')}</button><button className="outline" disabled={busy} onClick={()=>void run(()=>window.desktop!.syncChoose())}><FolderOpen size={16}/>{t('Change folder')}</button><button className="outline" disabled={busy} onClick={()=>void run(()=>window.desktop!.syncChoose(true))}><X size={16}/>{t('Turn off')}</button></div>
    </>:<>
      <p className="settings-description">{t('Choose a folder inside your Dropbox or Google Drive directory. Use the same folder on every computer.')}</p>
      <div className="modal-actions"><button className="primary" disabled={busy} onClick={()=>void run(()=>window.desktop!.syncChoose())}><FolderOpen size={16}/>{t('Choose sync folder')}</button></div>
    </>}
    {error&&<p className="field-error" role="alert">{error}</p>}
    <p className="muted workspace-footnote">{t('Organizations, projects, and time entries are merged across devices. A running timer stays on its own device. If two devices edit the same entry, the most recent sync wins.')}</p>
  </section>;
}
