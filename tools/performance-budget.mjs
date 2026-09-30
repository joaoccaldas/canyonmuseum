import fs from 'node:fs';
const limits={
 'app/kona-core.js':80*1024,
 'app/hall.js':1024*1024,
 'app/studio.js':800*1024,
 'app/museum-data.js':220*1024,
};
let failed=false;
for(const [file,max] of Object.entries(limits)){
 if(!fs.existsSync(file)) continue;
 const bytes=fs.statSync(file).size;
 const ok=bytes<=max;
 console.log(`${ok?'PASS':'FAIL'} ${file}: ${(bytes/1024).toFixed(1)} KiB / ${(max/1024).toFixed(0)} KiB`);
 if(!ok) failed=true;
}
if(failed) process.exit(1);
