import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';

@Component({
    selector: 'pcdrBuilder',
    templateUrl: './builder.component.html',
    // providers: [DataEntryService]
})

export class pcdrBuilderComponent implements AfterViewInit {
    navProperties = {title:'', buttons:'', spans:'', rows:'', chevron:'', subnavbar:false, navButtons:{}};
    parent: any;

    constructor() {
    }

    ngAfterViewInit() {
    }

    setNavProperties(prnt, prop) {
        this.navProperties = prop;
        // Buttons only
        if (this.navProperties.hasOwnProperty('buttons')) {
            // if [show] not created assume is 'true'
            for (const iterator of this.navProperties['buttons']) {
                if (!iterator.hasOwnProperty('show')) iterator['show'] = true;
            }
        }

        this.parent = prnt;
    }
}