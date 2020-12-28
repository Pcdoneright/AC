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
    selector: 'dialog-itemrelatedlist',
    templateUrl: './itemrelatedlist.component.html',
  })
  export class ItemRelatedList implements AfterViewInit {
    @ViewChild('itemrelg01') itemrelg01: WjFlexGrid;
    gH01:number;
    itemunitsImgCurrent = '';

    constructor(public dialogRef: MatDialogRef<ItemRelatedList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService, public wjH: wjHelperService, private toastr: ToastrService) {
        //dialogRef['height'] = "95%"; // Force value
        this.gH01 = (window.innerHeight * 0.50) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemUnitsList', { pfitem: this.data.fitem, pfcid: this.data.fcid })
            .subscribe((results) => {
                this.wjH.gridLoad(this.itemrelg01, results);
                this.itemrelg01.refresh();
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    closeDialog() {
        let row = this.wjH.getGridSelectecRow(this.itemrelg01);
        this.dialogRef.close(row);
    }

    initGrids() {
        // wj-flex-grid
        this.itemrelg01.initialize({
            isReadOnly: true,
            // formatItem: (s, e) => {
            //     if (e.panel == s.cells) {
            //         var col = s.columns[e.col], row = s.rows[e.row].dataItem;
            //         switch (col.binding) {
            //             case 'cfeach':
            //                 row.cfeach = this.CompanySvc.r2d(row.fsaleprice / row.funits); // Not happening at run time for all rows
            //                 // e.cell.style['text-align'] = 'right';
            //                 console.log(row.cfeach)
            //                 break;
            //         }
            //     }
            // },
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.itemrelg01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.itemrelg01);
                    if (!row) return;
                    this.setImage(row);
                }
            },
            columns: [
                {binding: "fimid", header: "ID", width: 65, format: 'D'},
                {binding: "fitem", header: "Item", width: 180},
                {binding: "fdescription", header: "Description", width: 250},
                {binding: "fuomdescription", header: "UOM", width: 120},
                {binding: "fsaleprice", header: "Price", width: 80, format: 'c'},
                {binding: "funits", header: "# Units", width: 80},
                {binding: "cfeach", header: "Each", width: 80, format:'c', align: 'right'},
                {binding: "fcategory", header: "Category", width: 140}
            ]
        });
        this.wjH.gridInit(this.itemrelg01, true);
        this.itemrelg01.hostElement.addEventListener('dblclick', (e)=> {
            this.closeDialog();
        });
    }
  }