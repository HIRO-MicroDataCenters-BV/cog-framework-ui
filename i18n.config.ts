export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      general: {
        project_name: "Cognetive Engine",
      },
      title: {
        platform: "Platform",
      },
      subtitle: {
        datasets: "Datasets",
      },
      label: {},
      placeholder: {
        search: "Search...",
      },
      action: {
        previous: "Previous",
        next: "Next",
        filters: "Filters",
      },
      stat: {
        total: "Total",
        files: "Files",
        databases: "Databases",
        streams: "Streams",
      },
      hint: {
        no_results: "No results found",
        of: "of",
        rows_selected: "rows selected",
      },
      menu: {
        documentation: "Documentation",
        support: "Support",
        dataset_management: "Dataset Management",
        training_builder: "Training Builder",
        runs: "Runs",
        model_management: "Model Management",
        model_validation: "Model Validation",
        model_serving: "Model Serving",
      },
      tab: {
        all: "All",
        file: "File",
        database: "Database",
        data_stream: "Data Stream",
      },
      column: {
        id: "ID",
        name: "Name",
        description: "Description",
        type: "Type",
        status: "Status",
        last_update: "Last Update",
        created_at: "Created At",
        updated_at: "Updated At",
      },
      zodI18n: {
        errors: {},
      },
    },
  },
}));
