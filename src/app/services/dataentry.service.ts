import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PcdrFilterPipe } from '../pipes/pcdrfilter.pipe';
import { ToastrService } from 'ngx-toastr';
import { CompanyService } from '../services/company.service';
import { DataService } from '../services/data.service';

@Injectable()
export class DataEntryService {
    codeTable: any[];
    updateStores: DataStore[] = [];
    validateStores: any[] = [];
    $filter: PcdrFilterPipe  = new PcdrFilterPipe();

    constructor(private toastr: ToastrService, private CompanySvc: CompanyService, private DataSvc: DataService) {
        // console.log('DataEntryService->constructor');
    }

    // Populate Code Detail
    initCodeTable() : Observable<any> {
        return Observable.create(observer => {
            this.DataSvc.serverDataGet('api/Company/Getcodedetail').subscribe((dataResponse) => {
                this.codeTable = dataResponse; // Save for further reference
                observer.next(dataResponse);
            });
        });
    }

    // Create data stores
    newDataStore(tableName: string, arrayIdNOTUSED: string[], updateAble: boolean, arrayValidate:string[]) {
        // var dstore = new DataStore(this.CompanySvc, tableName, arrayIdNN, arrayValidate); // Data Store Service
        var dstore = new DataStore(this.CompanySvc, tableName, arrayValidate); // Data Store Service
        if (updateAble) this.updateStores.push(dstore); // Add to updateable array
        return dstore;
    }

    validateDataStore(tableName: string, pDisplayTable: string, pField: string, pDisplayField?: string) {
        this.validateStores.push({ table: tableName, tDisplay: pDisplayTable, field: pField, fDisplay: (pDisplayField || pField.toUpperCase()) });
        // Add validation field to arrayValidate if not previously added (as in a inherited)
        var vrec = this.$filter.transform(this.updateStores, { tableName: tableName}, true)[0];
        if (vrec) {
            let found = vrec.arrayValidate.find(e => e == pField);
            if (!found) vrec.arrayValidate.push(pField);
        }
    }

    // Check if changes are pending and prompt to continue
    pendingChangesContinue() : Observable<any> {
        return Observable.create(observer => {
            if (this.checkForChanges()) {
                this.CompanySvc.confirm("Lose Current Changes?").subscribe(
                    response => {
                        if (response) observer.next(true);
                        else observer.complete();
                    }
                );
            }
            else observer.next(true);
        });
    }

    // Check for changes, returns true on the 1st occurrance of changes
    checkForChanges() {
        for (var i = 0; i < this.updateStores.length; i++) {
            if (this.updateStores[i].getChanges()) return true;
        }

        return false;
    }

    // Validate updateable store, returns table, field on first occurrance
    validate(): any {
        var field = null, row = null, store = null;

        for (var i = 0; i < this.updateStores.length; i++) {
            store = this.updateStores[i];
            if (store.getChanges()) {
                // Loop each field to validate
                if (!store.arrayValidate) break; // Exit if current store doesn't have validation
                for (var f = 0; f < store.arrayValidate.length; f++) {
                    // _modified
                    for (var m = 0; m < store._modified.length; m++) {
                        row = store._modified[m];
                        field = row[store.arrayValidate[f]];
                        if (field === undefined || field === '' || field === null) {
                            // Display Validation if Exist
                            if (this.validateStores.length > 0) {
                                // var vrec = this.$filter('filter')(this.validateStores, { table: store.tableName, field: store.arrayValidate[f] }, true)[0];
                                var vrec = this.$filter.transform(this.validateStores, { table: store.tableName, field: store.arrayValidate[f]}, true)[0];
                                this.toastr.warning(vrec.fDisplay + ' value missing in ' + vrec.tDisplay);
                            }
                            return { table: store.tableName, field: store.arrayValidate[f] }
                        }
                    }
                    // _inserted
                    for (var m = 0; m < store._inserted.length; m++) {
                        row = store._inserted[m];
                        field = row[store.arrayValidate[f]];
                        if (field === undefined || field === '' || field === null) {
                            // Display Validation if Exist
                            if (this.validateStores.length > 0) {
                                // var vrec = this.$filter('filter')(this.validateStores, { table: store.tableName, field: store.arrayValidate[f] }, true)[0];
                                var vrec = this.$filter.transform(this.validateStores, { table: store.tableName, field: store.arrayValidate[f] }, true)[0];
                                this.toastr.warning(vrec.fDisplay + ' value missing in ' + vrec.tDisplay);
                            }
                            return { table: store.tableName, field: store.arrayValidate[f] }
                        }
                    }
                }
            }
        }

        return '';
    }

