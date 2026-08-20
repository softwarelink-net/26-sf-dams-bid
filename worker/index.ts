/**
 * Cloudflare Worker — allworld
 * 多站点 R2 静态托管 + 26-sf-dams-bid (D1/R2/ASSETS) 主机分流
 */
import { handleApi } from '../functions/[[path]].js'

export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SITES: R2Bucket
  ASSETS: Fetcher
  TTP_SITE?: Fetcher
  PROJECT_SLUG: string
  DEPLOYMENT_HOST: string
  ROOT_DOMAIN: string
}

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

function siteIdFromHost(hostname: string, rootDomain: string): string {
  const host = hostname.toLowerCase()
  const root = rootDomain.toLowerCase()
  if (host === root) return '_root'
  if (host === `www.${root}`) return 'www'
  if (host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1))
  return host
}

function isProjectHost(hostname: string, env: Env): boolean {
  const host = hostname.toLowerCase()
  const root = (env.ROOT_DOMAIN || 'softwarelink.net').toLowerCase()
  const slug = (env.PROJECT_SLUG || '26-sf-dams-bid').toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) return true
  if (host.endsWith('.workers.dev')) return true
  return host === `${slug}.${root}` || host.startsWith(`${slug}.`)
}

function contentTypeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    json: 'application/json; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    ico: 'image/x-icon',
    txt: 'text/plain; charset=utf-8',
    map: 'application/json',
    xml: 'application/xml; charset=utf-8',
    woff: 'font/woff',
    woff2: 'font/woff2',
  }
  return map[ext] || 'application/octet-stream'
}

