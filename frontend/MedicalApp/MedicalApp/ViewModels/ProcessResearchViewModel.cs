using CommunityToolkit.Mvvm.ComponentModel;
using MedicalApp.Services;
using System.Collections.ObjectModel;
using System.IO;


namespace MedicalApp.ViewModels
{
    public partial class ProcessResearchViewModel : ObservableObject
    {
        private readonly ResearchDisplayModel _file;
        private readonly int _medicalRecordId;
        private readonly ResearchService _researchService = new();
        private readonly ResearchFileService _researchFileService = new();

        public ProcessResearchViewModel(ResearchDisplayModel file, string patientName,
            List<CaseDisplayModel> cases, int medicalRecordId)
        {
            _file = file;
            _medicalRecordId = medicalRecordId;
            PatientName = patientName;
            FileName = Path.GetFileName(file.FilePath ?? "—");
            FilePath = file.FilePath;
            CreatedAtDisplay = file.CreatedAtDisplay;

            // Кейси для ComboBox
            CaseOptions = new ObservableCollection<CaseOptionModel>(
                new[] { new CaseOptionModel { Id = null, DisplayName = "— Без кейсу —" } }
                .Concat(cases.Select(c => new CaseOptionModel
                {
                    Id = c.Id,
                    DisplayName = $"{c.MainCondition} ({c.OpeningDateDisplay})"
                }))
            );
            SelectedCase = CaseOptions.First();
        }

        public string PatientName { get; }
        public string FileName { get; }
        public string? FilePath { get; }
        public string CreatedAtDisplay { get; }

        public ObservableCollection<CaseOptionModel> CaseOptions { get; }

        private CaseOptionModel? _selectedCase;
        public CaseOptionModel? SelectedCase
        {
            get => _selectedCase;
            set => SetProperty(ref _selectedCase, value);
        }

        public List<string> ResearchTypeOptions { get; } = new()
        {
            "Загальний аналіз крові",
            "Біохімічний аналіз крові",
            "Загальний аналіз сечі",
            "ЕКГ",
            "УЗД черевної порожнини",
            "Рентген грудної клітки",
            "МРТ головного мозку",
            "КТ органів грудної клітки",
            "Ехокардіографія",
            "Спірометрія",
            "Інше",
        };

        private string? _selectedResearchType;
        public string? SelectedResearchType
        {
            get => _selectedResearchType;
            set
            {
                SetProperty(ref _selectedResearchType, value);
                OnPropertyChanged(nameof(CanSave));
            }
        }

        private string? _results;
        public string? Results
        {
            get => _results;
            set => SetProperty(ref _results, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                SetProperty(ref _errorMessage, value);
                OnPropertyChanged(nameof(HasError));
            }
        }

        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);
        public bool CanSave => !string.IsNullOrEmpty(SelectedResearchType);

        public async Task<bool> SaveAsync()
        {
            try
            {
                ErrorMessage = string.Empty;

                // 1. Створюємо Research
                var research = await _researchService.CreateAsync(new CreateResearchRequest
                {
                    MedicalRecordId = _medicalRecordId,
                    ResearchType = SelectedResearchType!,
                    CaseId = SelectedCase?.Id,
                    Results = Results,
                    Status = "PROCESSED"
                });

                // 2. Прив'язуємо файл до Research
                await _researchFileService.ClassifyAsync(_file.FileId!.Value, research.Id);

                return true;
            }
            catch (Exception ex)
            {
                ErrorMessage = ex.Message;
                return false;
            }
        }
    }

    public class CaseOptionModel
    {
        public int? Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }
}
