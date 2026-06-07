define(['knockout', '../accUtils', '../services/analyticsService',
        'ojs/ojchart', 'ojs/ojbutton', 'ojs/ojknockout'],
  function(ko, accUtils, analyticsService) {
    function ComparisonViewModel() {
      this.datasets = analyticsService.datasets;
      this.hasData = ko.pureComputed(analyticsService.allUploaded);

      this.comparisonItems = ko.pureComputed(function() {
        const items = [];
        analyticsService.datasets().forEach(function(dataset) {
          if (!dataset.uploaded) {
            return;
          }
          items.push({ id: dataset.key + '-rows', series: 'Rows', group: dataset.label, value: dataset.summary.rowCount });
          items.push({ id: dataset.key + '-numeric', series: 'Numeric columns', group: dataset.label, value: dataset.summary.numericColumns.length });
          items.push({ id: dataset.key + '-categories', series: 'Categorical columns', group: dataset.label, value: dataset.summary.categoricalColumns.length });
        });
        return items;
      });

      this.comparisonProvider = ko.pureComputed(function() {
        return analyticsService.chartDataProvider(this.comparisonItems());
      }, this);

      this.bars3d = ko.pureComputed(function() {
        const maxRows = Math.max.apply(null, analyticsService.datasets().map(function(dataset) {
          return dataset.summary.rowCount || 1;
        }));
        return analyticsService.datasets().map(function(dataset) {
          return {
            label: dataset.label,
            rows: dataset.summary.rowCount,
            height: Math.max(22, Math.round((dataset.summary.rowCount / maxRows) * 180))
          };
        });
      });

      this.insights = ko.pureComputed(function() {
        const loaded = analyticsService.datasets().filter(function(dataset) {
          return dataset.uploaded;
        });
        if (!loaded.length) {
          return [];
        }
        const largest = loaded.slice().sort(function(a, b) {
          return b.summary.rowCount - a.summary.rowCount;
        })[0];
        const widest = loaded.slice().sort(function(a, b) {
          return b.summary.numericColumns.length - a.summary.numericColumns.length;
        })[0];
        return [
          largest.label + ' has the largest row volume at ' + largest.summary.rowCount + ' rows.',
          widest.label + ' offers the most numeric analysis fields.',
          'Together the datasets support side-by-side scale, quality, and categorical distribution checks.'
        ];
      });

      this.goUpload = function() {
        window.location.href = '?ojr=upload';
      };

      this.connected = function() {
        accUtils.announce('Comparison page loaded.', 'assertive');
        document.title = 'Dataset Comparison';
      };
    }

    return ComparisonViewModel;
  }
);
