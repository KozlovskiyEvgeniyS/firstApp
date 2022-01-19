sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("yauheni.kazlouski.app.controller.BaseController", {
        navigateTo: function(sName, oParameters){
            this.getOwnerComponent().getRouter().navTo(sName, oParameters);
        },

        getSupplierPosition: function(sSupplierID) {
            var aSuppliersArray = this.getView().getModel("data").getProperty("/Suppliers");

            if (aSuppliersArray.length > 0) {
                return aSuppliersArray.filter(oSupplier => oSupplier !== undefined)
                    .findIndex( supplier => supplier.ID === sSupplierID);
            }
        },

        addMutableSupplier: function (oEditModel, sSupplierID) {
            var bEditMode = oEditModel.getProperty("/EditIndicator");
            var oEditSuppliersArray = oEditModel.getData().EditSuppliersArray;

            oEditSuppliersArray.push(sSupplierID);
            oEditModel.setProperty("/EditIndicator", !bEditMode);
        },

        deleteMutableSupplier: function (oEditModel, sSupplierID) {
            var bEditMode = oEditModel.getProperty("/EditIndicator");
            var oEditSuppliersArray = oEditModel.getProperty("/EditSuppliersArray");
            var nSupplierIndex = oEditSuppliersArray.indexOf(Number(sSupplierID));

            oEditSuppliersArray.splice(nSupplierIndex, 1);
            oEditModel.setProperty("/EditIndicator", !bEditMode);
        },

        onEditSupplier: function (oEditModel, sSupplierID) {
            var oPreviousSuppliersArray = oEditModel.getProperty("/PreviousSuppliersArray");
            var nSupplierPosition = this.getSupplierPosition(sSupplierID);
            var oPreviousSupplier = this.getView().getModel("data").getProperty(`/Suppliers/${nSupplierPosition}`);
            var oPreviousSupplierClone = $.extend(true, oPreviousSupplierClone, oPreviousSupplier)

            oPreviousSuppliersArray[sSupplierID] = oPreviousSupplierClone;
        },

        onDeleteConfirmation: function (sConfirmMessage) {
            return new Promise(function (resolve, reject) {
                MessageBox.error(sConfirmMessage, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        
                        if (sAction === MessageBox.Action.OK){
                            return resolve()
                        }  
                    },
                });
            })
        },

        onCancelEditConfirmation: function (oEditModel, sSupplierID) {
            var sResourseBundle = this.getView().getModel("i18n");
            var aCreatedSuppliersArray = oEditModel.getProperty("/CreatedSuppliers");
            var nCreatedSupplierPosition = aCreatedSuppliersArray.findIndex(supplier => supplier.ID === sSupplierID);
            var that = this;
            var sConfirmMessage;

            if (nCreatedSupplierPosition >= 0) {
                sConfirmMessage = sResourseBundle.getProperty("DeleteSupplierConfirm");
            } else {
                sConfirmMessage = sResourseBundle.getProperty("CancelEditSupplierConfirm");
            };
            
            return new Promise(function () {
                MessageBox.warning(sConfirmMessage, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        
                        if (sAction === MessageBox.Action.OK){
                            that.onCancelEditSupplier(oEditModel, sSupplierID);
                            that.deleteMutableSupplier(oEditModel, sSupplierID);
                        }  
                    },
                });
            })
        },

        onCancelEditSupplier: function(oEditModel, sSupplierID) {
            var oPreviousData = oEditModel.getProperty("/PreviousSuppliersArray");
            var aCreatedSuppliersArray = oEditModel.getProperty("/CreatedSuppliers");
            var nCreatedSupplierPosition = aCreatedSuppliersArray.findIndex(supplier => supplier.ID === sSupplierID);

            if (nCreatedSupplierPosition >= 0) {
                var oPreviousSuppliers = this.getView().getModel("data").getProperty("/Suppliers");
                var nPrevouSupplierPosition = oPreviousSuppliers.findIndex(supplier => supplier.ID === sSupplierID);

                aCreatedSuppliersArray.splice(nCreatedSupplierPosition, 1);
                oPreviousSuppliers[nPrevouSupplierPosition] = {};

                this.getView().getModel("data").setProperty("/Suppliers", oPreviousSuppliers);
                this.navigateTo("SuppliersOverview");
            } else {
                var nSupplierPosition = this.getSupplierPosition(sSupplierID)

                this.getView().getModel("data").setProperty(`/Suppliers/${nSupplierPosition}`,oPreviousData[sSupplierID]);
                oPreviousData.filter(oSupplier => oSupplier.ID !== sSupplierID);
            };
        },

        validateInput: function(oInput) {
            var sInputState = "None";
            var bValidationError = false;

            try {
                var oBinding = oInput.getBinding("value");
                oBinding.getType().validateValue(oInput.getValue());
            } catch (oError) {
                sInputState = "Error";
                bValidationError = true;
            };

            oInput.setValueState(sInputState);
            return bValidationError;
        }
    });
});