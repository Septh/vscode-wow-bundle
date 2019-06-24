
import { get as isColor } from 'color-string'

export const ColorEditorControllerBindings = {
    color: '<',
    disabled: '<ngDisabled',
    onUpdate: '&'
}

export class ColorEditorController implements ng.IController {

    // Bindinds
    public color?: string
    public disabled?: boolean
    public onUpdate!: ngComponentEventBinding

    // Utilisé par le template html
    get cssSafeColor() {
        return this.color && isColor(this.color) ? this.color : 'transparent'
    }

    get isPickerShown() {
        return false
    }

    // Constructeur
    public static readonly $inject = ['$element']
    constructor(private $element: JQLite) {}

    // Ajuste la largeur des boutons à la hauteur de l'input pour obtenir des boutons carrés
    public $postLink() {
        const input = this.$element.find('input')
        const inputStyle = getComputedStyle(input[0])

        // On ne peut pas lire directement la hauteur de l'input, car si le composant est caché
        // (par exemple dans un <details> fermé), sa hauteur vaut 'auto'. D'où l'addition des propriétés
        // et le passage par calc() pour éviter d'interpréter nous-mêmes les unités css.
        // NB: l'input DOIT avoir ses propriétés initialisées à des valeurs numériques (pas de mot-clé genre 'inherit'),
        //     ce qui est fait dans le css de ce composant.
        const inputHeight = ['line-height', 'border-bottom-width', 'border-top-width', 'padding-bottom', 'padding-top']
            .map(prop => inputStyle.getPropertyValue(prop))
            .join(' + ')
        this.$element.find('button').css('width', `calc(${inputHeight})`)
    }

    // Met à jour notre modèle quand celui du parent change
    public $onChanges(changes: ng.IOnChangesObject) {
        if (changes.disabled) {
            this.disabled = changes.disabled.currentValue
        }
        if (changes.color) {
            this.color = changes.color.currentValue
        }
    }

    // Met à jour notre modèle quand celui des enfants a changé
    public clear() {
        this.color = ''
        this.colorChanged()
    }
    public colorChanged() {
        this.notifyParent()
    }
    // Met à jour le modèle parent quand le nôtre a changé, mais seulement s'il est valide
    public notifyParent() {
        this.onUpdate({ color: this.color })
    }
}

export const validateColorDirective: ng.IDirectiveFactory = () => {
    return {
        require: 'ngModel',
        link(_scope, _elm, _attrs, ctrl) {
            ctrl!.$validators.cssColor = function(modelValue: string, viewValue: string) {
                if (ctrl!.$isEmpty(modelValue)) {
                    return true
                }
                return viewValue.match(/^[a-zA-Z]+$/) && isColor(viewValue)
            }
        }
    }
}
