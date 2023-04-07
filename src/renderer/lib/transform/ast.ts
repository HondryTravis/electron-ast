
/// @description AST 核心实现解析，这里只是做了一个完整未通过所有测试的 demo，具体实现还是使用了 html-to-ast
// 实现思路
// 1. 状态机
// 主要采用标记化算法的思路，解析器内部维护一个状态机；
// 解析流程会遍历 html 字符串，随着索引 index 的后移，状态机 status 会更新现在所处的解析状态；
// 根据不同的解析状态使用不同的解析方法，当前解析状态完成后，再进入下一个解析状态；
// 如此循环往复解析完整个树。

// 例如：
// 当解析到 div 标签的时候，此时状态机为解析标签名
// 当解析到 html 属性时，此时状态机为解析属性名
// 当解析到闭合标签时，此时状态机为关闭标签

// 2. 栈
// 由于 html 标签是前后对应的，因此使用栈来保存标签 tag 节点
// 解析到开始标签则压栈，解析到结束标签则弹栈。例如解析到 <div> 时压栈，解析到 </div> 时则弹栈；
// 如果解析完毕最后栈不为空则说明标签没有闭合，缺少结束标签；

// 具体详细实现参考链接: https://blog.csdn.net/Alan_1550587588/article/details/80297765

// usage:
// const html = '<div>hello world</div>';
// const parser = ParseHTML.of(html)
// const ret = parser.handleParse()

// e.g.

// {
//   "tag": "div",
//   "text": "hello world!"
// }


interface IAstNode {
  /**
   * 标签名称
   */
  tag: string

  /**
   * 常规 node 节点属性 attribute map
   */
  attribute: Record<string, string>

  /**
   * 当前节点文字
   */
  text: string

  /**
   * 如果当前节点存在子节点集合
   */
  children: Array<IAstNode> | []
}

interface IParseHTML {
  /**
   * 当前需要解析的 HTML
   */
  html: string

  /**
   * 当前状态机状态
   */
  status: string

  /**
   * 当前处理的游标，解析的位置
   */
  index: number

  /**
   * 当前解析的标签栈
   */
  tagStack: AstNode[]

  /**
   * 当前解析的 text 文本
   */
  text: string

  /**
   * 当前解析的 tagName
   */
  tagName: string

  /**
   * 当前解析使用的正则表达式
   */
  REG_EXP: Record<string, (...args: any[]) => boolean>

  /**
   * 当前解析的 node 节点
   */
  node: AstNode | null

  /**
   * 当前节点实现的 currentNode
   */
  currentNode: AstNode | null

  /**
   * 当前节点属性名称
   */
  attributeName: string

  /**
   * 当前节点属性值
   */
  attributeValue: string

  /**
   * 当前解析预处理
   */
  handlePreprocess(): void;

  /**
   * 解析主流程
   */
  handleParse(): void;

  /**
   * 解析初始状态
   */
  handleParseInit(str: string): void;

  /**
   * 解析开始标签
   */
  handleParseTagStart(str: string, pre: string, next: string): void;

  /**
   * 解析开始标签结束
   */
  handleParseTagEnd(str: string, pre: string, next: string): void;

  /**
   * 打开了一个标签
   */
  handleParseOpenTag(str: string, pre: string, next: string): void;

  /**
   * 解析完成一个标签，关闭
   */
  handleParseCloseTagStart(str: string, pre: string, next: string): void;

  /**
   * 解析结束标签结束
   */
  handleParseCloseTagEnd(str: string, pre: string, next: string): void;

  /**
   * 开始解析属性
   */
  handleParseAttributeStart(str: string, pre: string, next: string): void;

  /**
   * 解析属性值开始
   */
  handleParseAttributeValue(str: string, pre: string, next: string): void;

  /**
   * 解析属性结束
   */
  handleParseAttributeEnd(str: string, pre: string, next: string): void;

  /**
   * 获取栈顶
   */
  peek(): AstNode
}

