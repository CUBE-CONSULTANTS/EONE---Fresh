sap.ui.define([
  "sap/ui/core/format/DateFormat"
], function (DateFormat) {
  "use strict";

  return {
    formatValue: function (value) {
      return value && value.toUpperCase();
    },
    formatDate: function (date) {
      if (date) {
        var oDateFormat = DateFormat.getDateTimeInstance({
          pattern: "dd/MM/yyyy",
        });
        return oDateFormat.format(new Date(date));
      }
      return "";
    },
    formatTime: function (ms) {
      const date = new Date(ms);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const correctionHours = -date.getTimezoneOffset() / 60;
      hours += correctionHours;
      if (hours >= 24) {
        hours = hours - 24;
      }
      if (hours < 0) {
        hours = hours + 24;
      }
      return `${String(Math.floor(hours)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    formatDateString: function (dateString) {
      if (!dateString) return "";
      if (!/^\d{8}$/.test(dateString)) return "";
      const year = parseInt(dateString.substring(0, 4), 10);
      const month = parseInt(dateString.substring(4, 6), 10) - 1; 
      const day = parseInt(dateString.substring(6, 8), 10);
      const date = new Date(year, month, day);
      return date
    },
    parseDate: function (dateStr) {
      let parts = dateStr.split("/");
      return new Date(parts[2], parts[1] - 1, parts[0]);
    },
    convertiDataInTimestampSAP(dataString) {
      let year = dataString.substring(0, 4);
      let month = dataString.substring(4, 6);
      let day = dataString.substring(6, 8);
      let formattedDate = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
      return formattedDate;
    },
    formatDateToYYYYMMDD(dateString) {
      const date = new Date(dateString);
      const formattedDate = date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      return formattedDate;
    },
    returnDate: function (sVal, inpPatForm, OutPatForm) {
      if (sVal === "" || sVal === undefined || sVal === null || sVal === "00000000") {
        return "";
      }
      let inputFormat = DateFormat.getDateInstance({
        pattern: inpPatForm
      });
      let inputDate = inputFormat.parse(sVal);
      let outputFormat = DateFormat.getDateInstance({
        pattern: OutPatForm
      });
      return outputFormat.format(inputDate);
    },
    formattedPerc: function (val) {
      if (typeof val === 'string' && val.endsWith('-')) {
        let numVal = parseFloat(val.slice(0, -1)) * -1;
        let formatted = numVal.toFixed(2);
        return formatted + ' %';
      } else {
        let numVal = parseFloat(val);
        if (isNaN(numVal)) {
          return 'N/A %';
        }
        let formatted = numVal.toFixed(2);
        return formatted + ' %';
      }
    },
    convertNegative: function (value) {
      if (typeof value === "string" && value.endsWith("-")) {
        return (-parseFloat(value.slice(0, -1))).toFixed(2)
      }
      return parseFloat(value).toFixed(2)
    },
    checkValidExt: function (ext) {
      const extUpperCase = ext.toUpperCase();
      if (extUpperCase === "DOC" || extUpperCase === "JPG" || extUpperCase === "PNG" || extUpperCase === "XLS" || extUpperCase === "ZIP" || extUpperCase === "PDF") {
        return true
      }
      return false
    },
    formatterMultipleWhiteSpaces: function (title) {
        return title?.replaceAll(" ", "\u00A0")
    },

  };
});