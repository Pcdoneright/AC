import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { OrderByPipe } from 'ngx-pipes';
import { FormControl } from "@angular/forms";
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
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import * as wjGridX from "@grapecity/wijmo.grid.xlsx";
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { Itemvendorcost } from '../../inventory/itemlist/itemvendorcost.component';
import { VendItemList } from '../../ap/list/vendoritemlist.component';
import { Itempurchasehist } from '../../ap/list/itempurchasehist.component';
import { PoPayment } from '../../ap/poentry/popayment.component';
import { itemmaintComponent } from '../../inventory/itemmaint/itemmaint.component';
import { Observable } from 'rxjs';
import { appHelperService } from '../../services/appHelper.service';
import { ItemRelatedList } from '../../inventory/itemlist/itemrelatedlist.component';

@Component({
    selector: 'poentry',
    templateUrl: './poentry.component.html',
    providers: [DataEntryService, OrderByPipe],
})
export class PoentryComponent implements OnDestroy, AfterViewInit {
    fadmin: boolean = false;
    fupdate: boolean = false;
    tH01:number;
    poCurrent: any = {fdeliverydate: new Date()};

    listVendorGridSearch = new FormControl();
    selectedTab:number = 0;
    factive:boolean = true;
    vtype = 'N';
    potype = 'V';
    postatus = 'O';
    searchId = '';
    searchItemType = 'I'; // Initial value only for ItemList
    podatef:Date = new Date();
    podatet:Date = new Date();
    orderstatus:any [];
    voidFlag = false;
    receiveFlag = false;
    paymentFlag = false;
    showMoreEdit = false;

    purchaseorders:DataStore;
    purchasedetails:DataStore;
    purchaseorderpayments:DataStore;
    vendorterms: any[];
    companylocations: any[];
    vendorcontacts: any[];
    @ViewChild('poeG01') listVendorGrid: WjFlexGrid;
    @ViewChild('poeG02') listPOGrid: WjFlexGrid;
    @ViewChild('poeG03') purchasedetailsGrid: WjFlexGrid;

