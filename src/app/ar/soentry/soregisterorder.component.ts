import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { CompanyRulesService } from '../../services/companyrules.service';
import { SoRegisterComponent } from './soregister.component';

@Component({
    selector: 'dialog-soviewcustomer',
    templateUrl: './soregisterorder.component.html'
})
export class SOViewCustomer implements AfterViewInit {
    soR: SoRegisterComponent;

    constructor(public dialogRef: MatDialogRef<SOViewCustomer>, @Inject(MAT_DIALOG_DATA) public data: any, private CompanySvc: CompanyService, private companyRules: CompanyRulesService, private DataSvc: DataService) {
        this.soR = data.soregister; // assign pointer
    }

    ngAfterViewInit() {
    }
}