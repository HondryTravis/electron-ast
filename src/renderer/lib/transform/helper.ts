export function asyncCompose(...callbacks: Function[]): any {
  const allIsFunction = callbacks.every((fn) => typeof fn === 'function')

  if (!allIsFunction) {
    throw new TypeError('callback must be composed of functions!')
  }

  return function (context, next) {
    let index = -1
    return dispatch(0)

    function dispatch(pid: number) {
      if (pid <= index) return Promise.reject(new Error('next() called multiple times'))
      index = pid

      let callback = callbacks[pid]

      if (pid === callbacks.length) callback = next
      if (!callback) return Promise.resolve()

      try {
        return Promise.resolve(callback(context, dispatch.bind(null, pid + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

export function composeLeft(...callbacks: Function[]) {
  if (callbacks.length === 0) return (...args: Parameters<any>) => [...args]
  if (callbacks.length === 1) return callbacks[0]

  return callbacks.reduce((prev, next) => (...args: Parameters<any>) => next(prev(...args)));
}
