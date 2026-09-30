export function installState({standalone=false,native=false,ios=false,android=false,deferred=false}={}){
 if(native) return {kind:'native',show:false,action:'none'};
 if(standalone) return {kind:'installed',show:false,action:'none'};
 if(ios) return {kind:'ios-instructions',show:true,action:'instructions'};
 if(android&&deferred) return {kind:'android-prompt',show:true,action:'prompt'};
 if(android) return {kind:'android-instructions',show:true,action:'instructions'};
 if(deferred) return {kind:'browser-prompt',show:true,action:'prompt'};
 return {kind:'browser-instructions',show:true,action:'instructions'};
}
export function installInstructions(kind){
 if(kind==='ios-instructions') return 'Tap Share, then Add to Home Screen.';
 if(kind==='android-instructions') return 'Open the browser menu and choose Install app or Add to Home screen.';
 if(kind==='browser-instructions') return 'Use your browser menu to install this site as an app, or add it to your home screen.';
 return '';
}
