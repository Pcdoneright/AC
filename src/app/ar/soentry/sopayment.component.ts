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
import { soentrybaseClass } from './soentrybase';

@Component({
    selector: 'sopayment',
    templateUrl: './sopayment.component.html',
    styleUrls: ['./sopayment.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class SoPayment implements OnInit {
    @ViewChild('oepymnt01', {static: true}) salespaymentsGrid: WjFlexGrid;
    @ViewChild('ftenderamt') ftenderamt: ElementRef;
    oeC: soentrybaseClass
    tenderamt: string;
    firstInput = true;
    salespayments: DataStore;
    paymentTypes: any[];
    quickCashList: any[];

    constructor(public dialogRef: MatDialogRef<SoPayment>, @Inject(MAT_DIALOG_DATA) data: any, private CompanySvc: CompanyService, public wjH: wjHelperService, private $filter: PcdrFilterPipe, private datePipe: DatePipe) {
        dialogRef['disableClose'] = true;
        // Pointers
        this.oeC = data;
        this.salespayments = this.oeC.salespayments;
        this.paymentTypes = this.$filter.transform(this.oeC.dESrvc.codeTable, {fgroupid: 'CPT'}, true);
        this.quickCashList = this.$filter.transform(this.oeC.dESrvc.codeTable, {fgroupid: 'QCP'}, true);
    }

    ngOnInit() {
        this.initGrids();
        this.salespaymentsGrid.columns[1].dataMap = new wjGrid.DataMap(this.paymentTypes, 'fid', 'fdescription');
        this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);
        this.tenderamt = this.oeC.salesorders.items[0].fbalance;
        setTimeout(()=> this.ftenderamt.nativeElement.select(), 100);
    }

    salespaymentsRemove() {
        let row = this.wjH.getGridSelectecRow(this.salespaymentsGrid);
        if (!row) return;
        var ptype = row.ftype; // Payment type
        this.oeC.salespayments.removeRow(row, true); // Remove row without prompt
        // Reset Taxable flag when FoodStamp is removed
        if (ptype == 'FS') this.oeC.salesdetailsResetTaxable();
        this.oeC.salesordersTotals();
        this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);

        this.tenderamt = this.oeC.salesorders.items[0].fbalance;
        this.firstInput = true;
    }
    
    addPayment(pType) {
        let amount = this.CompanySvc.r2d(this.CompanySvc.validNumber(this.tenderamt, 2));
        if (amount <= 0 && this.oeC.salesorders.items[0].fbalance >= 0) return; // Allow negative payments for CR
        if (this.oeC.salesorders.items[0].fbalance == 0) return; // No balance

        // Except for cash, value cannot exceed balance, when positive only
        if (pType.fid !== 'CSH' || this.oeC.salesorders.items[0].fbalance < 0 ) {
            amount = Math.min(amount, this.oeC.salesorders.items[0].fbalance);
        }

        // Food Stamp
        if (pType.fid == 'FS') {
            amount = this.processFoodStamp(amount);
            if (amount <= 0) return; // Exit
        }

        // Find out if payment type already exist, then increment
        var row = this.$filter.transform(this.salespayments.items, { ftype: pType.fid }, true);
        // if (row.length > 0 ) { // 2018/10/11 Added Check to allow multiple checks to be used 
        if (row.length > 0 && pType.fid !== 'CHK') { 
            row[0].famount += amount;
        }
        else {
            this.oeC.salespaymentsAddItem(pType.fid, pType.fdescription, amount); //  Add row with remaining balance
        }

        this.oeC.salesordersTotals();
        this.wjH.gridLoad(this.salespaymentsGrid, this.salespayments.items);

        this.tenderamt = this.oeC.salesorders.items[0].fbalance;
        this.firstInput = true;

        // TODO Enter Reference for check 'CHK'
    }

    // FS get max possible to be applied
    processFoodStamp(amount) {
        var cumulativeamount = 0, amttoadd = 0, maxfsamount = 0;
        var sp = this.oeC.salesdetails.items;

        for (var i = 0; i < sp.length; i++) {
            // As long as its foodstamp and non-reseable
            if (sp[i].imfnonresaleable == false && sp[i].imfallowtfoodstamp == true) {
                amttoadd = sp[i].cextended;

                // Cummulative fs amount
                if (sp[i].fistaxable == false) {
                    maxfsamount += amttoadd;
                }

                if (this.CompanySvc.r2d(cumulativeamount + amttoadd) <= amount) { // if cumulative + new <= entered then increase cumulative
                    cumulativeamount += amttoadd;
                    sp[i].fistaxable = false; // Set flag for foodstamp
                }
            }
        }
        cumulativeamount = this.CompanySvc.r2d(cumulativeamount);

        // Check if entered > cumulative
        if ( amount > cumulativeamount) {
            amount = (amount <= maxfsamount) ? amount : cumulativeamount; // as long as is less than maxfsamount apply partially
        }

        return amount;
    }

    quickCash(pType) {
        this.tenderamt = pType.fid;
        this.addPayment({fid: 'CSH', fdescription: 'Cash'});
    }

    // Keypad event raised <keypad>
    onKeypadValueChange(event) {
        if (event == '') {
            this.tenderamt = this.oeC.salesorders.items[0].fbalance;
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
        this.salespaymentsGrid.initialize({
            columns: [
                { binding: "fdate", header: "Date", format: "MM/dd/yyyy", width: 100 },
                { binding: "ftype", header: "Type", width: 100, isReadOnly: true},
                { binding: "famount", header: "Amount", width: 100, format: 'c', isReadOnly: true },
                { binding: "freference", header: "Reference", width: '*' }
            ]
        });
        this.wjH.gridInit(this.salespaymentsGrid);
        this.wjH.gridCreateEditor(this.salespaymentsGrid.columns.getColumn('fdate'));
    }
}
