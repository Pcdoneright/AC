import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjcCore from '@grapecity/wijmo';

@Component({
    selector: 'pricecheckmain',
    templateUrl: './pricecheckmain.html',
    styleUrls: ['../../mainmenu/mainmenu.component.css', './itempricecheck.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class pricecheckmain implements AfterViewInit {
    @ViewChild('ipckg01') itemsGrid: WjFlexGrid;
    @ViewChild('fitemE') fitemE: ElementRef;
    fitem:string;
    itemCurrent: any = {};
    itemunitsImgCurrent = '';
    fileuploadinfo = {progress: 0, message: ''}
    gH01:number;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService, public toastr: ToastrService, public sharedSrvc: SharedService) {
        // Wijmo License
        wjcCore.setLicenseKey("104.254.244.129,934896988983683#B0jUzHMpNnTNN4TQJ6TZdnWylWZwgnd5x4MJ5Wclh6QvE7cFtkVNl6SDVzatxGcSdVUQpHT7YDeoRkULVWap3EVOlUawlXaG5mMZx6d4AjQkl7dsNWT4cXRsNGOWNXVQZ7Q9YmWD5meNN7VIpWQNtWawE7QwgVclZFVWV7brEjYqZTQz3yUFplSup6K7MHTXJ7TDpUaWVzQwFlR59WdxEVaTJ6VrgXZshWY8ZnMWZVM73WQKhWczMURWtUY9VkVCV5MSlzQKJ6ZFFTR5I5Qa9Ecmd6NGp6QZNUe5MlUmN7KXtScQtWRo5Wdw26VTd6YEZmQiVVSw2kI0IyUiwiI4YDNDFUQDdjI0ICSiwiN7IjNzQzN8cTM0IicfJye&Qf35VfiMzQwIkI0IyQiwiIlJ7bDBybtpWaXJiOi8kI1tlOiQmcQJCLiITM6ADMxAiMxgDMwIDMyIiOiQncDJCLikjMx8CN4IjL4UjMuQDMxIiOiMXbEJCLi46bj9CdodWayVmbvR6YwBkbpJXYsFmYiojIh94QiwiIzgjNzgTO8gTO6kDO4MTOiojIklkIs4nIyYHMyAjMiojIyVmdiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdrwEVrlEZ8AzUUxWQEVVa6AVdQhEZWxEd4IjYwFlcxVGdvhjWSV5VxsSbDhncChle5FVbjJ6LFZUbNpXZWN5bvJURFJHZLRXeXRFUq9mW6YlZ9cnRvA7RlVUSSBDLVAE");

        // setTimeout(() => {
        //     document.body.style.zoom = "140%";
        // }, 0);

        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
    }

    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();
        this.focusToScan();
    }

    fitemOnChange() {
        if (!this.fitem || this.fitem.length < 3) return;

        this.DataSvc.serverDataGet('api/ItemMaint/GetItemandRelated', {pfitem: this.fitem}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                let fitem = this.fitem; // Assign temporarily
                this.clearForm(); // Clears this.fitem
                this.fitem = fitem;

                this.toastr.warning('Item not found!');
                this.focusToScan();
                return;
            }

            this.wjH.gridLoad(this.itemsGrid, dataResponse, false);
            this.wjH.gridScrollToRow(this.itemsGrid, -1, 0, 'fitem', this.fitem); // No-focus only scroll
            this.fitem = ''; // Clear value
            this.focusToScan();
        });
    }

    prevrow() {
        this.wjH.gridSelectPrevRow(this.itemsGrid);
    }
    
    nextrow() {
        this.wjH.gridSelectNextRow(this.itemsGrid);
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }

    clearForm() {
        this.wjH.gridLoad(this.itemsGrid, []);
        this.fitem = ''; // Clear value
        this.itemCurrent = {};
        this.focusToScan();
        this.setImage(null);
    }

    allowUpload(control) {
        // if (!this.validEntry) return false;
        if (!this.wjH.getGridSelectecRow(this.itemsGrid)) return false;
        control.click(); // Call if allowed
    }

    fileChange(event) {
        var row = this.wjH.getGridSelectecRow(this.itemsGrid);
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.setImage(''); // clear first
            this.CompanySvc.ofHourGlass(true);
            let file: File = fileList[0];
            this.DataSvc.serverFileUpload(file, 'images', row.fitem + '.jpg', this.fileuploadinfo).subscribe(
                data => {
                    this.CompanySvc.ofHourGlass(false);
                    if (data.success) {
                        this.toastr.info('Image upload was succesful.');
                        this.focusToScan();
                    }
                    else 
                        this.toastr.warning('Unable to upload the image.');

                    this.setImage(row);
                    this.fileuploadinfo.progress = 0; // reset
                } ,
                // error => console.log(error)
            )
        }
        else console.log('no file');
    }

    // Resize gridlist to fill window
    onResize(event) {
        setTimeout(() => {
            this.gH01 = window.innerHeight - (170 + 370);
        }, 100);
    };

    initGrids() {
        // wj-flex-grid
        this.itemsGrid.initialize({
            isReadOnly: true,
            selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.itemsGrid, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.itemsGrid);
                    if (!row) return;
                    this.itemCurrent = row; // pointer
                    this.setImage(row);
                }
                this.focusToScan();
            },
            columns: [
                { binding: "fuomdescription", header: "Unit Name", width: '*'},
                { binding: "fsaleprice", header: "Price", format: 'c', width: 80 }
            ]
        });
        this.wjH.gridInit(this.itemsGrid);
        // this.itemsGrid.headersVisibility = wjGrid.HeadersVisibility.None;
        this.itemsGrid.rows.defaultSize = 70;
        this.itemsGrid.showAlternatingRows = false;
    }
}