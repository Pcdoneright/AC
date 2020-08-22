import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../../services/wjHelper.service';
import { ItemList } from '../../../inventory/itemlist/itemlist.component';

@Component({
    selector: 'itemsalesrpt',
    templateUrl: './itemsalesrpt.html'
})
export class itemsalesrpt implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdatef = new Date();
    fdatet = new Date();
    fitem:string;
    fimid:number;
    fdescription = '';
    fshowrelated:boolean = false;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, private toastr: ToastrService, public wjH: wjHelperService) {
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
        
        this.CompanySvc.ofHourGlass(true);

        let mParms = [
            { fline: 1, fdate: this.fdatef },
            { fline: 2, fdate: this.fdatet },
            { fline: 3, fstring: this.fshowrelated.toString() },
            { fline: 4, fnumber: this.fimid },
            { fline: 5, fstring: this.fitem }
        ];
        this.CompanySvc.ofCreateReport('d_item_sales_report_rpt', mParms, 3).subscribe((pResponse) => {
            // Open PDF file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}