import packages from '../../package.json'
export function getVersion(): string {
  return packages.version
}

// package tester
export function helloPistols(): string {
  console.log('Bang!')
  return `Bang!`;
}
