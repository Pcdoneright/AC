import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../../services/wjHelper.service';
import { ItemList } from '../../../inventory/itemlist/itemlist.component';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'invdiscrepancy',
    templateUrl: './invdiscrepancy.html'
})
export class invdiscrepancy implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdatef = new Date();
    fdatet = new Date();
    fitem:string = '';
    fimid:number;
    fdescription = '';
    companylocations: any[];
    flocation:number = 0;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService, private datePipe: DatePipe) {
        // Get Company Locations for DropDown
        DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
            this.companylocations = dataResponse;
            this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
        });
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            buttons: [
                {name: 'Report', icon: 'fa fa-print', style: 'primary', tooltip: 'Generate Report', action: 'print'}
            ]
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
                this.toastr.error('Item not found!','', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
                return;
            }
            this.fdescription = dataResponse[0].fdescription + ' ' + dataResponse[0].fuomdescription;
            this.fimid = dataResponse[0].fimid;
        });
    }

    lookupitem() {
        this.dialog.open(ItemList, {data: {fcid: '-1'}}).afterClosed().subscribe(selected => {
            if (!selected) return;
            this.fitem = selected.fitem;
            this.fdescription = selected.fdescription + ' ' + selected.fuomdescription;
            this.fimid = selected.fimid;
        });
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action]();
    }

    print() {
        this.CompanySvc.ofHourGlass(true);

        var mParms = 
            "pdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
            "&pdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd') + 
            "&pAnd=" + (this.flocation > 0? "AND inventorytrx.flocation=" + this.flocation: "") +
                       (this.fitem !== ''? " AND inventorytrx.fitem=" + this.fitem: "");

        this.CompanySvc.ofCreateJasperReport('invdiscrepancy.pdf', mParms).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}