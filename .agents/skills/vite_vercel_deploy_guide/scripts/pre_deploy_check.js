const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let envFile = '.env.local';
let gitignore = '.gitignore';
let outFile = '.deploy_report.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env-file') envFile = args[i + 1];
  if (args[i] === '--gitignore') gitignore = args[i + 1];
  if (args[i] === '--output') outFile = args[i + 1];
}

const report = { status: 'pass', errors: [], warnings: [] };

// 1. Check if gitignore exists and has the envFile
if (fs.existsSync(gitignore)) {
  const igContent = fs.readFileSync(gitignore, 'utf8');
  if (!igContent.includes(envFile)) {
    report.status = 'fail';
    report.errors.push(`SECURITY ERROR: '${envFile}' is missing from '${gitignore}'. The AI agent must automatically append it using a file edit tool before pushing to GitHub.`);
  }
} else {
  report.status = 'fail';
  report.errors.push(`SECURITY ERROR: '${gitignore}' not found. The AI agent must create it and add '${envFile}' before pushing.`);
}

// 2. Check for VITE_...SECRET... in env file
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('VITE_') && line.toUpperCase().includes('SECRET')) {
      report.warnings.push(`Line ${idx + 1}: Found 'VITE_' prefix combined with 'SECRET'. In Vite, this exposes the secret to the browser. Advise the user to remove 'VITE_' if it is a true backend secret, or ignore if intentional.`);
    }
  });
} else {
   report.warnings.push(`File '${envFile}' not found locally. Ensure environment variables are managed directly in Vercel.`);
}

fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`Success! Data written to: ${outFile}`);