const INIT = 'init';                        // 初始状态
const TAG_START = 'tagStart';               // 解析开始标签
const ATTRIBUTE_START = 'attributeStart';   // 开始解析属性
const ATTRIBUTE_VALUE = 'attributeValue';   // 解析属性值
const ATTRIBUTE_END = 'attributeEnd';       // 解析一个属性结束
const TAG_END = 'tagEnd';                   // 解析开始标签结束
const OPEN_TAG = 'openTag';                 // 打开了一个标签
const CLOSE_TAG = 'closeTag';               // 解析完成一个标签，关闭
const CLOSE_TAG_START = 'closeTagStart';    // 开始解析结束标签
const CLOSE_TAG_END = 'closeTagEnd';        // 解析结束标签结束

const REG_MAP = {
  isLetter: /[a-zA-Z]/,
  isEmpty: /[\s\n]/,
};

const REG_EXP = {};

Object
.keys(REG_MAP)
.forEach(key => {
  const reg = REG_MAP[key];
  REG_EXP[key] = (s) => reg.test(s);
});

export class AstNode implements IAstNode {

  tag: string

  attribute: Record<string, string>

  text: string

  children: Array<AstNode>

  constructor({ tag }) {
    this.tag = tag;
    this.attribute = {};
    this.text = '';
    this.children = [];
  }
}

export class ParseHTML implements IParseHTML {
  static of(html: string) {
    return new ParseHTML(html)
  }

  html: string;
  status: string;
  index: number
  tagStack: AstNode[]
  text: string;
  tagName: string
  REG_EXP: Record<string, (...args: any[]) => boolean>
  node: AstNode | null
  parentNode: AstNode | null
  currentNode: AstNode | null
  attributeName: string
  attributeValue: string

  constructor(html: string) {
    this.html = html;
    this.status = 'init';
    this.index = 0;
    this.tagStack = [];
    this.text = '';
    this.tagName = '';
    this.REG_EXP = REG_EXP;
    this.node = null;
    this.currentNode = null;
    this.attributeName = '';
    this.attributeValue = '';
  }

