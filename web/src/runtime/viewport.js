// runtime/viewport.js — the single owner of physical-phone / desktop-site layout context.
// Runs before CSS to avoid a desktop-layout flash when a phone requests a desktop site.
(function(){
  function apply(){
    const html=document.documentElement;
    const sw=screen.width||1e5,sh=screen.height||1e5;
    const short=Math.min(sw,sh);
    const landscape=innerWidth>innerHeight;
    const physical=landscape?Math.max(sw,sh):short;
    const desktopViewPhone=short<=500&&innerWidth>820;
    const fit=desktopViewPhone?Math.max(1,innerWidth/Math.max(1,physical)):1;
    html.classList.toggle('phone-fit',desktopViewPhone);
    html.classList.toggle('physical-phone',short<=600);
    html.style.setProperty('--fit',fit.toFixed(3));
    globalThis.__konaViewport={desktopViewPhone,physicalPhone:short<=600,fit};
  }
  apply();
  addEventListener('resize',apply,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(apply,200),{passive:true});
})();
