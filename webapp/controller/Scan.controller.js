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
        //TEST DELIVERY: FOTO ESISTENTE = 180000003, CONSEGNA NON ESISTENTE = 180000004
        //CONSEGNA ESISTENTE SENZA FOTO, POCHI DATI 180000002
        // try {
        //   const dataTest = await API.getEntity(this.getOwnerComponent().getModel("ZCMRTODDT_SRV"),"/ZV_DDTSet")
        //   console.log(dataTest)
        // } catch (error) {
        //   console.log(error)
        // }
      },

      onBarcodeInputChange: function (e) {
        const oBundle = this.getResourceBundle();
        const sCode = e.getParameter("value") || "";
        const oScanModel = this.getView().getModel("scanModel");
        oScanModel.setProperty("/code", sCode);

        if (!sCode) return;

        const oInput = e.getSource();
        oInput.setEditable(false);

        this._processDelivery(sCode)
          .catch((err) => {
            oScanModel.setProperty("/code", "");
            console.error(oBundle.getText("errProcessDelivery"), err);

            sap.m.MessageToast.show(
              err.message || oBundle.getText("errVerifyDelivery")
            );
          })
          .finally(() => {
            oInput.setEditable(true);
          });
      },

      _processDelivery: async function (sCode) {
        const oBundle = this.getResourceBundle();
        const oScanModel = this.getView().getModel("scanModel");
        this.showBusy(0);
        try {
          const oDelivery = await this._checkDeliveryExists(sCode);

          if (!oDelivery) {
            
            oScanModel.setProperty("/code", "");
            oScanModel.setProperty("/form/ddt","")
            oScanModel.setProperty("/form/date","")
            oScanModel.setProperty("/form/customer","")
            oScanModel.setProperty("/form/destination","")
            oScanModel.setProperty("/form/foto", {
                src: "./public/img/notFound.png",
                last_upload: "",
                name: ""
            });
            throw new Error(oBundle.getText("errDeliveryNotFound"));
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
          MessageBox.error(err.message || oBundle.getText("errVerifyDelivery"));
        } finally {
          this.hideBusy(0);
        }
      },

      _checkDeliveryExists: function (sDeliveryCode) {
        const oBundle = this.getResourceBundle();
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
            console.warn(oBundle.getText("errOdataFallback"), err);
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

        const oAttachment = validAttachments[validAttachments.length - 1];
        const oModel = this.getOwnerComponent().getModel("ZCMRTODDT_SRV");
        const oFoto = await API.readAttachment(
          oModel,
          "",
          oDelivery.Deliverydocument,
          oAttachment.Filename
        );

        return {
          src: oFoto.src,
          last_upload: formatter.formatDate(oFoto.last_upload),
          name: oFoto.name,
        };
      },

      openScannerForInput: function () {
        const oBundle = this.getResourceBundle();
        const oInput = this.byId("barcodeScannerInput");
        const oModel = this.getModel("scanModel");

        BarcodeScanner.scan(
          (data) => {
            const barcode = data.text;

            if (!barcode) {
              sap.m.MessageToast.show(oBundle.getText("scanCancelled"));
              oInput.focus();
              return;
            }

            oModel.setProperty("/code", barcode);
            oInput.fireChange({ value: barcode });
            BarcodeScanner.closeScanDialog();
          },
          (error) => {
            console.error(oBundle.getText("errScan"), error);
            sap.m.MessageToast.show(oBundle.getText("errScanManual"));
            oInput.focus();
          },
          undefined,
          oBundle.getText("scanDialogTitle"),
          false,
          undefined,
          undefined,
          false,
          false
        );
      },

      onFileUploaderChange: function (oEvent) {
        const oFileUploader = oEvent.getSource();
        const aFiles = oEvent.getParameter("files");
        const oFile = aFiles[0];
        const sFileName = oFile.name;
        const sMimeType = oFile.type || "image/jpeg";
        const oScanModel = this.getModel("scanModel");
        const sDelivery = oScanModel.getProperty("/form/ddt");

        // this.showBusy(0)

        const oReader = new FileReader();
        oReader.onload = function (e) {
          const vContent = e.target.result;
          const oModel = this.getOwnerComponent().getModel("ZCMRTODDT_SRV");

          const oEntity = {
            Delivery: sDelivery,
            Filename: sFileName,
            Mandt: "",
          };
          const headers = {
            "Content-Type": sMimeType,
            Slug: sFileName,
          };

          // API.createEntity(oModel, "/AttachDDTSet", vContent, headers)
          //   .then(() => {
          //     sap.m.MessageToast.show("Upload completato!");
          //     oScanModel.setProperty("/form/foto/name", sFileName);
          //     oScanModel.setProperty(
          //       "/form/foto/src",
          //       URL.createObjectURL(oFile)
          //     );
          //   })
          //   .catch((err) => {
          //     console.error(err);
          //     MessageBox.error("Errore durante l'upload.");
          //   }).finally(() => {
          //     this.hideBusy(0);
          //   });
        }.bind(this);

        oReader.readAsArrayBuffer(oFile);
      },
    });
  }
);
