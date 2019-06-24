
import { get as getColor } from 'color-string'

// Teste si une chaîne représente une couleur hexa
export function isColor(str?: string): boolean {
    return typeof str === 'string' && getColor(str) !== null
}

// Teste si une chaîne représente un style
const styles: Record<string, boolean> = { bold: true, italic: true, underline: true }
export function isStyle(str?: string): boolean {
    return typeof str === 'string' && (new Set(str.split(/\W+/).filter(w => styles[w])).size) <= 3
}

// Teste si une valeur est un objet
// https://webbjocke.com/javascript-check-data-types/
export function isObject(x?: any): boolean {
    return typeof x === 'object' && x !== null && (x.constructor === undefined || x.constructor === Object)
}
