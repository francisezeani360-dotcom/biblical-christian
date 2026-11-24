(function(){
'use strict';
const book='(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\\s*Samuel|2\\s*Samuel|1\\s*Kings|2\\s*Kings|1\\s*Chronicles|2\\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\\s*Corinthians|2\\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\\s*Thessalonians|2\\s*Thessalonians|1\\s*Timothy|2\\s*Timothy|Titus|Philemon|Hebrews|James|1\\s*Peter|2\\s*Peter|1\\s*John|2\\s*John|3\\s*John|Jude|Revelation)';
const refPattern=new RegExp('\\b('+book+')\\s+\\d{1,3}:\\d{1,3}(?:\\s*[-–—,]\\s*\\d{1,3}(?::\\d{1,3})?)*(?:\\s*;\\s*\\d{1,3}:\\d{1,3}(?:\\s*[-–—]\\s*\\d{1,3})?)?','gi');
const excluded='SCRIPT STYLE NOSCRIPT TEXTAREA INPUT BUTTON A .scripture-modal .scripture-link';
function makeModal(){
 let modal=document.createElement('div');modal.className='scripture-modal';modal.setAttribute('aria-hidden','true');
 modal.innerHTML='<section class="scripture-dialog" role="dialog" aria-modal="true" aria-labelledby="scripture-title"><button class="scripture-close" type="button" aria-label="Close Scripture popup">×</button><h2 id="scripture-title">Bible passage</h2><div class="scripture-version">English Standard Version (ESV)</div><div class="scripture-content"><p class="scripture-loading">Loading passage…</p></div><div class="scripture-hint">Tap outside this window or press Escape to close.</div></section>';
 document.body.appendChild(modal);const close=()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true')};
 modal.querySelector('.scripture-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});
 return {modal,close};
}
function normalize(ref){return ref.replace(/[–—]/g,'-').replace(/\s+/g,' ').trim()}
function openPassage(ref){
 const {modal}=window.__scripturePopup;const title=modal.querySelector('#scripture-title');const content=modal.querySelector('.scripture-content');
 title.textContent=ref;content.innerHTML='';modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');modal.querySelector('.scripture-close').focus();
 const p=document.createElement('p');p.className='scripture-error';p.textContent='The ESV passage service is being connected. For now, open the exact passage directly in the English Standard Version.';
 const link=document.createElement('a');link.className='scripture-source';link.href='https://www.esv.org/'+encodeURIComponent(normalize(ref)).replace(/%20/g,'+')+'/';link.target='_blank';link.rel='noopener';link.textContent='Read '+ref+' in the ESV ↗';
 const credit=document.createElement('p');credit.className='scripture-hint';credit.textContent='ESV® Bible text © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';
 content.replaceChildren(p,link,credit);
}
function linkReferences(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
  if(!node.nodeValue||!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
  const parent=node.parentElement;if(!parent||parent.closest(excluded))return NodeFilter.FILTER_REJECT;
  return refPattern.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const text=node.nodeValue;refPattern.lastIndex=0;let match,last=0;const frag=document.createDocumentFragment();
  while((match=refPattern.exec(text))){frag.append(document.createTextNode(text.slice(last,match.index)));const btn=document.createElement('button');btn.type='button';btn.className='scripture-link';btn.textContent=match[0];btn.setAttribute('aria-label','Read '+match[0]+' in a popup');btn.addEventListener('click',()=>openPassage(match[0]));frag.append(btn);last=match.index+match[0].length}
  frag.append(document.createTextNode(text.slice(last)));node.parentNode.replaceChild(frag,node);
 });
}
function init(){if(!document.body)return;window.__scripturePopup=makeModal();linkReferences(document.body)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();