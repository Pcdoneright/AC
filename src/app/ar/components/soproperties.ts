import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'soproperties',
    templateUrl: './soproperties.html',
    // providers: [DataEntryService]
})

export class soProperties implements AfterViewInit {
    @ViewChild('formsop01', {static: true}) formsop01: FormControl;
    parent: any;

    // Required:
    // assignCustomer()
    // onfdiscountp($event)
    // soCurrent[]
    // customercontacts
    // customerbilltos
    // customershiptos
    // customerterms
    // representatives
    // companylocations
    // showMoreEdit


    constructor() {
    }

    ngAfterViewInit() {
    }

    setProperties(prnt) {
        this.parent = prnt;
    }
}