
import * as angular from 'angular'
import { IEditableRule } from '../../../settings';

export const RuleEditorControllerBindings = {
    rule: '<',
    onUpdate: '&'
}

export class RuleEditorController implements ng.IController {
    // Bindings
    public rule!: IEditableRule
    public onUpdate!: ngComponentEventBinding

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
