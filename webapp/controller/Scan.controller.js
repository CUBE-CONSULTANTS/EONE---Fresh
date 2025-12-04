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

      async _onObjectMatched(oEvent) {},
      onBarcodeInputChange: function (e) {
        debugger
        const sCode = e.getParameter("value") || "";
        const oScanModel = this.getView().getModel("scanModel");
        oScanModel.setProperty("/code", sCode);
        if (!sCode) {
          return;
        }
        const oInput = e.getSource();
        oInput.setEditable(false);
        this._processDelivery(sCode)
          .catch((err) => {
            oScanModel.setProperty("/code", "");
            console.error("Errore nel processo consegna:", err);
            sap.m.MessageToast.show(
              err.message || "Errore durante la verifica della consegna"
            );
          })
          .finally(() => {
            oInput.setEditable(true);
          });
      },
      _processDelivery: async function (sCode) {
        const oScanModel = this.getView().getModel("scanModel");
        try {
          const oDelivery = await this._checkDeliveryExists(sCode);

          if (!oDelivery) {
            throw new Error("Consegna inesistente");
          }
          oScanModel.setProperty("/form/ddt", oDelivery.Deliverydocument);
          oScanModel.setProperty("/form/date", oDelivery.Documentdate);
          oScanModel.setProperty("/form/customer", oDelivery.Customername);

          const sDestination = [
            oDelivery.Streetname,
            oDelivery.Postalcode,
            oDelivery.Cityname,
            oDelivery.Country,
          ]
            .filter(Boolean)
            .join(", ");

          oScanModel.setProperty("/form/destination", sDestination);
          const oFoto = await this._loadDeliveryPhoto(oDelivery);
          oScanModel.setProperty("/form/foto", oFoto);
        } catch (err) {
          console.error(err);
          MessageBox.error(
            err.message || "Errore durante la verifica della consegna"
          );
        }
      },
      _checkDeliveryExists: function (sDeliveryCode) {
        const oModel = this.getOwnerComponent().getModel("ZCMRTODDT_SRV");

        return API.readByKey(
          oModel,
          "/ZV_DDTSet",
          { Mandt: "", Deliverydocument: sDeliveryCode },
          [],
          ["NavToDdt"]
        )
          .then((oDelivery) => oDelivery || null)
          .catch((err) => {
            console.warn(
              "Errore OData (interpreto come consegna inesistente):",
              err
            );
            return null;
          });
      },
      _loadDeliveryPhoto: async function (oDelivery) {
        if (!oDelivery.NavToDdt || oDelivery.NavToDdt.results.length === 0) {
          return {
            src: "./public/img/notFound.png",
            last_upload: "",
            name: "",
          };
        }

        const validAttachments = oDelivery.NavToDdt.results.filter(
          (item) =>
            item.Delivery === oDelivery.Deliverydocument && item.Filename
        );

        if (validAttachments.length === 0) {
          return {
            src: "./public/img/notFound.png",
            last_upload: "",
            name: "",
          };
        }

        const oAttachment = validAttachments[0];
        const oModel = this.getOwnerComponent().getModel("ZCMRTODDT_SRV");
        const oFoto = await API.readAttachment(
          oModel,
          "",
          oDelivery.Deliverydocument,
          oAttachment.Filename
        );

        return {
          src: oFoto.src,
          last_upload: "",
          name: oFoto.name,
        };
      },
      openScannerForInput: function () {
        const oInput = this.byId("barcodeScannerInput");
        const oModel = this.getModel("scanModel");

        BarcodeScanner.scan(
          (data) => {
            const barcode = data.text;
            if (!barcode) {
              sap.m.MessageToast.show(
                "Scansione annullata o fallita. Inserisci manualmente."
              );
              oInput.focus();
              return;
            }
            debugger
            oModel.setProperty("/code", barcode);
            oInput.fireChange({value: barcode});
            BarcodeScanner.closeScanDialog();
          },
          (error) => {
            console.error("Errore durante la scansione:", error);
            sap.m.MessageToast.show(
              "Errore nella scansione, inserisci manualmente."
            );
            oInput.focus();
          },
          undefined, 
          "Inquadra il barcode", 
          false, 
          1, 
          1, 
          false, 
          false         
        );
      },
      
    });
  }
);
