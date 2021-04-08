import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { DataService } from '../../services/data.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { appHelperService } from '../../services/appHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGrid from "@grapecity/wijmo.grid";
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'invwork',
    templateUrl: './invwork.html',
    providers: [DataEntryService],
})
export class invwork implements OnDestroy, AfterViewInit {
    @ViewChild('barList', {static: true}) barList: pcdrBuilderComponent;
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('listGrid', {static: true}) listGrid: WjFlexGrid;
    @ViewChild('invworkGrid', {static: true}) invworkGrid: WjFlexGrid;
    @ViewChild('fitemE') fitemE: ElementRef;
    selectedTab = 1;
    tH01:number;
    tH02:number;
    poCurrent: any = {};
    // fshipto: number;
    fitem:string;
    searchId = '';
    orderstatus:any [];
    fcttypes:any [];
    fctdescriptions:any [];
    itemunitsImgCurrent = '';
    
    // Set by each program
    @Input() programId: string;
    @Input() showOnhand = false;
    @Input() showQty1 = true;
    @Input() showQty2 = false;
    @Input() showQty3 = false;
    @Input() UpdateQty = 'fqty';
    @Input() allowDetailRemove = false;
    @Input() allowNewTransaction = true;
    @Input() allowItemLookup = true;
    @Input() addincrementScanItem = true;
    @Input() completebutton: string = 'Complete';
    @Input() location2 = false;
    @Input() OptShowTabs = false;
    @Input() OptLocationDisabled = false;
    allowNegativeQty = false;
    afterRetrieveTrx = false;
    trxType:string;
    parent:any;
    lastordernumber: string;
    OptNewAfterPost = true;
    OptPrintAfterPost = true;
    @Input() OptShowLastTransaction = true;
    @Input() OptShowListStatus = true;

    sodatef: Date = new Date();
    sodatet: Date = new Date();
    sostatus: string = 'O';
    flocation = 0;

    invworkheaders:DataStore;
    invwork:DataStore;
    companylocations: any[];
    
