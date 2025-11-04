sap.ui.define(
  ["./BaseController", "../model/models", "sap/ndc/BarcodeScanner"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (BaseController, models, BarcodeScanner) {
    "use strict";

    return BaseController.extend("webapp.controller.Scan", {
      onInit: function () {
        this.getRouter()
          .getRoute("Scan")
          .attachMatched(this._onObjectMatched, this);

        this.getView().setModel(models.createScanModel());
      },

      _onObjectMatched(oEvent) {},

      onBarcodeInputChange(e) {
        const { value: code } = e.getParameters();

        this.getModel().setData({
          code: code || "",
          form: {
            ddt: "12345678",
            date: "25/03/2025",
            customer: "Mario Rossi",
            destination: "Via Verdi 4, 42123, Reggio Emilia ( RE )",
            foto: {
              src: "https://img.freepik.com/free-vector/hand-drawn-delivery-note-template_23-2149890119.jpg",
              last_upload: "21/05/2025",
              name: "delivery.jpg",
            },
          },
        });

        e.getSource().setEditable(false);

        setTimeout(() => {
          e.getSource().setEditable(true);
          e.getSource().setValue("");
        }, 500);
      },

      openScannerForInput() {
        BarcodeScanner.scan(
          (data) => {
            const barcode = data.text;
            if (barcode) {
              this.getModel().setProperty("/code", barcode);
              this.byId("barcodeScannerInput").fireChange();
              BarcodeScanner.closeScanDialog();
            }
          },
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          1,
          false
        );
      },
    });
  }
);
