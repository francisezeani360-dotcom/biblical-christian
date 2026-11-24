(function(){const main=document.querySelector('main');if(!main)return;const headings=[...main.querySelectorAll('h2[id]')];const toc=document.querySelector('.toc');if(toc&&headings.length){const list=document.createElement('details');list.className='reading-tools';list.open=false;const summary=document.createElement('summary');summary.textContent='On this page';const ol=document.createElement('ol');headings.forEach(h=>{const li=document.createElement('li'),a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;li.append(a);ol.append(li)});list.append(summary,ol);toc.replaceWith(list)}const foot=document.querySelector('footer');if(foot&&!foot.querySelector('.site-links')){const nav=document.createElement('p');nav.className='site-links';nav.innerHTML='<a href="/">Home</a> · <a href="/search.html">Search</a> · <a href="/scripture-index.html">Scripture index</a> · <a href="/resources.html">Study resources</a> · <a href="/about.html">About &amp; beliefs</a> · <a href="/scripture-copyright.html">Scripture copyright</a>';foot.append(nav)}const style=document.createElement('style');style.textContent='.reading-tools{margin:25px 0;padding:18px 22px;background:#fff;border:1px solid #e5e2da}.reading-tools summary{cursor:pointer;font-weight:700;color:#806238}.reading-tools ol{columns:2;margin:14px 0 0;padding-left:20px}.reading-tools li{break-inside:avoid;margin:5px 0;font-size:13px}.reading-tools a,.site-links a{color:#d8bd8d}.site-links{margin-top:14px;font-size:12px}@media(max-width:620px){.reading-tools ol{columns:1}}';document.head.append(style)
function addArticleNavigation(){
 const main=document.querySelector('main');
 if(!main||document.querySelector('.article-navigation'))return;
 const load=()=>{if(!Array.isArray(window.LIBRARY))return;
 const current=location.pathname;
 const index=window.LIBRARY.findIndex(item=>item.url===current);
 if(index<0)return;
 const entries=window.LIBRARY;
 const previous=entries[index-1],next=entries[index+1];
 const section=document.createElement('section');
 section.className='article-navigation';
 section.setAttribute('aria-label','Article navigation');
 const nav=document.createElement('div');nav.className='article-sequence';
 const make=(item,label,side)=>{const a=document.createElement('a');a.className='sequence-card '+side;a.href=item?item.url:'/resources.html';const small=document.createElement('span');small.textContent=label;const title=document.createElement('strong');title.textContent=item?item.title:(side==='previous'?'Browse study resources':'Browse study resources');a.append(small,title);return a};
 nav.append(make(previous,'← Previous article','previous'),make(next,'Next article →','next'));
 section.append(nav);
 const words=s=>new Set((s||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3));
 const own=entries[index], ownTags=words(own.tags+' '+own.passages);
 const related=entries.map((item,i)=>({item,i,score:(item.category===own.category?3:0)+[...words(item.tags+' '+item.passages)].filter(w=>ownTags.has(w)).length})).filter(x=>x.i!==index).sort((a,b)=>b.score-a.score).slice(0,3);
 const heading=document.createElement('h2');heading.textContent='Continue studying';section.append(heading);
 const grid=document.createElement('div');grid.className='related-grid';
 related.forEach(({item})=>{const a=document.createElement('a');a.className='related-card';a.href=item.url;const category=document.createElement('span');category.textContent=item.category;const title=document.createElement('strong');title.textContent=item.title;const desc=document.createElement('p');desc.textContent=item.description;a.append(category,title,desc);grid.append(a)});
 section.append(grid);
 const refs=main.querySelector('.refs');
 if(refs)refs.insertAdjacentElement('afterend',section);else main.append(section);
 };
 if(Array.isArray(window.LIBRARY)){load();return}
 const script=document.createElement('script');script.src='/assets/library.js';script.onload=load;document.head.append(script);
}
addArticleNavigation();
})();