(function(){
'use strict';
if(document.querySelector('script[data-biblical-structured-data]'))return;
const canonical=document.querySelector('link[rel="canonical"]');
const url=canonical&&canonical.href?canonical.href:location.href.split('#')[0];
const origin=location.origin;
const title=(document.querySelector('h1')?.textContent||document.querySelector('meta[property="og:title"]')?.content||document.title||'Biblical Christian').trim();
const description=(document.querySelector('meta[name="description"]')?.content||document.querySelector('meta[property="og:description"]')?.content||'').trim();
const orgId=origin+'/#organization';
const siteId=origin+'/#website';
const nodes=[
 {'@type':'Organization','@id':orgId,'name':'Biblical Christian','url':origin+'/'},
 {'@type':'WebSite','@id':siteId,'url':origin+'/','name':'Biblical Christian','publisher':{'@id':orgId},'inLanguage':'en'}
];
const path=new URL(url).pathname;
if(path.startsWith('/articles/')){
 const eyebrow=document.querySelector('.eyebrow');
 const section=eyebrow?eyebrow.textContent.trim().split(/[·|]/)[0].trim():undefined;
 const article={'@type':'Article','@id':url+'#article','mainEntityOfPage':{'@type':'WebPage','@id':url},'headline':title,'description':description,'url':url,'inLanguage':'en','author':{'@id':orgId},'publisher':{'@id':orgId},'isPartOf':{'@id':siteId}};
 if(section)article.articleSection=section;
 nodes.push(article);
}
if(path!=='/'){
 nodes.push({'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':description||undefined,'isPartOf':{'@id':siteId},'inLanguage':'en'});
 const crumbs=[{'@type':'ListItem','position':1,'name':'Home','item':origin+'/'}];
 if(path.startsWith('/articles/'))crumbs.push({'@type':'ListItem','position':2,'name':title,'item':url});
 else crumbs.push({'@type':'ListItem','position':2,'name':title,'item':url});
 nodes.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb','itemListElement':crumbs});
}
const script=document.createElement('script');
script.type='application/ld+json';
script.setAttribute('data-biblical-structured-data','true');
script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':nodes});
(document.head||document.documentElement).appendChild(script);
})();