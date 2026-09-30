import fs from 'node:fs';

const allowed = new Set(['tokens.css']);
const files = fs.readdirSync('web/styles').filter(f=>f.endsWith('.css'));
const hex = /#[0-9a-fA-F]{3,8}\b/g;
const font = /font-family\s*:/g;
const report=[];
for(const name of files){
  if(allowed.has(name)) continue;
  const text=fs.readFileSync('web/styles/'+name,'utf8');
  const colors=[...new Set(text.match(hex)||[])];
  const fonts=(text.match(font)||[]).length;
  if(colors.length||fonts) report.push({file:name,color_literals:colors.length,font_family_declarations:fonts,examples:colors.slice(0,8)});
}
console.log(JSON.stringify({phase:'inventory-only',files:report},null,2));
console.log('Design literal inventory complete. This becomes enforcing after migration, not before.');
