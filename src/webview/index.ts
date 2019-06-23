/**
 * This file is responsible for bootstraping the angular app.
 */

import * as angular from 'angular'
import { AppModule } from './app'

import './index.html'
import './index.css'

const application = angular.module('wowbundle', [ AppModule.name ])

// angular refuse de s'auto-initialiser parce qu'il ne connaît pas le protocole vscode-ressource:,
// donc on le bootstrape à la main.
angular.element(document).ready( () => {
    angular.bootstrap(document, [ application.name ], { strictDi: true })
})
