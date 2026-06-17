const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findAndReplace(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            // Ganti string biasa 'http://localhost:4000...' menjadi template literal
            if (content.includes("'http://localhost:4000")) {
                content = content.replace(/'http:\/\/localhost:4000([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}$1`');
                updated = true;
            }

            // Ganti yang sudah berupa template literal `http://localhost:4000...`
            if (content.includes('`http://localhost:4000')) {
                content = content.replace(/`http:\/\/localhost:4000([^`]*)`/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}$1`');
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

findAndReplace(directoryPath);
console.log('Selesai!');
