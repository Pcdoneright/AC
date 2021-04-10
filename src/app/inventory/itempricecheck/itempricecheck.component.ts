import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl } from "@angular/forms";
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridX from "@grapecity/wijmo.grid.xlsx";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjcCore from '@grapecity/wijmo';

@Component({
    selector: 'dialog-itempricecheck',
    templateUrl: './itempricecheck.component.html',
    styleUrls: ['./itempricecheck.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class ItemPriceCheck implements AfterViewInit {
    @ViewChild('ipckg01') itemsGrid: WjFlexGrid;
    @ViewChild('fitemE') fitemE: ElementRef;
    fitem:string;
    itemCurrent: any = {};
    itemunitsImgCurrent = '';
    fileuploadinfo = {progress: 0, message: ''}

    constructor(private CompanySvc: CompanyService, public dialogRef: MatDialogRef<ItemPriceCheck>, private DataSvc: DataService, public wjH: wjHelperService, public toastr: ToastrService) {}

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();
    }

    fitemOnChange() {
        if (!this.fitem || this.fitem.length < 3) return;

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemandRelated', {pfitem: this.fitem}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                let fitem = this.fitem; // Assign temporarily
                this.clearForm(); // Clears this.fitem
                this.toastr.warning('Item ' + fitem + ' not found!');
                this.focusToScan();
                return;
            }

            this.wjH.gridLoad(this.itemsGrid, dataResponse, false);
            this.wjH.gridScrollToRow(this.itemsGrid, -1, 0, 'fitem', this.fitem); // No-focus only scroll
            this.fitem = ''; // Clear value
            this.focusToScan();
        });
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }

    clearForm() {
        this.wjH.gridLoad(this.itemsGrid, []);
        this.fitem = ''; // Clear value
        this.itemCurrent = {};
        this.focusToScan();
        this.setImage(null);
    }

    allowUpload(control) {
        // if (!this.validEntry) return false;
        if (!this.wjH.getGridSelectecRow(this.itemsGrid)) return false;
        control.click(); // Call if allowed
    }

    fileChange(event) {
        var row = this.wjH.getGridSelectecRow(this.itemsGrid);
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.setImage(''); // clear first
            this.CompanySvc.ofHourGlass(true);
            let file: File = fileList[0];
            this.DataSvc.serverFileUpload(file, 'images', row.fitem + '.jpg', this.fileuploadinfo).subscribe(
                data => {
                    this.CompanySvc.ofHourGlass(false);
                    if (data.success) {
                        this.toastr.info('Image upload was succesful.');
                        this.focusToScan();
                    }
                    else 
                        this.toastr.warning('Unable to upload the image.');

                    this.setImage(row);
                    this.fileuploadinfo.progress = 0; // reset
                } ,
                // error => console.log(error)
            )
        }
        else console.log('no file');
    }

    initGrids() {
        // wj-flex-grid
        this.itemsGrid.initialize({
            isReadOnly: true,
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.itemsGrid, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.itemsGrid);
                    if (!row) return;
                    this.itemCurrent = row; // pointer
                    this.setImage(row);
                }
            },
            columns: [
                // { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                { binding: "fuomdescription", header: "UOM", width: '*'},
                // { binding: "fdescription", header: "Description", minWidth: 200, width: '*'},
                { binding: "fsaleprice", header: "Price", format: 'c', width: 80 },
                // { binding: "cfmarkup", header: "Markup%", width: 80 },
                // { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum' },
                // { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
                // { binding: "cextended", header: "Extended", width: 100, format: 'c', isReadOnly: true },
                // { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
            ]
        });
        this.wjH.gridInit(this.itemsGrid);
        this.itemsGrid.headersVisibility = wjGrid.HeadersVisibility.None;
        this.itemsGrid.rows.defaultSize = 50;
        this.itemsGrid.showAlternatingRows = false;
    }
}