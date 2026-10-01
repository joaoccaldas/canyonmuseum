// runtime/viewport.js — the only owner of physical-phone / desktop-site viewport context.
// This tiny script runs before CSS so desktop-site mode on a physical phone does not flash desktop layout.
(function(){
  function apply(){
    const html=document.documentElement;
    const sw=screen.width||1e5,sh=screen.height||1e5;
    const short=Math.min(sw,sh);
    const landscape=innerWidth>innerHeight;
    const physical=landscape?Math.max(sw||innerWidth,sh||innerHeight):short;
    const desktopViewPhone=short<=500&&innerWidth>820;
    const ratio=desktopViewPhone?Math.max(1,innerWidth/Math.max(1,physical)):1;
    html.classList.toggle('phone-fit',desktopViewPhone);
    html.classList.toggle('physical-phone',short<=600);
    html.style.setProperty('--fit',ratio.toFixed(3));
    window.__konaViewport={desktopViewPhone,physicalPhone:short<=600,fit:ratio};
  }
  apply();
  addEventListener('resize',apply,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(apply,200),{passive:true});
})();
