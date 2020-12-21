import { Injectable } from '@angular/core';
import * as clover from "remote-pay-cloud";


@Injectable()
export class cloverService {
    // cloverConnector: clover.remotepay.ICloverConnector = null;
    // authToken: string = null;
    // pendingSaleRequest = null;

    // // constructor(private cloverSvc: CompanyService) {}
    // constructor() {}

    // connect(connectionConfiguration: any = null): void {
    //     this.cleanup(); // any existing connections.
    //     if (!connectionConfiguration) {
    //         connectionConfiguration = this.buildConnectionConfigFromWebForm();
    //     }
    //     clover.DebugConfig.loggingEnabled = true;
    //     let cloverDeviceConnectionConfiguration: clover.CloverDeviceConfiguration = null;
        
    //     this.updateStatus("Attempting to connect to your Clover device, please wait  ....");
    //     // Configuration Note: See: https://docs.clover.com/build/getting-started-with-clover-connector/?sdk=browser for more information
    //     // on how to obtain the required connection parameter values.
    //     cloverDeviceConnectionConfiguration = this.getDeviceConfigurationForCloud(connectionConfiguration);

    //     // toggleElement("connectionForm", false);
    //     let builderConfiguration: any = {};
    //     builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12;
    //     let cloverConnectorFactory: clover.CloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration);
    //     this.cloverConnector = cloverConnectorFactory.createICloverConnector(cloverDeviceConnectionConfiguration);
    //     this.cloverConnector.addCloverConnectorListener(this.buildCloverConnectionListener());
    //     this.cloverConnector.initializeConnection();
    // }

    // cleanup(): void {
    //     if (this.cloverConnector) {
    //         this.cloverConnector.dispose();
    //         // toggleElement("actions", false);
    //         this.updateStatus("Not connected to your Clover device.  Please refresh the page to re-connect and perform an action.");
    //     }
    // }

    // /**
    //  * Builds a configuration container from the web form.
    //  */
    // buildConnectionConfigFromWebForm(): any {
    //     const config: any = {};

    //     config["applicationId"] = "com.pcdoneright.pos";
    //     config["accessToken"] = "829d7953-7902-f601-9b35-1368d04c0c21";
    //     config["cloverServer"] = "https://sandbox.dev.clover.com/";
    //     config["merchantId"] = "Q16QY76RKAYFT";
    //     config["deviceId"] = "b5ceff88-49d6-9af4-3b36-44b16ea97351";
    //     config["friendlyId"] = "Register_1";

    //     return config;
    // }

    // /**
    //  * Build and return the connection configuration object for cloud.
    //  *
    //  * @param connectionConfiguration
    //  * @returns {WebSocketCloudCloverDeviceConfiguration}
    //  */
    // getDeviceConfigurationForCloud(connectionConfiguration: any): clover.CloverDeviceConfiguration {
    //     const configBuilder: clover.WebSocketCloudCloverDeviceConfigurationBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(connectionConfiguration.applicationId,
    //         connectionConfiguration.deviceId, connectionConfiguration.merchantId, connectionConfiguration.accessToken);
    //     configBuilder.setCloverServer(connectionConfiguration.cloverServer);
    //     configBuilder.setFriendlyId(connectionConfiguration.friendlyId);
    //     configBuilder.setHeartbeatInterval(1000);
    //     return configBuilder.build();
    // }

    // updateStatus(message: string, success: boolean = false, containerId: string = "statusContainer", messageId: string = "statusMessage"): void  {
    //     console.log("updateStatus:", message);
        
    //     // toggleElement(containerId, true);
    //     // const statusEle = document.getElementById(messageId);
    //     // statusEle.innerHTML = message;
    //     // if (success === false) {
    //     //     statusEle.className = "alert alert-danger";
    //     // } else if (success) {
    //     //     statusEle.className = "alert alert-success";
    //     // } else {
    //     //     statusEle.className = "alert alert-warning";
    //     // }
    // }

    // /**
    //  * Custom implementation of ICloverConnector listener, handles responses from the Clover device.
    //  */
    // function buildCloverConnectionListener() {
    //     return Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {

    //         onSaleResponse: function (response: clover.remotepay.SaleResponse): void {
    //             console.log({message: "Payment response received", response: response});
    //             const requestAmount = pendingSaleRequest.getAmount();
    //             const requestExternalId = pendingSaleRequest.getExternalId();
    //             pendingSaleRequest = null; // The sale is complete
    //             toggleElement("actions", true);
    //             toggleElement("pendingStatusContainer", false);
    //             if (response.getSuccess()) {
    //                 const payment = response.getPayment();
    //                 // We are choosing to void the payment if it was not authorized for the full amount.
    //                 if (payment && payment.getAmount() < requestAmount) {
    //                     const voidPaymentRequest = new clover.remotepay.VoidPaymentRequest();
    //                     voidPaymentRequest.setPaymentId(payment.getId());
    //                     voidPaymentRequest.setVoidReason(clover.order.VoidReason.REJECT_PARTIAL_AUTH);
    //                     updateStatus(`The payment was approved for a partial amount ($${payment.getAmount() / 100}) and will be voided.`, false);
    //                     cloverConnector.voidPayment(voidPaymentRequest);
    //                 } else {
    //                     updateStatus(`${payment.getResult()}: Payment ${payment.getExternalPaymentId()} for $${payment.getAmount() / 100} is complete.`, response.getResult() === clover.remotepay.ResponseCode.SUCCESS);
    //                     if (!response.getIsSale()) {
    //                         console.log({error: "Response is not a sale!"});
    //                     }
    //                 }
    //             } else {
    //                 updateStatus(`Payment ${requestExternalId} for $${requestAmount / 100} has failed or was voided.`, false);
    //                 this.resetDevice(); // The device may be stuck.
    //             }
    //         },

