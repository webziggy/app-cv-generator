const { execSync } = require('child_process');

console.log('====================================');
console.log('🚀 Starting Full Pipeline Build...');
console.log('====================================\n');

try {
    console.log('📝 Building Plain Text CV...');
    execSync('node build-txt.js', { stdio: 'inherit' });

    console.log('\n📝 Building Markdown CV...');
    execSync('node build-md.js', { stdio: 'inherit' });

    console.log('\n🌐 Building Static HTML CV...');
    execSync('node build-html.js', { stdio: 'inherit' });
    
    console.log('\n📄 Building PDF CVs & JSON-LD metadata...');
    execSync('node build-pdfs.js', { stdio: 'inherit' });

    console.log('\n✅ All builds successfully completed!');
} catch (error) {
    console.error('\n❌ Build pipeline failed:', error.message);
    process.exit(1);
}
