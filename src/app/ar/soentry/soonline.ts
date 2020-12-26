import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { SoRegisterComponent } from './soregister.component';

@Component({
    selector: 'soonline',
    templateUrl: './soonline.html'
})
export class soonline implements AfterViewInit {
    @ViewChild('soregister', {static: true}) soregister: SoRegisterComponent;
    
    constructor(public appH: appHelperService) {}

    ngOnInit() {
        this.soregister.orderOrigin = 'OL';
        this.soregister.OptOpenDrawer = false;
        this.soregister.OptSetPending = false;
        this.soregister.OptPrintSO = false;
        this.soregister.OptDrwRpt = false;
        this.soregister.Optlastorder = false;
        this.soregister.OptAssignCustomer = false;
        this.soregister.OptShowTax = true;
        this.soregister.OptShowShipping = true;
        this.soregister.OptOrderList = true;
        this.soregister.OptShowPrintMobile = false;
        this.soregister.OptSaveOnPending = true;
    }
    
    ngAfterViewInit() {
    }
}