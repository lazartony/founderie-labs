/* Founderie Labs site.js
   Analytics (GA4 + Microsoft Clarity, consent-gated), behavioural events,
   UTM capture, share bar, contact form, nav. No dependencies. */
(function () {
  'use strict';

  /* ---------- CONFIG: edit these ---------- */
  var CFG = window.FL_CONFIG || {};
  var GA4_ID       = CFG.ga4 || 'G-XXXXXXXXXX';          // GA4 measurement ID
  var CLARITY_ID   = CFG.clarity || 'xxxxxxxxxx';        // Microsoft Clarity project ID
  var FORM_ENDPOINT= CFG.formEndpoint || '';             // e.g. https://formspree.io/f/xxxx or https://api.web3forms.com/submit
  var FORM_KEY     = CFG.formKey || '';                  // Web3Forms access_key (if used)
  var CONTACT_EMAIL= CFG.email || 'hello@founderielabs.com';
  var CONSENT_KEY  = 'fl_consent_v1';
  /* ---------------------------------------- */

  var d = document, w = window;
  w.dataLayer = w.dataLayer || [];
  function gtag(){ w.dataLayer.push(arguments); }
  w.gtag = w.gtag || gtag;

  /* ---------- helpers ---------- */
  function $(s, c){ return (c||d).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c||d).querySelectorAll(s)); }
  function store(k, v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v);}catch(e){ return null; } }
  function once(fn){ var done=false; return function(){ if(!done){done=true; fn.apply(this, arguments);} }; }

  /* ---------- event bus: every event goes to GA4 + dataLayer (GTM-ready) + Clarity ---------- */
  function track(name, params){
    params = params || {};
    params.page_path = location.pathname;
    try { w.dataLayer.push(Object.assign({event: name}, params)); } catch(e){}
    if (w.__ga_loaded) { try { gtag('event', name, params); } catch(e){} }
    if (w.clarity) { try { w.clarity('event', name); } catch(e){} }
    if (CFG.debug) console.log('[track]', name, params);
  }
  w.flTrack = track;

  /* ---------- UTM / first-touch attribution ---------- */
  (function utm(){
    var q = new URLSearchParams(location.search), keys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','gclid','fbclid'], got={};
    keys.forEach(function(k){ if(q.get(k)) got[k]=q.get(k); });
    if (!store('fl_first_touch')) {
      store('fl_first_touch', JSON.stringify({ts:Date.now(), landing:location.pathname, referrer:d.referrer||'(direct)', params:got}));
    }
    if (Object.keys(got).length) store('fl_last_touch', JSON.stringify({ts:Date.now(), params:got}));
    // session start counter
    var n = parseInt(store('fl_visits')||'0',10)+1; if(!sessionStorage.getItem('fl_s')){ sessionStorage.setItem('fl_s','1'); store('fl_visits', String(n)); track('session_start_custom',{visit_number:n}); }
  })();

  /* ---------- Consent Mode v2 + loaders ---------- */
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
  gtag('js', new Date());

  function loadGA(){
    if (w.__ga_loaded || !/^G-[A-Z0-9]{6,}$/.test(GA4_ID) || /^G-X+$/.test(GA4_ID)) return;
    var s=d.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+GA4_ID; d.head.appendChild(s);
    gtag('config', GA4_ID, {send_page_view:true, anonymize_ip:true});
    w.__ga_loaded = true;
  }
  function loadClarity(){
    if (w.clarity || !/^[a-z0-9]{8,}$/i.test(CLARITY_ID) || /^x+$/i.test(CLARITY_ID)) return;
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(w,d,"clarity","script",CLARITY_ID);
    try{ w.clarity('consent'); }catch(e){}
  }
  function grant(){
    gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    loadGA(); loadClarity();
  }
  function initConsent(){
    var box = $('#consent'); if(!box) return;
    var c = store(CONSENT_KEY);
    if (c === 'granted') { grant(); return; }
    if (c === 'denied') return;
    box.classList.add('show');
    $('#consent-accept').addEventListener('click', function(){ store(CONSENT_KEY,'granted'); box.classList.remove('show'); grant(); track('consent',{choice:'granted'}); });
    $('#consent-decline').addEventListener('click', function(){ store(CONSENT_KEY,'denied'); box.classList.remove('show'); track('consent',{choice:'denied'}); });
  }

  /* ---------- behavioural events ---------- */
  function initBehaviour(){
    // scroll depth
    var marks=[25,50,75,100], hit={};
    function onScroll(){
      var h=d.documentElement, max=h.scrollHeight-h.clientHeight; if(max<=0) return;
      var pct=Math.round((h.scrollTop||d.body.scrollTop)/max*100);
      marks.forEach(function(m){ if(pct>=m && !hit[m]){ hit[m]=1; track('scroll_depth',{percent:m}); } });
    }
    w.addEventListener('scroll', onScroll, {passive:true}); setTimeout(onScroll, 1500);

    // section views
    if ('IntersectionObserver' in w) {
      var seen={}, io=new IntersectionObserver(function(es){ es.forEach(function(e){ var id=e.target.id; if(e.isIntersecting && !seen[id]){ seen[id]=1; track('section_view',{section:id}); } }); },{threshold:.35});
      $$('section[id]').forEach(function(s){ io.observe(s); });
    }

    // time on page milestones
    [15,45,90,180].forEach(function(s){ setTimeout(function(){ if(!d.hidden) track('engaged_time',{seconds:s}); }, s*1000); });

    // clicks: CTA (data-track), outbound, mailto/tel/whatsapp
    d.addEventListener('click', function(ev){
      var a = ev.target.closest('a,button'); if(!a) return;
      var t = a.getAttribute('data-track');
      if (t) track('cta_click',{cta:t, text:(a.textContent||'').trim().slice(0,60), location:(a.closest('section,header,footer')||{}).id||a.closest('header')?'header':'body'});
      if (a.tagName==='A' && a.href){
        var href=a.getAttribute('href')||'';
        if (href.indexOf('mailto:')===0) track('contact_click',{method:'email'});
        else if (href.indexOf('tel:')===0) track('contact_click',{method:'phone'});
        else if (/wa\.me|whatsapp/.test(href)) track('contact_click',{method:'whatsapp'});
        else if (a.host && a.host!==location.host) track('outbound_click',{url:a.href});
      }
    }, true);

    // FAQ opens
    $$('details').forEach(function(dt){ dt.addEventListener('toggle', function(){ if(dt.open) track('faq_open',{question:($('summary',dt).textContent||'').trim().slice(0,90)}); }); });

    // rage / dead-click-ish: 3 clicks within 700ms on same spot
    var last=0, cnt=0; d.addEventListener('click', function(e){ var now=Date.now(); cnt = (now-last<700)? cnt+1 : 1; last=now; if(cnt===3){ track('rage_click',{x:e.clientX,y:e.clientY,el:(e.target.tagName||'')}); cnt=0; } }, true);

    // exit intent (desktop)
    d.addEventListener('mouseout', once(function(e){ if(!e.relatedTarget && e.clientY<8) track('exit_intent'); }));

    // copy text
    d.addEventListener('copy', function(){ var s=String((w.getSelection&&w.getSelection())||'').slice(0,80); if(s) track('text_copy',{sample:s}); });
  }

  /* ---------- nav ---------- */
  function initNav(){
    var b=$('.burger'), n=$('nav.main'); if(!b||!n) return;
    b.addEventListener('click', function(){ var o=n.classList.toggle('open'); b.setAttribute('aria-expanded', o?'true':'false'); });
    $$('a', n).forEach(function(a){ a.addEventListener('click', function(){ n.classList.remove('open'); }); });
    var path=location.pathname.replace(/\/$/,'')||'/';
    $$('a', n).forEach(function(a){ var p=a.getAttribute('href').replace(/\/$/,'')||'/'; if(p===path) a.setAttribute('aria-current','page'); });
  }

  /* ---------- share bar ---------- */
  function initShare(){
    var bar=$('.share'); if(!bar) return;
    var url=location.origin+location.pathname, title=d.title;
    function u(src){ return encodeURIComponent(url+'?utm_source='+src+'&utm_medium=share&utm_campaign=site_share'); }
    var map={ whatsapp:'https://wa.me/?text='+encodeURIComponent(title+' ')+u('whatsapp'),
              linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+u('linkedin'),
              x:'https://twitter.com/intent/tweet?text='+encodeURIComponent(title)+'&url='+u('x'),
              email:'mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent('Thought you might find this useful: ')+u('email') };
    $$('a[data-share]', bar).forEach(function(a){ var k=a.getAttribute('data-share'); a.href=map[k]; a.addEventListener('click', function(){ track('share',{method:k, content_type:'page', item_id:location.pathname}); }); });
    var cp=$('button[data-copy]', bar); if(cp) cp.addEventListener('click', function(){
      var link=url+'?utm_source=copylink&utm_medium=share&utm_campaign=site_share';
      (navigator.clipboard? navigator.clipboard.writeText(link) : Promise.reject()).then(function(){ cp.textContent='Copied!'; setTimeout(function(){cp.textContent='Copy link';},1600); }, function(){ prompt('Copy this link', link); });
      track('share',{method:'copy_link', content_type:'page', item_id:location.pathname});
    });
    var ns=$('button[data-native]', bar);
    if (ns){ if(navigator.share){ ns.addEventListener('click', function(){ navigator.share({title:title, url:url+'?utm_source=native&utm_medium=share&utm_campaign=site_share'}).then(function(){ track('share',{method:'native'}); }).catch(function(){}); }); } else ns.style.display='none'; }
  }

  /* ---------- contact form ---------- */
  function initForm(){
    var f=$('form.lead-form'); if(!f) return;
    var msg=$('.form-msg', f), started=false;
    f.addEventListener('focusin', function(){ if(!started){ started=true; track('form_start',{form:'lead'}); } });
    $$('input,select,textarea', f).forEach(function(el){ el.addEventListener('change', function(){ track('form_field',{form:'lead', field:el.name}); }); });
    f.addEventListener('submit', function(ev){
      ev.preventDefault();
      if ($('.hp input', f) && $('.hp input', f).value) return; // honeypot
      var data={}; $$('input,select,textarea', f).forEach(function(el){ if(el.name) data[el.name]=el.value; });
      data.page=location.href; data.first_touch=store('fl_first_touch')||''; data.last_touch=store('fl_last_touch')||''; data.subject='New enquiry from '+(data.name||'website')+' | Founderie Labs';
      if (FORM_KEY) data.access_key=FORM_KEY;
      var btn=$('button[type=submit]', f); btn.disabled=true; btn.textContent='Sending…';
      function ok(){ msg.className='form-msg ok'; msg.textContent='Got it. We’ll reply within one business day.'; f.reset(); btn.disabled=false; btn.textContent='Send enquiry';
        track('generate_lead',{form:'lead', model:data.model||'', budget:data.budget||'', need:data.need||''}); }
      function fail(){ msg.className='form-msg err'; msg.innerHTML='Could not send automatically. Please email <a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a>. Your message has been copied to your email client.'; btn.disabled=false; btn.textContent='Send enquiry';
        track('form_error',{form:'lead'});
        var body=Object.keys(data).filter(function(k){return !/touch|access_key|subject/.test(k);}).map(function(k){return k+': '+data[k];}).join('\n');
        location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(data.subject)+'&body='+encodeURIComponent(body); }
      if (!FORM_ENDPOINT){ fail(); return; }
      fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){ return r.ok? ok() : fail(); }).catch(fail);
    });
  }

  /* ---------- boot ---------- */
  function boot(){ initConsent(); initNav(); initShare(); initForm(); initBehaviour(); track('page_view_custom',{title:d.title}); }
  if (d.readyState==='loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
