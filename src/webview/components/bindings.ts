
// Définit la fonction pour les bindings de type '&' :
// - HTML parent  : <composant on-update="$ctrl.valueChanged(param)">
// - TS composant : this.onUpdate( { param: valeur } )
export type ComponentEventBinding = (param: Record<string, any>) => void
