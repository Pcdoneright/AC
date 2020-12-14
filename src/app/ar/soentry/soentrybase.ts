import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { SharedService } from '../../services/shared.service';
import { appHelperService } from '../../services/appHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { ItemRelatedList } from '../../inventory/itemlist/itemrelatedlist.component';
import { CustomerList } from '../../ar/list/custlist.component';
import { debug } from 'util';

export class soentrybaseClass {
    fadmin: boolean = false;
    fupdate: boolean = false;
    orderOrigin:string;
    voidFlag:boolean = false;
    invoiceFlag:boolean = false;
    searchId:string;
    minMarkup = 0;

    salesorders:DataStore;
    salesdetails:DataStore;
    salespayments:DataStore;

    customercontacts:any[];
    customerbilltos:any[];
    customershiptos:any[];
    taxrates:any[];

    constructor(public CompanySvc: CompanyService, public DataSvc: DataService, public dESrvc: DataEntryService, public toastr: ToastrService, 
        public sharedSrvc: SharedService, public dialog: MatDialog, public $filter: PcdrFilterPipe, 
        public companyRules: CompanyRulesService, public appH: appHelperService) {
        // Data Stores, Unique Keys, updatable, validate fields
        this.salesorders = this.dESrvc.newDataStore('salesorders', ['fsoid'], true, ['fccid', 'frid', 'fctid', 'fcbtid', 'fcstid', 'flocation']);
        this.salesdetails = this.dESrvc.newDataStore('salesdetails', ['fsoid', 'fsodid'], true, ['fitem', 'fdescription']);
        this.salespayments = this.dESrvc.newDataStore('salespayments', ['fsoid', 'fsopid'], true, ['fdate']);

        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fccid', 'CONTACT');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'frid', 'DEPARTMENT');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fctid', 'TERMS');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fcbtid', 'BILL TO');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'fcstid', 'SHIP TO');
        this.dESrvc.validateDataStore('salesorders', 'PROPERTIES', 'flocation', 'LOCATION');
        this.dESrvc.validateDataStore('salesdetails', 'DETAILS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('salesdetails', 'DETAILS', 'fitem', 'ITEM');

        this.DataSvc.serverDataGet('api/CompanyMaint/GetMinMarkup').subscribe((dataResponse) => {
            this.minMarkup = dataResponse.fminmarkup;
        });
    }

    validEntry() {
        return (this.salesorders.items.length !== 1) ? false: true;
    }

    getTaxRate(pftrid:number) {
        //let row = this.$filter.transform(this.taxrates, {ftrid: pftrid}, true); // Did not work
        let row = this.taxrates.filter(row => row.ftrid == pftrid);
        return (row[0].frate / 100); // Get proper decimal
    }

    // Calculate totals for salesorders
    salesordersTotals() {
        var sorow = this.salesorders.items[0];
        sorow.ftaxabletotal = 0;
        sorow.fnontaxabletotal = 0;
        sorow.fdiscount = 0;
        sorow.fchange = 0;
        sorow.ftotalpayment = 0;

        // Loop details
        var len = this.salesdetails.items.length;
        for (var i = 0; i < len; i++) {
            if (this.salesdetails.items[i].fistaxable)
                sorow.ftaxabletotal += this.salesdetails.items[i].cextended;
            else
                sorow.fnontaxabletotal += this.salesdetails.items[i].cextended;
        }
        sorow.fnontaxabletotal = this.CompanySvc.r2d(sorow.fnontaxabletotal);

        // var trate = this.taxrates[this.taxratetoUse].frate / 100; // Get proper decimal
        var trate = this.getTaxRate(sorow.ftrid);
        sorow.ftax = this.CompanySvc.r2d(sorow.ftaxabletotal * trate);
        if (!sorow.fshipamt) 
            sorow.fshipamt = 0; // Existing orders before field was created
        else {
            if (trate > 0) {
                sorow.ftax += this.CompanySvc.r2d(sorow.fshipamt * trate); // Add tax for shipment too.
            }
        }
        sorow.ftotal = this.CompanySvc.r2d(sorow.ftaxabletotal + sorow.ftax + sorow.fnontaxabletotal + sorow.fshipamt);

        // if discount rate is specified, discount is % of ftotal
        if (sorow.fdiscountp > 0) {
            var drate = sorow.fdiscountp / 100;
            sorow.fdiscount = this.CompanySvc.r2d(sorow.ftotal * drate);
            sorow.ftotal = this.CompanySvc.r2d(sorow.ftotal - sorow.fdiscount);
        }

        // Loop payments
        len = this.salespayments.items.length;
        for (var i = 0; i < len; i++) {
            sorow.ftotalpayment += this.salespayments.items[i].famount;
        }

        // Calculate change and re-assign ftotalpayment, as long as line items are present
        // if (sorow.ftotalpayment > sorow.ftotal) {
        if (sorow.ftotalpayment > sorow.ftotal && this.salespayments.items.length > 0) {
            sorow.fchange = this.CompanySvc.r2d(sorow.ftotalpayment - sorow.ftotal);
            sorow.ftotalpayment = sorow.ftotal;
        }

        sorow.fbalance = this.CompanySvc.r2d(sorow.ftotal - sorow.ftotalpayment);
        this.salesorders.items[0] = sorow; // Reasing
    }

