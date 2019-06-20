
import * as angular from 'angular'
import * as Utils from '../../utils'
import { ComponentEventBinding } from '../bindings';
import { IEditableRule } from '../../settings'

import template from './rule-editor.component.html'

/*****************************************************************************
 * Implémentation du composant
 *****************************************************************************/
class RuleEditorController implements ng.IController {

    // Bindings (données du composant parent)
    public rule!: IEditableRule
    public onUpdate!: ComponentEventBinding

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

/*****************************************************************************
 * Exporte le registrar pour ce composant
 *****************************************************************************/
const RuleEditorComponentOptions: ng.IComponentOptions = {
    bindings: {
        rule: '<',
        onUpdate: '&'
    },
    controller: RuleEditorController,
    template
}

export const RuleEditorComponent: Utils.NGRegistrar = {
    register: (parent: ng.IModule) => parent.component('wbRuleEditor', RuleEditorComponentOptions)
}
