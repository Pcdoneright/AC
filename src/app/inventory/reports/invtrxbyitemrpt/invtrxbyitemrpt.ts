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
    selector: 'invtrxbyitemrpt',
    templateUrl: './invtrxbyitemrpt.html'
})
export class invtrxbyitemrpt implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdatef = new Date();
    fdatet = new Date();
    fitem:string;
    fimid:number;
    fdescription = '';
    flocation:number = 0;
    companylocations: any[];

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService, private datePipe: DatePipe) {
        // Get Company Locations for DropDown
        this.DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
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
        if (!this.fitem) {
            this.toastr.warning('Must Specify Item Number!');
            return;
        }

        var nextday = new Date();
        nextday.setDate(this.fdatet.getDate() + 1);
        
        var mParms = 
        // "pfdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd 00:00:00') + 
        // "&pfdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd 23:59:59') + 
        "pfdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
        "&pfdatet=" + this.datePipe.transform(nextday, 'yyyy-MM-dd') + 
        "&pfitem=" + this.fitem + 
        "&pAnd=" +
        (this.flocation > 0? " AND inventorytrx.flocation=" + this.flocation: "");

        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('invtrxbyitem.pdf', mParms).subscribe((pResponse) => {
            // Open PDF or XLXS file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}