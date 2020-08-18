import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpEventType, HttpClient, HttpParams } from '@angular/common/http';
// import 'rxjs/add/operator/map';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs/Observable';
import { SharedService } from '../services/shared.service';
import 'rxjs/add/operator/retryWhen';

//--------------------------------
// SINGLE INSTANCE
//--------------------------------
@Injectable()
export class DataService {
	constructor(private http: HttpClient, private datePipe: DatePipe, private toastr: ToastrService, private sharedSrvc: SharedService) {
	    // console.log('DataService -> constructor()');
    }

	async serverDataGetAsync(pUrl, pParms?, pConvert = true) {
		// Create proper parameters
		// let params: URLSearchParams = new URLSearchParams();
		let retryCounter = 0;
		let params = new HttpParams();
		if (pParms) {
			// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
			this.convertDateDatesToString(pParms);

			for (var key in pParms) {
				if (!pParms.hasOwnProperty(key)) continue;
				params = params.set(key, pParms[key]);
			}
		}

		// return Observable.create(observer => {
		try {
			const data = await this.http.get(pUrl, { params: params }).toPromise();
			if (data) {
				//console.log('serverdataget', data);
				// Before receiving date from server convert string to date
				if (pConvert) this.convertStringToDate(data);
			}
			return data;
		}
		catch(err) {
			this.toastr.error('error from [serverDataPost] using: ' + err.url + ', Status: ' + err.statusText);
			this.sharedSrvc.ofHourGlass(false);
			return null;
		}
		// err => {
		// 	switch(err.status) {
		// 		case 0:
		// 			retryCounter ++;
		// 			if (retryCounter < 16) {
		// 				this.toastr.info('Reconnecting to server...');
		// 			} else {
		// 				this.toastr.error('Unable to connect to server using: ' + pUrl + '. Please try again');
		// 				this.sharedSrvc.ofHourGlass(false);
		// 				observer.complete(); // This will trigger finally()
		// 			}
		// 			// console.log(retryCounter);
		// 			break;
		// 		default:
		// 			this.toastr.error('error from [serverDataPost] using: ' + err.url + ', Status: ' + err.statusText);
		// 			this.sharedSrvc.ofHourGlass(false);
		// 			observer.complete(); // This will trigger finally()
		// 			break;
		// 	}
		// 	observer.error(err); // 2018/10/13 forward error
		// }
		// }).retryWhen(errors => errors.delay(500).take(15))
	}
	
	serverDataGet(pUrl, pParms?, pConvert = true) : Observable<any> {
		// Create proper parameters
		// let params: URLSearchParams = new URLSearchParams();
		let retryCounter = 0;
		let params = new HttpParams();
		if (pParms) {
			// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
			this.convertDateDatesToString(pParms);

			for (var key in pParms) {
				if (!pParms.hasOwnProperty(key)) continue;
				params = params.set(key, pParms[key]);
			}
		}

		return Observable.create(observer => {
			// console.log('params->', params);
			// this.http.get(pUrl, { search: params })
			this.http.get(pUrl, { params: params })
				// .map((res) => res.json())
				.subscribe(
				data => {
					//console.log('serverdataget', data);
					// Before receiving date from server convert string to date
					if (pConvert) this.convertStringToDate(data);
					observer.next(data);
					observer.complete(); // This will trigger finally()
				},
				err => {
					switch(err.status) {
						case 0:
							retryCounter ++;
							if (retryCounter < 16) {
								this.toastr.info('Reconnecting to server...');
							} else {
								this.toastr.error('Unable to connect to server using: ' + pUrl + '. Please try again');
								this.sharedSrvc.ofHourGlass(false);
								observer.complete(); // This will trigger finally()
							}
							// console.log(retryCounter);
							break;
						default:
							this.toastr.error('error from [serverDataPost] using: ' + err.url + ', Status: ' + err.statusText);
							this.sharedSrvc.ofHourGlass(false);
							observer.complete(); // This will trigger finally()
							break;
					}
					observer.error(err); // 2018/10/13 forward error
				})
		}).retryWhen(errors => errors.delay(500).take(15))
	}

