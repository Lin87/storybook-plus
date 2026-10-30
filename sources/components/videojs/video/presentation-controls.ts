import { UIElement } from '@videojs/html';
import { PlayerController } from '@videojs/html/video';

// Gives the application documented access to the preset store, with the same
// connect/disconnect lifecycle as the skin's controls.
class PresentationControls extends UIElement {
    private controller = new PlayerController(this);
    get store() { return this.controller.value; }
}
customElements.define('sbplus-player-state', PresentationControls);
