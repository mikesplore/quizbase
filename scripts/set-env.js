/**
 * This script loads environment variables from .env and generates
 * the Angular environment files with proper values.
 */
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Get values from .env or existing environment variables
const geminiApiKey = envVars.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const googleSearchApiKey = envVars.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY || '';
const googleSearchEngineId = envVars.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID || '';

// Generate development environment.ts
const devEnvContent = `/**
 * Development environment configuration.
 * Auto-generated from .env file. Do not edit directly.
 */
export const environment = {
  production: false,
  geminiApiKey: '${geminiApiKey}',
  googleSearchApiKey: '${googleSearchApiKey}',
  googleSearchEngineId: '${googleSearchEngineId}',
};
`;

// Generate production environment.prod.ts
const prodEnvContent = `/**
 * Production environment configuration.
 * Auto-generated from .env file. Do not edit directly.
 */
export const environment = {
  production: true,
  geminiApiKey: '${geminiApiKey}',
  googleSearchApiKey: '${googleSearchApiKey}',
  googleSearchEngineId: '${googleSearchEngineId}',
};
`;

// Write to environment files
const devTargetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const prodTargetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');

fs.writeFileSync(devTargetPath, devEnvContent);
fs.writeFileSync(prodTargetPath, prodEnvContent);

console.log('✓ Environment files generated successfully');
if (!geminiApiKey) {
  console.log('⚠ WARNING: GEMINI_API_KEY not set - search will not work!');
}
if (!googleSearchApiKey || !googleSearchEngineId) {
  console.log('⚠ Google Custom Search not configured - using Gemini grounding only');
}
