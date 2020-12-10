import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { SoRegisterComponent } from './soregister.component';

@Component({
    selector: 'soquick',
    templateUrl: './soquick.html'
})
export class soquick implements AfterViewInit {
    @ViewChild('soregister', {static: true}) soregister: SoRegisterComponent;
    
    constructor(public appH: appHelperService) {}

    ngOnInit() {
        this.soregister.orderOrigin = 'SO';
        this.soregister.OptOpenDrawer = false;
        this.soregister.OptSetPending = false;
        this.soregister.OptPrintSO = false;
        this.soregister.OptDrwRpt = false;
        this.soregister.Optlastorder = true;
        this.soregister.OptAssignCustomer = true;
        this.soregister.OptShowTax = false;
        this.soregister.OptShowShipping = false;
    }
    
    ngAfterViewInit() {
    }
}
        