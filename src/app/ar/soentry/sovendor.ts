import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { SoRegisterComponent } from './soregister.component';

@Component({
    selector: 'sovendor',
    templateUrl: './sovendor.html'
})
export class sovendor implements AfterViewInit {
    @ViewChild('soregister', {static: true}) soregister: SoRegisterComponent;
    
    constructor(public appH: appHelperService) {}

    ngOnInit() {
        this.soregister.orderOrigin = 'VS'; // Vendor Sales Order
        this.soregister.OptOpenDrawer = false;
        this.soregister.OptSetPending = false;
        this.soregister.OptDrwRpt = false;
        this.soregister.OptOrderList = true;
        this.soregister.OptShowShipto = true;
        this.soregister.printMobile = true;
        this.soregister.OptShowPrintMobile = false;
        this.soregister.sostatus = 'A'; // Order List show ALL
    }
    
    ngAfterViewInit() {
    }
}