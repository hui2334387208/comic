export function success(data: any = null, message = 'success', code = 200) {
  return { code, message, data }
}

export function fail(message = 'error', code = 500, data: any = null) {
  return { code, message, data }
}
