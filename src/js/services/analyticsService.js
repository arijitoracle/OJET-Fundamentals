define(['knockout', 'ojs/ojarraydataprovider'],
  function(ko, ArrayDataProvider) {
    const datasetSlots = [
      { key: 'dataset1', label: 'Dataset 1', sampleName: 'customers.csv' },
      { key: 'dataset2', label: 'Dataset 2', sampleName: 'orders.csv' },
      { key: 'dataset3', label: 'Dataset 3', sampleName: 'feedback.csv' }
    ];
    const storageKey = 'multiDatasetAnalytics.datasets';

    const sampleCsv = [
      [
        'customer_id,customer_name,age_group,gender,region,segment,signup_date,loyalty_score,account_status,tenure_months',
        'CUST001,Customer_1,18-25,Male,East,Corporate,2023-08-17,56.98,Active,44',
        'CUST002,Customer_2,56+,Male,West,Retail,2023-01-31,54.68,Active,33',
        'CUST003,Customer_3,56+,Male,South,Enterprise,2023-08-14,72.46,Inactive,52',
        'CUST004,Customer_4,18-25,Male,West,SME,2023-10-12,57.77,Inactive,7',
        'CUST005,Customer_5,26-35,Female,North,Enterprise,2024-08-15,78.44,Active,28',
        'CUST006,Customer_6,46-55,Other,South,Corporate,2024-02-03,89.12,Pending,18',
        'CUST007,Customer_7,36-45,Female,East,Retail,2024-11-22,64.73,Active,12',
        'CUST008,Customer_8,26-35,Male,North,SME,2023-05-06,91.44,Inactive,49'
      ].join('\n'),
      [
        'order_id,customer_id,order_date,product_category,order_channel,quantity,unit_price,discount_pct,order_status,order_value',
        'ORD0001,CUST007,2024-03-07,Books,Store,5,471.71,0.14,Completed,2028.35',
        'ORD0002,CUST074,2024-11-07,Electronics,Online,1,92.83,0.24,Completed,70.55',
        'ORD0003,CUST072,2024-08-19,Sports,Store,7,311.03,0.24,Processing,1654.68',
        'ORD0004,CUST057,2024-11-08,Sports,Mobile App,5,432.88,0.3,Completed,1515.08',
        'ORD0005,CUST004,2025-02-16,Furniture,Online,8,221.18,0.04,Returned,1698.62',
        'ORD0006,CUST006,2025-07-10,Clothing,Mobile App,2,142.44,0.1,Completed,256.39',
        'ORD0007,CUST001,2024-05-12,Electronics,Store,3,385.19,0.16,Cancelled,970.68',
        'ORD0008,CUST008,2025-10-22,Books,Online,6,51.5,0.05,Completed,293.55'
      ].join('\n'),
      [
        'feedback_id,customer_id,order_id,feedback_date,rating,sentiment,issue_type,resolution_time_days,support_channel,comments_tag',
        'FDB0001,CUST057,ORD0247,2025-09-09,2,Negative,Delivery Delay,10,Web Form,Fulfillment',
        'FDB0002,CUST033,ORD0216,2024-02-14,3,Negative,None,6,Phone,Quality',
        'FDB0003,CUST094,ORD0405,2024-12-24,4,Negative,None,9,Email,Quality',
        'FDB0004,CUST076,ORD0069,2025-05-03,3,Positive,Delivery Delay,4,Web Form,Experience',
        'FDB0005,CUST001,ORD0007,2024-05-14,5,Positive,None,1,Chat,Service',
        'FDB0006,CUST006,ORD0006,2025-07-12,4,Positive,None,2,Email,App UI',
        'FDB0007,CUST004,ORD0005,2025-02-20,2,Neutral,Payment Issue,7,Phone,Pricing',
        'FDB0008,CUST008,ORD0008,2025-10-28,5,Positive,None,0,Chat,Experience'
      ].join('\n')
    ];

    const state = ko.observableArray(restoreDatasets());

    function createEmptyDataset(slot) {
      return {
        key: slot.key,
        label: slot.label,
        fileName: '',
        columns: [],
        rows: [],
        summary: emptySummary(),
        uploaded: false
      };
    }

    function emptySummary() {
      return {
        rowCount: 0,
        columnCount: 0,
        numericColumns: [],
        categoricalColumns: [],
        stats: [],
        topCategories: [],
        insights: []
      };
    }

    function restoreDatasets() {
      const fallback = datasetSlots.map(function(slot) {
        return createEmptyDataset(slot);
      });
      try {
        const stored = window.sessionStorage.getItem(storageKey);
        if (!stored) {
          return fallback;
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length !== datasetSlots.length) {
          return fallback;
        }
        return parsed.map(function(dataset, index) {
          const slot = datasetSlots[index];
          const columns = Array.isArray(dataset.columns) ? dataset.columns : [];
          const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
          return {
            key: slot.key,
            label: slot.label,
            fileName: dataset.fileName || '',
            columns: columns,
            rows: rows,
            summary: summarize(columns, rows),
            uploaded: Boolean(dataset.uploaded && columns.length && rows.length)
          };
        });
      } catch (error) {
        return fallback;
      }
    }

    function persistDatasets() {
      try {
        const datasets = state().map(function(dataset) {
          return {
            key: dataset.key,
            label: dataset.label,
            fileName: dataset.fileName,
            columns: dataset.columns,
            rows: dataset.rows,
            uploaded: dataset.uploaded
          };
        });
        window.sessionStorage.setItem(storageKey, JSON.stringify(datasets));
      } catch (error) {
        // Keep the in-memory app usable even if browser storage is unavailable.
      }
    }

    function parseCsv(text) {
      const records = [];
      let record = [];
      let field = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          record.push(field.trim());
          field = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (char === '\r' && next === '\n') {
            i++;
          }
          record.push(field.trim());
          if (record.some(Boolean)) {
            records.push(record);
          }
          record = [];
          field = '';
        } else {
          field += char;
        }
      }

      record.push(field.trim());
      if (record.some(Boolean)) {
        records.push(record);
      }

      if (!records.length) {
        return { columns: [], rows: [] };
      }

      const columns = records[0].map(function(header, index) {
        return header || 'Column ' + (index + 1);
      });
      const rows = records.slice(1).map(function(values, rowIndex) {
        const row = { id: rowIndex + 1 };
        columns.forEach(function(column, columnIndex) {
          row[column] = values[columnIndex] || '';
        });
        return row;
      });

      return { columns: columns, rows: rows };
    }

    function toNumber(value) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const numberValue = Number(String(value).replace(/[$,%]/g, ''));
      return Number.isFinite(numberValue) ? numberValue : null;
    }

    function summarize(columns, rows) {
      if (!columns.length) {
        return emptySummary();
      }

      const numericColumns = columns.filter(function(column) {
        const numericValues = rows.map(function(row) {
          return toNumber(row[column]);
        }).filter(function(value) {
          return value !== null;
        });
        return numericValues.length >= Math.max(2, Math.ceil(rows.length * 0.6));
      });

      const categoricalColumns = columns.filter(function(column) {
        return numericColumns.indexOf(column) === -1;
      });

      const stats = numericColumns.slice(0, 5).map(function(column) {
        const values = rows.map(function(row) {
          return toNumber(row[column]);
        }).filter(function(value) {
          return value !== null;
        }).sort(function(a, b) {
          return a - b;
        });
        const total = values.reduce(function(sum, value) {
          return sum + value;
        }, 0);
        return {
          column: column,
          min: round(values[0] || 0),
          max: round(values[values.length - 1] || 0),
          average: round(values.length ? total / values.length : 0),
          total: round(total)
        };
      });

      const topCategories = categoricalColumns.map(function(column) {
        const counts = countBy(rows, column).slice(0, 5);
        return { column: column, values: counts, score: categoryScore(rows, column, counts) };
      }).filter(function(category) {
        return category.score > 0 && category.values.length > 1;
      }).sort(function(a, b) {
        return b.score - a.score;
      }).slice(0, 4);

      const insights = buildInsights(rows, numericColumns, topCategories);

      return {
        rowCount: rows.length,
        columnCount: columns.length,
        numericColumns: numericColumns,
        categoricalColumns: categoricalColumns,
        stats: stats,
        topCategories: topCategories,
        insights: insights
      };
    }

    function buildInsights(rows, numericColumns, topCategories) {
      const insights = [];
      if (rows.length) {
        insights.push(rows.length + ' rows are available for exploration.');
      }
      if (numericColumns.length) {
        insights.push(numericColumns.length + ' numeric columns can be profiled and charted.');
      }
      if (topCategories.length && topCategories[0].values.length) {
        insights.push('Most frequent ' + topCategories[0].column + ' value is ' + topCategories[0].values[0].label + '.');
      }
      return insights;
    }

    function countBy(rows, column) {
      const counts = {};
      rows.forEach(function(row) {
        const key = row[column] || 'Blank';
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.keys(counts).map(function(key) {
        return { label: key, value: counts[key] };
      }).sort(function(a, b) {
        return b.value - a.value;
      });
    }

    function categoryScore(rows, column, counts) {
      if (!rows.length || !counts.length) {
        return 0;
      }

      const lowerColumn = column.toLowerCase();
      const uniqueCount = counts.length;
      const topCount = counts[0].value;

      if (/_id$/.test(lowerColumn) || lowerColumn === 'id' || lowerColumn.indexOf('date') !== -1 || lowerColumn.indexOf('name') !== -1) {
        return 0;
      }

      if (uniqueCount <= 1 || topCount <= 1 || uniqueCount >= rows.length * 0.8) {
        return 0;
      }

      const preferredTerms = ['status', 'category', 'segment', 'region', 'gender', 'sentiment', 'issue', 'channel', 'tag', 'group'];
      const preference = preferredTerms.some(function(term) {
        return lowerColumn.indexOf(term) !== -1;
      }) ? 40 : 0;
      const compactness = Math.max(0, 30 - uniqueCount);
      const dominance = Math.round((topCount / rows.length) * 30);

      return preference + compactness + dominance;
    }

    function round(value) {
      return Math.round(value * 100) / 100;
    }

    function setDataset(index, fileName, columns, rows) {
      const current = state();
      const slot = datasetSlots[index];
      current[index] = {
        key: slot.key,
        label: slot.label,
        fileName: fileName,
        columns: columns,
        rows: rows,
        summary: summarize(columns, rows),
        uploaded: true
      };
      state(current.slice());
      persistDatasets();
    }

    function loadSampleData() {
      sampleCsv.forEach(function(text, index) {
        const parsed = parseCsv(text);
        setDataset(index, datasetSlots[index].sampleName, parsed.columns, parsed.rows);
      });
    }

    function allUploaded() {
      return state().every(function(dataset) {
        return dataset.uploaded;
      });
    }

    function chartItemsFor(dataset, type) {
      if (!dataset || !dataset.uploaded) {
        return [];
      }
      const summary = dataset.summary;
      const category = summary.topCategories[0];
      const numeric = summary.numericColumns[0];

      if ((type === 'bar' || type === 'pie') && category) {
        return category.values.map(function(item) {
          return {
            id: dataset.key + '-' + item.label,
            series: dataset.label,
            group: item.label,
            value: item.value
          };
        });
      }

      if ((type === 'line' || type === 'area') && numeric) {
        return dataset.rows.slice(0, 12).map(function(row, index) {
          return {
            id: dataset.key + '-line-' + index,
            series: numeric,
            group: String(index + 1),
            value: toNumber(row[numeric]) || 0
          };
        });
      }

      if (type === 'scatter' && summary.numericColumns.length >= 2) {
        const xColumn = summary.numericColumns[0];
        const yColumn = summary.numericColumns[1];
        return dataset.rows.slice(0, 30).map(function(row, index) {
          return {
            id: dataset.key + '-scatter-' + index,
            series: dataset.label,
            group: String(index + 1),
            x: toNumber(row[xColumn]) || 0,
            y: toNumber(row[yColumn]) || 0,
            value: toNumber(row[yColumn]) || 0
          };
        });
      }

      return [];
    }

    function chartDataProvider(items) {
      return new ArrayDataProvider(items, { keyAttributes: 'id' });
    }

    function tableProvider(rows) {
      return new ArrayDataProvider(rows, { keyAttributes: 'id' });
    }

    function tableColumns(columns) {
      return columns.map(function(column) {
        return {
          headerText: column,
          field: column,
          sortable: 'enabled',
          resizable: 'enabled'
        };
      });
    }

    return {
      datasets: state,
      slots: datasetSlots,
      parseCsv: parseCsv,
      setDataset: setDataset,
      loadSampleData: loadSampleData,
      allUploaded: allUploaded,
      chartItemsFor: chartItemsFor,
      chartDataProvider: chartDataProvider,
      tableProvider: tableProvider,
      tableColumns: tableColumns,
      countBy: countBy,
      toNumber: toNumber
    };
  }
);
