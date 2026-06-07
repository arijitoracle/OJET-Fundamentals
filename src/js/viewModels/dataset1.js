define(['./datasetAnalysisFactory'], function(DatasetAnalysisFactory) {
  return function() {
    return new DatasetAnalysisFactory(0);
  };
});
