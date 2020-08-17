import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { DataEntryService, DataStore } from '../../../services/dataentry.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { CustomerList } from '../../../ar/list/custlist.component';

@Component({
    selector: 'salesagingrpt',
    templateUrl: './salesagingrpt.html',
    // providers: [DataEntryService] // New instance gets created
})
export class salesagingrpt implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdetails = false;
    fcid:string = '';
    fdescription:string = '';

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService) {
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            // title: 'Customer Selection', 
            buttons: [
                {name: 'Report', icon: 'print', style: 'primary', tooltip: 'Generate Report', action: 'print', val: null}
            ],
            subnavbar: false
        })
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
    }

    // barXX Events
    onClickNav(parm) {
        switch(parm.action) {
            default:
                this[parm.action]();
                break;
        }
    }

    fcidOnChange(){
        this.fdescription = '';
        this.fcid = this.fcid.replace(/[^0-9\.-]/g, '');
        if (!this.fcid) return;

        this.DataSvc.serverDataGet('api/CustomerMaint/GetValidateCustomer', {pfcid: this.fcid}).subscribe((dataResponse) => {
            if (dataResponse.length > 0) {
                this.fdescription = dataResponse[0].fname;
            }
            else
                this.toastr.info('Customer ID Not Found');
        });
    }

    lookupcust() {
        this.dialog.open(CustomerList, {height: '95%'}).afterClosed().subscribe(selected => {
            if (!selected) return;
            this.fcid = selected.fcid;
            this.fdescription = selected.fname;
        });
    }

    print() {
        this.CompanySvc.ofHourGlass(true);
        var mParms = [
            { fline: 1, fnumber: this.fcid || -1 },
            { fline: 2, fstring: this.fdetails.toString() }
        ];
        this.CompanySvc.ofCreateReport('d_salesorder_aging_rpt', mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}