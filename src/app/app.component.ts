import { Component, OnInit } from '@angular/core';
import { SharedService } from './services/shared.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	hourGlassLoading: boolean = false;
	constructor(private sharedSrvc: SharedService) { }

	ngOnInit() {
		// Whenever this chanes it gets notified
		this.sharedSrvc.loaderStatus.subscribe((val: boolean) => {
			this.hourGlassLoading = val;
		});
	}
}
