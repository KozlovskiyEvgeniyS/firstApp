sap.ui.define([
    "yauheni/kazlouski/app/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController,
	JSONModel) {
    "use strict";

    return BaseController.extend("yauheni.kazlouski.app.controller.ProductDetails", {
        onInit: function() {
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();

            oRouter.getRoute("ProductDetails").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function(oEvent) {
            var sSupplierID = Number(oEvent.getParameter("arguments").SupplierID);
            var sProductID = oEvent.getParameter("arguments").ProductID;
            var oEditSuppliersArray = this.getView().getModel("editModel").getData().EditSuppliersArray;
            var oEditModel = this.getView().getModel("editModel");

            this.getView().bindObject({
                path: `/Suppliers/${sSupplierID}/Products/${sProductID}`,
                model: "data"
            });

            var nSupplierObjectID = this.getView().getBindingContext("data").getObject("SupplierID");

            if (oEditSuppliersArray.includes(nSupplierObjectID)) {
                oEditModel.setProperty("/EditIndicator", true);
            } else {
                oEditModel.setProperty("/EditIndicator", false);
            };
        },
        
        onNavToSupplierListPress: function (oEvent) {
            this.navigateTo("SuppliersOverview");
        },
        
        onNavToSupplierDetailsPress: function (oEvent) {
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("SupplierID");
            var nSupplierPosition = this.getSupplierPosition(sSupplierID);

            this.navigateTo("SupplierDetails", {SupplierID: nSupplierPosition});
        },

        onEditButtonPress: function(oEvent) {
            var oEditModel = this.getView().getModel("editModel");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("SupplierID");
           
            this.addMutableSupplier(oEditModel, sSupplierID);
            this.onEditSupplier(oEditModel,sSupplierID)
        },

        onSaveProductChangesPress: function(oEvent) {
            var oEditModel = this.getView().getModel("editModel");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("SupplierID");

            this.deleteMutableSupplier(oEditModel, sSupplierID);
        },

        onCancelProductChangesPress: function (oEvent) {
            var oEditModel = this.getView().getModel("editModel");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("SupplierID");

            this.onCancelEditConfirmation(oEditModel, sSupplierID);
        }
    });
});
