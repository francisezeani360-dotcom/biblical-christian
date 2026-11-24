(function(){
'use strict';
const book='(?:Genesis|Gen\\.?|Exodus|Exod?\\.?|Leviticus|Lev\\.?|Numbers|Num\\.?|Deuteronomy|Deut?\\.?|Joshua|Josh\\.?|Judges|Judg?\\.?|Ruth|1\\s*Samuel|1\\s*Sam\\.?|2\\s*Samuel|2\\s*Sam\\.?|1\\s*Kings|1\\s*Kgs?\\.?|2\\s*Kings|2\\s*Kgs?\\.?|1\\s*Chronicles|1\\s*Chron\\.?|2\\s*Chronicles|2\\s*Chron\\.?|Ezra|Neh?\\.?|Nehemiah|Esther|Esth?\\.?|Job|Psalms?|Ps\\.?|Proverbs|Prov\\.?|Ecclesiastes|Eccl\\.?|Song of Solomon|Song of Songs|Song\\.?|Isaiah|Isa\\.?|Jeremiah|Jer\\.?|Lamentations|Lam\\.?|Ezekiel|Ezek\\.?|Daniel|Dan\\.?|Hosea|Hos\\.?|Joel|Amos|Obadiah|Obad\\.?|Jonah|Micah|Nahum|Habakkuk|Hab\\.?|Zephaniah|Zeph\\.?|Haggai|Hag\\.?|Zechariah|Zech\\.?|Malachi|Mal\\.?|Matthew|Matt?\\.?|Mark|Mk\\.?|Luke|Lk\\.?|John|Jn\\.?|Acts|Romans|Rom\\.?|1\\s*Corinthians|1\\s*Cor\\.?|2\\s*Corinthians|2\\s*Cor\\.?|Galatians|Gal\\.?|Ephesians|Eph\\.?|Philippians|Phil\\.?|Colossians|Col\\.?|1\\s*Thessalonians|1\\s*Thess?\\.?|2\\s*Thessalonians|2\\s*Thess?\\.?|1\\s*Timothy|1\\s*Tim\\.?|2\\s*Timothy|2\\s*Tim\\.?|Titus|Tit\\.?|Philemon|Philem?\\.?|Hebrews|Heb\\.?|James|Jas?\\.?|1\\s*Peter|1\\s*Pet\\.?|2\\s*Peter|2\\s*Pet\\.?|1\\s*John|1\\s*Jn\\.?|2\\s*John|2\\s*Jn\\.?|3\\s*John|3\\s*Jn\\.?|Jude|Revelation|Rev\\.?)';
const refPattern=new RegExp('\\b('+book+')\\s+\\d{1,3}(?:\\s*:\\s*\\d{1,3}(?:\\s*[-–—,]\\s*\\d{1,3}(?::\\d{1,3})?)*)?(?:\\s*;\\s*\\d{1,3}(?:\\s*:\\s*\\d{1,3}(?:\\s*[-–—,]\\s*\\d{1,3})?)?)*','gi');
const excluded='SCRIPT, STYLE, NOSCRIPT, TEXTAREA, INPUT, BUTTON, A, .scripture-modal, .scripture-link';
function makeModal(){
 let modal=document.createElement('div');modal.className='scripture-modal';modal.setAttribute('aria-hidden','true');
 modal.innerHTML='<section class="scripture-dialog" role="dialog" aria-modal="true" aria-labelledby="scripture-title"><button class="scripture-close" type="button" aria-label="Close Scripture popup">×</button><h2 id="scripture-title">Bible passage</h2><div class="scripture-version">English Standard Version (ESV)</div><div class="scripture-content"><p class="scripture-loading">Loading passage…</p></div><div class="scripture-hint">Tap outside this window or press Escape to close.</div></section>';
 document.body.appendChild(modal);const close=()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=modal.__previousOverflow||'';const trigger=modal.__trigger;if(trigger&&trigger.isConnected)trigger.focus()};
 modal.querySelector('.scripture-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(!modal.classList.contains('is-open'))return;if(e.key==='Escape'){close();return}if(e.key==='Tab'){const items=[...modal.querySelectorAll('button:not([disabled]),a[href], [tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 return {modal,close};
}
function normalize(ref){
 const clean=ref.replace(/[–—]/g,'-').replace(/\s+/g,' ').trim().replace(/\.$/,'');
 const match=clean.match(/^(.+?)\s+(\d.*)$/);if(!match)return clean;
 const key=match[1].toLowerCase().replace(/\./g,'').replace(/\s+/g,' ');
 const aliases={'gen':'Genesis','ex':'Exodus','exo':'Exodus','exod':'Exodus','lev':'Leviticus','num':'Numbers','deu':'Deuteronomy','deut':'Deuteronomy','josh':'Joshua','jud':'Judges','judg':'Judges','1 sam':'1 Samuel','2 sam':'2 Samuel','1 kg':'1 Kings','1 kgs':'1 Kings','2 kg':'2 Kings','2 kgs':'2 Kings','1 chron':'1 Chronicles','2 chron':'2 Chronicles','neh':'Nehemiah','est':'Esther','ps':'Psalms','prov':'Proverbs','eccl':'Ecclesiastes','song':'Song of Solomon','isa':'Isaiah','jer':'Jeremiah','lam':'Lamentations','ezek':'Ezekiel','dan':'Daniel','hos':'Hosea','obad':'Obadiah','hab':'Habakkuk','zeph':'Zephaniah','hag':'Haggai','zech':'Zechariah','mal':'Malachi','matt':'Matthew','mat':'Matthew','mt':'Matthew','mk':'Mark','lk':'Luke','jn':'John','rom':'Romans','1 cor':'1 Corinthians','2 cor':'2 Corinthians','gal':'Galatians','eph':'Ephesians','phil':'Philippians','col':'Colossians','1 thess':'1 Thessalonians','2 thess':'2 Thessalonians','1 tim':'1 Timothy','2 tim':'2 Timothy','tit':'Titus','philem':'Philemon','heb':'Hebrews','jas':'James','1 pet':'1 Peter','2 pet':'2 Peter','1 jn':'1 John','2 jn':'2 John','3 jn':'3 John','rev':'Revelation'};
 return (aliases[key]||match[1].replace(/\./g,''))+' '+match[2];
}
function openPassage(ref){
 const {modal}=window.__scripturePopup;const title=modal.querySelector('#scripture-title');const content=modal.querySelector('.scripture-content');
 modal.__trigger=document.activeElement;modal.__previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';title.textContent=ref;content.innerHTML='<p class="scripture-loading">Loading the ESV passage…</p>';modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');modal.querySelector('.scripture-close').focus();
 const query=encodeURIComponent(normalize(ref));
 fetch('https://biblical-christian-esv.onrender.com/api/passage?reference='+query)
 .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Passage could not be loaded');return data})
 .then(data=>{
  const fragment=document.createDocumentFragment();
  (data.passages||[]).forEach(text=>{const p=document.createElement('p');p.className='scripture-text';p.textContent=text.trim();fragment.appendChild(p)});
  content.replaceChildren(fragment);
  const credit=document.createElement('p');credit.className='scripture-hint';credit.textContent='Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';
  content.appendChild(credit);
  const link=document.createElement('a');link.className='scripture-source';link.href='https://www.esv.org/'+encodeURIComponent(normalize(ref)).replace(/%20/g,'+')+'/';link.target='_blank';link.rel='noopener';link.textContent='Open '+(data.reference||ref)+' on ESV.org ↗';content.appendChild(link);
 })
 .catch(error=>{
  const p=document.createElement('p');p.className='scripture-error';p.textContent=error.message||'The ESV passage could not be loaded right now.';
  const link=document.createElement('a');link.className='scripture-source';link.href='https://www.esv.org/'+query+'/';link.target='_blank';link.rel='noopener';link.textContent='Read '+ref+' on ESV.org ↗';content.replaceChildren(p,link);
 });
}
function linkReferences(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
  if(!node.nodeValue||!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
  const parent=node.parentElement;if(!parent||parent.closest(excluded))return NodeFilter.FILTER_REJECT;
  refPattern.lastIndex=0;
  return refPattern.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const text=node.nodeValue;refPattern.lastIndex=0;let match,last=0;const frag=document.createDocumentFragment();
  while((match=refPattern.exec(text))){const reference=match[0];frag.append(document.createTextNode(text.slice(last,match.index)));const btn=document.createElement('button');btn.type='button';btn.className='scripture-link';btn.textContent=reference;btn.setAttribute('aria-label','Read '+reference+' in a popup');btn.addEventListener('click',()=>openPassage(reference));frag.append(btn);last=match.index+reference.length}
  frag.append(document.createTextNode(text.slice(last)));node.parentNode.replaceChild(frag,node);
 });
}
function init(){if(!document.body)return;window.__scripturePopup=makeModal();linkReferences(document.body)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();