import { useState, type FormEvent } from 'react';
import { Building2, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { currencies, latin, money, type Currency, type Organization, type Project, type State } from './model';
import { t } from './i18n';

export function AssignmentFields({state,organizationId,projectId,onChange,disabled=false,filter=false}:{state:State;organizationId:string;projectId:string;onChange:(org:string,project:string)=>void;disabled?:boolean;filter?:boolean}) {
  return <div className="assignment-fields">
    <label className="form-label">{t(filter?'Organization':'Organization (required)')}<select aria-label={t(filter?'Filter organization':'Organization')} required={!filter} value={organizationId} disabled={disabled} onChange={e=>onChange(e.target.value,'')}>
      <option value="">{t(filter?'All organizations':'Select an organization')}</option>{state.organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
    </select></label>
    <label className="form-label">{t(filter?'Project':'Project (optional)')}<select aria-label={t(filter?'Filter project':'Project')} value={projectId} disabled={disabled||(!filter&&!organizationId)} onChange={e=>{const p=state.projects.find(p=>p.id===e.target.value);onChange(organizationId||p?.organizationId||'',e.target.value)}}>
      <option value="">{t(filter?'All projects':'No project')}</option>{state.projects.filter(p=>!organizationId||p.organizationId===organizationId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select></label>
  </div>;
}

export default function WorkspaceSettings({state,busy,commit}:{state:State;busy:boolean;commit:(s:State,message?:string)=>Promise<boolean>}) {
  const [selected,setSelected]=useState(''), [orgForm,setOrgForm]=useState<{id?:string;name:string;rate:string;currency:Currency}|null>(null), [projectForm,setProjectForm]=useState<{id?:string;name:string;rate:string}|null>(null), [error,setError]=useState('');
  const org=state.organizations.find(o=>o.id===selected)??state.organizations[0];
  const used=(id:string,project=false)=>state.entries.some(e=>(project?e.projectId:e.organizationId)===id)||(project?state.active?.projectId:state.active?.organizationId)===id;
  function editOrg(o?:Organization){setProjectForm(null);setError('');setOrgForm(o?{...o,rate:String(o.rate)}:{name:'',rate:String(state.rate),currency:'IRT'})}
  function editProject(p?:Project){setOrgForm(null);setError('');setProjectForm(p?{...p,rate:p.rate===null?'':String(p.rate)}:{name:'',rate:''})}
  async function saveOrg(e:FormEvent){e.preventDefault();if(!orgForm)return;const rate=Number(latin(orgForm.rate));if(!orgForm.name.trim()||!orgForm.rate.trim()||!Number.isFinite(rate)||rate<0||rate>1e12){setError(t('Enter a name and a valid hourly rate.'));return}
    const id=orgForm.id??crypto.randomUUID(), item:Organization={id,name:orgForm.name.trim(),rate,currency:orgForm.currency};
    if(await commit({...state,organizations:orgForm.id?state.organizations.map(o=>o.id===id?item:o):[...state.organizations,item]},t('Organization saved.'))){setOrgForm(null);setSelected(id)}
  }
  async function saveProject(e:FormEvent){e.preventDefault();if(!projectForm||!org)return;const rate=projectForm.rate.trim()?Number(latin(projectForm.rate)):null;if(!projectForm.name.trim()||(rate!==null&&(!Number.isFinite(rate)||rate<0||rate>1e12))){setError(t('Enter a name and a valid hourly rate.'));return}
    const id=projectForm.id??crypto.randomUUID(), item:Project={id,name:projectForm.name.trim(),rate,organizationId:org.id};
    if(await commit({...state,projects:projectForm.id?state.projects.map(p=>p.id===id?item:p):[...state.projects,item]},t('Project saved.')))setProjectForm(null);
  }
  return <section className="card settings-card workspace-settings">
    <div className="section-heading"><div><h2>{t('Organizations & projects')}</h2><p>{t('Organize your work and set rates for each client.')}</p></div><Building2 size={22}/></div>
    <div className="workspace-columns"><div><div className="workspace-list-heading"><h3>{t('Organizations')}</h3><button className="outline small" disabled={busy} onClick={()=>editOrg()}><Plus size={15}/>{t('Add organization')}</button></div>
      {!state.organizations.length&&<p className="muted">{t('Create an organization before tracking your first task.')}</p>}
      {state.organizations.map(o=><div className={`workspace-item ${org?.id===o.id?'selected':''}`} key={o.id}><button className="workspace-select" onClick={()=>{setSelected(o.id);setProjectForm(null);setError('')}}><strong>{o.name}</strong><small>{money(o.rate,o.currency)} / {t('hour')}</small></button><button className="icon-button" aria-label={t('Edit organization {0}',o.name)} disabled={busy} onClick={()=>editOrg(o)}><Pencil size={15}/></button><button className="icon-button delete" aria-label={t('Delete organization {0}',o.name)} title={t('Used organizations cannot be deleted.')} disabled={busy||used(o.id)||state.projects.some(p=>p.organizationId===o.id)} onClick={()=>void commit({...state,organizations:state.organizations.filter(x=>x.id!==o.id)},t('Organization deleted.'))}><Trash2 size={15}/></button></div>)}
    </div><div><div className="workspace-list-heading"><h3>{org?t('Projects in {0}',org.name):t('Projects')}</h3><button className="outline small" disabled={busy||!org} onClick={()=>editProject()}><Plus size={15}/>{t('Add project')}</button></div>
      {state.projects.filter(p=>p.organizationId===org?.id).map(p=><div className="workspace-item" key={p.id}><div className="workspace-select"><strong>{p.name}</strong><small>{p.rate===null?t('Uses organization rate'):money(p.rate,org!.currency)+' / '+t('hour')}</small></div><button className="icon-button" aria-label={t('Edit project {0}',p.name)} disabled={busy} onClick={()=>editProject(p)}><Pencil size={15}/></button><button className="icon-button delete" aria-label={t('Delete project {0}',p.name)} title={t('Used projects cannot be deleted.')} disabled={busy||used(p.id,true)} onClick={()=>void commit({...state,projects:state.projects.filter(x=>x.id!==p.id)},t('Project deleted.'))}><Trash2 size={15}/></button></div>)}
      {org&&!state.projects.some(p=>p.organizationId===org.id)&&<p className="muted">{t('Projects are optional. Add one to track work separately.')}</p>}
    </div></div>
    {orgForm&&<form className="workspace-form" onSubmit={saveOrg}><h3>{t(orgForm.id?'Edit organization':'New organization')}</h3><label className="form-label">{t('Organization name')}<input aria-label={t('Organization name')} autoFocus required maxLength={200} value={orgForm.name} onChange={e=>setOrgForm({...orgForm,name:e.target.value})}/></label><div className="assignment-fields"><label className="form-label">{t('Hourly rate')}<input aria-label={t('Organization hourly rate')} required inputMode="decimal" value={orgForm.rate} onChange={e=>setOrgForm({...orgForm,rate:e.target.value})}/></label><label className="form-label">{t('Currency')}<select aria-label={t('Organization currency')} value={orgForm.currency} onChange={e=>setOrgForm({...orgForm,currency:e.target.value as Currency})}>{currencies.map(c=><option key={c} value={c}>{t(c)}</option>)}</select></label></div><div className="modal-actions"><button className="primary" disabled={busy}><Check size={16}/>{t('Save organization')}</button><button type="button" className="outline" onClick={()=>setOrgForm(null)}><X size={16}/>{t('Cancel')}</button></div></form>}
    {projectForm&&<form className="workspace-form" onSubmit={saveProject}><h3>{t(projectForm.id?'Edit project':'New project')} · {org?.name}</h3><label className="form-label">{t('Project name')}<input aria-label={t('Project name')} autoFocus required maxLength={200} value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})}/></label><label className="form-label">{t('Project hourly rate')} ({org?.currency})<input aria-label={t('Project hourly rate')} inputMode="decimal" placeholder={t('Leave blank to use the organization rate')} value={projectForm.rate} onChange={e=>setProjectForm({...projectForm,rate:e.target.value})}/></label><div className="modal-actions"><button className="primary" disabled={busy}><Check size={16}/>{t('Save project')}</button><button type="button" className="outline" onClick={()=>setProjectForm(null)}>{t('Cancel')}</button></div></form>}
    {error&&<p className="field-error" role="alert">{error}</p>}
    <p className="muted workspace-footnote">{t('Rate and currency changes apply to future work. Existing entries keep their recorded values. Delete unused projects before deleting an organization.')}</p>
  </section>;
}
