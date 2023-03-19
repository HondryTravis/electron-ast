import { ERROR_MESSAGE } from "./const";

/**
 * 模块必须要实现 init 方法
 */
export interface IModules {
  init(...args: any[]): void;
}

/**
 * 表示是构造函数类型
 */
export type INewAble<T> = new (...args: any[]) => T;

/**
 * 一个注册再 modules 中的模块
 */
export interface IContainer {
  /**
   * 初始化模块
   * @param args 可以接受容器传入的参数，一般是容器自身
   */
  init(...args: any[]): any;

  /**
   * 是否是单例模式
   * @default true
   */
  singleton: boolean;

  /**
   * 当前模块初始化后的实例，一般通过 ITransform.use 时返回
   */
  instance?: any;
}


/**
 * 当前转换模块容器
 */
export interface ITransform {
  [key: PropertyKey]: any;
  /**
   * 默认容器注册的模块都会在这里
   */
  modules: Map<symbol, IContainer>;

  /**
   * ?可能会默认挂载的属性
   */
  HTMLParser?: any;

  /**
   * ?可能会默认挂载的属性
   */
  Rules?: any;

  /**
   * 预设函数
   */
  presets(): void;

  /**
   * 容器初始化
   */
  init(tr: ITransform, ...args: any[]): void;

  /**
   * 注册一个新的模块
   * @param namespace 当前注册模块的名称
   * @param newFn 当前函数的构造函数
   */
  register<T = any>(namespace: symbol, newFn: INewAble<T>): void;

  /**
   * 使用已经注册过的模块
   * @param namespace 模块的名称
   */
  use(namespace: symbol): any;

  /**
   * 覆盖已经存在的模块
   * @param namespace 当前注册模块的名称
   * @param newFun 当前函数的构造函数
   */
  override<T>(namespace: symbol, newFun: INewAble<T>): void;

  /**
   * 删除某个模块
   * @param namespace 当前注册模块的名称
   */
  restore(namespace: symbol): void;
}

export interface IRuleModule {

  /**
   * 当前解析规则的名称，会被用来做唯一 key 做 map
   */
  name: string,

  /**
   * 优先级，rules 规则会被排序到靠前的位置，默认是 0
   */
  priority?: number;

  /**
   * 测试当前 node 节点是否可以通过匹配
   * @param node ast node 节点
   */
  test(node): boolean;

  /**
   * 用于解析 test 匹配的结果
   * @param node 当前解析 test 匹配的 node
   * @param tr 当前 ITransform 对象
   */
  postprocessing(node, tr: ITransform): Promise<any>
}

/**
 * 解析规则判断条件
 */
export type RuleCondition = (rule: IRuleModule) => boolean;

/**
 * 用户 km 解析 html 的返回结果
 */
export type TransformToHTMLResult = {
  /**
   * 转换功能状态
   */
  status: ERROR_MESSAGE.FAILED | ERROR_MESSAGE.UNSUPPORTED | 'fulfilled'

  /**
   * 转换成功，即存在 content 属性
   */
  content?: string,

  /**
   * 转换失败，即存在 tasks 属性，携带失败处理结果
   */
  tasks?: {}[]
}

export type TransformToHTMLConfig = {
  /** 最后在转换为 html 前的处理
   * @param tr 当前 Transform 对象
   * @param nodes 当前 ast 树 nodes 节点
   */
  beforeToHTML?(tr: ITransform, nodes): boolean | void;

  /**
   * 执行函数期间需要的缓存参数，一般在执行本轮任务执行结束时清理
   */
  cache?: Record<string, any>
}
