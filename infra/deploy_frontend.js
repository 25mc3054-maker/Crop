#!/usr/bin/env node
/**
 * Deploy frontend build to S3 and invalidate CloudFront distribution.
 * Usage:
 *   node deploy_frontend.js --bucket <FRONTEND_BUCKET> --dist ./frontend/dist --distribution-id <CLOUDFRONT_ID>
 * Requires AWS credentials in environment or IAM role.
 */
const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')

function walk(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const it of items) {
    const full = path.join(dir, it)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase()
  switch (ext) {
    case '.html': return 'text/html'
    case '.js': return 'application/javascript'
    case '.css': return 'text/css'
    case '.json': return 'application/json'
    case '.png': return 'image/png'
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.svg': return 'image/svg+xml'
    case '.mp3': return 'audio/mpeg'
    default: return 'application/octet-stream'
  }
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2))
  const bucket = argv.bucket || process.env.FRONTEND_BUCKET
  const dist = argv.dist || argv._[0] || './frontend/dist'
  const distributionId = argv['distribution-id'] || process.env.CLOUDFRONT_ID
  if (!bucket) { console.error('Missing bucket. Use --bucket or FRONTEND_BUCKET'); process.exit(2) }

  const s3 = new AWS.S3()
  const files = walk(dist)
  console.log(`Uploading ${files.length} files from ${dist} to s3://${bucket}`)

  for (const f of files) {
    const Key = path.relative(dist, f).replace(/\\/g, '/')
    const Body = fs.readFileSync(f)
    const ContentType = contentTypeFor(f)
    console.log('PUT', Key)
    await s3.putObject({ Bucket: bucket, Key, Body, ContentType, ACL: 'public-read' }).promise()
  }

  if (distributionId) {
    console.log('Creating CloudFront invalidation for distribution', distributionId)
    const cf = new AWS.CloudFront()
    const inv = await cf.createInvalidation({ DistributionId: distributionId, InvalidationBatch: { CallerReference: `${Date.now()}`, Paths: { Quantity: 1, Items: ['/*'] } } }).promise()
    console.log('Invalidation created', inv.Invalidation?.Id)
  }

  console.log('Deploy complete')
}

main().catch(err => { console.error(err); process.exit(1) })