    // Update Stores with Server
    update(api: string, pShowSuccess = true, pParms?, fprepareUpdateCallback?) : Observable<any> {
        var mData = []; // Server Data

        for (var i = 0; i < this.updateStores.length; i++) {
            if (this.updateStores[i].getChanges()) {
                // Create Array
                if (this.updateStores[i]._modified.length > 0) mData.push([this.updateStores[i].tableName + 'update', this.updateStores[i]._modified]);
                if (this.updateStores[i]._inserted.length > 0) mData.push([this.updateStores[i].tableName + 'insert', this.updateStores[i]._inserted]);
                if (this.updateStores[i]._deleted.length > 0) mData.push([this.updateStores[i].tableName + 'delete', this.updateStores[i]._deleted]);
            }
        }
        return Observable.create(observer => {
            // Send Array
            if (mData.length > 0) {
                if (fprepareUpdateCallback) fprepareUpdateCallback(mData); // Custom data prepare function
                
                this.DataSvc.serverDataPost(api, mData, pParms).subscribe(
                    (dataResponse) => {
                        if (dataResponse.success) {
                            // Commit Changes
                            for (var i = 0; i < this.updateStores.length; i++) {
                                this.updateStores[i].commit();
                            }
                            if (pShowSuccess) this.toastr.success('Save was succesful!');
                        }
                        else {
                            this.toastr.error('Error Saving: ' + dataResponse.errmsg);
                        }
                        observer.next(dataResponse);
                        observer.complete(); // Triggers finally()
                    },
                    (err) => {
                        observer.error(err); // forward error
                    });
            }
            else observer.complete(); // No changes
        });
    }

    // Get MaxValue of a property in an array optional pathToField
    getMaxValue(items: any[], field: string, pathToField?: string): number {
        var val = 0;
        items.forEach(function (row) {
            if (pathToField) {
                if (row[pathToField][field] > val) val = row[pathToField][field];
            }
            else if (row[field] > val) val = row[field];
        });

        return val;
    }

    // Get Sum of a property in an array optional pathToField
    getSumValue(items: any[], field: string, pathToField?: string): number {
        var sum = 0, length = items.length;
        // Fast Loop
        for (var i = 0; i < length; i++) {
            if (pathToField)
                sum += items[i][pathToField][field];
            else
                sum += items[i][field];
        }

        return sum;
    }

    // Prevents ng2 from causing errors at compile
    rowCount(pGrid) {
        try { return pGrid.rowCount() }
        catch (e) { return 0 }
    }

}

// ---------------------------------------------------
// DataStoreSvc Class
// ---------------------------------------------------
export class DataStore {
    //tableName:string;
    //counter:number = 0;
    items = []; // Current rows
    _orgData = []; // Original rows
    _deleted = []; // Deleted rows
    _modified = []; // Modified rows
    _inserted = []; // New rows
    // $filter: Ng2FilterPipe  = new Ng2FilterPipe();
    $filter: PcdrFilterPipe  = new PcdrFilterPipe();

    // Create ds
    // constructor(public $filter: Ng2FilterPipe, private CompanySvc: CompanyService, public tableName: string, public arrayId) {
    // constructor(private CompanySvc: CompanyService, public tableName: string, public arrayId, public arrayValidate) {
    constructor(private CompanySvc: CompanyService, public tableName: string, public arrayValidate) {
        //this.counter++;
        //console.log("DataStoreSvc:" + this.counter);
        // console.log("DataStoreSvc->constructor");
    }

    // Sets Data and Reset property arrays
    loadData(data: any[]) {
        this.clearData();
        this.items = data;
        // 2020/08/20 Create Unique Key for each row, this is how we can guarantee finding the row
        for (var i = 0; i < this.items.length; i++) {
            this.items[i]['_pcdrkey'] = this.getUniqueKey(); // add unique key
        }

        this._orgData = this.CompanySvc.deepCopy(data);
        // this._orgData = angular.copy(data);

        // this._deleted = [];
        // this._modified = [];
        // this._inserted = [];
    }

    clearData() {
        this.items.length = 0;
        this._orgData.length = 0;
        this._deleted.length = 0;
        this._modified.length = 0;
        this._inserted.length = 0;
    }

    // Add Row
    addRow(data, addToTop = false) {
        data['_pcdrkey'] = this.getUniqueKey(); // add unique key
        return (addToTop) ? this.items.unshift(data) : this.items.push(data); // Append to end
    }

    // Remove row, will prompt to confirm, returns a promise
    removeRow(data, noprompt = false) {
        //var deferred = this.$q.defer();

        if (noprompt) {
            this._removeRow(data); // Remove from Grid
            return;
        }

        // Ask to remove row
        // Appending dialog to document.body to cover sidenav in docs app
        return Observable.create(observer => {
            this.CompanySvc.confirm("Remove Current Row?").subscribe(
                response => {
                    if (response) {
                        this._removeRow(data); // Remove from Grid
                        observer.next(data);
                    }
                    observer.complete();
                }
            );
        });

        // var confirm = this.$mdDialog.confirm()
        //     .parent(angular.element(document.body))
        //     .title('Remove Current Row?')
        //     .ok('Yes')
        //     .cancel('No')
        //     .targetEvent(ev);

        // return this.$mdDialog.show(confirm).then(() => {
        //     return this._removeRow(data); // Remove from Grid
        // });

        //this.$mdDialog.show(confirm).then(() => {
        //    this._removeRow(data); // Remove from Grid
        //    deferred.resolve();
        //});
        //
        //return deferred.promise;
    }