  handlePreprocess() {
    this.html = this.html.replace(/\n[ ]+/g, '');
    this.html = this.html.replace(/\n/g, '');
    this.html = this.html.replace(/[ ]+/g, ' ');
    this.html = this.html.replace(/<[\s]+/g, '<');
    this.html = this.html.replace(/[\s]+>/g, '>');
    this.html = this.html.replace(/[\s]+\/>/g, '/>');
    this.html = this.html.replace(/[\s]*=[\s]*"/g, '="');
  }

  handleParse() {
    this.handlePreprocess();
    for (this.index = 0; this.index < this.html.length; this.index++) {
      const s = this.html[this.index];
      const pre = this.html[this.index - 1];
      const next = this.html[this.index + 1];

      switch (this.status) {
        case INIT:
          this.handleParseInit(s);
          break;
        case TAG_START:
          this.handleParseTagStart(s, pre, next);
          break;
        case ATTRIBUTE_START:
          this.handleParseAttributeStart(s, pre, next);
          break;
        case ATTRIBUTE_VALUE:
          this.handleParseAttributeValue(s, pre, next);
          break;
        case ATTRIBUTE_END:
          this.handleParseAttributeEnd(s, pre, next);
          break;
        case TAG_END:
          this.handleParseTagEnd(s, pre, next);
          break;
        case OPEN_TAG:
          this.handleParseOpenTag(s, pre, next);
          break;
        case CLOSE_TAG_START:
          this.handleParseCloseTagStart(s, pre, next);
          break;
        case CLOSE_TAG_END:
          this.handleParseCloseTagEnd(s, pre, next);
          break;
        default:
          break;
      }
    }
    return this.node;
  }

  handleParseInit(s) {
    if (s === '<') {
      this.status = TAG_START;
    }
  }

  handleParseTagStart(s, pre, next) {
    const handle = () => {
      if (!this.node) {
        this.node = new AstNode({ tag: this.tagName });
        this.currentNode = this.node;
        this.parentNode = null;
      } else {
        this.parentNode = this.currentNode;
        this.currentNode = new AstNode({ tag: this.tagName });
        this.parentNode?.children.push(this.currentNode);
      }
      this.tagStack.push(this.currentNode);
    }
    if (this.REG_EXP.isLetter(s)) {
      // 标签名
      this.tagName += s;
    } else if (this.REG_EXP.isEmpty(s) && this.REG_EXP.isLetter(next)) {
      // 解析属性
      handle();
      this.status = ATTRIBUTE_START;
    }
    if (next === '>') {
      // 开始标签结尾
      handle();
      this.status = TAG_END;
    }

  }

  handleParseAttributeStart(s, pre, next) {
    // if (this.REG_EXP.isLetter(s)) {
    if (s !== '=') {
      this.attributeName += s;
    }
    if (next === ' ' || next === '>' || (next === '/' && this.html[this.index + 2] === '>')) {
      if (this.currentNode) {
        this.currentNode.attribute[this.attributeName] = this.attributeValue;
      }
      this.attributeName = '';
      this.attributeValue = '';
    }
    if (next === ' ') {
      this.status = ATTRIBUTE_END;
    } else if (next === '>' || next === '' || (next === '/' && this.html[this.index + 2] === '>')) {
      this.status = TAG_END;
    } else if (next === '"') {
      this.status = ATTRIBUTE_VALUE;
    }
  }

  handleParseAttributeValue(s, pre, next) {
    if (s !== '"') {
      this.attributeValue += s;
    }
    if (next === '"') {
      if (this.currentNode) {
        this.currentNode.attribute[this.attributeName] = this.attributeValue;
      }
      this.attributeName = '';
      this.attributeValue = '';
      this.status = ATTRIBUTE_END;
    }
  }

  handleParseAttributeEnd(s, pre, next) {
    if (this.REG_EXP.isEmpty(s)) {
      this.status = ATTRIBUTE_START;
    }
    if (next === '>') {
      this.status = TAG_END;
    }
  }

  handleParseTagEnd(s, pre, next) {
    if (pre === '/' && s === '>') {
      // 自闭合标签
      this.status = CLOSE_TAG_END;
      this.index--;// 回退一步，使关闭标签的索引落在>上以便正常解析
      return;
    }
    if (s === '>') {
      this.tagName = '';
      this.status = OPEN_TAG;
    }
  }

  handleParseOpenTag(s, pre, next) {
    if (s === '<') {
      if (next === '/') {
        this.status = CLOSE_TAG_START;
      } else {
        this.status = TAG_START;
      }
    } else {
      if (this.currentNode) {
        this.currentNode.text += s;
      }
    }
  }

  handleParseCloseTagStart(s, pre, next) {
    if (this.REG_EXP.isLetter(s)) {
      // if (s !== '>' && s !== '/') {
      this.tagName += s;
    } else if (this.REG_EXP.isEmpty(s)) {
      throw new Error('解析闭合标签失败: ' + this.tagName);
    }

    if (next === '>') {
      this.status = CLOSE_TAG_END;
    }
  }

  handleParseCloseTagEnd(s, pre, next) {
    if (s === '>') {
      const stackTop = this.peek();
      if (stackTop.tag === this.tagName) {
        deleteEmptyProp(stackTop);
        this.tagStack.pop();
        this.currentNode = this.peek();
        this.tagName = '';
        this.status = OPEN_TAG;
      } else {
        throw new Error('标签不能闭合: ' + this.tagName);
      }
    }
    // 删除空属性
    function deleteEmptyProp(node) {
      if (!node.text) {
        delete node.text;
      }
      if (node.children.length === 0) {
        delete node.children;
      }
      if (Object.keys(node.attribute).length === 0) {
        delete node.attribute;
      }
    }
  }

  peek() {
    return this.tagStack[this.tagStack.length - 1];
  }
}