function emptySitePage(siteId: string): Response {
  if (siteId === '_root' || siteId === 'www') {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>allworld · softwarelink.net</title>
  <style>
    :root { --ink:#0f172a; --muted:#64748b; --bg:#f8fafc; }
    body { margin:0; font-family:"Segoe UI",system-ui,sans-serif; color:var(--ink);
      background: radial-gradient(1000px 500px at 0% 0%,#e0f2fe,transparent 55%),
                  radial-gradient(800px 400px at 100% 0%,#fef3c7,transparent 50%), var(--bg);
      min-height:100vh; }
    main { max-width:42rem; margin:0 auto; padding:4rem 1.25rem; }
    h1 { font-size:clamp(2rem,5vw,3rem); letter-spacing:-0.04em; margin:0 0 .75rem; }
    p,li { color:var(--muted); line-height:1.7; }
    code { background:#e2e8f0; padding:.15em .4em; border-radius:4px; font-size:.92em; }
    a { color:#0284c7; }
  </style>
</head>
<body>
  <main>
    <h1>allworld</h1>
    <p>softwarelink.net 多站点边缘托管入口（Worker <code>allworld</code> + R2 <code>allworld-sites</code>）。</p>
    <ul>
      <li>子域站点：<code>{site}.softwarelink.net</code> → R2 前缀 <code>{site}/</code></li>
      <li>陕飞数字档案：<a href="https://26-sf-dams-bid.softwarelink.net/">26-sf-dams-bid.softwarelink.net</a></li>
    </ul>
  </main>
</body>
</html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${siteId}</title>
  <style>
    body { margin:0; font-family:system-ui,sans-serif; background:#f8fafc; color:#0f172a;
      min-height:100vh; display:grid; place-items:center; }
    main { max-width:36rem; padding:2rem; }
    h1 { margin:0 0 .5rem; letter-spacing:-0.03em; }
    p { color:#64748b; line-height:1.6; }
    code { background:#e2e8f0; padding:.1em .35em; border-radius:4px; }
  </style>
</head>
<body>
  <main>
    <h1>${siteId}</h1>
    <p>R2 尚无静态文件。上传静态产物或访问项目专属子域。</p>
  </main>
</body>
</html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function serveR2Site(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const siteId = siteIdFromHost(url.hostname, env.ROOT_DOMAIN || 'softwarelink.net')

  if (url.pathname === '/api/data/demo' && request.method === 'PUT') {
    return json({ ok: true, site: siteId, message: 'demo accepted' })
  }
  if (url.pathname.startsWith('/api/')) {
    return json({ ok: false, error: 'Not Found' }, 404)
  }

  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/')) pathname += 'index.html'
  if (pathname === '') pathname = '/index.html'

  const candidates = [
    `${siteId}${pathname}`,
    `${siteId}${pathname}.html`,
    `${siteId}${pathname}/index.html`,
    `${siteId}/index.html`,
  ]

  for (const key of candidates) {
    const obj = await env.SITES.get(key)
    if (!obj) continue
    const headers = new Headers()
    headers.set('Content-Type', obj.httpMetadata?.contentType || contentTypeFor(key))
    if (obj.httpEtag) headers.set('ETag', obj.httpEtag)
    return new Response(obj.body, { headers })
  }

  if (!pathname.split('/').pop()?.includes('.')) {
    const indexObj = await env.SITES.get(`${siteId}/index.html`)
    if (indexObj) {
      return new Response(indexObj.body, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  }

  return emptySitePage(siteId)
}

async function serveProjectStorage(request: Request, env: Env): Promise<Response | null> {
  if (!env.STORAGE) return null
  const url = new URL(request.url)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname.endsWith('/') || pathname === '') pathname = '/index.html'
  const key = pathname.replace(/^\//, '')
  const slug = env.PROJECT_SLUG || '26-sf-dams-bid'
  const keys = [key, `${slug}/${key}`]
  if (!key.includes('.')) keys.push('index.html', `${slug}/index.html`)

  for (const candidate of keys) {
    const obj = await env.STORAGE.get(candidate)
    if (!obj) continue
    const headers = new Headers()
    headers.set('Content-Type', obj.httpMetadata?.contentType || contentTypeFor(candidate))
    if (obj.httpEtag) headers.set('ETag', obj.httpEtag)
    return new Response(obj.body, { headers })
  }
  return null
}

async function serveCachedStatic(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  pathname: string,
): Promise<Response> {
  const cache = caches.default
  const cacheKey = new Request(new URL(pathname, request.url).toString(), {
    method: 'GET',
  })

  const hit = await cache.match(cacheKey)
  if (hit) {
    const headers = new Headers(hit.headers)
    headers.set('X-Cache', 'HIT')
    return new Response(hit.body, { status: hit.status, headers })
  }

  let upstream: Response | null = null
  if (env.ASSETS) {
    upstream = await env.ASSETS.fetch(request)
  }
  if (!upstream || upstream.status >= 400) {
    const fromR2 = await serveProjectStorage(request, env)
    if (fromR2) upstream = fromR2
  }
  if (!upstream) {
    return new Response('Not Found', { status: 404 })
  }

  const headers = new Headers(upstream.headers)
  if (pathname.endsWith('.xml')) {
    headers.set('Content-Type', 'application/xml; charset=utf-8')
  } else if (pathname.endsWith('.txt')) {
    headers.set('Content-Type', 'text/plain; charset=utf-8')
  }
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  headers.set('X-Cache', 'MISS')

  const response = new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // 通配路由可能抢到 TTP 子域：统一转发给独立 Worker
    if (url.hostname.toLowerCase().startsWith('26-ttp-test-bid.') && env.TTP_SITE) {
      return env.TTP_SITE.fetch(request)
    }

    // 站点地图 / robots 优先走边缘缓存，避免每次冷启动 Worker
    if (
      isProjectHost(url.hostname, env) &&
      (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt')
    ) {
      return serveCachedStatic(request, env, ctx, url.pathname)
    }

    if (isProjectHost(url.hostname, env)) {
      if (url.pathname.startsWith('/api/')) {
        try {
          return await handleApi(request, env)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal error'
          return json({ ok: false, error: message }, 500)
        }
      }
      if (env.ASSETS) {
        return env.ASSETS.fetch(request)
      }
      const fromR2 = await serveProjectStorage(request, env)
      if (fromR2) return fromR2
      return new Response('ASSETS binding not configured', { status: 500 })
    }

    try {
      return await serveR2Site(request, env)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      return json({ ok: false, error: message }, 500)
    }
  },
}
