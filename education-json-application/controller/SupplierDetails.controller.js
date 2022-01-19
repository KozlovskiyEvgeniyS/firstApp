sap.ui.define([
    "yauheni/kazlouski/app/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "../model/formatter"
], function (BaseController, JSONModel,	Filter,	FilterOperator, MessageToast, MessageBox,formatter) {
    "use strict";

    return BaseController.extend("yauheni.kazlouski.app.controller.SupplierDetails", {
        formatter: formatter,
        onInit: function() {
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();
            var oViewModel = new JSONModel({
                deleteProductsButtonEnabled: false,
                maxSelectionDate: new Date(),
                minDiscontinuedDate: new Date()
            })

            this.oViewModel = oViewModel;
            this.getView().setModel(oViewModel, "viewModel")
            oRouter.getRoute("SupplierDetails").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function(oEvent){
            var sSupplierID = Number(oEvent.getParameter("arguments").SupplierID);
            var oEditSuppliersArray = this.getView().getModel("editModel").getData().EditSuppliersArray;
            var oEditModel = this.getView().getModel("editModel");
        
            this.getView().bindObject({
                path: `/Suppliers/${sSupplierID}`,
                model: "data"
            });

            var sSupplierObjectID = this.getView().getBindingContext("data").getObject("ID");

            if (oEditSuppliersArray.includes(sSupplierObjectID)) {
                oEditModel.setProperty("/EditIndicator", true);
            } else {
                oEditModel.setProperty("/EditIndicator", false);
            };
        },

        onNavToSupplierListPress: function () {
            this.navigateTo("SuppliersOverview");
        },
        
        onProductsTableListItemPress: function (oEvent) {
            var oView = this.getView();
            var oDataBindingContext =  oView.getBindingContext("data");
            var aProducts = oDataBindingContext.getObject("Products");
            var sSupplierID = oDataBindingContext.getObject("ID");
            var sProductID = oEvent.getSource().getBindingContext("data").getObject("ID");
            var nProductPosition = aProducts.findIndex(oProduct => oProduct.ID === sProductID);
            var nSupplierPosition = this.getSupplierPosition(sSupplierID);

            this.navigateTo("ProductDetails", {SupplierID: nSupplierPosition,ProductID: nProductPosition});
        },

        onProductsSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oProductsTable = this.byId("productsTable");
            var oItemsBinding = oProductsTable.getBinding("items");
            debugger
            var oProductsFilter = new Filter({
                filters:[
                    new Filter("Name", FilterOperator.Contains, sQuery),
                    new Filter("Description", FilterOperator.Contains, sQuery),
                    new Filter("ReleaseDate", FilterOperator.Contains, sQuery),
                    new Filter("DiscontinuedDate", FilterOperator.Contains, sQuery),
                    new Filter("Rating", FilterOperator.EQ, sQuery),
                    new Filter("Price", FilterOperator.EQ, sQuery)
            ], or: true});
            oItemsBinding.filter(oProductsFilter);
        },

        onEditButtonPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var sSupplierID = oSource.getBindingContext("data").getObject("ID");
            var oEditModel = this.getView().getModel("editModel");
           
            this.addMutableSupplier(oEditModel, sSupplierID);
            this.onEditSupplier(oEditModel, sSupplierID);
        },

        onSaveProductChangesPress: function (oEvent) {
            var oEditModel = this.getView().getModel("editModel");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("ID");
            var aCreatedSuppliersArray = oEditModel.getProperty("/CreatedSuppliers");
            var nCreatedSupplierPosition = aCreatedSuppliersArray.findIndex(supplier => supplier.ID === sSupplierID);

            if (nCreatedSupplierPosition >= 0 ){
                aCreatedSuppliersArray.splice(nCreatedSupplierPosition, 1);
            }
            this.deleteMutableSupplier(oEditModel, sSupplierID);
        },

        onCancelProductChangesPress: function (oEvent) {
            var sSupplierID = Number(oEvent.getSource().getBindingContext("data").getObject("ID"));
            var oEditModel = this.getView().getModel("editModel");

            this.onCancelEditConfirmation(oEditModel, sSupplierID);
        },

        onCreateNewProductPress: function () {
            var oView = this.getView();
            var aInputsArray = oView.getControlsByFieldGroupId("newProductInputs")
                .filter(control => control.isA("sap.m.Input") || control.isA("sap.m.DatePicker"));

            if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "yauheni.kazlouski.app.view.fragments.CreateProductDialog",
                    this
				);
				oView.addDependent(this.oDialog);
			};
            
            aInputsArray.forEach(function (oInput) {
                oInput.setValueState("None")
            });
            sap.ui.getCore().getMessageManager().registerObject(this.oDialog, true)
			this.oDialog.open();
        },

        onCreateProduct: function (oEvent) {
            var oView = this.getView();
            var oDataModel = oView.getModel("data");
            var oEditModel = oView.getModel("editModel");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("ID");
            var aProducts = oView.getBindingContext("data").getObject("Products")
            var aInputsArray = oView.getControlsByFieldGroupId("newProductInputs")
                .filter(control => control.isA("sap.m.Input") || control.isA("sap.m.DatePicker"));
            var oNewProduct = $.extend(true, oNewProduct, oEditModel.getProperty("/ProductTemplate"));
            var sNewProductID;

            if (aProducts.length > 0) {
                sNewProductID = Math.max(...aProducts.map(oSupplier => !isNaN(oSupplier.ID) ? oSupplier.ID : 0)) + 1;
            } else {
                sNewProductID = 0;
            };

            oNewProduct.ID = sNewProductID;
            oNewProduct.SupplierID = sSupplierID;
            aProducts.push(oNewProduct)
            oDataModel.setProperty(`/Suppliers/${sSupplierID}/Products`, aProducts);
            oDataModel.refresh(true);
            aInputsArray.forEach(oInput => oInput.setValue(""));
            this.oDialog.close();
        },

        onCancelCreateProduct: function () {
            var aInputsArray = this.getView().getControlsByFieldGroupId("newProductInputs")
                .filter(control => control.isA("sap.m.Input") || control.isA("sap.m.DatePicker"));

            aInputsArray.forEach(function (oInput) {
                oInput.setValue("");
                oInput.setValueState("None")
            });
            this.oDialog.close();
        },

        onDeleteSupplier: function (oEvent) {
            var oView = this.getView();
            var oDataModel = oView.getModel("data");
            var oResourceBundle = oView.getModel("i18n");
            var sSupplierID = oEvent.getSource().getBindingContext("data").getObject("ID");
            var aSuppliers = oDataModel.getProperty("/Suppliers");
            var sConfirmMessage = oResourceBundle.getProperty("DeleteSupplierConfirm");
            
            this.onDeleteConfirmation(sConfirmMessage).then(function () {
                var aNewSuppliers = aSuppliers.filter(oSupplier => oSupplier.ID !== sSupplierID || oSupplier === undefined);

                oDataModel.setProperty("/Suppliers", aNewSuppliers);
                this.onNavToSupplierListPress();
            }.bind(this))
        },

        onProductsTableSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var oTableSelectedItems = oTable.getSelectedItems();

            if (oTableSelectedItems.length > 0) {
                this.oViewModel.setProperty("/deleteProductsButtonEnabled", true);
            } else {
                this.oViewModel.setProperty("/deleteProductsButtonEnabled", false);
            }
        },

        onProductsTableUpdateFinished: function (oEvent) {
            this.onProductsTableSelectionChange(oEvent);
        },

        onDeleteProducts: function (oEvent) {
            var oView = this.getView();
            var oDataModel = oView.getModel("data");
            var sSupplierID = oView.getBindingContext("data").getObject("ID");
            var nSupplierPosition = this.getSupplierPosition(sSupplierID);
            var aProducts = oEvent.getSource().getBindingContext("data").getObject("Products");
            var oProductsTable = this.byId("productsTable");
            var aSelectedProducts = oProductsTable.getSelectedItems().map(function (oSelecteditem) {
                return oSelecteditem.getBindingContext("data").getObject()
            });
            var oResourceBundle = oView.getModel("i18n");
            var sConfirmMessage = oResourceBundle.getProperty("DeleteProductsConfirm");

            this.onDeleteConfirmation(sConfirmMessage).then(function () {
                var aNewProducts = aProducts.filter(oProduct => !aSelectedProducts.includes(oProduct));
                
                oDataModel.setProperty(`/Suppliers/${nSupplierPosition}/Products`, aNewProducts);
                oProductsTable.removeSelections()
            })
        },

        onInputChange: function(oEvent) {
			var oSource = oEvent.getSource();
            var oReleaseDatePicker = this.byId("newProductReleaseDate");
            var oDiscontinuedDatePicker = this.byId("newProductDiscountDate");
            var sDateErrorMessage = this.getView().getModel("i18n").getProperty("DateErrorMessage");

            if (oReleaseDatePicker.getValue()) {
                this.oViewModel.setProperty("/minDiscontinuedDate", new Date(oReleaseDatePicker.getValue()));

                if (Date.parse(oReleaseDatePicker.getValue()) > Date.parse(oDiscontinuedDatePicker.getValue())) {
                    MessageBox.error(sDateErrorMessage);
                    oDiscontinuedDatePicker.setValue("");
                    this.oViewModel.setProperty("/minDiscontinuedDate", new Date(oReleaseDatePicker.getValue()));
                }
            };

            this.validateInput(oSource);
		},

        onVerifyInputs: function(oEvent) {
			var oResourceBundle = this.getView().getModel("i18n");
      		var bValidationError = false;
            var oReleaseDate = this.byId("newProductReleaseDate");
            var aInputs = this.getView().getControlsByFieldGroupId("newProductInputs")
                .filter(control => control.isA("sap.m.Input"));
            
            if (oReleaseDate.getValue() === "") {
				oReleaseDate.setValueState("Error");
				bValidationError = true;
			} else {
				oReleaseDate.setValueState("None");
			};

      		aInputs.forEach(function (oInput) {
      		  bValidationError = this.validateInput(oInput) || bValidationError;
      		}, this);

      		if (!bValidationError) {
                this.onCreateProduct(oEvent);
      		} else {
      		    MessageToast.show(oResourceBundle.getProperty("ProductValidationErrorMessage"));
      		};
		},
    }); 
});