    searchSONumber(checkPending = false) {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetValidateSonumber', {pfsonumber: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                if (checkPending) {
                    this.dESrvc.pendingChangesContinue().subscribe(() => {
                        this.retrieveSO(dataResponse[0].fsoid);
                        this.searchId = '';
                        this.CompanySvc.ofHourGlass(false)
                    });
                }
                else {
                    this.retrieveSO(dataResponse[0].fsoid);
                    this.searchId = '';
                }
            }
            else
                this.toastr.info('S.O. Number Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    retrieveSO(afsoid:number):void {
        if (!afsoid) return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetSO', {pfsoid: afsoid}).subscribe((dataResponse) => {
            this.salesorders.loadData(dataResponse.salesorders);
            this.salesdetails.loadData(dataResponse.salesdetails);
            this.salespayments.loadData(dataResponse.salespayments);

            // Calculate Markup %
            this.salesdetails.items.forEach((row) => {
                row.cfmarkup = this.companyRules.markupCalculate(row.fprice, row.funits, row.fsalesbase);
            })

            // Get Contacts
            this.getCustomerRelated(this.salesorders.items[0].fcid, false).subscribe(() => {
                // Calculate Computed Columns
                this.salesdetailsComputedAll();
                this.postRetrieveSO(); // Extend
                this.CompanySvc.ofHourGlass(false);
            });
        });
    }

    // After retrieve action must override
    postRetrieveSO() {
    }

    // Clear salesorders and related
    clearSalesOrder() {
        this.salesorders.loadData([]);
        this.salesdetails.loadData([]);
        this.salespayments.loadData([]);
    }

    createSO(pCustomer, pRepresentative) {
        if (!pCustomer) return;

        this.CompanySvc.ofHourGlass(true);
        this.clearSalesOrder();

        this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'salesorder'}).subscribe((dataResponse) => {
            var dt = new Date();
            dt.setHours(12, 0, 0);// Remove time

            this.salesorders.addRow({
                fsoid: dataResponse.data,
                fcid: pCustomer.fcid,
                cfcid: pCustomer.fname,
                fstatus: 'S', // Open
                fcustom1: this.orderOrigin,
                frid: pRepresentative, // Representative (Department)
                //frid: pCustomer.frid, // Rep
                ftrid: pCustomer.ftrid, // Tax Rate
                fctid: pCustomer.fctid, // Terms
                fdiscountp: pCustomer.fdiscountp, // Discount %
                cfpriceclass: pCustomer.fpriceclass, // Price Class
                cfistaxexcempt: pCustomer.fistaxexcempt,
                fdate: dt,
                fdocnumber: -1,
                ftaxabletotal: 0,
                fnontaxabletotal: 0,
                ftax: 0,
                fdiscount: 0,
                ftotal: 0,
                ftotalpayment: 0,
                fbalance: 0,
                fchange: 0,
                fshipamt: 0,
                flocation: this.sharedSrvc.user.flocation, // Assign user location
                fshipdate: null,
                fponumber: null,
                fccid: null,
                fcbtid: null,
                fcstid: null,
                fpackingnotes: null,
                fnotes: null,
                finvoicenotes: null,
                ts: null,
                fusername: null,
                finvoice_date: null
            });

            // Get Contacts, billto, shipto and assign its first row
            this.getCustomerRelated(pCustomer.fcid).subscribe(() => {
                this.postCreateSO(); // Call Post
                this.CompanySvc.ofHourGlass(false);
            });
        });
    }

    // After create action must override
    postCreateSO() {
    }

    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        let pfstatus = this.salesorders.items[0].fstatus; // Save Current Status for failure
        
        // Void Orders Cannot be modified
        if (this.salesorders.items[0].fstatus === 'V') {
            this.toastr.info('Only OPEN orders can be modified.');
            return;
        }
        
        console.log('this.orderOrigin', this.orderOrigin);
        // SO can only modify payments for invoices
        if (this.salesorders.items[0].fstatus === 'I' && this.orderOrigin === 'SO') {
            // Added 8/13/2020 But prevents it from updating since so.ts is updated too
            // if (this.salesorders.getChanges()) {
            //     this.toastr.info('Only Payments can be modified for Invoices.');
            //     return;
            // }
            
            if (this.salesdetails.getChanges()) {
                this.toastr.info('Only Payments can be modified for Invoices.');
                return;
            }
        }
        else {
            // POS screens can only modified 'S' open orders
            // if (this.salesorders.items[0].fstatus !== 'S' && (this.orderOrigin === 'POS' || this.orderOrigin === 'SMI')) {
            if (this.salesorders.items[0].fstatus !== 'S' && (this.orderOrigin === 'SO' || this.orderOrigin === 'SMI')) {
                this.toastr.info('Only OPEN orders can be modified.');
                return;
            }
        }

        if (this.dESrvc.validate() !== '') {
            this.voidFlag = false;
            this.invoiceFlag = false;
            return;
        }

        // Balance must be zero for POS, 'OL' allow to have balance
        switch (this.orderOrigin) {
            case 'OL':
                // Make sure is not invoicing
                if (this.invoiceFlag && this.salesorders.items[0].fbalance !== 0) {
                    this.toastr.error('Balance amount must be Zero');
                    this.invoiceFlag = false;
                    return;
                }
                break;
            case 'VS': // Vendor Sales Order
                break;
            default:
                if ((this.orderOrigin === 'POS' || this.orderOrigin === 'SMI') && this.salesorders.items[0].fbalance !== 0) {
                    this.toastr.error('Balance amount must be Zero');
                    return;
                }
        }
        // if (this.orderOrigin != 'OL') {
        //     if ((this.orderOrigin === 'POS' || this.orderOrigin === 'SMI') && this.salesorders.items[0].fbalance !== 0) {
        //         this.toastr.error('Balance amount must be Zero');
        //         return;
        //     }
        // }
        // else {
        //     // Make sure is not invoicing
        //     if (this.invoiceFlag && this.salesorders.items[0].fbalance !== 0) {
        //         this.toastr.error('Balance amount must be Zero');
        //         this.invoiceFlag = false;
        //         return;
        //     }
        // }

        // SCA 'Re-assign customer to Invoice'
        if (this.orderOrigin === 'SCA') {
            this.orderOrigin = this.salesorders.items[0].fcustom1; // Keep Original Value
        }

        this.CompanySvc.ofHourGlass(true);

        // Void order if requested
        if (this.voidFlag) {
            this.voidFlag = false;
            this.salesorders.items[0].fstatus = 'V';
        }

        // Complete order if requested
        if (this.invoiceFlag) {
            this.invoiceFlag = false;
            this.salesorders.items[0].fstatus = 'I';
            // Set date if not set
            if (!this.salesorders.items[0].finvoice_date) {
                this.salesorders.items[0].finvoice_date = new Date();
                this.salesorders.items[0].finvoice_date.setHours(12, 0, 0); // Remove time
            }
        }

        // Set forigin always to processing program
        this.salesorders.items[0].fcustom1 = this.orderOrigin;
        // Last Update
        this.salesorders.items[0].ts = new Date();
        this.salesorders.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/SO/Postupdate').subscribe((dataResponse) => {
            // console.log('dataResponse', dataResponse);
            if (dataResponse.success) {
                // Assign fdocnumber from server
                if (this.salesorders.items[0].fdocnumber === -1) {
                    if (dataResponse.fdocnumber) {
                        // Assign to current & original flag as no changes
                        this.salesorders.items[0].fdocnumber = dataResponse.fdocnumber;
                        this.salesorders._orgData[0].fdocnumber = dataResponse.fdocnumber;
                    }
                }
                this.postUpdate();
            }
            else {
                this.salesorders.items[0].fstatus = pfstatus; // Reverse status
            }
            this.CompanySvc.ofHourGlass(false);

        }, (ErrorMsg) => {
            this.salesorders.items[0].fstatus = pfstatus; // Reverse status
            this.CompanySvc.ofHourGlass(false);
            this.toastr.error('Unable to Update. Please try again!','', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
        });
    }

    // Override if necessary
    postUpdate() {
    }

    // Invoice open order
    complete(prompt?:boolean) {
        this.invoiceFlag = false;
        if (!this.validEntry()) return;
        // if (this.salesorders.items[0].fstatus !== 'S') { // 2018/10/11 Payment was not showing when status changed and server failed 
        // if (this.salesorders.items[0].fdocnumber !== -1) { // 2018/10/12 Regualr Order Entry Unable to invoice open orders
        // if ((this.salesorders.items[0].fdocnumber !== -1 && this.orderOrigin === 'POS') || 
        //     (this.salesorders.items[0].fstatus !== 'S' && this.orderOrigin !== 'POS'))  {  // 2018/10/13 Restore to original
        if (this.salesorders.items[0].fstatus !== 'S' && this.orderOrigin !== 'SO') {
            this.toastr.info('Only OPEN orders can be Invoiced.');
            return;
        }

        // Check if prompt is requested
        if (prompt) {
            this.CompanySvc.confirm('Invoice and Finalize this Sales Order?').subscribe(
                response => {
                    if (response) {
                        this.invoiceFlag = true; // Set flag
                        this.salesorders.items[0].ts = new Date(); // Force update if nothing was changed
                        this.update();
                    }
                }
            );
        }
        else {
            this.invoiceFlag = true; // Set flag
            this.salesorders.items[0].ts = new Date(); // Force update if nothing was changed
            this.update();
        }
    }

    // Void open order
    voidSO() {
        this.voidFlag = false;
        if (!this.validEntry()) return;
        
        if (this.salesorders.items[0].fdocnumber === -1) return; // Only existing orders

        // if (!voidInvoices) {
        //     if (this.salesorders.items[0].fstatus !== 'S') {
        //         this.toastr.info('Only OPEN orders can be void.');
        //         return;
        //     }
        // }

        this.CompanySvc.confirm('Void this Sales Order?').subscribe(
            response => {
                if (response) {
                    this.voidFlag = true; // Set flag
                    this.salesorders.items[0].ts = new Date(); // Force update if nothing was changed
                    this.update();
                }
            });
    }

    // Re-assign a different customer
    assignCustomer() {
        if (!this.validEntry()) return;
        if (this.salesorders.items[0].fstatus !== 'S') return; // Make sure is open order

        this.dialog.open(CustomerList, {height: '95%'}).afterClosed().subscribe(pCustomer => {
            if (!pCustomer) {
                this.postAssignCustomer(false);
                return;
            }

            this.CompanySvc.confirm('Replace Existing Customer?')
                .subscribe(response => {
                    if (!response) return;
                    this.CompanySvc.ofHourGlass(true);

                    // Reassign new customer related data
                    this.salesorders.items[0].fcid = pCustomer.fcid;
                    this.salesorders.items[0].cfcid = pCustomer.fname;
                    this.salesorders.items[0].ftrid = pCustomer.ftrid; // Tax Rate
                    this.salesorders.items[0].fctid = pCustomer.fctid; // Terms
                    this.salesorders.items[0].fdiscountp = pCustomer.fdiscountp; // Discount %
                    this.salesorders.items[0].cfpriceclass = pCustomer.fpriceclass; // Price Class
                    this.salesorders.items[0].cfistaxexcempt = pCustomer.fistaxexcempt;

                    // Assign fcid, taxable
                    var sd = this.salesdetails.items, sda = [];
                    for (var i = 0; i < sd.length; i++) {
                        sd[i].fcid = pCustomer.fcid;
                        sd[i].fistaxable = this.itemtaxable(sd[i].fistaxable, sd[i].fnonresaleable, this.salesorders.items[0].cfistaxexcempt);
                        // sda.push({fitem: sd[i].fitem, fpriceclass: pCustomer.fpriceclass, fprice: 0, findex: i}); // Build array
                        sda.push({ fitem: sd[i].fitem, fcid: pCustomer.fcid, fprice: 0, findex: i }); // Build array
                    }
                    // Assign class price for all
                    this.DataSvc.serverDataPost('api/SO/PostsalesdetailsPrice', sda).subscribe((dataResponse) => {
                        // Assign new Price
                        for (var i = 0; i < dataResponse.plist.length; i++) {
                            sd[dataResponse.plist[i].findex].fprice = dataResponse.plist[i].fprice; // Use org index
                        }
                        this.getCustomerRelated(pCustomer.fcid).subscribe(() => {
                            this.salesdetailsComputedAll();
                            this.salesordersTotals();
                            this.postAssignCustomer(true);
    
                            this.CompanySvc.ofHourGlass(false);
                        });
                    });
                });
        });
    }

    // Override for action
    postAssignCustomer(assigned: boolean) {}

    // Check if item is valid and add it --> Check if make sense return observ
    salesdetailsAddItemByFitem(pfitem, pAddTop = true) : Observable<any> {
        return Observable.create(observer => {
            this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWithPrice', {pfitem: pfitem, pfcid: this.salesorders.items[0].fcid}).subscribe((dataResponse) => {
                if (dataResponse.length == 0) {
                    this.appH.toastr('Item ' + pfitem + ' not found!','error', '', true);
                    observer.next(null);
                    return;
                }
                observer.next(this.salesdetailsAddItem(dataResponse[0], true, pAddTop));
            });
        });
        
        // return this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWithPrice', {pfitem: pfitem, pfcid: this.salesorders.items[0].fcid}).subscribe((dataResponse) => {
        //     if (dataResponse.length == 0) {
        //         this.toastr.warning('Item not found!');
        //         return false;
        //     }
        //     return this.salesdetailsAddItem(dataResponse[0], true);
        // });
    }

    // Add a record to salesdetails
    salesdetailsAddItem(pitem, calcTotal: boolean, pAddTop = true) {
        // Increment Qty if item found
        var row = this.$filter.transform(this.salesdetails.items, {fitem: pitem.fitem}, true)[0];
        //TODO: values should come from codetable instead of 997, 998 or 999
        if (row && ('997,998,999').indexOf(row.fitem) == -1) {
            row.fqty += parseInt(pitem.cqty || 1);
        }
        else {
            var rowIndex = this.salesdetails.addRow({
            // this.salesdetails.addRow({
                fsoid: this.salesorders.items[0].fsoid,
                fsodid: this.dESrvc.getMaxValue(this.salesdetails.items, 'fsodid') + 1,
                fcid: this.salesorders.items[0].fcid,
                fitem: pitem.fitem,
                fdescription: pitem.fdescription + ' ' + pitem.fuomdescription,
                cfitem: pitem.fuomdescription,
                fqty: parseInt(pitem.cqty || 1),
                fprice: pitem.fsaleprice, // Might be undefined
                fweight: pitem.fweight,
                fistaxable: this.itemtaxable(pitem.fistaxable, pitem.fnonresaleable, this.salesorders.items[0].cfistaxexcempt),
                imfistaxable: pitem.fistaxable,
                imfnonresaleable: pitem.fnonresaleable,
                imfallowtfoodstamp: pitem.fallowtfoodstamp,
                funits: pitem.funits,
                fimid: pitem.fimid,
                fsalesbase: pitem.fsalesbase,
                cfmarkup: this.companyRules.markupCalculate(pitem.fsaleprice, pitem.funits, pitem.fsalesbase)
            }, pAddTop);
            
            if (pAddTop) {
                row = this.salesdetails.items[0]; // Always first since now added to top
            }
            else {
                row = this.salesdetails.items[rowIndex - 1];
            }
        }

        this.salesdetailsComputed(row, row.fprice, row.fqty);
        if (calcTotal) this.salesordersTotals();
        if (row.fprice == 0) this.itemZeroPrice(row); // React to zero price

        return row;
    }

    salesdetailsResetTaxable() {
        // Re-Assign Taxable
        var sd = this.salesdetails.items;
        for (var i = 0; i < sd.length; i++) {
            sd[i].fistaxable = this.itemtaxable(sd[i].imfistaxable, sd[i].imfnonresaleable, this.salesorders.items[0].cfistaxexcempt);
        }
    }

    // Override item to request amount
    itemZeroPrice(row) {
    }

    // Add a record to salespayments
    salespaymentsAddItem(ftype:string, cftype:string, famount:number) {
        var mDate = new Date();
        mDate.setHours(12, 0, 0);

        return  this.salespayments.addRow({
            fsoid: this.salesorders.items[0].fsoid,
            fsopid: this.dESrvc.getMaxValue(this.salespayments.items, 'fsopid') + 1,
            fdate: mDate,
            ftype: ftype,
            cftype: cftype,
            famount: famount
        });
    }

    // Decide if item is tax exempt
    itemtaxable(item_istaxable:boolean, item_nonresaleable:boolean, cust_istaxexcempt:boolean):boolean {
        var ret = item_istaxable; // Assign from itemmaster
        if (cust_istaxexcempt) { // Check if taxexempt true
            if (!item_nonresaleable) ret = false; // As long as is not nonresaleable
        }

        return ret
    }

    // Get customer contacts, shipto, billto
    getCustomerRelated(fcid:number, assign = true) {
        // Get for DropDown
        return Observable.create((observer) => {
            this.DataSvc.serverDataGet('api/CustomerMaint/GetCustomerRelatedDD', {pfcid: fcid})
            .subscribe((dataResponse) => {
                this.customercontacts = dataResponse.customercontacts;
                this.customerbilltos = dataResponse.customerbilltos;
                this.customershiptos = dataResponse.customershiptos;
                this.taxrates = dataResponse.taxrates;
                
                // Select 1st instance of contact, shipto, billto
                if (assign) {
                    if (this.customercontacts.length > 0)
                        this.salesorders.items[0].fccid = this.customercontacts[0].fccid;
                    if (this.customerbilltos.length > 0)
                        this.salesorders.items[0].fcbtid = this.customerbilltos[0].fcbtid;
                    if (this.customershiptos.length > 0)
                        this.salesorders.items[0].fcstid = this.customershiptos[0].fcstid;
                }
                observer.next(dataResponse);
            });
        });
    }

    // Calculate salesdetails computed fields for all rows
    salesdetailsComputedAll() {
        this.salesdetails.items.forEach((item) => {
            this.salesdetailsComputed(item, item.fprice, item.fqty);
        });
    }

    // Calculate salesdetails computed fields 1 row
    salesdetailsComputed(row, fprice:number, fqty:number) {
        row.cextended = this.CompanySvc.r2d(fprice * fqty);
        row.cweight = this.CompanySvc.r2d(fqty * row.fweight);
    }

    // Show related items and replace if not isNew()
    showItemOptions(cRow) {
        return Observable.create((observer) => {
            if (!cRow) {
                observer.complete();
                return;
            }
            
            let pData = { fitem: cRow.fitem, fcid: this.salesorders.items[0].fcid };
            this.dialog.open(ItemRelatedList, {data: pData}).afterClosed().subscribe(selected => {
            if (!selected) {
                observer.complete();
                return;
            }
            
            var row = cRow;
            // Make sure is different
            if (row.fitem !== selected.fitem) {

                if (!this.salesdetails.isNew(row)) {
                    this.toastr.info('Existing items cannot be replaced. Add an Item instead.');
                    observer.complete();
                    return;
                }

                row.fitem = selected.fitem;
                row.fdescription = selected.fdescription + ' ' + selected.fuomdescription;
                row.cfitem = selected.fuomdescription;
                row.fprice = selected.fsaleprice;
                row.fistaxable = this.itemtaxable(selected.fistaxable, selected.fnonresaleable, this.salesorders.items[0].cfistaxexcempt);
                row.imfistaxable = selected.fistaxable;
                row.imfnonresaleable = selected.fnonresaleable;
                row.imfallowtfoodstamp = selected.fallowtfoodstamp;
                row.funits = selected.funits,
                row.fweight = selected.fweight,
                // Re-Calculate
                this.salesdetailsComputed(row, row.fprice, row.fqty);
                this.salesordersTotals();
            }
            observer.next(row);
            observer.complete();
        });
    })
    }
}