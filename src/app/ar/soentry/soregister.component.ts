import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
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
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { soentrybaseClass } from './soentrybase';
import { SoPayment } from './sopayment.component';
import { SOViewCustomer } from './soregisterorder.component';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
    selector: 'soregister',
    templateUrl: './soregister.component.html',
    styleUrls: ['./soregister.component.css'],
    providers: [DataEntryService],
    encapsulation: ViewEncapsulation.None
})
export class SoRegisterComponent extends soentrybaseClass implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    selectedTab:number = 0;
    lastordernumber:string;
    default_fcid:number;
    customers:any;
    totalQty: number = 0;
    totalWght: number = 0;
    fposprint:string;
    itemunitsImgCurrent = '';
    totalDrawer: number = 0;
    fcrdraweramt : number = 0;
    
    showMoreEdit:boolean;
    fitem:string;
    @ViewChild('fitemE') fitemE: ElementRef;
    
    tH01:number;
    gH01:number;
    defDepartment:number = 1; // TODO: s/b from companymstr
    printMobile = false;
    
    // objects, DS, Grids, arrays
    @ViewChild('soeg01') salesdetailsGrid: WjFlexGrid;
    @ViewChild('soeg02') salesorderspendingGrid: WjFlexGrid;
    soCurrent: any = {};
    sodCurrent: any = {};
    customerterms:any[];
    representatives:any[];
    companylocations:any[];
    orderstatus:any [];

    salesorderspending:any[] = [];
    salesdetailspending:any[] = [];
    salespaymentspending:any[] = [];

    constructor(CompanySvc: CompanyService, DataSvc: DataService, dESrvc: DataEntryService, toastr: ToastrService, sharedSrvc: SharedService, 
        dialog: MatDialog, $filter: PcdrFilterPipe, public wjH: wjHelperService, companyRules: CompanyRulesService, private datePipe: DatePipe) {
        super(CompanySvc, DataSvc, dESrvc, toastr, sharedSrvc, dialog, $filter, companyRules);
        this.sharedSrvc.setProgramRights(this, 'soentrytouch'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.orderOrigin = 'POS';

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'SOS'}, true);
        }); // when codetable is needed

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
        });
        this.DataSvc.serverDataGet('api/CompanyMaint/GetPosprint').subscribe((dataResponse) => {
            this.fposprint = dataResponse.fposprint;
        });
        // Get Company Drawer limit
        this.DataSvc.serverDataGet('api/CompanyMaint/GetDrawerAmt').subscribe((dataResponse) => {
            this.fcrdraweramt  = dataResponse.fcrdraweramt ;
        });
        // Get User Drawer amt
        this.DataSvc.serverDataGet('api/CashRegister/GetUserDrawer', {pfuserid: this.sharedSrvc.user.fuid}).subscribe((dataResponse) => {
            if (dataResponse.length > 0) this.totalDrawer  = dataResponse[0].fdrawer ;
        });
    }
    
    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Properties', 
            buttons: [
                {name: 'New Order', style: 'success', action: 'newSO'},
                {name: ' Receipt', style: 'light', icon: 'fa fa-print', action: 'printSO', val: false},
                {name: 'Drawer', style: 'light', tooltip: 'Open Drawer', action: 'openDrawer'},
                {name: 'Set Pending', style: 'primary', action: 'setToPending'},
                {name: 'Void', style: 'danger', action: 'setToVoid'},
                {name: 'Drawer Report', style: 'secondary', action: 'drawerReport'},
            ],
            // spans: [
                // {text: 'Last Order:', property: 'lastordernumber', style: 'margin-left:45px'},
                // {text: 'Drawer:', property: 'totalDrawer', style: 'margin-left:15px'}
            // ],
            navButtons: [
                {name: 'Pending List', action: 'selectedTab', val: 1}
            ],
            search: {action: 'searchSONumber', ngModel: 'searchId', placeholder: 'Order Number', val: true},
            validEntry: true
        })
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();

        // Get default customer id
        this.DataSvc.serverDataGet('api/CompanyMaint/GetPOSCustomerID').subscribe((dataResponse) => {
            this.default_fcid = dataResponse.fpos_cid;
            this.getcustomer(this.default_fcid); // will call postCreateSO()

            this.focusToScan();
        });
    }

    // barXX Events
    onClickNav(parm) {
        
        switch(parm.action) {
            case 'selectedTab':
                this.selectedTab = parm.val;
                if (this.selectedTab == 2) {
                    this.onResize(null);
                    this.gridRepaint();
                }
                break;
            default:
                this[parm.action](parm.val);
                break;
        }
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }
        
    // Get customer info
    getcustomer(pfcid: number) {
        this.DataSvc.serverDataGet('api/CustomerMaint/GetValidateCustomer', {pfcid: pfcid}).subscribe((dataResponse) => {
            this.customers = dataResponse;
            this.createSO(this.customers[0], this.defDepartment); // will call postCreateSO()
        });
    }

    postAssignCustomer(assigned) {
        this.salesdetailsGrid.refresh();
        this.focusToScan();
    }

    payment() {
        // if (!this.validEntry() || this.soCurrent.fstatus !== 'S' || this.salesdetails.items.length == 0)  { // 2018/10/11 Payment was not showing when status changed and server failed 
        // if (!this.validEntry() || this.soCurrent.fdocnumber !== -1 || this.salesdetails.items.length == 0)  { 2018/10/13 Restore to original
        if (!this.validEntry() || this.soCurrent.fstatus !== 'S' || this.salesdetails.items.length == 0)  {
            this.focusToScan();
            return;
        }
        
        this.dialog.open(SoPayment, {data: this}).afterClosed().subscribe(dataResponse => {
            // Complete
            if (dataResponse) {
                this.complete(false);
            }
            this.focusToScan();
        });
    }

    // Override to create a new order after update
    postUpdate() {
        this.printSO(true); // Open Drawer
        this.lastordernumber = this.soCurrent.fdocnumber; //Save last fdocnumber
        
        // Save totalDrawer
        this.getCashTotal();
        this.depositDrawerTotal();

        // Display Change Amount
        if (this.soCurrent.fchange !== 0) {
            // Display Change Due
            this.CompanySvc.alert(this.CompanySvc.currencyRenderer({value: this.soCurrent.fchange}), 'Change Amount')
                .subscribe(() =>{
                    this.newSO();
                });
        }
        else {
            this.newSO();
        }
    }

    depositDrawerTotal() {
        console.log('PostDrawerTotal', this.totalDrawer);
        this.DataSvc.serverDataPost('api/CashRegister/PostDrawerTotal', [{pfuserid: this.sharedSrvc.user.fuid, pfdrawer: this.totalDrawer}]).subscribe();
    }

    getCashTotal() {
        let items = this.$filter.transform(this.salespayments.items, {ftype: 'CSH'});
        let total = this.dESrvc.getSumValue(items, 'famount');
        this.totalDrawer += total - this.salesorders.items[0].fchange;
        this.totalDrawer = this.CompanySvc.r2d(this.totalDrawer);
    }
   
    // Extend to Fill grid with data
    postRetrieveSO() {
        this.soCurrent = this.salesorders.items[0]; // pointer
        this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items, false);
        this.updateTotalQty();
        this.focusToScan();
    }

    // Override to check if changes are pending
    createSO(customer, department) {
        this.dESrvc.pendingChangesContinue().subscribe(() => {
           super.createSO(customer, department);
        });
    }

    // Extend to Clear grid with data
    postCreateSO() {
        this.soCurrent = this.salesorders.items[0]; // pointer
        this.soCurrent.finvoice_date = this.soCurrent.fdate;
        this.wjH.gridLoad(this.salesdetailsGrid, []);
        this.sodCurrent = {};
        this.salesordersTotals();
        this.updateTotalQty();
        this.focusToScan();
        // return; // <<<<<---------
        
        console.log('totalDrawer', this.totalDrawer);
        console.log('fcrdraweramt', this.fcrdraweramt);
        // Prompt if drawer amt exceeds
        if (this.totalDrawer >= this.fcrdraweramt && this.totalDrawer > 0) {
            this.openDrawer(); // Allow to take money out
            // this.CompanySvc.inputDialog('Amount To Deposit', this.totalDrawer.toString(), 'Must Deposit Now $' + this.totalDrawer.toString(), 'Continue', 'Cancel', false, true, false, 'inputDialogAmount', this).subscribe((ret) => {
            this.CompanySvc.inputDialog('Amount To Deposit', '', 'Max Deposit $' + this.totalDrawer.toString(), 'Continue', 'Cancel', false, true, false, 'inputDialogAmount', this).subscribe((ret) => {
                this.cashDrawerOverride(this.CompanySvc.validNumber(ret, 2));
            });
        }
    }

    cashDrawerOverride(amtToDeposit: number) {
        this.CompanySvc.inputDialog('Enter Code', '', 'Admin Deposit-Code', 'Continue', 'Cancel', true, true, false).subscribe((value) => {
            this.DataSvc.serverDataGet('api/CompanyMaint/GetValidateCROverride', { fcrdrawercode: value }).subscribe((dataResponse) => {
                if (!dataResponse.validate) {
                    this.toastr.warning('Invalid Override Code');
                    setTimeout(()=> {this.cashDrawerOverride(amtToDeposit)}, 0);
                }
                else {
                    // Post Deposits, and new drawer total
                    this.totalDrawer -= amtToDeposit;
                    this.totalDrawer = this.CompanySvc.r2d(this.totalDrawer);
                    console.log('deposit', amtToDeposit);
                    
                    this.DataSvc.serverDataPost('api/CashRegister/PostDrawerDeposit', [{pfuserid: this.sharedSrvc.user.fuid, pfdrawer: amtToDeposit}]).subscribe(() => {
                        this.generateReport('CashDrawerLastDeposit.pdf', 'pfuserid=' + this.sharedSrvc.user.fuid); // Print receipt after every deposit
                    });
                    this.depositDrawerTotal();
                }
            });
        });
    }

    inputDialogAmount(val) {
        let amt = this.CompanySvc.validNumber(val, 2);
        if (!amt) {
            this.toastr.warning('Invalid Amount!');
            return false
        }
        // Value must be same or less
        if (amt > this.totalDrawer) {
            this.toastr.error('Amount cannot be greater than $' + this.totalDrawer.toString());
            return false
        }
        return true;
    }

    // async inputDialogEnter(val) {
    // async XinputDialogEnter(val) {
    //     const data = await this.DataSvc.serverDataGetAsync('api/CompanyMaint/GetValidatePOSOverride', { pfposoverride: val });
    //     console.log('returned data', data);
    //     if (data) {
    //         //await this.getAssetTypesPromise(val);
    //         // console.log('data', data['validate']);
    //         if (!data['validate']) {
    //             this.toastr.warning('Invalid Override Code');
    //             return false;
    //         }
    //         return true;
    //     }
    //     // When Error
    //     return false;
    // }

    // async getAssetTypesPromise(val) {
    //     console.log('before testoverrideAdmin');
    //     const data = await this.http.get('api/CompanyMaint/GetValidatePOSOverride', {params: {pfposoverride: val}}).toPromise();
    //     console.log("Data: " + JSON.stringify(data)); 
    //     console.log('after testoverrideAdmin');
    // }

    printSO(opendrawer: boolean) {
        if (!this.validEntry() || this.soCurrent.fdocnumber == -1) {
            this.focusToScan();
            return;
        };

        this.CompanySvc.ofHourGlass(true);
        var mParms = [
            {fline: 1, fnumber: this.soCurrent.fdocnumber}
        ];
        // Set priority = 4
        this.CompanySvc.ofCreateReport('d_salesorder_cr_receipt', mParms, 4).subscribe((pResponse) => {
            var filename = pResponse.ffilename;
            // Send to printer
            setTimeout(() => {
                this.CompanySvc.ofCheckServerFile(pResponse.data, () => {
                    // if (this.fposprint == 'D') { // Direct
                    if (this.printMobile) { // Direct 
                        this.CompanySvc.printPDFserverFile(pResponse.data, this);
                        if (opendrawer) this.openDrawer();
                    }
                    else {
                        window.location.href = 'pcdrprintpdfv3:' + filename + ':' + opendrawer; // open drawer option
                    }
                    this.focusToScan();
                });
            }, 1000);
        });
    }

    drawerReport() {
        let fdate = new Date(); // Use todays date
        
        var mParms = 'pfuserid=' + this.sharedSrvc.user.fuid +
            "&pfdatef=" + this.datePipe.transform(fdate, 'yyyy-MM-dd') + 
            "&pfdatet=" + this.datePipe.transform(fdate, 'yyyy-MM-dd')

        this.generateReport('CashDrawer.pdf', mParms);
    }

    // Generic report routine
    generateReport(pRptname: string, pParms: string) {
        this.CompanySvc.ofHourGlass(true);

        this.CompanySvc.ofCreateJasperReport(pRptname, pParms).subscribe((pResponse) => {
            var filename = pResponse.ffilename;
            // Send to printer
            setTimeout(() => {
                this.CompanySvc.ofCheckServerFile(pResponse.data, () => {
                    // this.CompanySvc.ofOpenServerFile(pResponse.data); // Display for testing
                    window.location.href = 'pcdrprintpdfv3:' + filename + ':false'; // Send to pos-prt
                    this.focusToScan();
                });
            }, 1000);
        });
    }

    openDrawer() {
        window.location.href = 'pcdrprintpdfv3:drawer:true'; // open drawer option
        this.focusToScan();
    }

    scanBeep() {
        // window.location.href = 'pcdrscanbeep:'; // machine beep
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;
        if (this.fitem.length < 3) return false;

        this.salesdetailsAddItemByFitem(this.fitem).subscribe((row) => {
            if (row) {
                this.scanBeep();

                this.fitem = ''; // Clear value
                this.updateTotalQty();
                this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items, false);
                this.wjH.gridScrollToRow(this.salesdetailsGrid, -1, 0, 'fsodid', row.fsodid); // No-focus only scroll
            }
            this.focusToScan();
        });
    }

    // Update Total Qty
    updateTotalQty() {
        this.totalQty = 0;
        this.totalWght = 0;
        this.salesdetails.items.forEach(row =>{
            this.totalQty += row.fqty;
            this.totalWght += row.cweight;
        });
    }

    // Prompt when zero price
    itemZeroPrice(row) {
        this.editItemDialog(row);
    }

    setToVoid() {
        // Ask to override
        this.overrideAdmin().subscribe(() => {
            // if new order just erase
            if (this.soCurrent.fdocnumber == -1) {
                this.newSO();
            }
            else {
                this.voidSO();
            }
            this.focusToScan();
        });
    }
    
    overrideAdmin() {
        return Observable.create((observer) => {
            this.CompanySvc.inputDialog('Enter Code', '', 'Admin Void-Override Code', 'Continue', 'Cancel', true).subscribe((value) => {
                if (value) {
                    this.DataSvc.serverDataGet('api/CompanyMaint/GetValidatePOSOverride', { pfposoverride: value }).subscribe((dataResponse) => {
                        if (dataResponse.validate) {
                            observer.next(dataResponse);
                        }
                        else {
                            this.toastr.warning('Invalid Admin Code!');
                        }
                    });
                }
            });
        });
    }

    // Show related items
    itemOptions() {
        if (!this.validEntry()) { this.focusToScan(); return };
        var row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) { this.focusToScan(); return }; // No selected row
        this.setImage(row);

        this.showItemOptions(row).finally(() => {
            this.focusToScan();
        }).subscribe(() => {
            this.salesdetailsGrid.refresh();
            this.updateTotalQty();
            this.setImage(row);
        });
    }
    
    // Edit Item
    editItem() {
        if (!this.validEntry()) { this.focusToScan(); return };
        var row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) { this.focusToScan(); return }; // No selected row

        this.editItemDialog(row);
    }

    editItemDialog(row) {
        this.dialog.open(SOEditItem, {data: row}).afterClosed().subscribe(() => {
            row.fprice = Math.abs(this.CompanySvc.validNumber(row.fprice, 2)); // Amount alway positive
            row.fqty = this.CompanySvc.validNumber(row.fqty, 2);

            this.salesdetailsComputed(row, row.fprice, row.fqty);
            this.salesordersTotals();
            row.cfmarkup = this.companyRules.markupCalculate(row.fprice, row.funits, row.fsalesbase);
            this.updateTotalQty();
            this.salesdetailsGrid.refresh();
            
            this.focusToScan();
        });
    }

    // Assign Discount
    discountAssign() {
        // Ask to override
        this.overrideAdmin().subscribe(() => {
            this.CompanySvc.inputDialog('Input Value', this.soCurrent.fdiscountp, 'Enter Discount Percentage').subscribe((response) => {
                if (response) {
                    this.soCurrent.fdiscountp = this.CompanySvc.validNumber(response, 2);
                    this.salesordersTotals();
                }
            });
        })
    }

    // Set current order to pending
    setToPending() {
        // no details, not new order
        if (!this.validEntry() || this.soCurrent.fdocnumber !== -1 || this.salesdetails.items.length == 0) {
            this.focusToScan(); 
            return;
        };

        this.CompanySvc.inputDialog('Enter a Reference', this.soCurrent.fponumber, 'Pending Order', '', '', false, false).subscribe((response) => {
            if (response) {
                this.soCurrent.fponumber  = response;
                this.salesorderspending.push(this.soCurrent); // Append to end
                // Add all salesdetails
                for (var i = 0; i < this.salesdetails.items.length; i++) {
                    this.salesdetailspending.push(this.salesdetails.items[i]);
                }
                // Add all payments
                for (var i = 0; i < this.salespayments.items.length; i++) {
                    this.salespaymentspending.push(this.salespayments.items[i]);
                }

                this.wjH.gridLoad(this.salesorderspendingGrid, this.salesorderspending);

                // clear all
                this.clearSalesOrder();
                this.setImage(null);
                // this.salesorders.loadData([]);
                // this.salesdetails.loadData([]);
                // this.salespayments.loadData([]);

                // Create new order, clear current
                this.newSO();
            }
            this.focusToScan();
        });
    }

    // Restore pending order
    restorePending() {
        if (!this.validEntry()) return;
        if (this.salesdetails.items.length > 0 && this.soCurrent.fdocnumber == -1) return; // exit if current order exist
        if (!this.wjH.getGridSelectecRow(this.salesorderspendingGrid)) return; // make sure row is selected

        // clear all
        this.clearSalesOrder();
        this.setImage(null);

        var fsoid = this.wjH.getGridSelectecRow(this.salesorderspendingGrid).fsoid;
        // find and remove it
        for (var i=0; i < this.salesorderspending.length; i++) {
            // if found exit
            if (this.salesorderspending[i].fsoid === fsoid) {
                this.salesorders.items.push(this.salesorderspending.splice(i, 1)[0]); // slice out specific item, and get 1st item of returned array
                break;
            }
        }

        // details
        for (var i=0; i < this.salesdetailspending.length; i++) {
            // if found exit
            if (this.salesdetailspending[i].fsoid === fsoid) {
                this.salesdetails.items.push(this.salesdetailspending.splice(i, 1)[0]);
                i--; // decrease loop
            }
        }

        // payments
        for (var i=0; i < this.salespaymentspending.length; i++) {
            // if found exit
            if (this.salespaymentspending[i].fsoid === fsoid) {
                this.salespayments.items.push(this.salespaymentspending.splice(i, 1)[0]);
                i--; // decrease loop
            }
        }

        // Retrieve customer related if diff from walkin
        if (this.default_fcid !== this.soCurrent.fcid) this.getCustomerRelated(this.soCurrent.fcid, false).subscribe();
        this.wjH.gridLoad(this.salesorderspendingGrid, this.salesorderspending);
        this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items, false);
        this.soCurrent = this.salesorders.items[0]; // pointer

        this.selectedTab = 0;
        this.focusToScan();
    }

     // Retrieve default customer and createSO()
    newSO() {
        this.focusToScan();
        // Check if default info already retrieved
        if (this.default_fcid !== this.customers[0].fcid) {
            this.getcustomer(this.default_fcid); // Will call postCreateSO()
        }
        else {
            this.createSO(this.customers[0], this.defDepartment); // Will call postCreateSO()
        }
        this.setImage(null);
    }

    salesdetailsAdd() {
        if (!this.validEntry()) return;
        
        // Clear Value to prevent showing continuous error on invalid value
        if (this.fitem !== '') {
            this.fitem = '';
            this.toastr.clear();
        }

        let pData = { fcid: this.soCurrent.fcid };
        this.dialog.open(ItemList, {data: pData}).afterClosed().subscribe(dataResponse => {
            this.focusToScan();
            if (!dataResponse) return;
            let row = this.salesdetailsAddItem(dataResponse, true); //  Add selection to salesdetails
            this.updateTotalQty();
            this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
            this.wjH.gridScrollToRow(this.salesdetailsGrid, -1, 0, 'fsodid', row.fsodid); // park on Price
        });
    }

    salesdetailsRemove() {
        this.focusToScan();

        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
        if (!row) return;

        this.salesdetails.removeRow(row).finally(()=> {
            this.focusToScan();
        }).subscribe(() => {
            this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items, false);
            this.salesordersTotals();
            this.updateTotalQty();
            this.setImage(null);

            if (this.salesdetails.items.length == 0) this.sodCurrent = {}; // Clear if no rows
        });
    }

    viewOrder() {
        if (!this.validEntry()) return;

        let pData = { soregister: this };
        this.dialog.open(SOViewCustomer, {data: pData}).afterClosed().subscribe(() =>{
            this.focusToScan();
        });
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    onResize(event) {
        // setTimeout(() => {
            this.tH01 = window.innerHeight - 50;
            this.gH01 = window.innerHeight - 50;
        // }, 100);
    };

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.salesdetailsGrid);
                case 1:
                    this.wjH.gridRedraw(this.salesorderspendingGrid);
                    break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.salesdetailsGrid.initialize({
            isReadOnly: true,
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'fdescription':
                            e.cell.textContent = row.fqty + ' ' + row.fdescription;
                            break;
                    }
                }
            },
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.salesdetailsGrid, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.salesdetailsGrid);
                    if (!row) return;
                    this.sodCurrent = row; // pointer
                    this.setImage(row);
                    this.focusToScan();
                }
            },
            columns: [
                // { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                // { binding: "cfitem", header: "UOM", width: 150, isReadOnly: true},
                // { binding: "fqty", header: "Qty", width: 45, cssClass: 'text-left' },
                { binding: "fdescription", header: "Description", minWidth: 200, width: '*'},
                // { binding: "fprice", header: "Price", format: 'c', width: 80, },
                // { binding: "cfmarkup", header: "Markup%", width: 80 },
                // { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
                { binding: "cextended", header: "Extended", width: 100, format: 'c', isReadOnly: true },
                // { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
            ]
        });
        this.wjH.gridInit(this.salesdetailsGrid);
        this.salesdetailsGrid.headersVisibility = wjGrid.HeadersVisibility.None;
        this.salesdetailsGrid.rows.defaultSize = 50;
        this.salesdetailsGrid.showAlternatingRows = false;
        this.salesdetailsGrid.hostElement.addEventListener('dblclick', (e)=> {
            this.editItem();
        });

        // wj-flex-grid
        this.salesorderspendingGrid.initialize({
            isReadOnly: true,
            columns: [
                {binding: "cfcid", header: "Customer", width: 250},
                {binding: "fponumber", header: "Reference", width: 200},
                {binding: "ftotal", header: "Total", width: 100, format: 'c'}
            ]
        });
        this.wjH.gridInit(this.salesorderspendingGrid);
    }
}

