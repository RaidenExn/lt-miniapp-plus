import { readdirSync } from 'fs'
import { resolve, join } from 'path'

async function main() {
  const currentDir = import.meta.dirname || process.cwd()
  console.log('CURRENT DIR:', currentDir)
  
  const parentDir = resolve(currentDir, '..')
  console.log('PARENT DIR:', parentDir)
  
  try {
    const parentFiles = readdirSync(parentDir)
    console.log('PARENT DIR FILES:', parentFiles)
  } catch (err: any) {
    console.error('FAILED TO READ PARENT DIR:', err.message)
  }
}

main().catch(console.error)