    //         //clover.remotepay.ResultStatus.SUCCESS

    //         onRetrievePaymentResponse: function(retrievePaymentResponse: clover.remotepay.RetrievePaymentResponse) {
    //             console.log({message: "onRetrievePaymentResponse", response: retrievePaymentResponse});
    //             if (pendingSaleRequest) {
    //                 if (retrievePaymentResponse.getExternalPaymentId() === pendingSaleRequest.getExternalId()) {
    //                     if (retrievePaymentResponse.getQueryStatus() === clover.remotepay.QueryStatus.FOUND) {
    //                         // The payment's status can be used to resolve the payment in your POS.
    //                         const payment = retrievePaymentResponse.getPayment();
    //                         updateStatus(`${payment.getResult()}: Payment ${pendingSaleRequest.getExternalId()} is complete.`, payment.getResult() === clover.payments.Result.SUCCESS);
    //                         pendingSaleRequest = null; // The pending sale is complete.
    //                         toggleElement("actions", true);
    //                         toggleElement("pendingStatusContainer", false);
    //                     } else if (retrievePaymentResponse.getQueryStatus() === clover.remotepay.QueryStatus.IN_PROGRESS) {
    //                         // payment either not found or in progress,
    //                         updateStatus(`Payment: ${pendingSaleRequest.getExternalId()} for $${pendingSaleRequest.getAmount() / 100} is in progress.   If you would like to start a new payment, you may reset the device.  However, doing so may void payment ${pendingSaleRequest.getExternalId()}.  If you would like to reset the device anyway please <a onclick="forceResetDevice()" href="#">click here</a> to confirm.`, null, "pendingStatusContainer", "pendingMessage");
    //                     } else if (retrievePaymentResponse.getQueryStatus() === clover.remotepay.QueryStatus.NOT_FOUND) {
    //                         updateStatus(`Payment: ${pendingSaleRequest.getExternalId()} wasn't taken or was voided.`, false);
    //                         toggleElement("pendingStatusContainer", false);
    //                     }
    //                 }
    //             }
    //         },

    //         onResetDeviceResponse(retrievePaymentResponse: clover.remotepay.ResetDeviceResponse) {
    //             if (pendingSaleRequest) {
    //                 // Verify the payment status, the reset will generally void payments, but not in all cases.
    //                 const retrievePaymentRequest = new clover.remotepay.RetrievePaymentRequest();
    //                 retrievePaymentRequest.setExternalPaymentId(pendingSaleRequest.getExternalId());
    //                 cloverConnector.retrievePayment(retrievePaymentRequest);
    //             }
    //         },

    //         // See https://docs.clover.com/build/working-with-challenges/
    //         onConfirmPaymentRequest: function (request: clover.remotepay.ConfirmPaymentRequest): void {
    //             console.log({message: "Automatically accepting payment", request: request});
    //             updateStatus("Automatically accepting payment", true);
    //             cloverConnector.acceptPayment(request.getPayment());
    //             // to reject a payment, pass the payment and the challenge that was the basis for the rejection
    //             // getCloverConnector().rejectPayment(request.getPayment(), request.getChallenges()[REJECTED_CHALLENGE_INDEX]);
    //         },

    //         // See https://docs.clover.com/build/working-with-challenges/
    //         onVerifySignatureRequest: function (request: clover.remotepay.VerifySignatureRequest): void {
    //             console.log({message: "Automatically accepting signature", request: request});
    //             updateStatus("Automatically accepting signature", true);
    //             cloverConnector.acceptSignature(request);
    //             // to reject a signature, pass the request to verify
    //             // getCloverConnector().rejectSignature(request);
    //         },

    //         onDeviceReady: function (merchantInfo: clover.remotepay.MerchantInfo): void {
    //             updateStatus("The connection to your Clover Device has been established.", true);
    //             toggleElement("connectionForm", false);
    //             if (!pendingSaleRequest) {
    //                 console.log({message: "Device Ready to process requests!", merchantInfo: merchantInfo});
    //                 toggleElement("actions", true);
    //             } else {
    //                 // We have an unresolved sale.  The connection to the device was lost and the customer is in the
    //                 // middle of or finished the payment with the POS disconnected.  Calling retrieveDeviceStatus
    //                 // with setSendLastMessage will ask the Clover device to send us the last message it
    //                 // sent which may allow us to proceed with the payment.
    //                 const retrieveDeviceStatusRequest = new clover.remotepay.RetrieveDeviceStatusRequest();
    //                 retrieveDeviceStatusRequest.setSendLastMessage(true);
    //                 cloverConnector.retrieveDeviceStatus(retrieveDeviceStatusRequest);
    //             }
    //         },

    //         onDeviceError: function (cloverDeviceErrorEvent: clover.remotepay.CloverDeviceErrorEvent): void {
    //             console.log({message: `An error has occurred: ${cloverDeviceErrorEvent.getMessage()}`});
    //             updateStatus(`An error has occurred: ${cloverDeviceErrorEvent.getMessage()}`, false);
    //         },

    //         onDeviceDisconnected: function (): void {
    //             console.log({message: "You have been disconnected from the Clover device."});
    //             updateStatus("The connection to your Clover Device has been dropped.", false);
    //             toggleElement("connectionForm", true);
    //             toggleElement("actions", false);
    //         }

    //     });
    // }
}