@Component({
    selector: 'dialog-soitemedit',
    template: `
        <div mat-dialog-content cdkDrag cdkDragRootElement=".cdk-overlay-pane" style="max-height:none;" fxLayout="column" class="widget-grid panel-nobox">
            <nav class="navbar navbar-expand-md mbg-info" fxLayout="row">
                <span class="text-nowrap">Item Properties</span>
                <div fxFlex="flex"></div>
            </nav>
            <form fxFlex>
                <div fxLayout="row" class="rmargin">
                    <div class="form-group" style="width: 250px;" fxLayout="column">
                        <label>Item Number</label>
                        <span fxFlex class="fdocnumber">{{sodCurrent.fitem}}</span>
                    </div>
                    <div class="form-group lmargin" fxFlex="flex">
                        <label>Description</label>
                        <input #infield type="text" class="form-control" [(ngModel)]="sodCurrent.fdescription" [ngModelOptions]="{standalone: true}">
                    </div>
                </div>
                <div fxLayout="row" class="rmargin">
                    <div class="form-group lmargin" fxFlex="flex">
                        <label>Price</label>
                        <input type="text" pcdrAmount class="form-control" [(ngModel)]="sodCurrent.fprice" [ngModelOptions]="{standalone: true}">
                    </div>
                    <div class="form-group lmargin" fxFlex="flex">
                        <label>Quantity</label>
                        <input type="text" pcdrQty class="form-control" [(ngModel)]="sodCurrent.fqty" [ngModelOptions]="{standalone: true}">
                    </div>
                </div>
            </form>
        </div>
        <div mat-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-primary" (click)="dialogRef.close()">Continue</button>
        </div>
    `
})
export class SOEditItem implements AfterViewInit {
     sodCurrent: any = {};
    @ViewChild('infield') infield: ElementRef;

    constructor(public dialogRef: MatDialogRef<SOEditItem>, @Inject(MAT_DIALOG_DATA) public data: any) {
        dialogRef.disableClose = true;
        this.sodCurrent = data; // assign pointer
    }

    ngAfterViewInit() {
        setTimeout(() => this.infield.nativeElement.select(), 100);
    }
}