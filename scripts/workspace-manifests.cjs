const { readFileSync } = require('node:fs')
const { resolve, relative, sep } = require('node:path')

function parseWorkspacePackageDirs(text) {
  const dirs = []
  let inPackages = false
  for (const line of text.split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }
    if (inPackages && line.length > 0 && !/^\s/.test(line)) break
    if (!inPackages) continue
    if (line.trim() === '' || line.trim().startsWith('#')) continue

    const match = line.match(/^\s*-\s*["']?([^"'#\s]+)["']?\s*(?:#.*)?$/)
    if (!match) throw new Error(`cannot parse workspace package entry: ${line.trim()}`)
    if (/[*?\[\]{}!]/.test(match[1])) {
      throw new Error(`workspace package globs are not supported by the pre-install gates: ${match[1]}`)
    }
    dirs.push(match[1])
  }
  if (!inPackages) throw new Error('pnpm-workspace.yaml has no packages block')
  return dirs
}

function readWorkspacePackages(repoRoot) {
  const root = resolve(repoRoot)
  const workspaceText = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8')
  const dirs = ['.', ...parseWorkspacePackageDirs(workspaceText)]
  const packages = []
  const names = new Set()

  for (const dir of dirs) {
    const manifestPath = resolve(root, dir, 'package.json')
    const relativePath = relative(root, manifestPath)
    if (relativePath.startsWith(`..${sep}`) || relativePath === '..') {
      throw new Error(`workspace package escapes the repository: ${dir}`)
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (!manifest.name || !manifest.version) {
      throw new Error(`${relativePath} must declare both name and version`)
    }
    if (names.has(manifest.name)) throw new Error(`duplicate workspace package name: ${manifest.name}`)
    names.add(manifest.name)
    packages.push({ dir, manifestPath, relativePath, name: manifest.name, version: manifest.version })
  }
  return packages
}

module.exports = { parseWorkspacePackageDirs, readWorkspacePackages }
