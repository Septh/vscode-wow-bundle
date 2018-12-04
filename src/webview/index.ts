
import * as angular from 'angular'
import { wbRuleEditorComponent } from './components/rule-editor.component'
import { wbColorEditorComponent } from './components/color-editor.component'
import { wbFontStyleEditorComponent } from './components/fontstyle-editor.component'
import { wbSettingsService } from './services/settings.service'
import { wbExtensionService } from './services/extension.service'
import { wbMainController } from './controllers/MainController'

// Crée la bibliothèque de composants
const lib = angular.module('webview-components', [ 'ngSanitize' ])
wbFontStyleEditorComponent.register(lib)
wbColorEditorComponent.register(lib)
wbRuleEditorComponent.register(lib)

// Crée l'app avec ses services et ses contrôleurs
const app = angular.module('wowbundle', [ 'webview-components' ])
wbExtensionService.register(app)
wbSettingsService.register(app)
wbMainController.register(app)

// angular refuse de s'auto-initialiser parce qu'il ne connaît pas le protocole vscode-ressource:
angular.element(document).ready( () => {
    angular.bootstrap(document, [ 'wowbundle' ], { strictDi: true })
})