    fitem:string;
    @ViewChild('fitemE') fitemE: ElementRef;
    
    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dESrvc: DataEntryService, 
        private toastr: ToastrService, public sharedSrvc: SharedService, private dialog: MatDialog, 
        private $filter: PcdrFilterPipe, private OrderByPipe: OrderByPipe, public wjH: wjHelperService, 
        private companyRules: CompanyRulesService, public appH: appHelperService) {
        
        this.sharedSrvc.setProgramRights(this, 'poentry'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.podatef.setHours(12, 0, 0);
        this.podatet.setHours(12, 0, 0);

        // Data Stores, Unique Keys, updatable, validate fields
        this.purchaseorders = this.dESrvc.newDataStore('purchaseorders', ['fpoid'], true, ['fvcid', 'fshipto']);
        this.purchasedetails = this.dESrvc.newDataStore('purchasedetails', ['fpoid', 'fpodid'], true, ['fdescription', 'fvitem']);
        this.purchaseorderpayments = this.dESrvc.newDataStore('purchaseorderpayments', ['fpoid', 'fpopid'], true, ['fdate']);
        this.dESrvc.validateDataStore('purchaseorders', 'PROPERTIES', 'fvcid', 'CONTACT');
        this.dESrvc.validateDataStore('purchaseorders', 'PROPERTIES', 'fshipto', 'SHIP TO');
        this.dESrvc.validateDataStore('purchasedetails', 'DETAILS', 'fdescription', 'DESCRIPTION');
        this.dESrvc.validateDataStore('purchasedetails', 'DETAILS', 'fvitem', 'VENDOR ITEM');
        this.dESrvc.validateDataStore('purchaseorderpayments', 'PAYMENTS', 'fdate', 'DATE');

        // Get Vendor Terms for DropDown
        DataSvc.serverDataGet('api/VendorMaint/GetVendorTermsDD').subscribe((dataResponse) => {
            this.vendorterms = dataResponse;
        });

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
        });

        // Search Vendor List
        this.listVendorGridSearch.valueChanges
            .debounceTime(800)
            .distinctUntilChanged()
            .switchMap(val => {
                if (val == null) return [];
                if (this.vtype !== "A" && val.length < 3) return [];
                this.CompanySvc.ofHourGlass(true);
                return this.DataSvc.serverDataGet('api/VendorMaint/GetVendorList', { pActive: this.factive, pName: val, pType: this.vtype });
            })
            .subscribe(results => {
                this.wjH.gridLoad(this.listVendorGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'POS'}, true);
            this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All
        });
    }

    validEntry() {
        return (this.purchaseorders.items.length == 1);
    }

    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        
        if (this.purchaseorders.items[0].fstatus !== 'O' && this.paymentFlag == false) {
            this.toastr.info('Only OPEN orders can be modified.');
            return;
        }

        if (this.dESrvc.validate() !== '')  {
            // Reset Flags
            this.voidFlag = false;
            this.receiveFlag = false;
            this.paymentFlag = false;
            return;
        }
        this.CompanySvc.ofHourGlass(true);

        // Void order if requested
        if (this.voidFlag) {
            this.voidFlag = false;
            this.purchaseorders.items[0].fstatus = 'V';
        }

        // Complete order if requested
        if (this.receiveFlag) {
            this.receiveFlag = false;
            this.purchaseorders.items[0].fstatus = 'R';
            // Set date if not set
            if (!this.purchaseorders.items[0].freceivedate) {
                this.purchaseorders.items[0].freceivedate = new Date();
                this.purchaseorders.items[0].freceivedate.setHours(12, 0, 0);// Remove time
            }
            this.purchasedetailsComputedAll();
            this.purchaseordersTotals();
        }

        // Reset Flags
        this.paymentFlag = false;

        // Last Update
        this.purchaseorders.items[0].ts = new Date();
        this.purchaseorders.items[0].fusername = this.sharedSrvc.user.fname;

        // Send to Server
        this.dESrvc.update('api/PO/Postupdate').subscribe((dataResponse) => {
            // Assign fponumber from server
            if (this.purchaseorders.items[0].fponumber === -1) {
                if (dataResponse.fponumber) {
                    // Assign to current & original flag as no changes
                    this.purchaseorders.items[0].fponumber = dataResponse.fponumber;
                    this.purchaseorders._orgData[0].fponumber = dataResponse.fponumber;
                }
            }

            this.CompanySvc.ofHourGlass(false);
        });
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;
        if (this.fitem.length < 3) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWithPrice', {pfitem: this.fitem, pfcid:0}).subscribe((dataResponse) => {
            var mitem = this.fitem;
            this.fitem = ''; // Clear value
            if (dataResponse.length == 0) {
                this.appH.toastr('Item ' + mitem + ' not found!','error', '', true);
                return;
            }
            dataResponse[0].fcost = 0; // Force non-existing value
            this.purchasedetailsAddItem(dataResponse[0], true, true);
        });
    }

    itemOptions() {
        if (!this.validEntry()) return;
        var row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) return; // No selected row

        this.showItemOptions(row).subscribe(() => this.purchasedetailsGrid.refresh());
    }

    showItemOptions(cRow) {
        return new Observable((observer) => {
            if (!cRow) {
                observer.complete();
                return;
            }
            
            let pData = { fitem: cRow.fitem, fcid: 0 };
            this.dialog.open(ItemRelatedList, {data: pData}).afterClosed().subscribe(selected => {
            if (!selected) {
                observer.complete();
                return;
            }
            
            var row = cRow;
            // Make sure is different
            if (row.fitem !== selected.fitem) {

                if (!this.purchasedetails.isNew(row)) {
                    this.toastr.info('Existing items cannot be replaced. Add an Item instead.');
                    observer.complete();
                    return;
                }

                row.fitem = selected.fitem;
                row.fdescription = selected.fdescription + ' ' + selected.fuomdescription;
                row.cfitem = selected.fuomdescription;
                row.fprice = selected.fsaleprice;
                row.imfistaxable = selected.fistaxable;
                row.imfnonresaleable = selected.fnonresaleable;
                row.imfallowtfoodstamp = selected.fallowtfoodstamp;
                row.funits = selected.funits;
                row.fweight = selected.fweight;
                row.fcost = 0;
                row.fvitem =  (selected.fvitem || selected.fitem),
                // Re-Calculate
                this.purchasedetailsComputed(row, row.fprice, row.fqty, row.freceivedqty);
                this.purchaseordersTotals();
            }
            observer.next(row);
            observer.complete();
        });
    })
    }

    listGridCreate() {
        let row = this.wjH.getGridSelectecRow(this.listVendorGrid);
        if (!row) return;
        
        this.createPO(row); // Department=2 TODO: Department from cmpny
        this.selectedTab = 1;
        this.gridRepaint();
    }

    // Create PO for particular vendor
    createPO(pVendor) {
        if (!pVendor) return;
        // Check for changes
        this.dESrvc.pendingChangesContinue().then(() => {

            this.CompanySvc.ofHourGlass(true);
            this.purchaseorders.loadData([]);
            this.purchasedetails.loadData([]);
            this.purchaseorderpayments.loadData([]);

            this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'purchaseorder'}).subscribe((dataResponse) => {
                var dt = new Date();
                dt.setHours(12, 0, 0);// Remove time

                this.purchaseorders.addRow({
                    fpoid: dataResponse.data,
                    fvid: pVendor.fvid,
                    fvcid: 1, // Default
                    fvtid: pVendor.fvtid,
                    cfvid: pVendor.fname,
                    cfcustomerid: pVendor.fcustomerid,
                    fdate: dt,
                    fstatus: 'O',
                    fponumber: -1,
                    fsubtotal: 0,
                    fshipamt: 0,
                    ftotal: 0,
                    fbalance: 0,
                    ftotalpayment: 0,
                    fshipto: this.sharedSrvc.user.flocation // Assign user location
                });

                // Get Contacts
                this.getVendorContacts(pVendor.fvid);

                this.poCurrent = this.purchaseorders.items[0]; // pointer
                this.wjH.gridLoad(this.purchasedetailsGrid, []);
                this.CompanySvc.ofHourGlass(false);
            });
        }).catch(()=>{});
    }

    // Open Payment Interface
    payment() {
        this.paymentFlag = false;
        if (!this.validEntry()) return;
        
        this.dialog.open(PoPayment, {data: this}).afterClosed().subscribe(dataResponse => {
            // Complete
            if (dataResponse) {
                // Already Received, Payment made
                if (this.poCurrent.fstatus == 'R') {
                    // Check that no changes were made to purchasedetails
                    if (this.purchasedetails.getChanges()) {
                        this.toastr.info('Order Already Completed. No changes can be made to DETAILS!');
                        return;
                    }
                    else { 
                        this.paymentFlag = true;
                        this.update();
                    }
                }
                else {
                    this.complete(true);
                }
            }
        });
    }

    complete(prompt?:boolean) {
        this.receiveFlag = false;
        if (!this.validEntry()) return;
        if (this.purchaseorders.items[0].fstatus !== 'O') {
            this.toastr.info('Only OPEN orders can be completed.')
            return;
        }

        // Check if prompt is requested
        if (prompt) {
            this.CompanySvc.confirm('Complete and Finalize this Purchase Order?').subscribe(
                response => {
                    if (response) {
                        this.receiveFlag = true; // Set flag
                        this.purchaseorders.items[0].ts = new Date(); // Force update if nothing was changed
                        this.update();
                    }
                }
            );
        }
        else {
            this.receiveFlag = true; // Set flag
            this.purchaseorders.items[0].ts = new Date(); // Force update if nothing was changed
            this.update();
        }

    }

    voidPO() {
        this.voidFlag = false;
        if (!this.validEntry()) return;
        
        if (this.purchaseorders.items[0].fponumber === -1) return; // Only existing orders

        if (this.purchaseorders.items[0].fstatus !== 'O') {
            this.toastr.info('Only OPEN orders can be void.');
            return;
        }

        this.CompanySvc.confirm('Void this Purchase Order?').subscribe(
            response => {
                if (response) {
                    this.voidFlag = true; // Set flag
                    this.purchaseorders.items[0].ts = new Date(); // Force update if nothing was changed
                    this.update();
                }
            });
    }

    onfshipamt(event) {
        if (!this.validEntry()) return;
        var newval = this.CompanySvc.validNumber(event.srcElement.value, 2); // Convert to number
        if (newval == this.poCurrent.fshipamt) return; // no changes exit

        this.poCurrent.fshipamt = newval;
        this.purchaseordersTotals();
    }
    
    // Calculate totals for purchaseorders
    purchaseordersTotals() {
        this.poCurrent.fsubtotal = this.CompanySvc.r2d(this.dESrvc.getSumValue(this.purchasedetails.items, 'cextended'));
        this.poCurrent.ftotalpayment = this.CompanySvc.r2d(this.dESrvc.getSumValue(this.purchaseorderpayments.items, 'famount'));
        this.poCurrent.ftotal = this.CompanySvc.r2d(this.poCurrent.fsubtotal + this.poCurrent.fshipamt);
        this.poCurrent.fbalance = this.CompanySvc.r2d(this.poCurrent.ftotal - this.poCurrent.ftotalpayment);
    }

    // Display Received Total without modifying PO
    showRecieveTotal() {
        if (!this.validEntry()) return;
        if (this.purchaseorders.items[0].fstatus !== 'O') return; // For open orders only

        var ftotal = 0;
        this.purchasedetails.items.forEach((item) => {
            ftotal += this.rowCalculateExtended("R", item.fprice, item.fqty, item.freceivedqty);
        });
        ftotal = this.CompanySvc.r2d(ftotal + this.poCurrent.fshipamt);
        ftotal = this.CompanySvc.r2d(ftotal - this.poCurrent.ftotalpayment);
        this.CompanySvc.alert(this.CompanySvc.currencyRenderer({value: ftotal}), 'Balance').subscribe();
    }

    // Calculate purchasedetails computed fields 1 row
    purchasedetailsComputed(row, fcost, fqty, freceivedqty) {
        if (this.purchaseorders.items[0].fstatus == 'R') {
            // row.cextended = this.CompanySvc.r2d(fcost * freceivedqty);
            row.cextended = this.rowCalculateExtended('R', fcost, fqty, freceivedqty);
            row.cweight = freceivedqty * row.fweight;
        }
        else {
            // row.cextended = this.CompanySvc.r2d(fcost * fqty);
            row.cextended = this.rowCalculateExtended('O', fcost, fqty, freceivedqty);
            row.cweight = fqty * row.fweight;
        }
    }

    rowCalculateExtended(fstatus, fcost, fqty, freceivedqty) {
        if (fstatus == 'R') {
            return this.CompanySvc.r2d(fcost * freceivedqty);
        }
        else {
            return this.CompanySvc.r2d(fcost * fqty);
        }
    }

    listVendorGridRefresh() {
        this.DataSvc.serverDataGet('api/VendorMaint/GetVendorList', { pActive: this.factive, pName: '', pType: 'A' })
            .subscribe(results => {
                this.wjH.gridLoad(this.listVendorGrid, results);
                if (results.length === 0) this.toastr.info('No Rows found');
                this.CompanySvc.ofHourGlass(false);
            });
    }

    listPOGridRefresh() {
        if (this.potype === 'V' && !this.wjH.getGridSelectecRow(this.listVendorGrid)) {
            this.toastr.warning('Vendor must be selected');
            return;
        }

        var fvid = (this.potype == 'V') ? this.wjH.getGridSelectecRow(this.listVendorGrid).fvid : 0;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetPOList', {
            ppotype: this.potype,
            pfvid: fvid,
            pdatef: this.podatef,
            pdatet: this.podatet,
            pfstatus: this.postatus
        }).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.listPOGrid, dataResponse);
            this.listPOGridTotal();

            if (dataResponse.length === 0) this.toastr.info('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listPOGridTotal() {
        var ftotal = 0, fbalance = 0;

        this.listPOGrid.itemsSource.forEach((row) => {
            if (row.fstatus !== 'V') {
                ftotal += row.ftotal;
                fbalance += row.fbalance;
            }
        });
        this.listPOGrid.columnFooters.setCellData(0, 6, ftotal);
        this.listPOGrid.columnFooters.setCellData(0, 7, fbalance);
    }

    listPOGridEdit() {
        let row = this.wjH.getGridSelectecRow(this.listPOGrid);
        if (!row) return;

        this.dESrvc.pendingChangesContinue().then(() => {
            this.retrievePO(row.fpoid);
            this.selectedTab = 1;
            this.gridRepaint();
        }).catch(()=>{});
    }

    searchPONumber(checkPending = false) {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetValidatePonumber', {pfponumber: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                if (checkPending) {
                    this.dESrvc.pendingChangesContinue().then(() => {
                        this.retrievePO(dataResponse[0].fpoid);
                        this.searchId = '';
                        this.CompanySvc.ofHourGlass(false)
                    }).catch(()=>{});
                }
                else {
                    this.retrievePO(dataResponse[0].fpoid);
                    this.searchId = '';
                }
            }
            else
                this.toastr.info('P.O. Number Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    retrievePO(afpoid:number):void {
        if (!afpoid) return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/PO/GetPO', {pfpoid: afpoid}).subscribe((dataResponse) => {
            this.purchaseorders.loadData(dataResponse.purchaseorders);
            this.purchasedetails.loadData(dataResponse.purchasedetails);
            this.purchaseorderpayments.loadData(dataResponse.purchaseorderpayments);
            this.poCurrent = this.purchaseorders.items[0]; // pointer

            this.wjH.gridLoad(this.purchasedetailsGrid, this.purchasedetails.items);
            // Get Contacts
            this.getVendorContacts(this.purchaseorders.items[0].fvid);
            // Calculate Computed Columns
            this.purchasedetailsComputedAll();
            
            this.CompanySvc.ofHourGlass(false);
        });
    }

    getVendorContacts(fvid) {
        // DropDown
        this.DataSvc.serverDataGet('api/VendorMaint/GetVendorContactsDD', {pfvid: fvid}).subscribe((dataResponse) => {
            this.vendorcontacts = dataResponse;
        });
    }

    purchasedetailsAdd() {
        if (!this.validEntry()) return;

        this.dialog.open(ItemList, {data: {fcid: '-1'}}).afterClosed().subscribe(dataResponse => {
            if (!dataResponse) return;
            dataResponse.fcost = 0; // Force non-existing value
            this.purchasedetailsAddItem(dataResponse); //  Add selection to purchasedetails
        });
    }

    purchasedetailsAddItem(pitem, pfocus = true, pLoadGrid = true) {
        // Prevent Adding existing item
        if (this.$filter.transform(this.purchasedetails.items, {fitem: pitem.fitem}, true).length > 0) return;

        var rowIndex = this.purchasedetails.addRow({
            fpoid: this.purchaseorders.items[0].fpoid,
            fpodid: this.dESrvc.getMaxValue(this.purchasedetails.items, 'fpodid') + 1,
            fitem: pitem.fitem,
            fdescription: pitem.fdescription,
            fqty: pitem.cqty || 1,
            freceivedqty: 0,
            fprice: pitem.fcost,
            fvitem: (pitem.fvitem || pitem.fitem),
            fweight: pitem.fweight,
            fexpirationdate: null
        });
        var row = this.purchasedetails.items[rowIndex - 1];
        this.purchasedetailsComputed(row, row.fprice, row.fqty, row.freceivedqty);

        if (pLoadGrid) this.wjH.gridLoad(this.purchasedetailsGrid, this.purchasedetails.items);
        // Scroll to new row (always last)
        if (pfocus) setTimeout(() => {
            this.wjH.gridScrollToLastRow(this.purchasedetailsGrid, 1);
        }, 10); 
    }

    // Remove Rows
    purchasedetailsRemove() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) return;

        this.purchasedetails.removeRow(row).subscribe(() => {
            this.wjH.gridLoad(this.purchasedetailsGrid, this.purchasedetails.items);
            this.purchaseordersTotals();
        });
    }

    purchaseorderpaymentsAddItem(ftype:string, cftype:string, famount:number) {
        var mDate = new Date();
        mDate.setHours(12, 0, 0);

        return  this.purchaseorderpayments.addRow({
            fpoid: this.purchaseorders.items[0].fpoid,
            fpopid: this.dESrvc.getMaxValue(this.purchaseorderpayments.items, 'fpopid') + 1,
            fdate: mDate,
            ftype: ftype,
            cftype: cftype,
            famount: famount
        });
    }

    addVendorItems() {
        if (!this.validEntry()) return;

        let pData = { fvid: this.poCurrent.fvid };
        this.dialog.open(VendItemList, {data: pData}).afterClosed().subscribe(dataResponse => {
            if (!dataResponse) return;

            var calcTotal = false;
            var rows = this.OrderByPipe.transform(dataResponse, 'fdescription');
            // Add items with valid cqty
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].cqty > 0) {
                    this.purchasedetailsAddItem(rows[i], false, false);
                    calcTotal = true;
                }
            }

            if (calcTotal) {
                this.purchaseordersTotals();
                this.wjH.gridLoad(this.purchasedetailsGrid, this.purchasedetails.items);
            }
        });
    }
    
    compareCost() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) return;

        let pData = { fitem: row.fitem };
        this.dialog.open(Itemvendorcost, {data: pData}).afterClosed().subscribe();
    }
    
    viewHistory() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) return;

        let pData = { fitem: row.fitem };
        this.dialog.open(Itempurchasehist, {data: pData}).afterClosed().subscribe();
    }

    // Calculate purchasedetails computed fields for all rows
    purchasedetailsComputedAll() {
        this.purchasedetails.items.forEach((item) => {
            this.purchasedetailsComputed(item, item.fprice, item.fqty, item.freceivedqty);
        });
    }

    editItemmaint() {
        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.purchasedetailsGrid);
        if (!row) return;

        // Open Itemmaint, retrieve record
        let ret = this.sharedSrvc.openTask('itemmaintenance');
        if (ret) {
            // Wait for constructor()
            setTimeout(() => {
                let itm:itemmaintComponent = ret.component;
                if (itm) {
                    itm.selectedTab = 1;
                    itm.retrieveItem(row.fimid);
                }
            }, 150);
        }
    }

    printPO() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);

        var mParms = [
            {fline: 1, fnumber: this.purchaseorders.items[0].fpoid}
        ];

        this.CompanySvc.ofCreateReport('d_purchaseorders_receipt_rpt', mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }

    exportToXcel() {
        if (this.listPOGrid.rows.length == 0) return;
        
        let xcel = wjGridX.FlexGridXlsxConverter.save(this.listPOGrid, {
            includeColumnHeaders: true,
            includeRowHeaders: true
        });

        xcel.sheets[0].name = "P.O. Order History";
        xcel.saveAsync('pohistory.xlsx');
    }

    onResize(event) {
        this.tH01 = window.innerHeight - 55;
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.listPOGrid);
                    this.wjH.gridRedraw(this.listVendorGrid);
                    break;
                case 1:
                    this.wjH.gridRedraw(this.purchasedetailsGrid);
                    break;
            }
        }, 100);
    }

        initGrids() {
        // wj-flex-grid
        this.listVendorGrid.initialize({
            isReadOnly: true,
            loadedRows: (s,e) => { // optional for readonly faster performance
                for (var i = 0; i < s.rows.length; i++) {
                    var row = s.rows[i].dataItem;
                    row.fphone = this.CompanySvc.phoneRenderer({value: row.fphone});
                }
            },
            columns: [
                {binding: "fvid", header: "ID", width: 60, format: 'D'},
                {binding: "fname", header: "Name", width: '*'},
                {binding: "faddress1", header: "Address", width: 250},
                {binding: "vcfname", header: "Contact", width: 250},
                {binding: "fphone", header: "Phone", width: 130},
                {binding: "cftype", header: "Type", width: 85},
                {binding: "fcustomerid", header: "Cust. ID", width: 120}
            ]
        });
        this.wjH.gridInit(this.listVendorGrid, true);
        this.listVendorGrid.hostElement.addEventListener('dblclick', (e)=> { 
            this.potype = 'V';
            this.listPOGridRefresh();
        });
        new wjGridFilter.FlexGridFilter(this.listVendorGrid);

        // wj-flex-grid
        this.listPOGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fponumber", header: "PO#", width: 80, format:'D', align: "left" },
                { binding: "fdate", header: "Date", width: 100, format:'MM/dd/yyyy' },
                { binding: "freceivedate", header: "Received", width: 120, format:'MM/dd/yyyy' },
                { binding: 'cfstatus', header: 'Status', width: 100 },
                { binding: 'freference', header: 'Reference', width: 120 },
                { binding: 'cfname', header: 'Vendor', width: '*', minWidth: 100 },
                { binding: 'ftotal', header: 'Total', width: 130, format: 'c' },
                { binding: 'fbalance', header: 'Balance', width: 130, format: 'c', align: "right" }
            ]
        });
        this.wjH.gridInit(this.listPOGrid, true);
        this.listPOGrid.columnFooters.rows.push(new wjGrid.GroupRow());
        this.listPOGrid.hostElement.addEventListener('dblclick', (e)=> {
            this.listPOGridEdit();
        });
        new wjGridFilter.FlexGridFilter(this.listPOGrid);

        // wj-flex-grid
        this.purchasedetailsGrid.initialize({
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'fqty':
                    case 'fprice':
                    case 'freceivedqty':
                        var newval = this.CompanySvc.validNumber(s.activeEditor.value, 2); // Convert to number
                        if (newval != rec[col.binding]) {
                            rec[col.binding] = newval;
                            this.purchasedetailsComputed(rec, rec.fprice, rec.fqty, rec.freceivedqty);
                            this.purchaseordersTotals();
                        }
                        break;
                }
            },
            columns: [
                { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                { binding: "fvitem", header: "Vendor Item", width: 200},
                { binding: "fdescription", header: "Description", width: '*', minWidth: 100},
                { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum' },
                { binding: "freceivedqty", header: "Received", width: 80, aggregate: 'Sum' },
                { binding: "fprice", header: "Price", format: 'c', width: 80 },
                { binding: "fexpirationdate", header: "Exp Date", format: 'MM/dd/yyyy', width: 130 },
                { binding: "cextended", header: "Extended", width: 100, format: 'c', align: "right", isReadOnly: true },
                { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', align: "right", isReadOnly: true }
            ]
        });
        this.wjH.gridInit(this.purchasedetailsGrid);
        // add custom editors to the grid
        this.wjH.gridCreateEditor(this.purchasedetailsGrid.columns.getColumn('fexpirationdate'), 'Date');
        this.purchasedetailsGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    }
}
