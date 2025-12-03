sap.ui.define(
  [
    "./BaseController",
    "../model/models",
    "sap/ndc/BarcodeScanner",
    "../model/API",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    BaseController,
    models,
    BarcodeScanner,
    API,
    MessageBox,
    JSONModel,
    formatter
  ) {
    "use strict";

    return BaseController.extend("webapp.controller.Scan", {
      formatter: formatter,
      onInit: function () {
        this.getRouter()
          .getRoute("Scan")
          .attachMatched(this._onObjectMatched, this);
        this.setModel(models.createScanModel(), "scanModel");
      },

      async _onObjectMatched(oEvent) {
        const oModel = this.getOwnerComponent().getModel("ZCMRTODDT_SRV");
        this.showBusy(0);
        try {
          const deliverySet = await API.getEntity(
            oModel,
            "/ZV_DDTSet",
            [],
            ["NavToDdt"],
            {}
          );
          this.setModel(new JSONModel(deliverySet.results), "deliverySet");
          console.log(this.getModel("deliverySet").getData());
        } catch (error) {
          MessageBox.error("Errore nel recupero dei dati dal servizio OData.");
        } finally {
          this.hideBusy(0);
        }
      },
      onManualSearch: function () {
        const self = this;
        this.onOpenDialog(
          "ddtHelpDialog",
          "webapp.view.fragments.DdtHelp",
          self,
          "deliverySet"
        );
      },
      onDdtSelect: function (oEvent) {
        const sDeliveryCode = oEvent
          .getParameters()
          .listItem.getBindingContext("deliverySet")
          .getProperty("Deliverydocument");

        if (!sDeliveryCode) return;

        const oScanModel = this.getModel("scanModel");
        oScanModel.setProperty("/code", sDeliveryCode);
        oEvent.getSource().getParent().close();
        this._processDelivery(sDeliveryCode);
      },
      // onBarcodeInputChange: function (e) {
      //   const sCode = e.getParameter("value") || "";
      //   const oScanModel = this.getModel("scanModel");
      //   oScanModel.setProperty("/code", sCode);
      //   if (sCode) {
      //     oScanModel.setProperty("/form/ddt", "12345678");
      //     oScanModel.setProperty("/form/date", "25/03/2025");
      //     oScanModel.setProperty("/form/customer", "Mario Rossi");
      //     oScanModel.setProperty(
      //       "/form/destination",
      //       "Via Verdi 4, 42123, Reggio Emilia ( RE )"
      //     );
      //     oScanModel.setProperty("/form/foto", {
      //       src: "https://img.freepik.com/free-vector/hand-drawn-delivery-note-template_23-2149890119.jpg",
      //       last_upload: "21/05/2025",
      //       name: "delivery.jpg",
      //     });
      //   }

      //   e.getSource().setEditable(false);

      //   setTimeout(() => {
      //     e.getSource().setEditable(true);
      //     e.getSource().setValue("");
      //   }, 500);
      // },
      onBarcodeInputChange: function (e) {
        const sCode = e.getParameter("value") || "";
        const oScanModel = this.getView().getModel("scanModel");
        oScanModel.setProperty("/code", sCode);
        if (!sCode) {
          return;
        }
        const oInput = e.getSource();
        oInput.setEditable(false);
        this._processDelivery(sCode).finally(() => {
          oInput.setEditable(true);
          oScanModel.setProperty("/code", "");
        });
      },
      _processDelivery: function (sCode) {
        ;
        const oScanModel = this.getView().getModel("scanModel");

        return this._checkDeliveryExists(sCode)
          .then((oDelivery) => {
            if (oDelivery) {
              oScanModel.setProperty("/form/ddt", oDelivery.Deliverydocument);
              oScanModel.setProperty("/form/date", oDelivery.Documentdate);
              oScanModel.setProperty("/form/customer", oDelivery.Customername);
              oScanModel.setProperty(
                "/form/destination",
                oDelivery.Destination || ""
              );
              oScanModel.setProperty(
                "/form/foto",
                oDelivery.Foto || {
                  src: "./public/img/notFound.png",
                  last_upload: "",
                  name: "",
                }
              );
            } else {
              MessageBox.error("Consegna inesistente");
            }
          })
          .catch((err) => {
            console.error(err);
            MessageBox.error("Errore durante la verifica della consegna");
          });
      },
      _checkDeliveryExists: function (sDeliveryCode) {
        ;
        return API.readByKey(
          this.getOwnerComponent().getModel("ZCMRTODDT_SRV"),
          "/ZV_DDTSet",
          { Mandt: "", Deliverydocument: sDeliveryCode },
          [], 
          ["NavToDdt"] 
        )
          .then((oDelivery) => oDelivery || null)
          .catch((err) => {
            console.error(err);
            return null;
          });
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
