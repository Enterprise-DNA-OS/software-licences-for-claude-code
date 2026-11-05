#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const commands = {
 help:'List commands', applications:'Products and reviewed licence rules', consumers:'Devices and named users',
 position:'Reconcile evidenced rights against recorded demand', attention:'Prioritised exceptions', compliance:'Evidence checks with source rules',
 renewals:'Expired rights and upcoming renewals', reclaim:'Unused and retired assignments for review', inventory:'Recorded installations and assignments',
 entitlements:'Purchased rights and dates', evidence:'Purchase proof and review gaps', departments:'Demand by department', history:'Recorded actions',
 application:'One product, its position and source terms',
 'add-application':'Register a product for review', 'add-consumer':'Register a device or user', 'set-rule':'Record reviewed device or user terms',
 'add-entitlement':'Record a purchase', 'verify-entitlement':'Record checked purchase evidence', assign:'Record an installation or named-user assignment',
 release:'Record a confirmed removal or unassignment', 'set-consumer':'Record retired or active status without releasing licences',
 log:'Record a note', import:'Import Snow report CSVs atomically', export:'Export every business record',
 'weekly-review':'Draft the weekly licence review', 'draft-renewal':'Draft a renewal evidence request', insights:'Answer ten licence desk questions'
};
const tables = ['applications','consumers','entitlements','deployments','events','import_batches','import_rows','policy'];
const today=()=>new Date().toISOString().slice(0,10);
const nonblank=(s,label)=>{if(typeof s!=='string'||!s.trim())throw Error(`${label} is required`);return s.trim();};
const integer=(v,label)=>{if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<1)throw Error(`${label} must be a positive integer`);return Number(v);};
export function date(v,label='date',optional=false){
 if(!v&&optional)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${label} must be a real YYYY-MM-DD date`);
 return v;
}
const choice=(v,values,label)=>{if(!values.includes(v))throw Error(`${label} must be ${values.join('|')}`);return v;};
const notFuture=(d)=>{if(d&&d>today())throw Error('Observed and usage dates cannot be in the future');return d;};
const opts={
 'add-application':['name','publisher'], 'add-consumer':['name','kind','department','seen'],
 'set-rule':['metric','source'], 'add-entitlement':['reference','metric','quantity','start','end','evidence'],
 'verify-entitlement':['evidence','metric'],assign:['consumer','observed','used'],release:['evidence'],
 'set-consumer':['state','seen'],log:['note'],import:['deployments','licenses','dry-run'],export:['out'],
};
function parse(argv){const flags={},pos=[];for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in flags)throw Error(`Duplicate flag --${k}`);flags[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {command:pos.shift()||'help',pos,flags};}
export async function resolve(db,tableName,query){
 const label=tableName==='entitlements'?'reference':'name';if(!['applications','consumers','entitlements','deployments'].includes(tableName))throw Error('Unknown record type');
 nonblank(query,'record name or ID');
 const name=tableName==='deployments'?"a.name||' / '||c.name":label;
 const from=tableName==='deployments'?'deployments t join applications a on a.id=t.application_id join consumers c on c.id=t.consumer_id':`${tableName} t`;
 const records=await db.query(`select t.*,${name} as match_name from ${from} order by ${name}`);
 const exact=records.filter(r=>r.id===query||r.match_name.toLowerCase()===query.toLowerCase());
 const found=exact.length?exact:records.filter(r=>r.id.startsWith(query.toLowerCase())||r.match_name.toLowerCase().includes(query.toLowerCase()));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No matching'} ${tableName}: ${query}\n${(found.length?found:records).map(r=>`${r.id}  ${r.match_name}`).join('\n')}`);
 return found[0];
}
async function event(db,app,actor,action,detail){await db.query('insert into events(application_id,actor,action,detail) values($1,$2,$3,$4)',[app,actor,action,JSON.stringify(detail)]);}
async function atomic(db,fn,dry=false){await db.exec('BEGIN');try{const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
const outDir=()=>path.resolve(process.env.OUTPUT_DIR||REPO_ROOT);
function draft(name,body){const dir=path.join(outDir(),'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`${today()}-${name}-${randomUUID().slice(0,8)}.md`);fs.writeFileSync(file,body,{mode:0o600});return [{draft:file}];}
const csv=(rows)=>{if(!rows.length)return '';const headers=Object.keys(rows[0]);const cell=v=>'"'+String(v==null?'':typeof v==='object'?JSON.stringify(v):v).replaceAll('"','""')+'"';return [headers,...rows.map(r=>headers.map(h=>r[h]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';};
const views={position:'v_position',attention:'v_attention',renewals:'v_renewals',reclaim:'v_reclaim',evidence:'v_evidence',departments:'v_departments'};
const rules={
 'LIC-01':{source:'https://www.microsoft.com/licensing/terms/product/ForallSoftware/all',rule:'Recorded use needs matching rights; local evidence check, product terms decide legal rights'},
 'LIC-02':{source:'https://docs.flexera.com/snow-license-manager-ui/applications/application-detail-view',rule:'Expired, incomplete and different-metric rights cannot be treated as coverage here'},
 'DATA-01':{source:'docs/compliance.md#internal-policies',rule:'Refresh evidence older than the configured inventory policy; this is an internal control'},
 'REVIEW-01':{source:'docs/compliance.md#supported-metrics',rule:'Unsupported metrics remain unassessed; specialist review required'}
};
export const questions=[
 ['Which products have more assignments than evidenced rights?','select name,required,evidenced,balance from v_position where balance<0 order by name'],
 ['Which purchases have missing or unchecked proof?','select name,reference,quantity,finding from v_evidence where finding!=\'Evidence recorded\' order by name,reference'],
 ['Which rights expire in the renewal window?','select name,reference,quantity,days_left,proof from v_renewals order by days_left,reference'],
 ['Which retired users or devices still consume a recorded assignment?',"select name,consumer,kind,reason from v_reclaim where consumer_state='retired' order by name,consumer"],
 ['Which assignments have no recorded use date?',"select name,consumer,reason from v_reclaim where last_used is null order by name,consumer"],
 ['Which products cannot yet be assessed?',"select name,metric,required,assessment from v_position where assessment='UNASSESSED' order by name"],
 ['Where is demand concentrated by department?', 'select * from v_departments order by name,department,kind'],
 ['Which apparently covered products have stale evidence?',"select name,evidenced,required,stale,assessment from v_position where stale>0 and balance>=0 order by name"],
 ['Which renewals also have a current shortfall?', 'select r.name,r.reference,r.days_left,p.balance from v_renewals r join v_position p on p.name=r.name where p.balance<0 order by r.days_left'],
 ['Who last recorded a decision and what was the evidence?', 'select a.name,e.actor,e.action,e.detail,e.created_at from events e left join applications a on a.id=e.application_id order by e.created_at desc,e.id limit 10']
];
async function importSnow(db,f,actor){
 if(!f.deployments&&!f.licenses)throw Error('Supply --deployments=<CSV> and/or --licenses=<CSV>');
 const results=[];
 for(const [kind,file] of [['deployments',f.deployments],['licenses',f.licenses]]){
  if(!file)continue;const raw=fs.readFileSync(nonblank(file,'CSV path'),'utf8');const rows=parseCsv(raw);if(!rows.length)throw Error(`${kind}: CSV has no data rows`);
  const digest=createHash('sha256').update(kind+'\0'+raw).digest('hex');
  if((await db.query('select id from import_batches where digest=$1',[digest])).length){results.push({kind,rows:rows.length,result:'already imported'});continue;}
  const [batch]=await db.query('insert into import_batches(digest,source,actor,row_count) values($1,$2,$3,$4) returning id',[digest,`Snow License Manager ${kind}`,actor,rows.length]);
  for(const [index,row] of rows.entries()){
   try{
    const name=nonblank(pick(row,'Application','Application name','ApplicationName'),'Application');
    const publisher=nonblank(pick(row,'Application manufacturer','Manufacturer','ManufacturerName'),'Application manufacturer');
    let [app]=await db.query('select * from applications where lower(name)=lower($1)',[name]);
    if(!app)[app]=await db.query('insert into applications(name,publisher) values($1,$2) returning *',[name,publisher]);
    if(app.publisher.toLowerCase()!==publisher.toLowerCase())throw Error('Publisher differs from existing product; reconcile the name first');
    if(kind==='deployments'){
     const computer=nonblank(pick(row,'Computer name','ComputerName'),'Computer name');
     const observed=notFuture(date(pick(row,'Last scanned','LastScanned'),'Last scanned'));
     const used=notFuture(date(pick(row,'Last used','LastUsed'),'Last used',true));if(used&&used>observed)throw Error('Last used is later than Last scanned');
     const department=pick(row,'Organisation','Organization')||'Unassigned';
     let [consumer]=await db.query("select * from consumers where kind='device' and lower(name)=lower($1)",[computer]);
     if(!consumer)[consumer]=await db.query("insert into consumers(name,kind,department,last_seen) values($1,'device',$2,$3) returning *",[computer,department,observed]);
     else await db.query('update consumers set last_seen=greatest(last_seen,$2::date) where id=$1',[consumer.id,observed]);
     const [existing]=await db.query('select * from deployments where application_id=$1 and consumer_id=$2',[app.id,consumer.id]);
     if(existing && (existing.observed_on>observed || (existing.released_on&&existing.released_on>=observed)))throw Error('Older or pre-release inventory cannot overwrite this assignment');
     await db.query(`insert into deployments(application_id,consumer_id,observed_on,last_used) values($1,$2,$3,$4)
      on conflict(application_id,consumer_id) do update set observed_on=excluded.observed_on,last_used=excluded.last_used,state='active',release_evidence=null,released_by=null,released_on=null`,[app.id,consumer.id,observed,used]);
    }else{
     const reference=nonblank(pick(row,'License ID','LicenseId','Id'),'License ID');
     const quantity=integer(pick(row,'Quantity'),'Quantity');
     const start=date(pick(row,'Purchase date','PurchaseDate'),'Purchase date');
     const end=date(pick(row,'Subscription expiration date','Expiry date','End date'),'End date',true);if(end&&end<start)throw Error('End date precedes purchase date');
     // Import preserves raw metric but cannot certify a contract interpretation.
     const [existing]=await db.query('select * from entitlements where reference=$1',['snow:'+reference]);
     if(existing)throw Error('Changed licence export needs manual reconciliation for reference snow:'+reference);
     await db.query("insert into entitlements(reference,application_id,metric,quantity,starts_on,ends_on) values($1,$2,'review',$3,$4,$5)",['snow:'+reference,app.id,quantity,start,end]);
    }
    await db.query('insert into import_rows(batch_id,row_number,raw) values($1,$2,$3)',[batch.id,index+2,JSON.stringify(row)]);
   }catch(e){throw Error(`${kind} CSV row ${index+2}: ${e.message}`);}
  }
  await event(db,null,actor,'import',{kind,digest,rows:rows.length});results.push({kind,rows:rows.length,result:f['dry-run']?'validated, rolled back':'imported'});
 }
 return results;
}
export async function run(db,argv){
 const {command:c,pos,flags:f}=parse(argv);if(!(c in commands))throw Error(`Unknown command ${c}. Use help.`);
 const allowed=new Set(['json','by',...(opts[c]||[])]);for(const key of Object.keys(f))if(!allowed.has(key))throw Error(`Unknown flag --${key} for ${c}`);
 if(c==='help')return Object.entries(commands).map(([command,description])=>({command,description}));
 if(c in views)return db.query(`select * from ${views[c]} order by ${c==='attention'?'priority,name,issue,detail':c==='departments'?'name,department,kind':c==='renewals'?'days_left,reference':c==='reclaim'?'name,consumer':c==='evidence'?'name,reference':'name'}`);
 if(c==='applications')return db.query('select * from applications order by name');
 if(c==='consumers')return db.query('select * from consumers order by name,kind');
 if(c==='inventory')return db.query('select d.id,a.name,c.name as consumer,c.kind,c.department,d.state,d.observed_on,d.last_used from deployments d join applications a on a.id=d.application_id join consumers c on c.id=d.consumer_id order by a.name,c.name');
 if(c==='entitlements')return db.query('select e.*,a.name from entitlements e join applications a on a.id=e.application_id order by e.reference');
 if(c==='history')return db.query('select * from events order by created_at desc,id');
 if(c==='application'){const a=await resolve(db,'applications',pos[0]);return db.query('select p.*,a.terms_source,a.reviewed_by,a.reviewed_on,a.notes from v_position p join applications a on a.id=p.id where p.id=$1',[a.id]);}
 if(c==='compliance'){
  const issues=await db.query("select name,assessment,stale,balance from v_position order by name");const output=[];
  for(const r of issues){if(r.assessment==='NO INVENTORY')output.push({name:r.name,code:'DATA-01',finding:'No inventory evidence recorded',...rules['DATA-01']});if(r.assessment==='UNASSESSED')output.push({name:r.name,code:'REVIEW-01',finding:'Metric or consumer type needs review',...rules['REVIEW-01']});if(r.balance<0)output.push({name:r.name,code:'LIC-01',finding:`Recorded rights shortfall ${-r.balance}`,...rules['LIC-01']});if(r.stale>0)output.push({name:r.name,code:'DATA-01',finding:`${r.stale} stale assignments`,...rules['DATA-01']});}
  for(const r of await db.query("select * from v_evidence where finding!='Evidence recorded'"))output.push({name:r.name,code:'LIC-02',finding:r.reference+': '+r.finding,...rules['LIC-02']});
  for(const r of await db.query('select * from v_renewals where days_left<0'))output.push({name:r.name,code:'LIC-02',finding:r.reference+': expired rights excluded',...rules['LIC-02']});
  return output;
 }
 if(c==='insights'){const out=[];for(const [question,sql] of questions)out.push({question,answer:await db.query(sql)});return out;}
 if(c==='weekly-review'){
  const parts=await Promise.all(['attention','position','renewals'].map(x=>run(db,[x])));
  return draft('weekly-review',`# Weekly licence review\n\nDraft from recorded data, ${today()}. Verify source terms before a licensing decision.\n\n`+parts.map((rows,i)=>`## ${['Attention','Position','Renewals'][i]}\n\n${format(rows)}\n`).join('\n'));
 }
 if(c==='draft-renewal'){
  const a=await resolve(db,'applications',pos[0]);const rows=await db.query('select reference,quantity,ends_on from entitlements where application_id=$1 order by ends_on nulls last',[a.id]);
  return draft('renewal',`# Renewal evidence request: ${a.name}\n\nDraft, not sent.\n\nPlease confirm the renewal terms and licence evidence for these records before any order is placed.\n\n${format(rows)}\n\nNo purchase or cancellation has been authorised.\n`);
 }
 if(c==='export'){
  const dir=path.resolve(nonblank(f.out,'--out'));fs.mkdirSync(dir,{recursive:true,mode:0o700});const result=[];
  await db.exec('BEGIN READ ONLY');try{const all={};for(const t of tables){const rows=await db.query(`select * from ${t} order by id`);all[t]=rows;fs.writeFileSync(path.join(dir,t+'.csv'),csv(rows),{mode:0o600});result.push({table:t,rows:rows.length});}fs.writeFileSync(path.join(dir,'archive.json'),JSON.stringify(all,null,2)+'\n',{mode:0o600});}finally{await db.exec('ROLLBACK');}return result;
 }
 const actor=nonblank(f.by,'--by');
 return atomic(db,async()=>{
  let result,appId=null;
  if(c==='import'){if(pos[0]!=='snow-license-manager')throw Error('Import supports snow-license-manager');return importSnow(db,f,actor);}
  if(c==='add-application')result=await db.query('insert into applications(name,publisher) values($1,$2) returning *',[nonblank(f.name,'--name'),nonblank(f.publisher,'--publisher')]);
  else if(c==='add-consumer')result=await db.query('insert into consumers(name,kind,department,last_seen) values($1,$2,$3,$4) returning *',[nonblank(f.name,'--name'),choice(f.kind,['device','user'],'--kind'),f.department||'Unassigned',notFuture(date(f.seen,'--seen',true))]);
  else if(c==='set-consumer') {const row=await resolve(db,'consumers',pos[0]);result=await db.query('update consumers set state=$2,last_seen=coalesce($3::date,last_seen) where id=$1 returning *',[row.id,choice(f.state,['active','retired'],'--state'),notFuture(date(f.seen,'--seen',true))]);}
  else if(c==='release'){const row=await resolve(db,'deployments',pos[0]);appId=row.application_id;if(row.state==='released')throw Error('Assignment already released');result=await db.query("update deployments set state='released',release_evidence=$2,released_by=$3,released_on=current_date where id=$1 returning *",[row.id,nonblank(f.evidence,'--evidence'),actor]);}
  else if(c==='verify-entitlement'){const row=await resolve(db,'entitlements',pos[0]);appId=row.application_id;const metric=choice(f.metric||row.metric,['device','user'],'--metric');result=await db.query('update entitlements set evidence_ref=$2,verified_by=$3,metric=$4 where id=$1 returning *',[row.id,nonblank(f.evidence,'--evidence'),actor,metric]);}
  else {
   const app=await resolve(db,'applications',pos[0]);appId=app.id;
   if(c==='set-rule')result=await db.query('update applications set metric=$2,terms_source=$3,reviewed_by=$4,reviewed_on=current_date where id=$1 returning *',[app.id,choice(f.metric,['device','user','review'],'--metric'),nonblank(f.source,'--source'),actor]);
   else if(c==='add-entitlement'){
    const start=date(f.start,'--start'),end=date(f.end,'--end',true);if(end&&end<start)throw Error('End date precedes start date');
    result=await db.query('insert into entitlements(reference,application_id,metric,quantity,starts_on,ends_on,evidence_ref,verified_by) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',[nonblank(f.reference,'--reference'),app.id,choice(f.metric,['device','user','review'],'--metric'),integer(f.quantity,'--quantity'),start,end,f.evidence?nonblank(f.evidence,'--evidence'):null,f.evidence?actor:null]);
   } else if(c==='assign'){
    const consumer=await resolve(db,'consumers',f.consumer),observed=notFuture(date(f.observed,'--observed')),used=notFuture(date(f.used,'--used',true));
    if(used&&used>observed)throw Error('Usage date is later than observation');
    if(app.metric!=='review'&&consumer.kind!==app.metric)throw Error('Consumer kind does not match the reviewed licence metric');
    const [old]=await db.query('select * from deployments where application_id=$1 and consumer_id=$2',[app.id,consumer.id]);
    if(old&&(old.observed_on>observed||(old.released_on&&old.released_on>=observed)))throw Error('Older or pre-release inventory cannot overwrite this assignment');
    result=await db.query(`insert into deployments(application_id,consumer_id,observed_on,last_used) values($1,$2,$3,$4) on conflict(application_id,consumer_id) do update set observed_on=excluded.observed_on,last_used=excluded.last_used,state='active',release_evidence=null,released_by=null,released_on=null returning *`,[app.id,consumer.id,observed,used]);
   } else if(c==='log'){result=[{note:nonblank(f.note,'--note')}];}else throw Error(`Unhandled command ${c}`);
  }
  await event(db,appId||(c==='add-application'?result[0].id:null),actor,c,{arguments:pos,fields:f,result});return result;
 },Boolean(f['dry-run']));
}
export function format(rows){if(!rows.length)return '  (none)';return table(rows,Object.keys(rows[0]).filter(k=>!['id','created_at','updated_at','application_id','consumer_id','match_name'].includes(k)).map(key=>({key,label:key.replaceAll('_',' '),width:70,format:v=>v&&typeof v==='object'?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
