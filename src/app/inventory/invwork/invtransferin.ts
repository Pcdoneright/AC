import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../services/appHelper.service';
import { invwork } from './invwork';

@Component({
    selector: 'invtransferin',
    templateUrl: './invtransferin.html'
})
export class invtransferin implements AfterViewInit {
    @ViewChild('invwork', {static: true}) invwork: invwork;
    currAction = '';
    
    constructor(public appH: appHelperService) {}
    
    ngAfterViewInit() {
        this.invwork.parent = this;
        this.invwork.allowNegativeQty = false;
        this.invwork.trxType = 'XO'; // Trasnfer-OUT
        this.invwork.afterRetrieveTrx = true;
        this.invwork.sostatus = "S";
        this.invwork.OptNewAfterPost = false;

        // Add custom buttons
        this.invwork.bar01.navProperties['buttons'].push({name: 'Set-To-Complete', style: 'secondary', action: 'customAction', function: 'setComplete', show: true});
    }

    afterRetrieveTrx() {
        this.invwork.invworkheaders.items[0].flocation2 = (this.invwork.invworkheaders.items[0].flocation2 || this.appH.getUserLocation()); // Assign user location2
        // Update fqty3
        this.invwork.invwork.items.forEach((row) => {
            row.fqty3 = row.fqty2;
        })
    }

    allowToUpdate(rowH) {
        return (rowH.fstatus == 'S'); // 'Ship' Only
    }

    setComplete() {
        if (!this.invwork.validEntry()) return;

        if (this.invwork.invworkheaders.items[0].fstatus !== 'S') {
            this.appH.toastr('Only Shipped Orders can be Complete.', 'warning', '', true, true);
            return;
        }

        // Flag an Update Order
        this.currAction = 'C';
        this.invwork.invworkheaders.items[0].ts = new Date(); // Force to update if nothing changed
        this.invwork.update();
    }

    InUpdate() {
        if (this.currAction == 'C') {
            this.invwork.invworkheaders.items[0].fstatus = 'C'; // Complete trx
            this.currAction = '';
        }
    }
}
