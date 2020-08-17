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
    selector: 'dialog-custitemlist',
    templateUrl: './custitemlist.component.html',
  })
  export class CustItemList implements AfterViewInit {
    @ViewChild('custitemlistg01') itemlistg01: WjFlexGrid;
    gH01:number;
    
    constructor(public dialogRef: MatDialogRef<CustItemList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemCustomerList', {pfcid: this.data.fcid})
            .subscribe(results => {
                // Set initial value
                for (var i = 0; i < results.length; i++) {
                    results[i].cqty = 0;
                }
                this.wjH.gridLoad(this.itemlistg01, results);
                // if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    closeDialog() {
        this.dialogRef.close(this.itemlistg01.itemsSource);
    }

    initGrids() {
        // wj-flex-grid
        this.itemlistg01.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cfeach':
                            row.cfeach = row.fsaleprice / row.funits;
                            break;
                    }
                }
            },
            columns: [
                {binding: "cqty", header: "Qty", width: 70, isReadOnly: false}, // Non Existing Column
                {binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                {binding: "fdescription", header: "Description", width: 300, isReadOnly: true},
                {binding: "fuomdescription", header: "UOM", width: 140, isReadOnly: true},
                {binding: "fsaleprice", header: "Price", width: 100, format: 'c', isReadOnly: true},
                {binding: "funits", header: "# Units", width: 100, isReadOnly: true},
                {binding: "cfeach", header: "Each", width: 80, format:'c', align: 'right'},
                {binding: "fohqty", header: "On Hand", width: 100, isReadOnly: true}
            ]
        });
        this.wjH.gridInit(this.itemlistg01, true);
        new wjGridFilter.FlexGridFilter(this.itemlistg01);
    }
  }