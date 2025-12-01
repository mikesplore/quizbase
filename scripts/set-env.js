/**
 * This script loads environment variables from .env and generates
 * the Angular environment file with proper values.
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

// Generate environment.ts content
const envContent = `/**
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

// Write to environment.ts
const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(targetPath, envContent);

console.log('✓ Environment file generated successfully');
if (!googleSearchApiKey || !googleSearchEngineId) {
  console.log('⚠ Google Custom Search not configured - using Gemini grounding fallback');
}
