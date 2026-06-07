define(['knockout', '../accUtils', '../services/analyticsService', 'ojs/ojarraydataprovider',
        'ojs/ojchart', 'ojs/ojtable', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojknockout'],
  function(ko, accUtils, analyticsService, ArrayDataProvider) {
    function DatasetAnalysisViewModel(datasetIndex) {
      this.dataset = ko.pureComputed(function() {
        return analyticsService.datasets()[datasetIndex];
      });
      this.filterText = ko.observable('');
      this.hasData = ko.pureComputed(function() {
        return this.dataset() && this.dataset().uploaded;
      }, this);

      this.filteredRows = ko.pureComputed(function() {
        const dataset = this.dataset();
        const term = this.filterText().toLowerCase();
        if (!dataset || !dataset.uploaded || !term) {
          return dataset ? dataset.rows : [];
        }
        return dataset.rows.filter(function(row) {
          return dataset.columns.some(function(column) {
            return String(row[column] || '').toLowerCase().indexOf(term) !== -1;
          });
        });
      }, this);

      this.tableDataProvider = ko.pureComputed(function() {
        return analyticsService.tableProvider(this.filteredRows());
      }, this);

      this.tableColumns = ko.pureComputed(function() {
        const dataset = this.dataset();
        return analyticsService.tableColumns(dataset ? dataset.columns : []);
      }, this);

      this.barProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(analyticsService.chartItemsFor(this.dataset(), 'bar'));
      }, this);
      this.pieProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(analyticsService.chartItemsFor(this.dataset(), 'pie'));
      }, this);
      this.lineProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(analyticsService.chartItemsFor(this.dataset(), 'line'));
      }, this);
      this.areaProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(analyticsService.chartItemsFor(this.dataset(), 'area'));
      }, this);
      this.scatterProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(analyticsService.chartItemsFor(this.dataset(), 'scatter'));
      }, this);

      this.goUpload = function() {
        window.location.href = '?ojr=upload';
      };

      this.connected = function() {
        const label = analyticsService.slots[datasetIndex].label;
        accUtils.announce(label + ' analysis page loaded.', 'assertive');
        document.title = label + ' Analysis';
      };
    }

    return DatasetAnalysisViewModel;
  }
);
