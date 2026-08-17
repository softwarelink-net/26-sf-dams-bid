#!/usr/bin/env node
/**
 * Upload dist/client to:
 *   1) R2 26-sf-dams-bid-assets  (project bucket)
 *   2) R2 allworld-sites/26-sf-dams-bid/  (shared Allworld host)
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const dist = join(root, 'dist', 'client')
const siteId = process.argv[2] || '26-sf-dams-bid'
const projectBucket = '26-sf-dams-bid-assets'
const sitesBucket = 'allworld-sites'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.assetsignore' || name === '.DS_Store') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function put(bucket, key, file, ct) {
  console.log(`PUT ${bucket}/${key}`)
  execSync(
    `npx wrangler r2 object put ${bucket}/${key} --file=${JSON.stringify(file)} --content-type=${JSON.stringify(ct)}`,
    { stdio: 'inherit', cwd: root, shell: true },
  )
}

if (!existsSync(dist)) {
  console.error('dist/client missing. Run npm run build first.')
  process.exit(1)
}

const files = walk(dist)
if (!files.length) {
  console.error('dist/client is empty. Run npm run build first.')
  process.exit(1)
}

for (const file of files) {
  const rel = relative(dist, file).replace(/\\/g, '/')
  const ct = mime[extname(file).toLowerCase()] || 'application/octet-stream'
  put(projectBucket, rel, file, ct)
  put(sitesBucket, `${siteId}/${rel}`, file, ct)
}

console.log(`\nUploaded ${files.length} files`)
console.log(`→ Worker: https://${siteId}.softwarelink.net/`)
console.log(`→ R2:     ${projectBucket} + ${sitesBucket}/${siteId}/`)