    constructor(public CompanySvc: CompanyService, private DataSvc: DataService, public dESrvc: DataEntryService, 
        public sharedSrvc: SharedService, private $filter: PcdrFilterPipe, 
        public wjH: wjHelperService, public appH: appHelperService,
        public dialog: MatDialog, private datePipe: DatePipe) {
        
        this.sharedSrvc.setProgramRights(this, this.programId); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        // Data Stores, Unique Keys, updatable, validate fields
        this.invworkheaders = this.dESrvc.newDataStore('invworkheaders', [], true, ['flocation', 'ftype']);
        this.invwork = this.dESrvc.newDataStore('invworks', [], true, ['fqty']);
        this.dESrvc.validateDataStore('invworkheaders', 'PROPERTIES', 'flocation', 'LOCATION FROM');
        this.dESrvc.validateDataStore('invworkheaders', 'PROPERTIES', 'ftype', 'TYPE');
        this.dESrvc.validateDataStore('invworks', 'DETAILS', 'fqty', 'QUANTITY');

        // Get Company Locations for DropDown
        DataSvc.serverDataGetAsync('api/CompanyMaint/GetLocationsDD').then((dataResponse) => {
            this.companylocations = <any>dataResponse;
            // this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
            // this.fshipto = this.appH.getUserLocation(); // Assign user location
        });

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'ITS'}, true);
            this.orderstatus.unshift({fid: '-1', fdescription: 'All'}); // Add All

            this.fcttypes = this.$filter.transform(dataResponse, {fgroupid: 'ITL'}, true); //
            this.fctdescriptions = this.$filter.transform(dataResponse, {fgroupid: 'ITD'}, true); //
        });

        this.flocation = this.appH.getUserLocation() // Assign user location;
    }

    ngOnInit() {
        if (this.OptShowTabs) this.selectedTab = 0; // When Tabs show list first

        this.barList.setNavProperties(this, {
            title: 'Transaction List',
            buttons: [
                { name: 'Edit Selected', style: 'success', action: 'listGridEdit' },
            ],
            navButtons: [{ name: 'Entry', action: 'selectedTab', val: 1 }],
            rows: { grid: 'listGrid' },
        });

        this.bar01.setNavProperties(this, {
            title: 'Inventory Properties', 
            buttons: [
                {name: 'New Transaction', style: 'success', action: 'createOrder', show: this.allowNewTransaction},
                {name: this.completebutton, style: 'primary', action: 'update'},
                {name: ' Receipt', style: 'light', icon: 'fa fa-print', action: 'printPO'}
            ],
            navButtons: [
                { name: 'Transaction List', action: 'selectedTab', val: 0, show: this.OptShowTabs }
            ],
            validEntry: true,
            search: {action: 'searchPONumber', ngModel: 'searchId', placeholder: 'Inventory Work Number', }
        })

        this.bar02.setNavProperties(this, {
            title: 'Details', 
            buttons: [
                {name: ' Remove', style: 'danger', icon: 'fa fa-minus-circle', action: 'detailsRemove', show: this.allowDetailRemove},
                {name: ' Find Item', style: 'success', icon: 'fa fa-search', action: 'lookupItem', show: this.allowItemLookup},
                {name: 'Change Qty', style: 'primary', action: 'editQty'}
            ],
            // spans: [
            //     {text:'Items:', property:'invwork.items.length', style:'margin-left:35px'}
            // ],
            rows: {grid: 'invworkGrid'}
        })
    }

    // barXX Events
    onClickNav(parm) {
        switch(parm.action) {
            case 'selectedTab':
                this.selectedTab = parm.val;
                break;
            case 'customAction':
                this.parent[parm.function]();
                break;
            default:
                this[parm.action](parm.val);
                break;
        }
    }

    listGridRefresh() {
        this.CompanySvc.ofHourGlass(true);

        this.DataSvc.serverDataGet('api/invwork/GetTrxList', {
            pdatef: this.datePipe.transform(this.sodatef, 'yyyy-MM-dd'),
            pdatet: this.datePipe.transform(this.sodatet, 'yyyy-MM-dd'),
            pflocation: this.flocation,
            pfstatus: this.sostatus,
            pftype: this.trxType
        }).subscribe((dataResponse) => {
            this.wjH.gridLoad(this.listGrid, dataResponse);

            if (dataResponse.length === 0) this.appH.toastr('No Rows found');
            this.CompanySvc.ofHourGlass(false);
        });
    }

    listGridEdit() {
        let row = this.wjH.getGridSelectecRow(this.listGrid);
        if (!row) return;

        if (this.invwork.items.length > 0) {
            this.dESrvc.pendingChangesContinue().subscribe(() => {
                this.retrieveTrx(row.fiwhid);
                this.selectedTab = 1;
            });
        } else {
            this.retrieveTrx(row.fiwhid);
            this.selectedTab = 1;
        }
    }

    // Create PO for particular vendor
    async createOrder() {
        // Check for changes
        this.dESrvc.pendingChangesContinue().subscribe(async () => {
            this.CompanySvc.ofHourGlass(true);
            this.invwork.loadData([]);
            this.invworkheaders.loadData([]);
            this.setImage(null);
            let dataResponse = await this.DataSvc.serverDataGetAsync('api/Company/Getnextsequence', {seq: 'invworkheader'});
            if (dataResponse) {
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

                this.poCurrent = this.invworkheaders.items[0]; // pointer
                this.wjH.gridLoad(this.invworkGrid, []);
                this.CompanySvc.ofHourGlass(false);
                this.focusToScan();
            };
        });
    }
    // createOrder() {
    //     // Check for changes
    //     this.dESrvc.pendingChangesContinue().subscribe(() => {
    //         this.CompanySvc.ofHourGlass(true);
    //         this.invwork.loadData([]);
    //         this.invworkheaders.loadData([]);
    //         this.setImage(null);
    //         this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'invworkheader'}).subscribe((dataResponse) => {
    //             var dt = new Date();
    //             dt.setHours(12, 0, 0);// Remove time

    //             this.invworkheaders.addRow({
    //                 fiwhid: dataResponse.data,
    //                 fdate: dt,
    //                 fstatus: 'O',
    //                 ftype: this.trxType,
    //                 fnotes: null, // wijmo compalins
    //                 flocation: this.appH.getUserLocation() // Assign user location
    //             });

    //             this.poCurrent = this.invworkheaders.items[0]; // pointer
    //             this.wjH.gridLoad(this.invworkGrid, []);
    //             this.CompanySvc.ofHourGlass(false);
    //             this.focusToScan();
    //         });
    //     });
    // }

    detailsRemove() {
        this.focusToScan();

        if (!this.validEntry()) return;
        let row = this.wjH.getGridSelectecRow(this.invworkGrid);
        if (!row) return;

        this.invwork.removeRow(row).finally(()=> {
            this.focusToScan();
        }).subscribe(() => {
            this.wjH.gridLoad(this.invworkGrid, this.invwork.items, false);
            if (this.invwork.items.length == 0) this.setImage(null);
        });
    }

    // Add scanned item
    fitemOnChange() {
        if (!this.validEntry()) return;
        if (!this.fitem) return;

        var row = this.invworkfindrow(this.fitem);
        if (row) {
            this.fitem = ''; // Clear value
            if (this.addincrementScanItem) { row.fqty += 1; } // Increment Qty only if allowed
            this.invworkGrid.refresh();
            this.wjH.gridScrollToRow(this.invworkGrid, -1, 0, 'fitem', row.fitem); // No-focus only scroll
        }
        else {
            if (!this.addincrementScanItem) {
                this.appH.toastr('Item ' + this.fitem + " not found on this list.");
                this.fitem = ''; // Clear value
                this.focusToScan();
                return; // Do not add new item
            }

            this.addinvwork(this.fitem);
            this.fitem = ''; // Clear value

            // this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemWOH', {pfitem: this.fitem, pfloc: this.poCurrent.flocation, pfactive: 'true'}).subscribe((res) => {
            //     if (res.length == 0) {
            //         this.appH.toastr('Item ' + this.fitem + ' not found!','error', '', true);
            //         this.fitem = '';
            //         return;
            //     }
                    
            //     this.DataSvc.serverDataGet('api/Company/Getnextsequence', {seq: 'invwork'}).subscribe((dataResponse) => {
            //         var dt = new Date();
            //         this.invwork.addRow({
            //             fiwid: dataResponse.data,
            //             fiwhid: this.invworkheaders.items[0].fiwhid,
            //             ts: dt,
            //             fitem: res[0].fitem,                
            //             ftype: this.invworkheaders.items[0].ftype,                
            //             fstatus: this.invworkheaders.items[0].fstatus,              
            //             // fuser: this.sharedSrvc.user.fname,                
            //             fuser: this.appH.getUsername(),                
            //             fdate: this.invworkheaders.items[0].fdate,                
            //             flocation: this.invworkheaders.items[0].flocation,            
            //             fnotes: this.invworkheaders.items[0].fnotes,          
            //             fqty: 1,
            //             // computed                 
            //             fdescription: res[0].cfdescription,
            //             funits: res[0].funits,
            //             fonhand: res[0].fonhand
            //         });
            
            //         this.wjH.gridLoad(this.invworkGrid, this.invwork.items); // Load data
            //         this.wjH.gridScrollToLastRow(this.invworkGrid, 1); // Scroll to new row (always last)
            //         this.fitem = ''; // Clear value
            //     })
            // });
        }

        this.focusToScan();
    }

    invworkfindrow(pfitem : string) {
        return this.$filter.transform(this.invwork.items, {fitem: pfitem}, true)[0];
    }

    async addinvwork(pfitem:string, pRefreshGrid = true) {
        let newRow = null;
        const res = await this.DataSvc.serverDataGetAsync('api/ItemMaint/GetValidateItemWOH', {pfitem: pfitem, pfloc: this.poCurrent.flocation, pfactive: 'true'});
        if (!res || res.length == 0) {
            this.appH.toastr('Item ' + pfitem + ' not found!','error', '', true);
            return null;
        }
                
        let dataResponse = await this.DataSvc.serverDataGetAsync('api/Company/Getnextsequence', {seq: 'invwork'});
        if (dataResponse) {
            var dt = new Date();
            newRow = this.invwork.addRow({
                fiwid: dataResponse.data,
                fiwhid: this.invworkheaders.items[0].fiwhid,
                ts: dt,
                fitem: res[0].fitem,                
                ftype: this.invworkheaders.items[0].ftype,                
                fstatus: this.invworkheaders.items[0].fstatus,              
                fuser: this.appH.getUsername(),                
                fdate: this.invworkheaders.items[0].fdate,                
                flocation: this.invworkheaders.items[0].flocation,            
                fnotes: this.invworkheaders.items[0].fnotes,          
                fqty: 1,
                fqty2: 0,
                fqty3: 0,
                // computed                 
                fdescription: res[0].cfdescription,
                funits: res[0].funits,
                fonhand: res[0].fonhand
            });
            newRow = this.invwork.items[newRow - 1];

            if (pRefreshGrid) {
                this.wjH.gridLoad(this.invworkGrid, this.invwork.items); // Load data
                this.wjH.gridScrollToRow( this.invworkGrid, -1, 0, 'fitem', newRow.fitem); // park on Price
            }
        }

        return newRow;
    }

    editQty() {
        if (!this.validEntry()) { this.focusToScan(); return };
        var row = this.wjH.getGridSelectecRow(this.invworkGrid);
        if (!row) { this.focusToScan(); return }; // No selected row

        this.CompanySvc.inputDialog('Qty', row[this.UpdateQty], 'Quantity', 'Continue', 'Cancel', false, true, false, 'inputDialogQty', this).subscribe(() => {
            this.focusToScan();
        });
    }
    
    inputDialogQty(val) {
        let amt = this.CompanySvc.validNumber(val); // Will make it at least 0
        if (amt < 0 && (!this.allowNegativeQty)) {
            this.appH.toastr('Quantity cannot be negative!','warning');
            return false
        }

        var row = this.wjH.getGridSelectecRow(this.invworkGrid);
        row[this.UpdateQty] = amt; // Update fqty1/2/3
        this.invworkGrid.refresh(false);
        return true;
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.initGrids();
    }

    validEntry() {
        return (this.invworkheaders.items.length == 1);
    }

    update() {
        if (!this.validEntry()) return;
        if (!this.dESrvc.checkForChanges()) return;
        
        if (!this.parent['allowToUpdate'](this.invworkheaders.items[0])) {
            this.appH.toastr('Only OPEN Transactions can be modified.');
            return;
        }

        // Validate Details
        if (this.invwork.items.length < 1) {
            this.appH.toastr('Transaction Must Have At Least 1 Detail.', 'warning');
            return;
        }

        if (this.dESrvc.validate() !== '')  return;
        this.CompanySvc.ofHourGlass(true);

        this.parent['InUpdate'](); // Call parent.InUpdate();
        // Update status from parent in case it was changed in 'InUpdate'
        this.invwork.items.forEach((row) => {
            row.fstatus = this.invworkheaders.items[0].fstatus;
        });

        // Last Update
        this.invworkheaders.items[0].ts = new Date();
        this.invworkheaders.items[0].fuser = this.appH.getUsername();

        // Send to Server
        this.dESrvc.update('api/Invwork/Postupdate').subscribe((dataResponse) => {
            this.lastordernumber = this.invworkheaders.items[0].fiwhid; // Save last order
            if (this.OptPrintAfterPost) this.printPO();
            this.CompanySvc.ofHourGlass(false);
            if (this.OptNewAfterPost) this.createOrder()
        }, (ErrorMsg) => {
            this.lastordernumber = '';
            // this.invworkheaders.items[0].fstatus = 'O'; // Reverse status
            this.CompanySvc.ofHourGlass(false);
        });
    }

    searchPONumber() {
        this.searchId = this.appH.getStringToNumberOrEmpty(this.searchId);
        if (this.searchId === '') return;

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/Invwork/GetValidateInvworkheader', {pfid: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                // if (!this.parent['allowToUpdate'](dataResponse[0])) {
                //     this.appH.toastr('Only OPEN transactions can be modified.');
                // }
                this.dESrvc.pendingChangesContinue().subscribe(() => {
                    this.retrieveTrx(dataResponse[0].fiwhid);
                    this.searchId = '';
                });
            }
            else
                this.appH.toastr('Transaction Number Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    retrieveTrx(afpoid:number) {
        if (!afpoid) return;
        
        this.setImage(null);
        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/Invwork/GetInvworkH', {pfid: afpoid}).subscribe((dataResponse) => {
            this.invworkheaders.loadData(dataResponse.invworkheaders);
            this.invwork.loadData(dataResponse.invworks);
            this.poCurrent = this.invworkheaders.items[0]; // pointer
            
            if (this.afterRetrieveTrx) this.parent['afterRetrieveTrx'](); // Call parent after loading

            this.wjH.gridLoad(this.invworkGrid, this.invwork.items, false);
            this.focusToScan();
            this.CompanySvc.ofHourGlass(false);
        });
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }

    lookupItem() {
        if (!this.validEntry()) return;
        
        // Clear Value to prevent showing continuous error on invalid value
        if (this.fitem !== '') {
            this.fitem = '';
            // this.toastr.clear();
        }

        this.dialog.open(ItemList, {data: {fcid: -1}}).afterClosed().subscribe(dataResponse => {
            this.focusToScan();
            if (!dataResponse) return;
            this.fitem = dataResponse.fitem;
            this.fitemOnChange(); // Adds row
        });
    }

    printPO() {
        if (!this.validEntry()) return;
        this.CompanySvc.ofHourGlass(true);

        var mParms = 'pfiwhid=' + this.poCurrent.fiwhid;
        this.CompanySvc.ofCreateJasperReport('invworkheader.pdf', mParms).subscribe((pResponse) => {
            // Print PDF file
            setTimeout(() => {
                this.CompanySvc.printPDFserverFile(pResponse.data, this);
            }, 1000);
        });
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    onResize(event) {
        this.tH01 = window.innerHeight - 50;
        this.tH02 = window.innerHeight - 442;
    }

    initGrids() {
        // wj-flex-grid
        this.listGrid.initialize({
            isReadOnly: true,
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'ts':
                            e.cell.textContent = this.datePipe.transform(row.ts, 'yyyy/MM/dd h:mm a') + " " + row.fuser;
                            break;
                    }
                }
            },
            columns: [
                { binding: 'fiwhid', header: 'Trx #', width: 100, format: 'D', },
                { binding: 'fdate', header: 'Date', width: 100, format: 'MM/dd/yyyy'},
                { binding: 'cfstatus', header: 'Status', width: 100 },
                { binding: 'fnotes', header: 'Notes', width: '*' },
                { binding: 'ts', header: 'Last Update', width: 300 }
            ],
        });
        this.wjH.gridInit(this.listGrid, true);
        this.listGrid.hostElement.addEventListener('dblclick', (e) => {
            this.listGridEdit();
        });
        new wjGridFilter.FlexGridFilter(this.listGrid);

        // wj-flex-grid
        this.invworkGrid.initialize({
            isReadOnly: true,
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.invworkGrid, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.invworkGrid);
                    this.setImage(row);
                }
            },
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'fnonhand':
                            e.cell.textContent = row.fonhand + (row.fqty * row.funits);
                            break;
                    }
                }
            },
            columns: [
                { binding: "fitem", header: "Item Number", width: 200},
                { binding: "fdescription", header: "Description", width: '*'},
                { binding: "funits", header: "Units/Case", width: 130},
                // Show values if requested
                { binding: "fonhand", header: "On-Hand", width: 100, visible: this.showOnhand, align: "right"},
                { binding: "fqty", header: "Qty", width: 100, aggregate: 'Sum', visible: this.showQty1, align: "right"},
                { binding: "fqty2", header: "Shipped", width: 100, aggregate: 'Sum', visible: this.showQty2, align: "right"},
                { binding: "fqty3", header: "Received", width: 100, aggregate: 'Sum', visible: this.showQty3, align: "right"},
                { binding: "fnonhand", header: "New On-Hand", width: 130, visible: this.showOnhand, align: "right"}
            ]
        });
        this.wjH.gridInit(this.invworkGrid);
        this.invworkGrid.columnFooters.rows.push(new wjGrid.GroupRow()); // Add footer
    }
}
