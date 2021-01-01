import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { DataEntryService, DataStore } from '../../../services/dataentry.service';
import { CompanyService } from '../../../services/company.service';
import { wjHelperService } from '../../../services/wjHelper.service';
import { DatePipe } from '@angular/common';
import { PcdrFilterPipe } from '../../../pipes/pcdrfilter.pipe';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { ItemList } from '../../../inventory/itemlist/itemlist.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'invvaluation',
    templateUrl: './invvaluation.html',
    providers: [DataEntryService] // New instance gets created
})
export class invvaluation implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fctid = 'All';
    fcategory: any[];
    companylocations: any[];
    flocation:number = 0;
    fqtytype = "A";

    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService, private datePipe: DatePipe, private toastr: ToastrService, 
        private $filter: PcdrFilterPipe, public dialog: MatDialog) {

        // Get Company Locations for DropDown
        this.DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
            this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
        });

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.fcategory = this.$filter.transform(dataResponse, {fgroupid: 'IMC'}, true);
            this.fcategory.unshift({fgroupid: 'IMC', fid: 'All'}); // Add ALL
        }); // when codetable is needed
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            buttons: [
                {name: 'Report', icon: 'fa fa-print', style: 'primary', tooltip: 'Generate Report', action: 'print'}
            ],
            subnavbar: false
        })
    }

    ngOnDestroy() {}

    // barXX Events
    onClickNav(parm) {
        this[parm.action]();
    }

    print() {
        var mParms = 
        "pAnd=" +
        (this.flocation > 0? " AND inventories.flocation=" + this.flocation: "") +
        (this.fctid !== 'All'? " AND itemmasters.fcategory='" + this.fctid + "'": "") +
        (this.fqtytype !== 'A'? " AND inventories.fonhand " + (this.fqtytype == 'P'? ">": "<") + " 0": "");

        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('InventoryValuation.pdf', mParms).subscribe((pResponse) => {
            // Open PDF or XLXS file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}