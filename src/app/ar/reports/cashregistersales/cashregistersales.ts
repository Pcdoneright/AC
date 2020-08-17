import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../../services/wjHelper.service';

@Component({
    selector: 'cashregistersales',
    templateUrl: './cashregistersales.html'
})
export class cashregistersales implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdetails = false;
    fdatef = new Date();
    fdatet = new Date();

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService) {
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

    // barXX Events
    onClickNav(parm) {
        switch(parm.action) {
            default:
                this[parm.action]();
                break;
        }
    }

    print() {
        this.CompanySvc.ofHourGlass(true);

        let mParms = [
            { fline: 1, fdate: this.fdatef },
            { fline: 2, fdate: this.fdatet },
            { fline: 3, fstring: this.fdetails.toString() }
        ];
        this.CompanySvc.ofCreateReport('d_cashregister_sales_rpt', mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}