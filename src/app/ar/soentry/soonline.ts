import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { SoRegisterComponent } from './soregister.component';

@Component({
    selector: 'soonline',
    templateUrl: './soonline.html'
})
export class soonline implements AfterViewInit {
    @ViewChild('soonline', {static: true}) soonline: SoRegisterComponent;
    
    constructor(public appH: appHelperService) {}
    
    ngAfterViewInit() {
        this.soonline.orderOrigin = 'OL';
    }
}
        