using CommunityToolkit.Mvvm.ComponentModel;


namespace MedicalApp.ViewModels
{
    public partial class ViewResearchViewModel : ObservableObject
    {
        public ResearchDisplayModel Research { get; set; } = null!;
        public string PatientName { get; set; } = string.Empty;
        public bool IsFromFile { get; set; }
        public string? FilePath { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ResearchType { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
        public string CreatedAtDisplay { get; set; } = string.Empty;
        public string ProcessedAtDisplay { get; set; } = string.Empty;
        public string? Results { get; set; }

        public string? ExtractedText { get; set; }

        public ViewResearchViewModel(ResearchDisplayModel research, string patientName)
        {
            Research = research;
            PatientName = patientName;
            IsFromFile = research.IsFromFile;
            FilePath = research.FilePath;
            Title = research.IsFromFile
                ? $"PDF-файл: {System.IO.Path.GetFileName(research.FilePath ?? "—")}"
                : research.ResearchType;
            ResearchType = research.ResearchType;
            StatusDisplay = research.StatusDisplay;
            StatusColor = research.StatusColor;
            StatusTextColor = research.StatusTextColor;
            CreatedAtDisplay = research.CreatedAtDisplay;
            ProcessedAtDisplay = research.ProcessedAtDisplay;
            Results = research.Results;
            ExtractedText = research.ExtractedText;
        }
    }
}
