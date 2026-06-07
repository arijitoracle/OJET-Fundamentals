define(['knockout', '../accUtils', '../services/analyticsService', 'ojs/ojarraydataprovider',
        'ojs/ojbutton', 'ojs/ojmessages', 'ojs/ojknockout'],
  function(ko, accUtils, analyticsService, ArrayDataProvider) {
    function UploadViewModel() {
      this.slots = analyticsService.slots;
      this.datasets = analyticsService.datasets;
      this.messages = ko.observableArray([]);
      this.datasetProvider = ko.pureComputed(function() {
        return new ArrayDataProvider(analyticsService.datasets(), { keyAttributes: 'key' });
      });
      this.canContinue = ko.pureComputed(analyticsService.allUploaded);

      this.selectFile = function(index, viewModel, event) {
        const files = event.target.files;
        const file = files && files.length ? files[0] : null;
        if (!file) {
          return;
        }
        const extension = file.name.split('.').pop().toLowerCase();
        if (['csv', 'txt'].indexOf(extension) === -1) {
          this.messages([{
            severity: 'warning',
            summary: 'CSV parser available',
            detail: 'Please upload CSV files for this browser-only implementation.'
          }]);
          return;
        }
        const reader = new FileReader();
        reader.onload = function(loadEvent) {
          const parsed = analyticsService.parseCsv(loadEvent.target.result);
          if (parsed.columns.length !== 10) {
            this.messages([{
              severity: 'warning',
              summary: 'Column validation',
              detail: file.name + ' has ' + parsed.columns.length + ' columns. The architecture expects 10 columns.'
            }]);
          }
          analyticsService.setDataset(index, file.name, parsed.columns, parsed.rows);
        }.bind(this);
        reader.readAsText(file);
        event.target.value = '';
      }.bind(this);

      this.loadSamples = function() {
        analyticsService.loadSampleData();
        this.messages([{
          severity: 'confirmation',
          summary: 'Sample datasets loaded',
          detail: 'Customers, orders, and feedback datasets are ready for analysis.'
        }]);
      }.bind(this);

      this.continueToDashboard = function() {
        if (!analyticsService.allUploaded()) {
          this.messages([{
            severity: 'error',
            summary: 'Upload all datasets',
            detail: 'All three datasets must be loaded before the dashboard can be generated.'
          }]);
          return;
        }
        window.location.href = '?ojr=dashboard';
      }.bind(this);

      this.connected = function() {
        accUtils.announce('Upload page loaded.', 'assertive');
        document.title = 'Upload Datasets';
      };
    }

    return UploadViewModel;
  }
);
