sap.ui.define([], function () {
    "use strict";
    return {
        priceText: function (sPrice) {
            return `${sPrice} USD`
        },

        discountDateFormatter: function (sDate) {
            return sDate ? sDate : "-"
        },

        productsTableModeFormatter: function (bEditIndicator) {
            if (bEditIndicator) {
                return "MultiSelect"
            } else {
                return "None"
            }
        },

        supplierStatusFormatter: function (sStatus) {
            if (sStatus === "Draft") {
                return "Warning"
            } else if (sStatus === "Unsaved/Draft") {
                return "Error"
            } else {
                return "None"
            }
        }
    };
});