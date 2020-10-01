import { Component, OnDestroy, ViewChild} from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { MatDialog } from '@angular/material/dialog';
import { wjHelperService } from '../../services/wjHelper.service';
import { ItemList } from '../../inventory/itemlist/itemlist.component';
import { appHelperService } from '../../services/appHelper.service';

@Component({
    selector: 'dashboarditem',
    templateUrl: './dashboarditem.html'
})
export class dashboarditem implements OnDestroy {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    fdatef = new Date();
    fdatet = new Date();
    fitem:string;
    fdescription = '';
    currentItem = {};

    // mymessage = '';
    // mymessage2 = '';
    // counter = 0;


    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public dialog: MatDialog, 
        public appH: appHelperService, public wjH: wjHelperService) {
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            buttons: [
                {name: ' Refresh', icon: 'fas fa-sync-alt', style: 'success', action: 'refresh'}
            ]
        })
    }

    ngOnDestroy() {}

    // async fitemOnChange() {
    //     this.mymessage2 = '';
    //     await this.mfitemOnChange();

    //     this.counter ++;
    //     this.mymessage2 = 'after mfitemOnChange ' + this.counter;
    // }

    // // Add scanned item
    // async mfitemOnChange() {
    //     this.fdescription = '';
    //     this.mymessage = '';
    //     this.counter = 0;

    //     if (!this.fitem) return;

    //     const ret = await this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: this.fitem}).toPromise();
    //     if (ret.length == 0) {
    //         this.appH.toastr('Item not found!','error', '', true);
    //         return;
    //     }
    //     this.counter ++;
    //     this.fdescription = ret[0].fdescription + ' ' + ret[0].fuomdescription + ' ' + this.counter;
    //     this.fimid = ret[0].fimid;

    //     this.counter ++;
    //     this.mymessage = 'after onchange ' + this.counter;
    // }
    
    async fitemOnChange() {
        if (!this.fitem) return;

        this.currentItem = {};
        let dataResponse = await this.appH.validateItem(this.fitem);
        if (dataResponse) this.currentItem = dataResponse[0];

        console.log(this.currentItem)
    }

    async lookupitem() {
        let dataResponse = await this.appH.lookupItem();
        if (dataResponse) this.currentItem = dataResponse;

        console.log(this.currentItem)
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action]();
    }

    refresh() {
        if (!this.fitem) {
            this.appH.toastr('Please Specify an Item Number.');
            return;
        }
        
        // this.CompanySvc.ofHourGlass(true);

        // let mParms = [
        //     { fline: 1, fdate: this.fdatef },
        //     { fline: 2, fdate: this.fdatet },
        //     { fline: 3, fnumber: this.fimid }
        // ];
        // this.CompanySvc.ofCreateReport('d_itemmaster_movement_rpt', mParms, 3).subscribe((pResponse) => {
        //     // Open PDF file
        //     setTimeout(() => {
        //         this.CompanySvc.ofOpenServerFile(pResponse.data);
        //     }, 1000);
        // });
    }
}