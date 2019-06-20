
import * as angular from 'angular'
import { RuleEditorComponent, ColorEditorComponent, FontStyleEditorComponent } from './components'
import { SettingsService, ExtensionService } from './services'
import { MainController } from './controllers'

import './index.html'
import './index.css'

// Enregistre nos composants
const lib = angular.module('webview-components', [ 'ngSanitize' ])
FontStyleEditorComponent.register(lib)
ColorEditorComponent.register(lib)
RuleEditorComponent.register(lib)

// Crée l'app avec ses services et ses contrôleurs
const app = angular.module('wowbundle', [ 'webview-components' ])
ExtensionService.register(app)
SettingsService.register(app)
MainController.register(app)

// angular refuse de s'auto-initialiser parce qu'il ne connaît pas le protocole vscode-ressource:,
// donc on le bootstrape à la main.
angular.element(document).ready( () => {
    angular.bootstrap(document, [ 'wowbundle' ], { strictDi: true })
})
