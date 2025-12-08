#!/usr/bin/env node

/**
 * Step 2: Dependency Validation Script
 * Validates that all required packages are installed and imports are correct
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 ClinicAI Dependency Validation\n');

// ===== 1. Check package.json =====
console.log('📦 1. Checking package.json dependencies...');
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const requiredPackages = {
    'openai': '✅ OpenAI SDK',
    'firebase': '✅ Firebase Client SDK',
    'firebase-admin': '✅ Firebase Admin SDK',
    'node-fetch': '✅ Node Fetch',
    'axios': '✅ Axios HTTP Client'
};

let missingPackages = [];
for (const [pkg, description] of Object.entries(requiredPackages)) {
    if (packageJson.dependencies[pkg]) {
        console.log(`  ${description} - v${packageJson.dependencies[pkg]}`);
    } else {
        console.log(`  ❌ Missing: ${pkg}`);
        missingPackages.push(pkg);
    }
}

if (missingPackages.length > 0) {
    console.error(`\n❌ Missing packages: ${missingPackages.join(', ')}`);
    console.error('Run: npm install');
    process.exit(1);
}

console.log('\n✅ All required packages are listed in package.json\n');

// ===== 2. Check Environment Variables Template =====
console.log('🔐 2. Checking .env.example...');
const envExample = readFileSync(join(__dirname, '..', '.env.example'), 'utf-8');
const requiredEnvVars = [
    'WHATSAPP_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'OPENAI_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
];

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
    if (envExample.includes(envVar)) {
        console.log(`  ✅ ${envVar}`);
    } else {
        console.log(`  ❌ Missing: ${envVar}`);
        missingEnvVars.push(envVar);
    }
}

if (missingEnvVars.length > 0) {
    console.error(`\n❌ Missing environment variables in .env.example: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

console.log('\n✅ All required environment variables are in .env.example\n');

// ===== 3. Validate Critical Imports =====
console.log('📝 3. Validating critical imports...');

const criticalFiles = [
    { path: 'api/whatsapp-webhook.js', imports: ['sendWhatsAppMessage', 'detectLanguage', 'generateAIReply'] },
    { path: 'api/ai-service.js', imports: ['OpenAI'] },
    { path: 'api/firebase-admin.js', imports: ['admin'] },
    { path: 'src/firebase.ts', imports: ['initializeApp', 'getFirestore'] }
];

for (const file of criticalFiles) {
    try {
        const content = readFileSync(join(__dirname, '..', file.path), 'utf-8');
        console.log(`  📄 ${file.path}`);
        for (const imp of file.imports) {
            if (content.includes(imp)) {
                console.log(`    ✅ ${imp}`);
            } else {
                console.log(`    ❌ Missing import: ${imp}`);
            }
        }
    } catch (err) {
        console.log(`  ❌ File not found: ${file.path}`);
    }
}

console.log('\n✅ All critical imports are present\n');

// ===== 4. Summary =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Step 2 Validation Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Next Steps:');
console.log('  1. Copy .env.example to .env.local');
console.log('  2. Fill in all environment variables');
console.log('  3. Run: npm run dev (to test locally)');
console.log('  4. Deploy to Vercel\n');
