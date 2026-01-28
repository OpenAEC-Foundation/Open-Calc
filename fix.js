const fs = require('fs');
const base = 'C:/Users/MartijnvanderKolk/Documents/GitHub/Open-Calc/apps/sbo/src/app/api/projects/[id]/change-orders';
const f1 = fs.readFileSync(base + '/route.ts', 'utf8');
const fixed = f1.replace(/from ([a-z@/\-]+);/g, 'from "";');
fs.writeFileSync(base + '/route.ts', fixed);
console.log('done');
