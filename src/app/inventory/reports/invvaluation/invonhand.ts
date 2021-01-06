import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { appHelperService } from '../../../services/appHelper.service';
import { invvaluation } from './invvaluation';

@Component({
    selector: 'invonhand',
    templateUrl: './invonhand.html'
})
export class invonhand implements AfterViewInit {
    @ViewChild('invvaluation', {static: true}) invvaluation: invvaluation;
    
    constructor(public appH: appHelperService) {}
    
    ngAfterViewInit() {
        this.invvaluation.OptionShowAmt = false; // Adjustment
    }
}
        