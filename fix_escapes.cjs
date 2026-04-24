const fs = require('fs');

const files = [
    'd:/2nd year/4th sem/BEE/Devio - Copy - Copy/frontend/src/pages/Student/Practice/PracticePage.jsx',
    'd:/2nd year/4th sem/BEE/Devio - Copy - Copy/frontend/src/pages/Student/Practice/PracticeSolver.jsx',
    'd:/2nd year/4th sem/BEE/Devio - Copy - Copy/frontend/src/pages/Student/battles/BattlePage.jsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        let text = fs.readFileSync(f, 'utf8');
        text = text.replace(/\\`/g, '`');
        text = text.replace(/\\\$\{/g, '${');
        fs.writeFileSync(f, text);
        console.log('Fixed', f);
    } else {
        console.log('File not found:', f);
    }
});