    // 2018-08-19 Update existing row
    updateRow(row) {
        //xx var keys = this.createKeyProperty(row); // Use for finding row by its keys
        //xx var results = this.$filter.transform(this.items, keys, true);
        var results = this.$filter.transform(this.items, { _pcdrkey: row['_pcdrkey'] }, true);

        // if Found update fields
        if (results.length > 0) {
            for (var key in row) {
                results[0][key] = row[key];
                // console.log('key:', key);
            }
        }
    }

    // Check if row is new
    isNew(row) {
        //xx var keys = this.createKeyProperty(row); // Use for finding row by its keys
        //xx var results = this.$filter.transform(this._orgData, keys, true);
        var results = this.$filter.transform(this._orgData, { _pcdrkey: row['_pcdrkey'] }, true);

        return (results.length == 0); // Does not exist, newly created.
    }

    // Must be called when an item is removed
    _removeRow(item) {
        //xx var keys = this.createKeyProperty(item); // Use for finding row by its keys
        //xx var results = this.$filter.transform(this._orgData, keys, true);
        var results = this.$filter.transform(this._orgData, { _pcdrkey: item['_pcdrkey'] }, true);
        
        // if Found in orgData add it to _deleted rows
        if (results.length > 0) {
            //results = this.$filter('filter')(this._deleted, keys, true); // Find it again in the _deleted rows in case same key was created and removed
            //if (results.length === 0) this._deleted.push(angular.copy(item));

            // Add to delete buffer        
            this._deleted.push(this.CompanySvc.deepCopy(item));
            // Remove From _orgData so new records with same key don't generate an update
            this._orgData.splice(this._orgData.indexOf(results[0]), 1);
        }

        // Now remove it from items
        //xx results = this.$filter.transform(this.items, keys, true);
        results = this.$filter.transform(this.items, { _pcdrkey: item['_pcdrkey'] }, true);
        if (results.length > 0) this.items.splice(this.items.indexOf(results[0]), 1);
    }

    //2020/08/18
    getUniqueKey() {
        return Math.floor(Math.random() * 10000); // Good up to 10000 unique ids;
    }

    // Populate _arrays with changes
    getChanges() {
        // var keys = {};
        var items = [];
        this._modified = []; // reset
        this._inserted = []; // reset

        // For each item
        for (var i = 0; i < this.items.length; i++) {
            //xx keys = this.createKeyProperty(this.items[i]); // Use for finding row by its keys
            //xx items = this.$filter.transform(this._orgData, keys, true);
            items = this.$filter.transform(this._orgData, { _pcdrkey: this.items[i]['_pcdrkey'] }, true);
            // console.log('getchanges', items);


            if (items.length > 0) {
                if (!this.compareOrg(items[0], this.items[i]))
                    this._modified.push(this.CompanySvc.deepCopy(this.items[i])); // Add row to modified it it changed
            }
            else
                this._inserted.push(this.CompanySvc.deepCopy(this.items[i])); // Add to inserted if not found on original
            // this._inserted.push(angular.copy(this.items[i])); // Add to inserted if not found on original
        }

        return (this._modified.length + this._inserted.length + this._deleted.length > 0);
    }

    // Commit Changes
    commit(): void {
        // Check if changes were made
        if (this._deleted.length + this._inserted.length + this._modified.length > 0) {
            // Clear pending
            this._deleted = [];
            this._inserted = [];
            this._modified = [];
            this._orgData = this.CompanySvc.deepCopy(this.items);
            // this._orgData = angular.copy(this.items); // Make original = current
        }
    }

    // 2020/08/18 Deprecated since using _pcdrkey
    // createKeyProperty(item) {
    //     var mProperty = {};

    //     // For each index field
    //     for (var f = 0; f < this.arrayId.length; f++) {
    //         mProperty[this.arrayId[f]] = item[this.arrayId[f]];
    //     }

    //     return mProperty;
    // }

    // Compare each field from original since new may have new 'properties' added
    compareOrg(orgData, newData) {
        var found = true;

        for (var key in orgData) {
            if (orgData[key] instanceof Date)
                if (newData[key] == null) // Null Dates cannot become string
                    found = (orgData[key] === newData[key]);
                else {
                    found = (orgData[key].toString() === newData[key].toString());
                }
            else {
                if (key !== 'w2ui') // w2ui grid attaches this property to the row that must be ignored
                    found = (orgData[key] === newData[key]);
            }

            if (!found) {
                // Debug only
                // console.log('orgData', orgData);
                // console.log('newData', newData);
                // console.log('orgData[key]', orgData[key]);
                // console.log('newData[key]', newData[key]);

                break; // exit as soon as something is different
            }
        }

        return found;
    }
}
