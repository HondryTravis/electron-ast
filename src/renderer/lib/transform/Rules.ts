import { IModules, RuleCondition, IRuleModule, ITransform } from './type';

export const RulesKey = Symbol.for('Rules')
export class Rules implements IModules {
  tr: ITransform

  rules: IRuleModule[]

  rulesMap: Record<string, IRuleModule>

  unableRules: IRuleModule[]

  constructor(tr: ITransform) {
    this.rules = []
    this.unableRules = []
    this.rulesMap = {}

    this.init(tr)
  }

  init(tr: ITransform): void {
    this.tr = tr

    if (!Reflect.has(tr, 'Rules')) {
      this.tr.Rules = this;
    } else {
      throw new Error('挂载失败，重复使用 key')
    }
  }

  addRules(...moreRules: IRuleModule[]) {
    this.rules.push(...moreRules)
    this.sort(this.rules)
  }

  removeRule(condition: RuleCondition) {
    this.rules = this.rules.filter(rule => condition(rule))
  }

  addUnableRules(...moreRules: IRuleModule[]) {
    this.unableRules.push(...moreRules)
    this.sort(this.unableRules)
  }

  removeUnableRule(condition: RuleCondition) {
    this.unableRules = this.unableRules.filter(rule => condition(rule))
  }

  sort(rules: IRuleModule[]) {
    rules.sort((prev, cur) => {
      const prevPriority = prev.priority || 0
      const curPriority = cur.priority || 0

      return prevPriority - curPriority
    })

    this.rulesMap = {}
    rules.forEach(rule => this.rulesMap[rule.name] = rule);
  }
}