	// Return a promise
	// serverDataPost(pUrl, pData, pParms = []) : Observable<any> {
	serverDataPost(pUrl, pData, pParms = {}) : Observable<any> {
		let httpError = -1;
		// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
		this.convertDateDatesToString(pData);

		return Observable.create(observer => {
			// Create parameters
			let httpParams = new HttpParams();
			Object.keys(pParms).forEach(function (key) {
				httpParams = httpParams.append(key, pParms[key]);
			});

			this.http.post(pUrl, pData, { params: httpParams}).subscribe(
				data => {
					// observer.next(JSON.parse(data['_body']));
					observer.next(data);
				},
				err => {
					httpError = err.status; // Assign status
					switch(err.status) {
						case 0:
							this.toastr.info('Reconnecting to server...');
							break;
						default:
							this.toastr.error('Error from [Post] using: ' + pUrl + ', Status: ' + err.error.ExceptionMessage,'', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
							this.sharedSrvc.ofHourGlass(false);
							break;
					}
					observer.error(err); // 2018/10/13 forward error
				})
			}
		// Retry 15 times if no connection otherwise stop after 1st error from server
		).retryWhen(err => {
			return err.scan(retryCount => {
				retryCount += 1;
				if (retryCount > 15 || httpError > 0) {
					throw(err);
				} else {
					return retryCount;
				}
			}, 0).delay(500);
		})
	}
	// 10/18/2018
	// serverDataPost(pUrl, pData, pParms = []) : Observable<any> {
	// 	let retryCounter = 0;
	// 	// Before sending to server convert date(only not datetime) to string to have current values instead of zulu
	// 	this.convertDateDatesToString(pData);

	// 	return Observable.create(observer => {
	// 		// Create parameters
	// 		let httpParams = new HttpParams();
	// 		Object.keys(pParms).forEach(function (key) {
	// 			httpParams = httpParams.append(key, pParms[key]);
	// 		});
			
	// 		// (angular.js) this.http.post(pUrl, {params: pParms, data: pData}).subscribe(
	// 		// this.http.post(pUrl, pData).subscribe(
	// 		this.http.post(pUrl, pData, { params: httpParams}).subscribe(
	// 			data => {
	// 				// observer.next(JSON.parse(data['_body']));
	// 				observer.next(data);
	// 			},
	// 			err => {
	// 				switch(err.status) {
	// 					case 0:
	// 						this.toastr.info('Reconnecting to server...');
	// 						break;
	// 					default:
	// 						// this.toastr.error('Error from [Post] using: ' + pUrl + ', Status: ' + err.error.ExceptionMessage);
	// 						if (retryCounter >= 15) {
	// 							this.toastr.error('Error from [Post] using: ' + pUrl + ', Status: ' + err.error.ExceptionMessage,'', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
	// 							this.sharedSrvc.ofHourGlass(false);
	// 						}
	// 						retryCounter += 1;
	// 						break;
	// 				}
	// 				observer.error(err); // 2018/10/13 forward error
	// 			})
	// 		}).retry(15); // 2018/10/16 Retry
	// }

	serverFileUpload(pfile, pfolder, pfilename, pProgress, poverride = true) {
		return Observable.create(observer => {
			// Create parameters
			let httpParams = new HttpParams();
            httpParams = httpParams.append('folder', pfolder);
			httpParams = httpParams.append('fnewname', pfilename);
			httpParams = httpParams.append('foverride', poverride.toString());
			
			let formData:FormData = new FormData();
			formData.append('uploadFile', pfile, pfile.name);
			
			this.http.post('api/Company/UploadSingleFile', formData, { params: httpParams, reportProgress: true, observe: 'events'})
				.subscribe(event => {
						if (event.type === HttpEventType.UploadProgress) {
							pProgress.progress = Math.round(100 * event.loaded / event.total);
						}
						else if (event.type === HttpEventType.Response) {
							// pProgress.message = 'Upload success.';
							observer.next({success:true});
							// observer.next(event);
						}
				},
				err => {
					this.toastr.error('error from [serverFileUpload] using: ' + err.url + ', Status: ' + err.statusText);
					console.log('error', err);
					
					this.sharedSrvc.ofHourGlass(false);
				})
			});
    }


	// Convert Date to String before it gets send to server
	convertDateDatesToString(input) {
		// Ignore things that aren't objects.
		if (typeof input !== "object") return input;

		for (var key in input) {
			if (!input.hasOwnProperty(key)) continue;

			var value = input[key];
			if (typeof value === 'string' || value === null) continue; // Exit for non-objects

			// Check for object properties which look like dates.
			//if (typeof value === 'object' && Object.getPrototypeOf(value).toString() === "Invalid Date") {
			if (typeof value === 'object' && Object.prototype.toString.call(value) === '[object Date]') {
				// Convert only date with zero time (getHours() always show a number)
				if (value.getMinutes() + value.getSeconds() === 0) {
					// input[key] = this.$filter('date')(value, 'yyyy-MM-dd 00:00:00'); // Covert to String for proper datetime
					input[key] = this.datePipe.transform(value, 'yyyy-MM-dd 00:00:00'); // Covert to String for proper datetime
					//console.log(input[key]);
				}
				else {
					// input[key] = this.$filter('date')(value, 'yyyy-MM-dd HH:mm:ss'); // Covert to String to non-zulu 24hrs datetime
					input[key] = this.datePipe.transform(value, 'yyyy-MM-dd HH:mm:ss'); // Covert to String to non-zulu 24hrs datetime
				}
			} else if (typeof value === "object") {
				// Recurse into object
				this.convertDateDatesToString(value);
			}
		}
	}

	regexIso8601 = /^(\d{4})-0?(\d+)-0?(\d+)[T ]0?(\d+):0?(\d+):0?(\d+)Z?/;
	// Convert String to Date object
	convertStringToDate(input) {
		// Ignore things that aren't objects.
		if (typeof input !== "object") return input;

		for (var key in input) {
			if (!input.hasOwnProperty(key)) continue;

			var value = input[key];
			var match;
			// Check for string properties which look like dates.
			if (typeof value === "string" && (match = value.match(this.regexIso8601))) {
				//console.log(value);
				// Use 12 hr o make sure date stays the same for Non-Timestamps
				if (value.slice(-1) !== 'Z') value = value.replace("T00", "T12");
				if (value.slice(-1) !== 'Z') value = value.replace("T", " "); // Preserve Original DateTime When new Date() is applied otherwise converted to Z
				input[key] = new Date(value);
				//console.log(input[key]);
			} else if (typeof value === "object") {
				// Recurse into object
				this.convertStringToDate(value);
			}
		}
	}

	// // Upload a File with progress counter
	// fileUpload(pUrl, pfiles, pCounter, pParams?) {
	// 	var deferred = this.$q.defer();

	// 	this.Upload.upload({
	// 		url: pUrl,
	// 		data: {file: pfiles[0]},
	// 		params: pParams
	// 	}).then((dataResponse) => {
	// 		pCounter.progress = -1;
	// 		deferred.resolve(dataResponse);
	// 	}, (dataResponse) => {
	// 		if (dataResponse.status > 0) {
	// 			this.toastr.error(dataResponse.status + ': Error Uploading File. Try Again.');
	// 			pCounter.progress = -1;
	// 		}
	// 		deferred.reject(dataResponse.status + ': Error Uploading File. Try Again.');
	// 	}, (evt) => {
	// 		pCounter.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
	// 	});

	// 	return deferred.promise;
	// }

}