import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../services/wjHelper.service';

@Component({
    selector: 'itemreassign',
    templateUrl: './itemreassign.html'
})
export class itemreassign implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fitem:string;
    fimid:string;
    fdescription = '';
    fiddescription = '';

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService) {
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            buttons: [
                {name: ' Process', icon: 'fa fa-cog', style: 'primary', tooltip: 'Execute Task', action: 'print'}
            ],
            // subnavbar: false
        })
    }

    ngOnDestroy() {}

    // Add scanned item
    fitemOnChange() {
        this.fdescription = '';
        if (!this.fitem) return;
        if (this.fitem.length < 3) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: this.fitem}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.toastr.error('Item not found!');
                return;
            }
            this.fdescription = dataResponse[0].fdescription + ' ' + dataResponse[0].fuomdescription;
        });
    }
    
    // Add scanned item
    fidOnChange() {
        this.fiddescription = '';
        if (!this.fimid) return;
        if (this.fimid.length < 3) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItemmasters', {pfimid: this.fimid}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.toastr.error('Item ID not found!');
                return;
            }
            this.fiddescription = dataResponse[0].fdescription;
        });
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action]();
    }

    print() {
        if (this.fitem == '' || this.fdescription == '' || this.fimid == '' || this.fiddescription == '') {
            this.toastr.warning('Must Specify Item Number and Item ID!');
            return;
        }
        
        this.CompanySvc.confirm('Continue With Process?').subscribe(response => {
            if (response) {
                this.CompanySvc.ofHourGlass(true);
                this.DataSvc.serverDataPost('api/ItemMaint/PostReassign', '', {pfitem: this.fitem, pfimid: this.fimid}).subscribe((dataResponse) => {
                    if (dataResponse.success) {
                        this.fitem = '';
                        this.fdescription = '';
                        this.fimid = '';
                        this.fiddescription = '';
                        this.toastr.success('Process Completed');
                    }
                    this.CompanySvc.ofHourGlass(false);
                });
            }
        });
    }
}