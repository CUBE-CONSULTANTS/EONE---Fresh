sap.ui.define(
  ["sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
  function (Filter, FilterOperator) {
    "use strict";

    return {
      getEntity: function (
        oModel,
        Entity,
        aFilters = [],
        Expands = [],
        params = {}
      ) {
        let urlParameters = { ...params };
        if (urlParameters.$top === undefined) delete urlParameters.$top;
        if (urlParameters.$skip === undefined) delete urlParameters.$skip;
        if (Expands.length > 0) {
          urlParameters.$expand = Expands.join(",");
        }
        return new Promise((resolve, reject) => {
          oModel.read(Entity, {
            filters: aFilters.length > 0 ? aFilters : undefined,
            urlParameters:
              Object.keys(urlParameters).length > 0 ? urlParameters : undefined,
            success: (odata) => {
              resolve({
                results: odata.results || odata,
                success: true,
              });
            },
            error: (err) => {
              reject({ success: false, error: err });
            },
          });
        });
      },
      fetchMC: function (
        oModel,
        Entity,
        aFilters = [],
        Expands = [],
        headers = {}
      ) {
        const baseUrl = oModel.sServiceUrl;
        let urlParameters = "";
        if (Expands.length > 0) {
          urlParameters += `$expand=${Expands.join(",")}`;
        }
        if (aFilters.length > 0) {
          if (urlParameters) urlParameters += "&";
          urlParameters += `$filter=${aFilters.join(",")}`;
        }

        const requestUrl = `${baseUrl}${Entity}?${urlParameters}`;

        return new Promise((resolve, reject) => {
          fetch(requestUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Request failed with status ${response.status}`
                );
              }
              return response.json();
            })
            .then((data) => {
              resolve({
                results: data.value || data,
                success: true,
              });
            })
            .catch((error) => {
              reject({ success: false, error: error.message });
            });
        });
      },
      readByKey: function (
        oModel,
        Entity,
        keyValue,
        aFilters = [],
        Expands = []
      ) {
        let keyString =
          typeof keyValue === "object"
            ? Object.entries(keyValue)
                .map(([k, v]) => `${k}='${v}'`)
                .join(",")
            : `'${keyValue}'`;

        let urlParameters = {};
        if (Expands.length > 0) {
          urlParameters.$expand = Expands.join(",");
        }

        return new Promise((resolve, reject) => {
          oModel.read(`${Entity}(${keyString})`, {
            filters: aFilters.length > 0 ? aFilters : undefined,
            urlParameters: urlParameters,
            success: function (data) {
              resolve(data);
            },
            error: function (err) {
              reject(err);
            },
          });
        });
      },

      createEntity: function (
        oModel,
        Entity,
        oRecords,
        headers = {},
        Expands = []
      ) {
        let urlParameters = {};

        if (Expands.length > 0) {
          urlParameters.$expand = Expands.join(",");
        }
        return new Promise((resolve, reject) => {
          oModel.create(Entity, oRecords, {
            headers: headers,
            urlParameters:
              Object.keys(urlParameters).length > 0 ? urlParameters : undefined,
            success: function (res) {
              resolve(res);
            },
            error: function (err) {
              reject({ success: false, error: err });
            },
          });
        });
      },
      // /fiori/upload_excel
      updateEntity: function (oModel, Entity, oRecord, method) {
        return new Promise((resolve, reject) => {
          oModel.update(Entity, oRecord, {
            method: method, // "PATCH" or "PUT"
            success: function (res) {
              resolve(res);
            },
            error: function (err) {
              reject({ success: false, error: err });
            },
          });
        });
      },
      deleteEntity: function (oModel, Entity) {
        return new Promise((resolve, reject) => {
          oModel.remove(Entity, {
            success: function () {
              resolve();
            },
            error: function (err) {
              reject({ success: false, error: err });
            },
          });
        });
      },
      readAttachment: async function (oModel, sMandt, sDelivery, sFilename) {
        const safeFilename = sFilename.split(/[/\\]/).pop();
        const sUrl = `${oModel.sServiceUrl}/ZAttach_DDTSet(Mandt='${sMandt}',Delivery='${sDelivery}',Filename='${safeFilename}')/$value`;

        try {
          const response = await fetch(sUrl, {
            method: "GET",
            headers: { Accept: "*/*" },
          });

          if (!response.ok)
            throw new Error(`Errore download allegato: ${response.status}`);

          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          return {
            src: base64,
            name: safeFilename,
            last_upload: "", // qui puoi aggiungere logica se vuoi leggere la data da un altro endpoint
          };
        } catch (err) {
          console.error("Errore caricamento allegato:", err);
          return {
            src: "./public/img/notFound.png",
            name: safeFilename,
            last_upload: "",
          };
        }
      },

      sendBatchRequest: function (oModel, batchOperations) {
        return new Promise((resolve, reject) => {
          let mRequests = [];

          batchOperations.forEach((op) => {
            mRequests.push(
              oModel.createBatchOperation(op.path, op.method, op.data)
            );
          });

          oModel.addBatchChangeOperations(mRequests);

          oModel.submitBatch(
            (oData, oResponse) => resolve(oData),
            (oError) => reject(oError)
          );
        });
      },
    };
  }
);
