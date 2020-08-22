import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { CustomerList } from '../../list/custlist.component';
import { wjHelperService } from '../../../services/wjHelper.service';

@Component({
    selector: 'salesordersrpt',
    templateUrl: './salesordersrpt.html'
})
export class salesordersrpt implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdetails = false;
    fcid:string = '';
    rtype:string = 'C';
    frid:string = '-1';
    fdescription:string = '';
    fdatef = new Date();
    fdatet = new Date();
    representatives:any[];

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService) {
        // Get Representative for DropDown
        DataSvc.serverDataGet('api/RepresentativeMaint/GetRepresentativeDD').subscribe((dataResponse) => {
            this.representatives = dataResponse;
            this.representatives.unshift({ frid: -1, fname: 'All' }); // Add ALL
        });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            // title: 'Customer Selection', 
            buttons: [
                {name: 'Report', icon: 'fa fa-print', style: 'primary', tooltip: 'Generate Report', action: 'print', val: null}
            ],
            subnavbar: false
        })
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        this.wjH.fixWM()
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

        let mParms = [
            { fline: 1, fdate: this.fdatef },
            { fline: 2, fdate: this.fdatet },
            { fline: 3, fstring: this.fdetails.toString() },
            { fline: 4, fnumber: this.frid },
            { fline: 5, fnumber: this.fcid || -1 }
        ];
        let rpt:string;
        switch (this.rtype) {
            case 'C':
                rpt = 'd_salesorder_sales_rpt';
                break;
            case 'D':
                rpt = 'd_salesorder_salesbydep_rpt';
                break;
            case 'DD':
                rpt = 'd_salesorder_salesbydepbyday_rpt';
                break;
        }
        this.CompanySvc.ofCreateReport(rpt, mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}