import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';

@Component({
    selector: 'dialog-userlist',
    templateUrl: './userlist.component.html',
  })
  export class UserList implements AfterViewInit {
    @ViewChild('g01') usersG: WjFlexGrid;
    gH01:number;

    constructor(public dialogRef: MatDialogRef<UserList>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService) {
        this.gH01 = (window.innerHeight * 0.95) - 100;
    }

    ngAfterViewInit() {
        this.initGrids();
        
        this.DataSvc.serverDataGet('api/UserMaint/Getlist').subscribe((dataResponse) => {
			this.wjH.gridLoad(this.usersG, dataResponse);
		});
    }

    closeDialog() {
        let row = this.wjH.getGridSelectecRow(this.usersG);
        if (!row) {
            this.dialogRef.close();
            return;
        }
        this.dialogRef.close(row);
    }

    initGrids() {
        // wj-flex-grid
        this.usersG.initialize({
            isReadOnly: true,
            columns: [
                {binding: "FNAME", header: "User ID", width: 150},
                {binding: "ffirst", header: "First", width: 250},
                {binding: "flast", header: "Last", width: 250}
            ]
        });
        this.wjH.gridInit(this.usersG, true);
    }
  }