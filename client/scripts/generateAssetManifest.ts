import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Version for manual cache busting - increment to force all assets to update
const VERSION = 1;

interface AssetInfo {
  path: string;
  hash: string;
  size: number;
  mtime: number;
}

// Flat structure using path-based keys for O(1) access
interface AssetManifest {
  version: string;
  generatedAt: number;
  assets: Record<string, AssetInfo>; // Flat object with path-based keys
}



function createPathKey(filePath: string): string {
  // Include extension in the key generation
  const parsed = path.parse(filePath);
  const filename = parsed.name + parsed.ext;
  const dir = path.dirname(filePath);
  const fullPath = dir === '.' ? filename : `${dir}/${filename}`;
  
  // Convert to camelCase and sanitize for JavaScript object keys
  return fullPath
    .replace(/[^a-zA-Z0-9_/-]/g, '_')
    .split(/[/_-]/)
    .filter(Boolean)
    .map((part, index) => 
      index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join('');
}

function generateFileHash(filePath: string): string {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex').substring(0, 16);
    return `v${VERSION}_${fileHash}`; // Include version prefix for manual cache busting
  } catch (error) {
    console.warn(`Warning: Could not hash file ${filePath}:`, error);
    return `v${VERSION}_error`;
  }
}

function getFileInfo(filePath: string, relativePath: string): AssetInfo {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: `/${relativePath.replace(/\\/g, '/')}`,
      hash: generateFileHash(filePath),
      size: stats.size,
      mtime: stats.mtime.getTime()
    };
  } catch (error) {
    console.warn(`Warning: Could not get file info for ${filePath}:`, error);
    return {
      path: `/${relativePath.replace(/\\/g, '/')}`,
      hash: '',
      size: 0,
      mtime: 0
    };
  }
}

function scanDirectory(dir: string, baseDir: string = dir): Array<{ path: string; info: AssetInfo }> {
  const assets: Array<{ path: string; info: AssetInfo }> = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Skip certain directories
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }
        assets.push(...scanDirectory(fullPath, baseDir));
      } else if (item.isFile()) {
        // Skip certain files
        if (item.name.startsWith('.') || item.name.includes('worker') || item.name.includes('manifest')) {
          continue;
        }
        
        const relativePath = path.relative(baseDir, fullPath);
        const info = getFileInfo(fullPath, relativePath);
        assets.push({ path: relativePath, info });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }
  
  return assets;
}



function generateVersion(assets: Array<{ path: string; info: AssetInfo }>): string {
  // Create a version hash based on VERSION constant and all asset hashes
  const allHashes = assets.map(a => a.info.hash).sort().join('');
  const versionedInput = `v${VERSION}_${allHashes}`;
  return createHash('sha256').update(versionedInput).digest('hex').substring(0, 12);
}

function generateManifest(): void {
  const publicDir = path.join(__dirname, '..', 'public');
  const manifestPath = path.join(publicDir, 'assets-manifest.json');
  
  console.log('🔍 Scanning assets in:', publicDir);
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found:', publicDir);
    process.exit(1);
  }
  
  const allAssets = scanDirectory(publicDir);
  console.log(`📁 Found ${allAssets.length} assets`);
  
  // Generate version hash from all assets
  const version = generateVersion(allAssets);
  
  // Create nested asset structure based on folder hierarchy
  const manifest: AssetManifest = {
    version,
    generatedAt: Date.now(),
    assets: {}
  };
  
  for (const asset of allAssets) {
    // Create a flat key from the path
    const pathKey = createPathKey(asset.path);
    
    // Store asset with path-based key for O(1) access
    manifest.assets[pathKey] = asset.info;
  }
  
  // Write JSON manifest
  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log('✅ Asset manifest generated successfully!');
    console.log(`📄 JSON Manifest: ${manifestPath}`);
    console.log(`📊 Found ${allAssets.length} assets`);
    console.log(`🔖 Version: ${version}`);
    console.log('🐙 The tentacles of organization have embraced your assets!');
    
  } catch (error) {
    console.error('❌ Error writing manifest file:', error);
    process.exit(1);
  }
}

// Run the generator
generateManifest();
