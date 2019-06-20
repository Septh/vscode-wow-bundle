
import * as Utils from '../../utils'
import { ComponentEventBinding } from '../bindings';

import template from './fontstyle-editor.component.html'

/*****************************************************************************
 * Implémentation du composant
 *****************************************************************************/

// Styles supportés
type TStyleName = 'bold' | 'italic' | 'underline'
type TFontStyles = {
    [ style in TStyleName ]: boolean
}

const BOLD_REGEX = /\bbold\b/i
const ITALIC_REGEX = /\bitalic\b/i
const UNDERLINE_REGEX = /\bunderline\b/i

// Contrôleur du composant
class FontStyleEditorController implements ng.IController {

    // Bindinds
    public style!: string
    public disabled!: boolean
    public onUpdate!: ComponentEventBinding

    // Autres
    public styles: TFontStyles = {
        bold: false,
        italic: false,
        underline: false
    }

    // Met à jour notre modèle quand celui du parent change
    public $onChanges(changes: ng.IOnChangesObject) {
        if (changes.disabled) {
            this.disabled = changes.disabled.currentValue
        }
        if (changes.style) {
            this.style = changes.style.currentValue

            this.styles.bold = BOLD_REGEX.test(this.style!)
            this.styles.italic = ITALIC_REGEX.test(this.style!)
            this.styles.underline = UNDERLINE_REGEX.test(this.style!)
        }
    }

    // Met à jour notre modèle quand celui des enfants change
    public styleChanged() {
        this.style = Object.keys(this.styles).filter( k => this.styles[k as TStyleName] ).join(' ')
        this.notifyParent()
    }

    // Met à jour le modèle parent quand le nôtre a changé
    public notifyParent() {
        this.onUpdate({ fontStyle: this.style })
    }
}

/*****************************************************************************
 * Exporte le registrar pour ce composant
 *****************************************************************************/
const FontStyleEditorComponentOptions: ng.IComponentOptions = {
    bindings: {
        style: '<fontstyle',
        disabled: '<ngDisabled',
        onUpdate: '&'
    },
    controller: FontStyleEditorController,
    template
}

export const FontStyleEditorComponent: Utils.NGRegistrar = {
    register: (parent: ng.IModule) => parent.component('wbFontstyleEditor', FontStyleEditorComponentOptions)
}
