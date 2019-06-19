
import * as angular from 'angular'
import * as Utils from '../utils'
import { IEditableRule } from '../settings'

export const wbRuleEditorComponent: Utils.NGRegistrable = {
    register: (parent: ng.IModule) => parent.component('wbRuleEditor', RuleEditorComponentOptions)
}

/*****************************************************************************
 * Implémentation du composant
 *****************************************************************************/
class RuleEditorController implements ng.IController {

    // Bindings (données du composant parent)
    public rule!: IEditableRule
    public onUpdate!: Utils.ExpressionBinding

    // Met à jour notre modèle quand celui du parent change
    public $onChanges(changes: ng.IOnChangesObject) {
        if (changes.rule) {

            // Copie le nouveau réglage
            this.rule = angular.copy(changes.rule.currentValue)
        }
    }

    // Met à jour notre modèle quand celui des enfants change
    public foregroundChanged(foreground: string) {
        this.rule.settings.foreground = foreground
        this.notifyParent()
    }

    public backgroundChanged(background: string) {
        this.rule.settings.background = background
        this.notifyParent()
    }

    public fontStyleChanged(fontStyle: string) {
        this.rule.settings.fontStyle = fontStyle
        this.notifyParent()
    }

    public flagsChanged() {
        this.notifyParent()
    }

    // Met à jour le modèle parent quand le nôtre a changé
    public notifyParent() {
        this.onUpdate({ rule: this.rule })
    }
}

const RuleEditorComponentOptions: ng.IComponentOptions = {
    bindings: {
        rule: '<',
        onUpdate: '&'
    },
    controller: RuleEditorController,
    templateUrl: './assets/rule-editor.component.html'
}
