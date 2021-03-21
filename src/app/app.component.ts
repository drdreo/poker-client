import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { slideInAnimation } from './shared/animations';

@Component({
	selector: 'poker-root',
	templateUrl: './app.component.html',
	animations: [
		slideInAnimation
	],
})
export class AppComponent {

	prepareRoute(outlet: RouterOutlet) {
		return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
	}
}
