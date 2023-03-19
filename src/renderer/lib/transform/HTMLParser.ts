import * as HTMLParser2 from 'htmlparser2'
import renderHTML, { DomSerializerOptions } from 'dom-serializer';
import * as DomHandler from 'domhandler';
import { parse } from 'html-to-ast'

import { IModules, ITransform, TransformToHTMLConfig, TransformToHTMLResult } from './type';
import { ERROR_MESSAGE } from './const';

export const HTMLParserKey = Symbol.for('HTMLParser')
export class HTMLParser implements IModules {
  tr: ITransform

  originDomHandler = DomHandler
  originParser = HTMLParser2

  cache = {}

  constructor(tr: ITransform) {
    this.init(tr)
  }

  init(tr: ITransform) {
    this.tr = tr

    if (!Reflect.has(tr, 'HTMLParser')) {
      this.tr.HTMLParser = this;

      this.exportAPI(tr)
    } else {
      throw new Error('挂载失败，重复使用 key')
    }
  }

  exportAPI(tr: ITransform) {
    tr.transformHTML = this.transformHTML.bind(this)
    tr.setHTMLParserCache = this.setCache.bind(this)
    tr.getHTMLParserCache = this.getCache.bind(this)
  }

  descendants(ast: any, callback: Function) {
    for (let i = 0; i < ast.length; i ++) {
      const node = ast[i]
      const keepOn = callback(node, i, ast)

      if (keepOn !== false) {
        if (node.children && node.children.length) {
          this.descendants(node.children, callback)
        }
      }
    }
  }

  toHTML(nodes, options: DomSerializerOptions) {
    return renderHTML(nodes, options)
  }

  HTMLToAST(html: string) {
    return new Promise((resolve, reject) => {
      const handler = new this.originParser.DomHandler((error, dom) => {
        if (error) reject(error); else resolve(dom);
      });

      const parser = new this.originParser.Parser(handler);
      parser.write(html);
      parser.end();
    });
  }

  ASTToHTML(ast: any) {
    let html = ''

    for (const item of ast) {
      if (item.type === 'text') {
        html += item.data
      }

      if (item.type === 'tag') {
        html += '<' + item.name

        if (item.attribs) {
          Object.keys(item.attribs).forEach((attr) => {
            html += ` ${attr}='${item.attribs[attr]}'`
          });
        }

        html += '>'

        if (item.children && item.children.length) {
          html += this.ASTToHTML(item.children);
        }

        html += `</${item.name}>`
      }
    }

    return html
  }

  parseASTFromHTML(html: string): any {
    if (parse) {
      return parse(html)
    }
    return null
  }

  parse(ast) {
    const rulesModule = this.tr.Rules

    if (!rulesModule) throw new Error('是否缺少 rules 配置')

    const { rules, unableRules } = rulesModule

    let support = true;
    for (const unableRule of unableRules) {
      const unable = this.originParser.DomUtils.findAll(unableRule.test, ast)
      if (unable.length) {
        support = false;
        break;
      };
    }

    const parseMap = {}
    if (support) {
      for (const rule of rules) {
        parseMap[rule.name] = []
        parseMap[rule.name].push(...this.originParser.DomUtils.findAll(rule.test, ast))
      }
    }

    return {
      result: parseMap,
      support: support
    }
  }

  setCache(obj = {}) {
    this.cache = {}

    this.cache = {
      ...obj
    }
  }

  getCache() {
    return this.cache
  }

  async transformHTML(html: string, config: TransformToHTMLConfig = {}, options: DomSerializerOptions): Promise<TransformToHTMLResult> {

    if (config.cache) this.setCache(config.cache)

    const nodes = await this.HTMLToAST(html)
    const ret = this.parse(nodes)
    const { Rules } = this.tr;

    if (!Rules) throw new Error('缺少 Rules 解析')

    if (!ret.support) return { status: ERROR_MESSAGE.UNSUPPORTED }

    const { result } = ret

    const process: Promise<any>[] = []
    for (const key of Object.keys(result)) {
      for (const item of result[key]) {
        process.push(Rules.rulesMap[key].postprocessing(item, this.tr))
      }
    }

    const processResult = await Promise.allSettled(process)
    this.setCache()

    const tasks = processResult.filter(task => task.status === 'rejected' || task.value === false)
    if (tasks.length) return { status: ERROR_MESSAGE.FAILED, tasks }

    if (config.beforeToHTML && typeof config.beforeToHTML === 'function') {
      config.beforeToHTML(this.tr, nodes)
    }

    return {
      status: 'fulfilled',
      content: this.toHTML(nodes, options)
    }
  }
}
