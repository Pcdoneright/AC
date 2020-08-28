import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, throwMatDialogContentAlreadyAttachedError} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
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
import * as wjcCore from '@grapecity/wijmo';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { soProperties } from '../components/soproperties';
import { soentrybaseClass } from '../soentry/soentrybase';
import { FormControl } from '@angular/forms';
import { appHelperService } from '../../services/appHelper.service';

@Component({
    selector: 'soreopeninvoice',
    templateUrl: './soreopeninvoice.html',
    // styleUrls: ['./soreopeninvoice.css'],
    providers: [DataEntryService],
    // encapsulation: ViewEncapsulation.None
})
// export class soreopeninvoice implements AfterViewInit {
export class soreopeninvoice extends soentrybaseClass implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('soeg01', {static: true}) salesdetailsGrid: WjFlexGrid;
    // @ViewChild('form01', {static: true}) form01: FormControl;
    form01: FormControl;
    @ViewChild('soproperties01', {static: true}) soproperties01: soProperties;
    soCurrent: any = {finvoice_date: new Date(), fshipdate: new Date()}; // Wijmo throws error if null values
    customerterms:any[];
    representatives:any[];
    companylocations:any[];
    searchId:string = '';
    showMoreEdit:boolean = false;
    orderstatus:any [];
    gH01:number;

    constructor(CompanySvc: CompanyService, DataSvc: DataService, dESrvc: DataEntryService,
        toastr: ToastrService, sharedSrvc: SharedService, dialog: MatDialog, $filter: PcdrFilterPipe,
        public wjH: wjHelperService, companyRules: CompanyRulesService, public appH: appHelperService) {

        super(CompanySvc, DataSvc, dESrvc, toastr, sharedSrvc, dialog, $filter, companyRules, appH);

        this.sharedSrvc.setProgramRights(this, 'soreopeninvoice'); // sets fupdate, fadmin
        
        // Get Customer Terms for DropDown
        DataSvc.serverDataGet('api/CustomerMaint/GetCustomerTermsDD').subscribe((dataResponse) => {
            this.customerterms = dataResponse;
        });

        // Get Representative for DropDown
        DataSvc.serverDataGet('api/RepresentativeMaint/GetRepresentativeDD').subscribe((dataResponse) => {
            this.representatives = dataResponse;
        });

        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
        });
    }

    ngAfterViewInit() {
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start

        this.initGrids();
        this.wjH.fixWM();
        this.formDisable()

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.orderstatus = this.$filter.transform(dataResponse, {fgroupid: 'SOS'}, true);
            this.orderstatus.unshift({fid: 'A', fdescription: 'All'}); // Add All
        }); // when codetable is needed
    }
    
    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Order Properties', 
            buttons: [
                {name: 'Re-Open', style: 'primary', action: 'soreopeninvoice'}
            ],
            validEntry: true,
            search: {action: 'searchSONumber', ngModel: 'searchId', placeholder: 'Order Number', },
            chevron: {action: 'editMore', show: 'showMoreEdit'}
        })

        this.bar02.setNavProperties(this, {
            title: 'Items', 
            rows: {grid: 'salesdetailsGrid'},
            subnavbar: false
        })

        this.soproperties01.setProperties(this);
        this.form01 = this.soproperties01.formsop01;
    }

    // Disable Entire Form
    formDisable() {
        setTimeout(() => {
            // Disable all controls in the form (TODO: wijmo-date not disabled)
            for (const iterator of this.form01['nativeElement']) {
                iterator.disabled = true;
            }
        }, 100);
    }

    validEntry() {
        return (this.salesorders.items.length == 1);
    }

    // Extend to Fill grid with data
    postRetrieveSO() {
        this.soCurrent = this.salesorders.items[0]; // pointer
        this.wjH.gridLoad(this.salesdetailsGrid, this.salesdetails.items);
    }

    // barXX Events
    onClickNav(parm) {
        
        switch(parm.action) {
            case 'editMore':
                this.showMoreEdit = !this.showMoreEdit;
                this.formDisable(); // disable form
                this.onResize(null);
                break;                
            default:
                this[parm.action]();
                break;
        }
    }

    soreopeninvoice() {
        if (!this.validEntry()) return;
        if (this.salesorders.items[0].fstatus !== 'I') return; // Make sure is Invoice
        
        // Confirm Process
        this.CompanySvc.confirm("Re-Open this Sales Order?").subscribe(response => {
            if (response) {
                this.CompanySvc.ofHourGlass(true);
                let parms = {pfsoid: this.salesorders.items[0].fsoid, pfusername: this.sharedSrvc.user.fname};

                this.DataSvc.serverDataGet('api/SO/GetOpenInvoice', parms).subscribe((dataResponse) => {
                    if (dataResponse.success) {
                        this.salesorders.items[0].fstatus = 'S'; // For display update status
                        this.toastr.success('Save was succesful!');
                    }
                    else {
                        this.toastr.error('Error Saving: ' + dataResponse.errmsg);
                    }

                    this.CompanySvc.ofHourGlass(false)
                });
            }
        });
    }

    searchSONumber() {
        if (!this.searchId) return;
        this.searchId = this.searchId.replace(/[^0-9\.-]/g, '');
        if (this.searchId === '') return; //Remove non-numeric, period or minus char

        this.CompanySvc.ofHourGlass(true);
        this.DataSvc.serverDataGet('api/SO/GetValidateSonumber', {pfsonumber: this.searchId}).subscribe((dataResponse)=> {
            if (dataResponse.length > 0) {
                if (dataResponse[0].fstatus !== 'I') {
                    this.toastr.warning('Invoiced Orders Only Allowed!'); // Make sure is Invoice
                }
                else {
                    this.dESrvc.pendingChangesContinue().subscribe(() => {
                        this.retrieveSO(dataResponse[0].fsoid);
                        this.searchId = '';
                        this.CompanySvc.ofHourGlass(false)
                    })
                }
            }
            else
                this.toastr.info('S.O. Number Not Found');

            this.CompanySvc.ofHourGlass(false);
        });
    }

    // Re-assign a different customer
    assignCustomer() {
        // Do nothing
    }

    // After salesorders.fdiscountp calculate totals
    onfdiscountp(event) {
        // Do nothing
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            var height = (this.showMoreEdit) ? 720 : 555; // Edit
            this.gH01 = Math.max(window.innerHeight - (height), 200);
        }, 100);
    };

    initGrids() {
        // wj-flex-grid
        this.salesdetailsGrid.initialize({
            formatItem: (s, e) => {
                if (e.panel == s.cells) {
                    var col = s.columns[e.col], row = s.rows[e.row].dataItem;
                    switch (col.binding) {
                        case 'cextended':
                        case 'fprice':
                            if (row.cfmarkup < this.minMarkup || row.fprice <= 0) {
                                wjcCore.toggleClass(e.cell, 'alert-row', true);
                            }
                            break;
                        case 'cunit':
                            e.cell.textContent = this.CompanySvc.currencyRenderer({value: this.CompanySvc.r2d(row.fprice / row.funits)});
                            break;
                    }
                }
            },
            columns: [
                { binding: "fitem", header: "Item Number", width: 200, isReadOnly: true},
                { binding: "cfitem", header: "UOM", width: 150, isReadOnly: true},
                { binding: "fdescription", header: "Description", width: '*'},
                { binding: "fprice", header: "Price", format: 'c', width: 80, },
                { binding: "cunit", header: "@Unit", dataType: 'Number', format: 'c', width: 80, isReadOnly: true },
                { binding: "fqty", header: "Qty", width: 80, aggregate: 'Sum' },
                { binding: "fistaxable", header: "Tax", width: 70, isReadOnly: true },
                { binding: "cextended", header: "Extended", width: 100, format: 'c', isReadOnly: true },
                { binding: "cweight", header: "Weight", width: 100, aggregate: 'Sum', isReadOnly: true }
            ]
        });
        this.wjH.gridInit(this.salesdetailsGrid);
        this.salesdetailsGrid.columnFooters.rows.push(new wjGrid.GroupRow());
    }

}
