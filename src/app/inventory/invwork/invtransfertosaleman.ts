import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, } from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input, } from '@angular/core';
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
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjGridFilter from '@grapecity/wijmo.grid.filter';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { appHelperService } from '../../services/appHelper.service';
import { ItemRelatedList } from '../../inventory/itemlist/itemrelatedlist.component';
import {SOEditItem} from '../../ar/soentry/soregister.component'

@Component({
    selector: 'invtransfertosaleman',
    templateUrl: './invtransfertosaleman.html',
    styleUrls: ['../../ar/soentry/soregister.component.css'],
    providers: [DataEntryService],
    encapsulation: ViewEncapsulation.None,
})
export class invtransfertosaleman implements AfterViewInit {
    @ViewChild('bar01', { static: true }) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', { static: true }) bar02: pcdrBuilderComponent;
    @ViewChild('soeg01', { static: true }) invworkGrid: WjFlexGrid;
    // @ViewChild('soeg02', { static: true }) invworkheadersGrid: WjFlexGrid;
    @ViewChild('listSOGrid', { static: true }) listSOGrid: WjFlexGrid;
    @ViewChild('fitemE') fitemE: ElementRef;
    @Input() programId = 'invtransfertosaleman';

    selectedTab: number = 1;
    lastordernumber: string;
    default_fcid: number;
    totalQty: number = 0;
    totalWght: number = 0;
    fposprint: string;
    itemunitsImgCurrent = '';
    trxType = 'SX';

    invworkheaders:DataStore;
    invwork:DataStore;

    sodatef: Date = new Date();
    sodatet: Date = new Date();
    soflocation: number = 0;
    searchId = '';

    showMoreEdit: boolean;
    fitem: string;

    tH01: number;
    tH02: number;
    gH01: number;
    printMobile = false;

