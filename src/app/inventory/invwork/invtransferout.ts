import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';
import { DataService } from '../../services/data.service';

@Component({
    selector: 'invtransferout',
    templateUrl: './invtransferout.html'
})
export class invtransferout implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    currAction = '';
    
    constructor(public appH: appHelperService, private DataSvc: DataService) {}
    
    async ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'XO'; // Transfer-Out
        this.invwork.OptNewAfterPost = false;
        this.invwork.sostatus = "T";

        setTimeout(() => {
            // Add custom buttons
            this.invwork.bar01.navProperties['buttons'].push({name: 'Set-To-Ship', style: 'secondary', action: 'customAction', function: 'setShipped', show: true});
        }, 0);
    }

    setShipped() {
        if (!this.invwork.validEntry()) return;

        if (this.invwork.invworkheaders.items[0].fstatus !== 'T') {
            this.appH.toastr('Only In-Transfer Orders can be Ship.', 'warning', '', true, true);
            return;
        }

        // Flag an Update Order
        this.currAction = 'S';
        this.invwork.invworkheaders.items[0].ts = new Date(); // Force to update if nothing changed
        this.invwork.update();
    }

    allowToUpdate(rowH) {
        return (rowH.fstatus == 'T'); // In-Transfer Only
    }

    InUpdate() {
        if (this.currAction == 'S') {
            this.invwork.invworkheaders.items[0].fstatus = 'S'; // Shipped
            this.currAction = '';
        }
    }
}
        