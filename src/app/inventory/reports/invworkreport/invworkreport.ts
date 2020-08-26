import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../../services/wjHelper.service';
import { DatePipe } from '@angular/common';
import { DataEntryService, DataStore } from '../../../services/dataentry.service';
import { PcdrFilterPipe } from '../../../pipes/pcdrfilter.pipe';

@Component({
    selector: 'invworkreport',
    templateUrl: './invworkreport.html',
    providers: [DataEntryService]
})
export class invworkreport implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdatef = new Date();
    fdatet = new Date();
    flocation:number = 0;
    ftype:string ='-1';
    companylocations: any[];
    fcttypes:any [];

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService, private datePipe: DatePipe, public dESrvc: DataEntryService, private $filter: PcdrFilterPipe) {
        // Get Company Locations for DropDown
        this.DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
            this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
        });

        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.fcttypes = this.$filter.transform(dataResponse, {fgroupid: 'ITL'}, true); //
            this.fcttypes.unshift({fgroupid: 'ITL', fid: '-1', fdescription: "All"}); // Add first item
        });
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
        this.CompanySvc.ofHourGlass(true);

        var mParms = 
            "pdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
            "&pdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd') + 
            "&pAnd=" + (this.flocation > 0? "AND invwork.flocation=" + this.flocation: "") +
                       (this.ftype !== '-1'? " AND invwork.ftype='" + this.ftype + "'": "");

        this.CompanySvc.ofCreateJasperReport('invworkreport.pdf', mParms).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}