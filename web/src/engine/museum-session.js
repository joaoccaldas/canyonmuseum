const SESSION_KEY='speedmax.museum-session.v1';

export function createMuseumSession({passport,modelled,getPose,isStarted,roomOf,onProgress}){
  const read=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
      if(raw?.v===1)return{v:1,visits:Number(raw.visits)||0,pose:raw.pose||null};
    }catch(_){}
    return{v:1,visits:0,pose:null};
  };
  const session=read();
  const write=()=>{try{localStorage.setItem(SESSION_KEY,JSON.stringify(session));}catch(_){}};
  const progress=()=>{
    const total=modelled.length;
    const seen=modelled.filter(piece=>passport.has('bike:'+piece.key)).length;
    onProgress?.({seen,total});
    return{seen,total};
  };
  const discover=piece=>{
    if(!piece?.key||!piece.glb||passport.has('bike:'+piece.key))return false;
    passport.stamp('bike:'+piece.key,piece.name,10);progress();return true;
  };
  const savePose=()=>{
    if(!isStarted())return;
    const p=getPose(),region=roomOf();
    if(region==='horror')return;
    session.pose={x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,region};write();
  };
  passport.onChange?.(progress);
  return{session,write,progress,discover,savePose,key:SESSION_KEY};
}
