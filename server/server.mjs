import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stat } from 'node:fs/promises'
import { extname, sep } from 'node:path'

const port = Number(process.env.PORT || 3001)

const dataPath = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR, 'coffee.json')
  : resolve(dirname(fileURLToPath(import.meta.url)), 'data/coffee.json')

async function readInventory() {
  try {
    const contents = await readFile(dataPath, 'utf8')
    return JSON.parse(contents)
  } catch {
    return []
  }
}

async function writeInventory(inventory) {
  await mkdir(dirname(dataPath), { recursive: true })
  await writeFile(dataPath, `${JSON.stringify(inventory, null, 2)}\n`)
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
  })
  response.end(JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    })
    response.end()
    return
  }

  if (request.url === '/api/coffees' && request.method === 'GET') {
    sendJson(response, 200, await readInventory())
    return
  }

  if (request.url === '/api/coffees' && request.method === 'POST') {
    let body = ''

    for await (const chunk of request) {
      body += chunk
    }

    try {
      const coffee = JSON.parse(body)
      const inventory = await readInventory()

      inventory.push(coffee)

      await writeInventory(inventory)
      sendJson(response, 201, coffee)
    } catch {
      sendJson(response, 400, { error: 'Invalid coffee data' })
    }

    return
  }

  if (
    request.method === 'PUT' &&
    request.url?.startsWith('/api/coffees/')
  ) {
    let body = ''

    for await (const chunk of request) {
      body += chunk
    }

    try {
      const coffee = JSON.parse(body)
      const id = request.url.split('/').pop()

      const inventory = await readInventory()
      const index = inventory.findIndex((item) => item.id === id)

      if (index === -1) {
        sendJson(response, 404, { error: 'Coffee not found' })
        return
      }

      inventory[index] = coffee

      await writeInventory(inventory)
      sendJson(response, 200, coffee)
    } catch {
      sendJson(response, 400, { error: 'Invalid coffee data' })
    }

    if (request.method === 'GET') {
      const distPath = resolve(process.cwd(), 'dist')
      const pathname = new URL(request.url, 'http://localhost').pathname

      const requestedPath = resolve(
        distPath,
        `.${decodeURIComponent(pathname)}`
      )

      if (
        requestedPath === distPath ||
        requestedPath.startsWith(distPath + sep)
      ) {
        try {
          const fileInfo = await stat(requestedPath)

          if (fileInfo.isFile()) {
            const mimeTypes = {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.ico': 'image/x-icon',
              '.woff2': 'font/woff2',
            }

            response.writeHead(200, {
              'Content-Type':
                mimeTypes[extname(requestedPath)] ||
                'application/octet-stream',
            })

            response.end(await readFile(requestedPath))
            return
          }
        } catch {
          // Fall through to the app shell or 404.
        }
      }

      if (!pathname.startsWith('/api/')) {
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(await readFile(resolve(distPath, 'index.html')))
        return
      }
    }

    return
  }

  sendJson(response, 404, { error: 'Not found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Coffee app running on port ${port}`)
})
