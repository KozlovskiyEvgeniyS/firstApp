sap.ui.define([
    "yauheni/kazlouski/app/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], function (BaseController, Filter, FilterOperator, MessageToast, JSONModel, formatter) {
    "use strict";

    return BaseController.extend("yauheni.kazlouski.app.controller.SuppliersOverview", {
        formatter: formatter,
        onInit: function() {
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();
            var oAppView = new JSONModel({
                suppliersFilters: [{},{}]
            });
            
            this.oAppView = oAppView;
            this.getView().setModel(oAppView, "appView");
            oRouter.getRoute("SuppliersOverview").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function () {
            var oSuppliersFilter = this.getView().byId("supplersNameFilter");
            var oShowAllItem = new sap.ui.core.Item({
                key: "all",
                text: "Show all"
            });

            if (oSuppliersFilter.getFirstItem().getKey() !== "all") {
                oSuppliersFilter.insertItem(oShowAllItem, 0);
                oSuppliersFilter.setSelectedKey("all");
            };

            this._determineSupplierEditStatus();
        },

        onFiltersDialogClosed: function () {
            this._onPatternMatched();
        },

        onSuppliersTableListItemPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var sSupplierID = oSource.getBindingContext("data").getObject("ID");
            var nSupplierPosition = this.getSupplierPosition(sSupplierID);

            this.navigateTo("SupplierDetails", {SupplierID: nSupplierPosition})
        },

        onSupplierSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var aSuppliersFilters = this.oAppView.getProperty("/suppliersFilters");
            var oSuppliersFilter = new Filter({
                filters:[
                    new Filter("Name", FilterOperator.Contains, sQuery),
                    new Filter("Address/Country", FilterOperator.Contains, sQuery),
                    new Filter("Address/State", FilterOperator.Contains, sQuery),
                    new Filter("Address/City", FilterOperator.Contains, sQuery),
                    new Filter("Address/Street", FilterOperator.Contains, sQuery),
            ], or: true});

            aSuppliersFilters[0] = oSuppliersFilter;
            this._onSuppliersFiltersConnect(aSuppliersFilters);
        },

        onFilterBarSearchPress: function () {
            var sSelectedItemKey = this.byId("supplersNameFilter").getSelectedKey();
            var aSuppliersFilters = this.oAppView.getProperty("/suppliersFilters");

            if (sSelectedItemKey === "all"){
                aSuppliersFilters[1] = {};
                this._onSuppliersFiltersConnect(aSuppliersFilters);
            } else {
                var oSuppliersFilter = new Filter("Name", FilterOperator.Contains, sSelectedItemKey);
                aSuppliersFilters[1] = oSuppliersFilter;
                this._onSuppliersFiltersConnect(aSuppliersFilters);
            };
        },

        _onSuppliersFiltersConnect: function (aFilters) {
            var oItemsBinding = this.byId("suppliersTable").getBinding("items");
            var oSuppliersTableFilter = new Filter({filters : aFilters, and:true});

            oItemsBinding.filter(oSuppliersTableFilter);
        },

        onCreateSupplierDialog: function (oEvent) {
            var oView = this.getView();
            var aInputsArray = this.getView().getControlsByFieldGroupId("createNewSupplierInputs")
                .filter(control => control.isA("sap.m.Input"));

            if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "yauheni.kazlouski.app.view.fragments.CreateSupplierDialog",
                    this
				);
				oView.addDependent(this.oDialog);
			};

            aInputsArray.forEach( function(oInput) {
                oInput.setValue("");
                oInput.setValueState("None");
            });
            sap.ui.getCore().getMessageManager().registerObject(this.oDialog, true)
			this.oDialog.open();
        },

        onCreateSupplier: function () {
            var oView = this.getView();
            var oDataModel = oView.getModel("data");
            var oEditModel = oView.getModel("editModel");
            var aCreatedSuppliersArray = oEditModel.getProperty("/CreatedSuppliers");
            var aSuppliers = oDataModel.getProperty("/Suppliers");
            var oNewSupplier = $.extend(true, oNewSupplier, oEditModel.getProperty("/SupplierTemplate"));
            var aInputsArray = this.getView().getControlsByFieldGroupId("createNewSupplierInputs")
                .filter(control => control.isA("sap.m.Input"));
            var sNewSupplierID;

            if (aSuppliers.length > 0) {
                sNewSupplierID = Math.max(...aSuppliers.map(oSupplier => !isNaN(oSupplier.ID) ? oSupplier.ID : 0)) + 1;
            } else {
                sNewSupplierID = 0;
            };

            aInputsArray.forEach( function(oInput) {
                oInput.setValue("");
                oInput.setValueState("None");
            });
            oNewSupplier.ID = sNewSupplierID;
            aSuppliers.push(oNewSupplier);
            oDataModel.setProperty("/Suppliers", aSuppliers);
            aCreatedSuppliersArray.push(oNewSupplier);
            this.navigateTo("SupplierDetails", {SupplierID: this.getSupplierPosition(sNewSupplierID)});
            this.addMutableSupplier(oEditModel, sNewSupplierID);
            this.oDialog.close();
        },

        onCancelCreateSupplier: function () {
            this.oDialog.close();
        },

        onInputChange: function(oEvent) {
			var oSource = oEvent.getSource();

			this.validateInput(oSource);
		},

        onVerifyInputs: function() {
			var oResourceBundle = this.getView().getModel("i18n");
            var aInputs = this.getView().getControlsByFieldGroupId("createNewSupplierInputs")
                .filter(control => control.isA("sap.m.Input"));
      		var bValidationError = false;

      		aInputs.forEach(function (oInput) {
      		  bValidationError = this.validateInput(oInput) || bValidationError;
      		}, this);
		  
      		if (!bValidationError) {
                this.onCreateSupplier();
      		} else {
      		    MessageToast.show(oResourceBundle.getProperty("SupplierValidationErrorMessage"));
      		};
		},

        _determineSupplierEditStatus: function() {
            var oEditModel = this.getView().getModel("editModel");
            var oDataModel = this.getView().getModel("data");
            var aSuppliersArray = oDataModel.getProperty("/Suppliers");
			var aEditSuppliersIDs = oEditModel.getProperty("/EditSuppliersArray");
			var aCreatedSuppliersIDs = oEditModel.getProperty("/CreatedSuppliers").map(supplier => supplier.ID);
            var oSupplierEditStatusObject = oEditModel.getProperty("/SupplierEditStatus");
			
            aSuppliersArray.map(function (oSupplier) {
                var nSupplierEditIndex =  aEditSuppliersIDs.indexOf(oSupplier.ID);
                var nSupplierCreatedIndex = aCreatedSuppliersIDs.indexOf(oSupplier.ID);

                if (nSupplierCreatedIndex >= 0 && nSupplierCreatedIndex >=0) {
                    oSupplier.EditStatus = oSupplierEditStatusObject.Unsaved;
                } else if (nSupplierEditIndex >= 0 && nSupplierCreatedIndex === -1) {
                    oSupplier.EditStatus = oSupplierEditStatusObject.Draft;
                } else {
                    oSupplier.EditStatus = oSupplierEditStatusObject.Empty;
                };
            });

            oDataModel.setProperty("/Suppliers", aSuppliersArray)
        }
    });
});
