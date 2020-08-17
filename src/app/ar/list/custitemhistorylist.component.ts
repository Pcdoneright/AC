import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";

@Component({
    selector: 'dialog-custitemhistorylist',
    templateUrl: './custitemhistorylist.component.html',
  })
  export class CustItemHistoryList implements AfterViewInit {
    @ViewChild('custitemhlistg01') itemlistg01: WjFlexGrid;
    gH01:number;
    
    constructor(public dialogRef: MatDialogRef<CustItemHistoryList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        this.gH01 = (window.innerHeight * 0.70) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/SO/GetItemHistory', {pfitem: this.data.fitem, pfcid: this.data.fcid})
            .subscribe(results => {
                this.wjH.gridLoad(this.itemlistg01, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    closeDialog() {
        this.dialogRef.close();
    }

    initGrids() {
        // wj-flex-grid
        this.itemlistg01.initialize({
            isReadOnly: true,
            columns: [
                {binding: "fdocnumber", header: "S.O.#", width: 100, format: 'D'},
                {binding: "finvoice_date", header: "Invoice Date", width: 130, format: 'MM/dd/yyyy' },
                {binding: "fprice", header: "Price", width: 100, format: 'c'},
                {binding: "fitem", header: "Item Number", width: 200},
                {binding: "fdescription", header: "Description", width: 300},
                {binding: "fqty", header: "Qty", width: 100}
            ]
        });
        this.wjH.gridInit(this.itemlistg01, true);
        new wjGridFilter.FlexGridFilter(this.itemlistg01);
    }
  }