    // objects, DS, Grids, arrays
    soCurrent: any = { fshipamt: 0 };
    sodCurrent: any = {};
    customerterms: any[];
    representatives: any[];
    companylocations: any[];
    orderstatus: any[];

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, private dESrvc: DataEntryService, private toastr: ToastrService, public sharedSrvc: SharedService, private dialog: MatDialog, private $filter: PcdrFilterPipe, public wjH: wjHelperService, companyRules: CompanyRulesService, private datePipe: DatePipe, public appH: appHelperService) {

        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        // Data Stores, Unique Keys, updatable, validate fields
        this.invworkheaders = this.dESrvc.newDataStore('invworkheaders', [], true, ['flocation', 'flocation2', 'ftype']);
        this.invwork = this.dESrvc.newDataStore('invworks', [], true, ['fqty']);
        this.dESrvc.validateDataStore('invworkheaders', 'PROPERTIES', 'flocation', 'LOCATION FROM');
        this.dESrvc.validateDataStore('invworkheaders', 'PROPERTIES', 'flocation2', 'SALESMEN');
        this.dESrvc.validateDataStore('invworkheaders', 'PROPERTIES', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('invworks', 'DETAILS', 'fqty', 'QUANTITY');

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe(
            (dataResponse) => {
                this.companylocations = dataResponse;
            }
        );
        this.DataSvc.serverDataGet('api/CompanyMaint/GetPosprint').subscribe(
            (dataResponse) => {
                this.fposprint = dataResponse.fposprint;
            }
        );
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Transaction List',
            buttons: [
                { name: 'Edit Selected', style: 'success', action: 'listSOGridEdit' },
            ],
            navButtons: [{ name: 'Entry', action: 'selectedTab', val: 1 }],
            rows: { grid: 'listSOGrid' },
        });

        this.bar02.setNavProperties(this, {
            title: 'Properties',
            buttons: [
                { name: 'New Transaction', style: 'success', action: 'createSO' },
                { name: ' Receipt', style: 'light', icon: 'fa fa-print', action: 'printSO', val: false },
                // { name: 'Drawer', style: 'light', tooltip: 'Open Drawer', action: 'openDrawer', show: this.OptOpenDrawer },
                // { name: 'Set Pending', style: 'primary', action: 'setToPending', show: this.OptSetPending },
                // { name: 'Void', style: 'danger', action: 'setToVoid' },
                // { name: 'Drawer Report', style: 'secondary', action: 'drawerReport', show: this.OptDrwRpt },
                { name: 'Complete', style: 'primary', action: 'complete'}
            ],
            // spans: [
            // {text: 'Last Order:', property: 'lastordernumber', style: 'margin-left:45px'},
            // {text: 'Drawer:', property: 'totalDrawer', style: 'margin-left:15px'}
            // ],
            navButtons: [
                { name: 'Order List', action: 'selectedTab', val: 0}
            ],
            search: { action: 'searchSONumber', ngModel: 'searchId', placeholder: 'Transaction Number', val: true },
            validEntry: true,
        });
    }

    ngAfterViewInit() {
        // programId gets overriden at this level, not at constructor
        this.sharedSrvc.setProgramRights(this, this.programId); // sets fupdate, fadmin

        this.initGrids();
        this.wjH.fixWM();

        // Get default customer id
        this.DataSvc.serverDataGet('api/CompanyMaint/GetPOSCustomerID').subscribe((dataResponse) => {
            this.default_fcid = dataResponse.fpos_cid;
            this.createSO();
            this.focusToScan();
        });
    }

    // barXX Events
    onClickNav(parm) {
        switch (parm.action) {
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

    validEntry() {
        return (this.invworkheaders.items.length == 1);
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }

    // Create PO for particular vendor
    createSO() {
        // Check for changes
        this.dESrvc.pendingChangesContinue().subscribe(() => {
            this.CompanySvc.ofHourGlass(true);
            this.invwork.loadData([]);
            this.invworkheaders.loadData([]);
            this.setImage(null);
            this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'invworkheader'}).subscribe((dataResponse) => {
                var dt = new Date();
                dt.setHours(12, 0, 0);// Remove time

                this.invworkheaders.addRow({
                    fiwhid: dataResponse.data,
                    fdate: dt,
                    fstatus: 'O',
                    ftype: this.trxType,
                    fnotes: null, // wijmo compalins
                    flocation: this.appH.getUserLocation() // Assign user location
                });

                this.soCurrent = this.invworkheaders.items[0]; // pointer
                this.wjH.gridLoad(this.invworkGrid, []);
                this.sodCurrent = {};
                this.salesordersTotals();
                this.updateTotalQty();
                this.focusToScan();
                this.CompanySvc.ofHourGlass(false);
            });
        });
    }

    // Calculate totals for salesorders
    salesordersTotals() {
        var sorow = this.invworkheaders.items[0];
        sorow.ftotal = 0;
        // Loop details
        var len = this.invwork.items.length;
        for (var i = 0; i < len; i++) {
            sorow.ftotal += this.invwork.items[i].cextended;
        }
        sorow.ftotal = this.CompanySvc.r2d(sorow.ftotal);
        this.invworkheaders.items[0] = sorow; // Reasing
    }

    printSO() {
        if (!this.validEntry() || this.invwork.items.length == 0) {
            this.focusToScan();
            return;
        }

        this.CompanySvc.ofHourGlass(true);

        var mParms = 'pfiwhid=' + this.soCurrent.fiwhid;
        this.CompanySvc.ofCreateJasperReport('invworkSO.pdf', mParms).subscribe((pResponse) => {
            // Print PDF file
            setTimeout(() => {
                this.CompanySvc.printPDFserverFile(pResponse.data, this);
            }, 1000);
        });
    }

    scanBeep() {
        // window.location.href = 'pcdrscanbeep:'; // machine beep
    }

    searchSONumber(checkPending = false) {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/invwork/GetValidateInvworkheader', {pfid: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0 && dataResponse[0].ftype == 'SX') {
                if (checkPending) {
                    this.dESrvc.pendingChangesContinue().subscribe(() => {
                        this.retrieveSO(dataResponse[0].fiwhid);
                        this.searchId = '';
                        this.CompanySvc.ofHourGlass(false)
                    });
                }
                else {
                    this.retrieveSO(dataResponse[0].fiwhid);
                    this.searchId = '';
                }
            }
            else {

                this.toastr.info('TRANSACTION ' + this.searchId + ' Not Found');
                this.searchId = '';
            }

            this.CompanySvc.ofHourGlass(false);
        });
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;
        if (this.fitem.length < 2) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWithPrice', {pfitem: this.fitem, pfcid: this.default_fcid}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.appH.toastr('Item ' + this.fitem + ' not found!','error', '', true);
                return;
            }
            let row = dataResponse[0];
            this.salesdetailsAddItem(row, true, true);
            this.scanBeep();
            this.updateTotalQty();
            this.wjH.gridLoad( this.invworkGrid, this.invwork.items, false );
            this.wjH.gridScrollToRow( this.invworkGrid, -1, 0, 'fitem', row.fitem ); // No-focus only scroll
            
            this.fitem = ''; // Clear value
            this.focusToScan();
        });

        // this.salesdetailsAddItemByFitem(this.fitem).subscribe((row) => {
        //     if (row) {
        //         this.scanBeep();

        //         this.updateTotalQty();
        //         this.wjH.gridLoad( this.invworkGrid, this.invwork.items, false );
        //         this.wjH.gridScrollToRow( this.invworkGrid, -1, 0, 'fiwid', row.fiwid ); // No-focus only scroll
        //     }
        //     this.fitem = ''; // Clear value
        //     this.focusToScan();
        // });
    }

    // Add a record to salesdetails
    salesdetailsAddItem(pitem, calcTotal: boolean, pAddTop = true) {
        // Increment Qty if item found
        var row = this.$filter.transform(this.invwork.items, {fitem: pitem.fitem}, true)[0];
        //TODO: values should come from codetable instead of 997, 998 or 999
        if (row && ('997,998,999').indexOf(row.fitem) == -1) {
            row.fqty += parseInt(pitem.cqty || 1);
        }
        else {
            var rowIndex = this.invwork.addRow({
                // fiwid: this.dESrvc.getMaxValue(this.invwork.items, 'fiwid') + 1,
                fiwhid: this.invworkheaders.items[0].fiwhid,
                fitem: pitem.fitem,
                fdescription: pitem.fdescription + ' ' + pitem.fuomdescription,
                cfitem: pitem.fuomdescription,
                fqty: parseInt(pitem.cqty || 1),
                fprice: pitem.fsaleprice, // Might be undefined
                fweight: pitem.fweight,
                funits: pitem.funits,
                fimid: pitem.fimid,
                fsalesbase: pitem.fsalesbase,
            }, pAddTop);
            
            if (pAddTop) {
                row = this.invwork.items[0]; // Always first since now added to top
            }
            else {
                row = this.invwork.items[rowIndex - 1];
            }

            // Assing seq
            this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'invwork'}).subscribe((dataResponse)=> {
                row.fiwid = dataResponse.data;
            });
        }

        this.salesdetailsComputed(row, row.fprice, row.fqty);
        if (calcTotal) this.salesordersTotals();
        if (row.fprice == 0) this.itemZeroPrice(row); // React to zero price

        return row;
    }

    // Update Total Qty
    updateTotalQty() {
        this.totalQty = 0;
        this.totalWght = 0;
        this.invwork.items.forEach((row) => {
            this.totalQty += row.fqty;
            this.totalWght += row.cweight;
        });
    }

    // Prompt when zero price
    itemZeroPrice(row) {
        this.editItemDialog(row);
    }

    overrideAdmin() {
        return Observable.create((observer) => {
            this.CompanySvc.inputDialog(
                'Enter Code',
                '',
                'Admin Void-Override Code',
                'Continue',
                'Cancel',
                true
            ).subscribe((value) => {
                if (value) {
                    this.DataSvc.serverDataGet(
                        'api/CompanyMaint/GetValidatePOSOverride',
                        { pfposoverride: value }
                    ).subscribe((dataResponse) => {
                        if (dataResponse.validate) {
                            observer.next(dataResponse);
                        } else {
                            this.toastr.warning('Invalid Admin Code!');
                        }
                    });
                }
            });
        });
    }

    // Show related items
    itemOptions() {
        if (!this.validEntry()) {
            this.focusToScan();
            return;
        }
        var row = this.wjH.getGridSelectecRow(this.invworkGrid);
        if (!row) {
            this.focusToScan();
            return;
        } // No selected row
        this.setImage(row);

        this.showItemOptions(row)
            .finally(() => {
                this.focusToScan();
            })
            .subscribe(() => {
                this.invworkGrid.refresh();
                this.updateTotalQty();
                this.setImage(row);
            });
    }

    // Show related items and replace if not isNew()
    showItemOptions(cRow) {
        return Observable.create((observer) => {
            if (!cRow) {
                observer.complete();
                return;
            }
            
            let pData = { fitem: cRow.fitem, fcid: this.default_fcid };
            this.dialog.open(ItemRelatedList, {data: pData}).afterClosed().subscribe(selected => {
            if (!selected) {
                observer.complete();
                return;
            }
            
            var row = cRow;
            // Make sure is different
            if (row.fitem !== selected.fitem) {

                if (!this.invwork.isNew(row)) {
                    this.toastr.info('Existing items cannot be replaced. Add an Item instead.');
                    observer.complete();
                    return;
                }

                row.fitem = selected.fitem;
                row.fdescription = selected.fdescription + ' ' + selected.fuomdescription;
                row.cfitem = selected.fuomdescription;
                row.fprice = selected.fsaleprice;
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

    // Calculate salesdetails computed fields for all rows
    salesdetailsComputedAll() {
        this.invwork.items.forEach((item) => {
            this.salesdetailsComputed(item, item.fprice, item.fqty);
        });
    }

    // Calculate salesdetails computed fields 1 row
    salesdetailsComputed(row, fprice:number, fqty:number) {
        row.cextended = this.CompanySvc.r2d(fprice * fqty);
        row.cweight = this.CompanySvc.r2d(fqty * row.fweight);
    }

    editItemDialog(row) {
        this.dialog
            .open(SOEditItem, { data: row })
            .afterClosed()
            .subscribe(() => {
                row.fprice = Math.abs(
                    this.CompanySvc.validNumber(row.fprice, 2)
                ); // Amount alway positive
                row.fqty = this.CompanySvc.validNumber(row.fqty, 2);

                this.salesdetailchanged(row);
                this.focusToScan();
            });
    }

    salesdetailchanged(row) {
        this.salesdetailsComputed(row, row.fprice, row.fqty);
        this.salesordersTotals();
        this.updateTotalQty();
        this.invworkGrid.refresh();
    }

    complete() {
        // no details, not new order
        if (!this.validEntry() || this.invwork.items.length == 0) {
            this.focusToScan();
            return;
        }

        if (this.invworkheaders.getChanges()) {
            // Validate Details
            if (this.invwork.items.length < 1) {
                this.appH.toastr('Transaction Must Have At Least 1 Detail.', 'warning');
                return;
            }

            if (this.invworkheaders.items[0].fstatus !== 'O') {
                this.appH.toastr('Only new Transaction can be COMPLETE', 'error');
                return;
            }

            if (this.dESrvc.validate() !== '')  return;
            this.CompanySvc.ofHourGlass(true);

            // Last Update
            this.invworkheaders.items[0].ts = new Date();
            this.invworkheaders.items[0].fuser = this.appH.getUsername();
            this.invworkheaders.items[0].fstatus = 'C';

            // Update status from parent
            this.invwork.items.forEach((row) => {
                row.fstatus = this.invworkheaders.items[0].fstatus;
                row.fdate = this.invworkheaders.items[0].fdate;
                row.ts = this.invworkheaders.items[0].ts;
            });

            // Send to Server
            this.dESrvc.update('api/Invwork/Postupdate').subscribe((dataResponse) => {
                this.lastordernumber = this.invworkheaders.items[0].fiwhid; // Save last order
                this.printSO();
                this.createSO();
                this.CompanySvc.ofHourGlass(false);
            }, (ErrorMsg) => {
                this.lastordernumber = '';
                this.invworkheaders.items[0].fstatus = 'O'; // Reverse status
                this.CompanySvc.ofHourGlass(false);
                // this.toastr.error('Unable to Update. Please try again!','', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
            });
        }
    }

    salesdetailsAdd() {
        if (!this.validEntry()) return;

        // Clear Value to prevent showing continuous error on invalid value
        if (this.fitem !== '') {
            this.fitem = '';
            this.toastr.clear();
        }

        let pData = { fcid: this.default_fcid };
        //const dataResponse = this.dialog.open(ItemList, { data: pData }).afterClosed().toPromise();
        //console.log(dataResponse);
        this.dialog.open(ItemList, { data: pData }).afterClosed()
            .subscribe((dataResponse) => {
                this.focusToScan();
                if (!dataResponse) return;
                let row = this.salesdetailsAddItem(dataResponse, true); //  Add selection to salesdetails
                this.updateTotalQty();
                this.wjH.gridLoad( this.invworkGrid, this.invwork.items );
                this.wjH.gridScrollToRow( this.invworkGrid, -1, 0, 'fiwid', row.fiwid);
            });

            
            // .subscribe((dataResponse) => {
            //     this.focusToScan();
            //     if (!dataResponse) return;
            //     let row = await this.salesdetailsAddItem(dataResponse, true); //  Add selection to salesdetails
            //     this.updateTotalQty();
            //     this.wjH.gridLoad( this.invworkGrid, this.invwork.items );
            //     this.wjH.gridScrollToRow( this.invworkGrid, -1, 0, 'fiwid', row.fiwid);
            // });
    }

    salesdetailsRemove() {
        this.focusToScan();

        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.invworkGrid);
        if (!row) return;

        this.invwork .removeRow(row) .finally(() => {
                this.focusToScan();
            })
            .subscribe(() => {
                this.wjH.gridLoad( this.invworkGrid, this.invwork.items, false );
                this.salesordersTotals();
                this.updateTotalQty();
                this.setImage(null);

                if (this.invwork.items.length == 0) this.sodCurrent = {}; // Clear if no rows
            });
    }

    listOLGridRefresh() {
        if (!this.soflocation) return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/invwork/GetSOList', {
            pdatef: this.datePipe.transform(this.sodatef, 'yyyy-MM-dd'),
            pdatet: this.datePipe.transform(this.sodatet, 'yyyy-MM-dd'),
            pflocation: this.soflocation
        }).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.listSOGrid, dataResponse);
            this.listSOGridTotal();

            if (dataResponse.length === 0) this.toastr.info('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listSOGridTotal() {
        var ftotal = 0,
            fbalance = 0;

        this.listSOGrid.itemsSource.forEach((row) => {
            ftotal += row.ftotal;
        });
        this.listSOGrid.columnFooters.setCellData(0, 'ftotal', ftotal);
    }

    listSOGridEdit() {
        let row = this.wjH.getGridSelectecRow(this.listSOGrid);
        if (!row) return;

        if (this.invwork.items.length > 0) {
            this.dESrvc.pendingChangesContinue().subscribe(() => {
                this.retrieveSO(row.fiwhid);
                this.selectedTab = 1;
                this.gridRepaint();
            });
        } else {
            this.retrieveSO(row.fiwhid);
            this.selectedTab = 1;
            this.gridRepaint();
        }
    }

    retrieveSO(afsoid:number):void {
        if (!afsoid) return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/Invwork/GetInvworkH', {pfid: afsoid}).subscribe((dataResponse) => {
            this.invworkheaders.loadData(dataResponse.invworkheaders);
            this.invwork.loadData(dataResponse.invworks);

            // Calculate Computed Columns
            this.salesdetailsComputedAll();
            this.soCurrent = this.invworkheaders.items[0]; // pointer
            this.wjH.gridLoad( this.invworkGrid, this.invwork.items, false ); 
            this.updateTotalQty();
            this.focusToScan();
            
            this.CompanySvc.ofHourGlass(false);
        });
    }

    editQty() {
        if (!this.validEntry()) {
            this.focusToScan();
            return;
        }

        var row = this.wjH.getGridSelectecRow(this.invworkGrid);
        if (!row) {
            this.focusToScan();
            return;
        } // No selected row

        this.CompanySvc.inputDialog('Qty', row['fqty'], 'Quantity', 'Continue', 'Cancel', false, true, false, 'inputDialogQty', this).subscribe(() => {
            this.salesordersTotals();
            this.updateTotalQty();
            this.wjH.gridLoad( this.invworkGrid, this.invwork.items, false );
            this.focusToScan();
        });
    }

    inputDialogQty(val) {
        let amt = this.CompanySvc.validNumber(val); // Will make it at least 0
        if (amt == 0) amt = 1; // Make sure is at least 1

        var row = this.wjH.getGridSelectecRow(this.invworkGrid);
        row.fqty = amt;

        this.salesdetailchanged(row);
        this.focusToScan();
        return true;
    }

    setImage(row) {
        this.itemunitsImgCurrent = row ? './images/' + row.fitem + '.jpg' : '';
    }

    onResize(event) {
        // setTimeout(() => {
        this.tH01 = window.innerHeight - 50;
        this.tH02 = window.innerHeight - 50;
        this.gH01 = window.innerHeight - 50;
        // }, 100);
    }

    // Allows grid to repaint properly due to multiple tabs
    gridRepaint() {
        setTimeout(() => {
            switch (this.selectedTab) {
                case 0:
                    this.wjH.gridRedraw(this.invworkGrid);
                    break;
            }
        }, 100);
    }

    initGrids() {
        // wj-flex-grid
        this.invworkGrid.initialize({
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
                if (this.wjH.gridSelectChanged(this.invworkGrid, e.row)) {
                    var row = this.wjH.getGridSelectecRow(
                        this.invworkGrid
                    );
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
                { binding: 'fdescription', header: 'Description', minWidth: 200, width: '*', },
                // { binding: "fprice", header: "Price", format: 'c', width: 80, },
                // { binding: "cfmarkup", header: "Markup%", width: 80 },
                // { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
                { binding: 'cextended', header: 'Extended', width: 100, format: 'c', isReadOnly: true, },
                // { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
            ],
        });
        this.wjH.gridInit(this.invworkGrid);
        this.invworkGrid.headersVisibility = wjGrid.HeadersVisibility.None;
        this.invworkGrid.rows.defaultSize = 50;
        this.invworkGrid.showAlternatingRows = false;

        // wj-flex-grid
        this.listSOGrid.initialize({
            isReadOnly: true,
            columns: [
                { binding: 'fiwhid', header: 'TRX#', width: 100, format: 'D' },
                { binding: 'fdate', header: 'Date', width: 100, format: 'MM/dd/yyyy' },
                { binding: 'fname', header: 'Salesmen', width: '*' },
                { binding: 'fnotes', header: 'PO Number', width: 200 },
                { binding: 'ftotal', header: 'Total', width: 130, format: 'c' }
            ],
        });
        this.wjH.gridInit(this.listSOGrid, true);
        this.listSOGrid.columnFooters.rows.push(new wjGrid.GroupRow());
        this.listSOGrid.hostElement.addEventListener('dblclick', (e) => {
            this.listSOGridEdit();
        });
        new wjGridFilter.FlexGridFilter(this.listSOGrid);
    }
}

