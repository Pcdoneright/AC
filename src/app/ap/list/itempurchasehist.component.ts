import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';

@Component({
    selector: 'dialog-itempurchasehist',
    templateUrl: './itempurchasehist.component.html',
  })
  export class Itempurchasehist implements AfterViewInit {
    @ViewChild('itemrelg01') itemrelg01: WjFlexGrid;
    gH01:number;

    constructor(public dialogRef: MatDialogRef<Itempurchasehist>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService) {
        //dialogRef['height'] = "95%"; // Force value
        this.gH01 = (window.innerHeight * 0.50) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/PO/GetItemHistory', { pfitem: this.data.fitem })
            .subscribe((results) => {
                this.wjH.gridLoad(this.itemrelg01, results);
                this.CompanySvc.ofHourGlass(false);
            });
    }

    initGrids() {
        // wj-flex-grid
        this.itemrelg01.initialize({
            isReadOnly: true,
            columns: [
                {binding: "fponumber", header: "PO#", width: 100, format: 'D', align: "left"},
                {binding: "freceivedate", header: "Recvd. Date", format: 'MM/dd/yyyy', width: 120},
                {binding: "fprice", header: "Cost", format:'c', width: 100},
                {binding: "fname", header: "Vendor", width: 200},
                {binding: "fitem", header: "Item Number", width: 200},
                {binding: "fvitem", header: "Vendor Item", width: 200},
                {binding: "fdescription", header: "Description", width: 300},
                {binding: "fqty", header: "Qty", width: 100},
                {binding: "freceivedqty", header: "Received", width: 100}
            ]
        });
        this.wjH.gridInit(this.itemrelg01, true);
    }
  }