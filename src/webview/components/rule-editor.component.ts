
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
    rule: IEditableRule
    onUpdate: Utils.ExpressionBinding

    // Met à jour notre modèle quand celui du parent change
    $onChanges(changes: ng.IOnChangesObject) {
        if (changes.rule) {

            // Copie le nouveau réglage
            this.rule = angular.copy(changes.rule.currentValue)
        }
    }

    // Met à jour notre modèle quand celui des enfants change
    foregroundChanged(foreground: string) {
        this.rule.settings.foreground = foreground
        this.notifyParent()
    }

    backgroundChanged(background: string) {
        this.rule.settings.background = background
        this.notifyParent()
    }

    fontStyleChanged(fontStyle: string) {
        this.rule.settings.fontStyle = fontStyle
        this.notifyParent()
    }

    flagsChanged() {
        // if (this.rule.flags.setForeground && !this.rule.settings.foreground) { this.rule.settings.foreground = '' }
        // if (this.rule.flags.setBackground && !this.rule.settings.background) { this.rule.settings.background = '' }
        // if (this.rule.flags.setFontStyle  && !this.rule.settings.fontStyle)  { this.rule.settings.fontStyle = ''  }
        this.notifyParent()
    }

    // Met à jour le modèle parent quand le nôtre a changé
    notifyParent() {
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
