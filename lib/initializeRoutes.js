import * as path from 'path'
import { promises as fs } from 'fs'

const expressHTTPMethods = [
  'all',
  'checkout',
  'copy',
  'delete',
  'get',
  'head',
  'lock',
  'merge',
  'mkactivity',
  'mkcol',
  'move',
  'm-search',
  'notify',
  'options',
  'patch',
  'post',
  'purge',
  'put',
  'report',
  'search',
  'subscribe',
  'trace',
  'unlock',
  'unsubscribe'
]

const resolveBindURI = (name, overrideObject) => {
  if (typeof (overrideObject) === 'string') {
    return overrideObject
  } else {
    if (name.endsWith('.endpoint')) {
      return name.slice(0, -9)
    } else if (name.endsWith('.router')) {
      return name.slice(0, -7)
    }
  }
}

export async function subRouters (router, dir, baseURI = '/') {
  const routesDirectoryFiles = (await fs.readdir(
    dir,
    { withFileTypes: true }
  )).filter((c) => c.isFile() && (c.name.endsWith('.router.js')))
    .map((c) => path.join(c.parentPath, c.name))
  for (const route of routesDirectoryFiles) {
    const parsedRouterModulePath = path.parse(route)
    import(route).then((subRouterModule) => {
      router.use(baseURI + resolveBindURI(parsedRouterModulePath.name, subRouterModule.uriOverride), subRouterModule.default)
    })
  }
}

export async function endpoints (router, dir, baseURI = '/') {
  const endpointsDirectoryFiles = (await fs.readdir(
    dir,
    { withFileTypes: true }
  )).filter((c) => c.isFile() && (c.name.endsWith('.endpoint.js')))
    .map((c) => path.join(c.parentPath, c.name))
  for (const endpoint of endpointsDirectoryFiles) {
    import(endpoint).then((endpointModule) => {
      for (const key of Object.keys(endpointModule).filter((c) => expressHTTPMethods.includes(c))) {
        router[key](baseURI + resolveBindURI(path.parse(endpoint).name, endpointModule.uriOverride), endpointModule[key])
      }
    })
  }
}

export async function initializeAll (router, dir, baseURI = '/') {
  return Promise.all([subRouters(router, dir, baseURI), endpoints(router, dir, baseURI)])
}
