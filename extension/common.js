import browser from 'webextension-polyfill'

export const PERMISSIONS_REQUIRED = {
  getPublicKey: 1,
  signEvent: 10
}

const ORDERED_PERMISSIONS = [
  [1, ['getPublicKey']],
  [10, ['signEvent']]
]

const PERMISSION_NAMES = {
  getPublicKey: 'read your public key',
  signEvent: 'sign events using your private key'
}

export function getAllowedCapabilities(permission) {
  let requestedMethods = []
  for (let i = 0; i < ORDERED_PERMISSIONS.length; i++) {
    let [perm, methods] = ORDERED_PERMISSIONS[i]
    if (perm > permission) break
    requestedMethods = requestedMethods.concat(methods)
  }

  if (requestedMethods.length === 0) return 'nothing'

  return requestedMethods.map(method => PERMISSION_NAMES[method])
}

export function getPermissionsString(permission) {
  let capabilities = getAllowedCapabilities(permission)

  return (
    capabilities.slice(0, -1).join(', ') +
    ' and ' +
    capabilities[capabilities.length - 1]
  )
}

export async function readPermissions() {
  let {permissions = {}} = await browser.storage.local.get('permissions')

  // delete expired
  var needsUpdate = false
  for (let host in permissions) {
    if (
      permissions[host].condition === 'expirable' &&
      permissions[host].created_at < Date.now() / 1000 - 5 * 60
    ) {
      delete permissions[host]
      needsUpdate = true
    }
  }
  if (needsUpdate) browser.storage.local.set({permissions})

  return permissions
}

export async function readPermissionLevel(host) {
  return (await readPermissions())[host]?.level || 0
}

export async function updatePermission(host, permission) {
  browser.storage.local.set({
    permissions: {
      ...((await browser.storage.local.get('permissions').permissions) || {}),
      [host]: {
        ...permission,
        created_at: Math.round(Date.now() / 1000)
      }
    }
  })
}
