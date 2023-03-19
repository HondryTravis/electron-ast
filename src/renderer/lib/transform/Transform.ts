import { HTMLParser, HTMLParserKey } from './HTMLParser';
import { Rules, RulesKey } from './Rules'
import { IContainer, INewAble, ITransform } from './type'

export default class Transform implements ITransform {

  static of() {
    return new Transform
  }

  modules: Map<symbol, IContainer>

  constructor() {
    this.modules = new Map<symbol, IContainer>()
    this.presets()
  }

  presets() {
    this.register(HTMLParserKey, HTMLParser)
    this.register(RulesKey, Rules)

    this.init(this)
  }

  init(tr: Transform): void {

    this.modules.forEach((module) => {
      if (!module.instance) {
        module.instance = module.init(tr)
      }
    })
  }

  register<T = any>(namespace: symbol, newFn: INewAble<T>) {
    if (this.modules.has(namespace)) {
      console.error(`重复创建 ${String(namespace)} 模块，请在使用 override 方法覆盖`)
    }

    const init = (tr: Transform) => {
      return new newFn(tr)
    }

    this.modules.set(namespace, {
      init,
      singleton: true
    })
  }

  use(namespace: symbol) {
    if (!this.modules.has(namespace)) {
      throw Error(`缺失 ${String(namespace)} 模块，请调用 Transform 阶段 register() 注册。`)
    }
    const module = this.modules.get(namespace)

    if (!module?.instance) {
      throw Error(`未初始化 ${String(namespace)} 模块，请在 Transform 阶段 init() 之后再调用`)
    }

    return (module.singleton && module.instance) || void 0;
  }

  override<T>(namespace: symbol, newFun: INewAble<T>) {
    this.restore(namespace)
    this.register(namespace, newFun)
  }

  restore(namespace: symbol) {
    this.modules.delete(namespace)
  }
}
