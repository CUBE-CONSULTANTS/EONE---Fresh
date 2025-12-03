sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  /**
   * provide app-view type models (as in the first "V" in MVVC)
   *
   * @param {typeof sap.ui.model.json.JSONModel} JSONModel
   * @param {typeof sap.ui.Device} Device
   *
   * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
   */
  function (JSONModel, Device) {
    "use strict";

    return {
      createDeviceModel: function () {
        var oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },
      createMainModel: function () {
				return new JSONModel({
					visibility: false,
					editable: false,
					enabled: false,
					busy: false,
					selected: false
				});
			},
      createScanModel() {
        return new JSONModel({
          code: "",
          form: {
            ddt: "",
            date: "",
            customer: "",
            destination: "",
            foto: {
                src: "./public/img/notFound.png",
                last_upload: "",
                name: ""
            }
          }
        });
      }
    };
  }
);
