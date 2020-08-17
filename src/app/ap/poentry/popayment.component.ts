import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, ViewChild, Inject, ViewEncapsulation, ElementRef } from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from "@angular/forms";
import { DatePipe } from '@angular/common';
import { DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import { PoentryComponent } from './poentry.component';

@Component({
    selector: 'popayment',
    templateUrl: './popayment.component.html',
    styleUrls: ['./popayment.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class PoPayment implements OnInit {
    @ViewChild('oepymnt01', {static: true}) purchaseorderpaymentsGrid: WjFlexGrid;
    @ViewChild('ftenderamt') ftenderamt: ElementRef;
    oeC: PoentryComponent
    tenderamt: string;
    firstInput = true;
    purchaseorderpayments: DataStore;
    paymentTypes: any[];
    quickCashList: any[];
    completeButton = 'Complete';

    constructor(public dialogRef: MatDialogRef<PoPayment>, @Inject(MAT_DIALOG_DATA) data: any, private CompanySvc: CompanyService,
        public wjH: wjHelperService, private $filter: PcdrFilterPipe, private datePipe: DatePipe) {
        
        dialogRef['disableClose'] = true;
        // Pointers
        this.oeC = data;
        this.purchaseorderpayments = this.oeC.purchaseorderpayments;
        this.paymentTypes = this.$filter.transform(this.oeC.dESrvc.codeTable, {fgroupid: 'PPT'}, true);
        this.quickCashList = this.$filter.transform(this.oeC.dESrvc.codeTable, {fgroupid: 'QCP'}, true);
        if (this.oeC.purchaseorders.items[0].fstatus == 'R') this.completeButton = 'Save';
    }

    ngOnInit() {
        this.initGrids();
        this.purchaseorderpaymentsGrid.columns[1].dataMap = new wjGrid.DataMap(this.paymentTypes, 'fid', 'fdescription');
        this.wjH.gridLoad(this.purchaseorderpaymentsGrid, this.purchaseorderpayments.items);
        this.tenderamt = this.oeC.purchaseorders.items[0].fbalance;
        setTimeout(()=> this.ftenderamt.nativeElement.select(), 100);
    }

    purchaseorderpaymentsRemove() {
        let row = this.wjH.getGridSelectecRow(this.purchaseorderpaymentsGrid);
        if (!row) return;
        
        this.oeC.purchaseorderpayments.removeRow(row, true); // Remove row without prompt
        this.oeC.purchaseordersTotals();
        this.wjH.gridLoad(this.purchaseorderpaymentsGrid, this.purchaseorderpayments.items);

        this.tenderamt = this.oeC.purchaseorders.items[0].fbalance;
        this.firstInput = true;
    }
    
    addPayment(pType) {
        let amount = this.CompanySvc.r2d(this.CompanySvc.validNumber(this.tenderamt, 2));
        if (amount <= 0 && this.oeC.purchaseorders.items[0].fbalance >= 0) return; // Allow negative payments for CR
        if (this.oeC.purchaseorders.items[0].fbalance == 0) return; // No balance

        // // Except for cash, value cannot exceed balance, when positive only
        // if (pType.fid !== 'CSH' || this.oeC.purchaseorders.items[0].fbalance < 0 ) {
        //     amount = Math.min(amount, this.oeC.purchaseorders.items[0].fbalance);
        // }

        // Find out if payment type already exist, then increment
        var row = this.$filter.transform(this.purchaseorderpayments.items, { ftype: pType.fid }, true);
        if (row.length > 0) {
            row[0].famount += amount;
        }
        else {
            this.oeC.purchaseorderpaymentsAddItem(pType.fid, pType.fdescription, amount); //  Add row with remaining balance
        }

        this.oeC.purchaseordersTotals();
        this.wjH.gridLoad(this.purchaseorderpaymentsGrid, this.purchaseorderpayments.items);

        this.tenderamt = this.oeC.purchaseorders.items[0].fbalance;
        this.firstInput = true;

        // TODO Enter Reference for check 'CHK'
    }

    // quickCash(pType) {
    //     this.tenderamt = pType.fid;
    //     this.addPayment({fid: 'CSH', fdescription: 'Cash'});
    // }

    // Keypad event raised <keypad>
    onKeypadValueChange(event) {
        if (event == '') {
            this.tenderamt = this.oeC.purchaseorders.items[0].fbalance;
            this.firstInput = true;
        }
        else if (event == 'B') {
            this.tenderamt = this.tenderamt.toString(); // Migth be a number
            this.tenderamt = (this.tenderamt) ? this.tenderamt.substring(0, this.tenderamt.length - 1) : '0';
            this.firstInput = false;
        }
        else {
            this.tenderamt = (this.firstInput) ? event : this.tenderamt.toString() + event;
            if (this.tenderamt == '.') this.tenderamt = '0.';
            this.firstInput = false;
        }
    }

    initGrids() {
        // wj-flex-grid
        this.purchaseorderpaymentsGrid.initialize({
            columns: [
                { binding: "fdate", header: "Date", format: "MM/dd/yyyy", width: 135 },
                { binding: "ftype", header: "Type", width: 100, isReadOnly: true},
                { binding: "famount", header: "Amount", width: 100, format: 'c', isReadOnly: true },
                { binding: "freference", header: "Reference", width: '*' }
            ]
        });
        this.wjH.gridInit(this.purchaseorderpaymentsGrid);
        // add custom editors to the grid
        this.wjH.gridCreateEditor(this.purchaseorderpaymentsGrid.columns.getColumn('fdate'), 'Date');
    }
}
