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

        public string Confidence { get; set; } = string.Empty;

        public string ConfidenceDisplay => Confidence == "high" ? "Висока впевненість" : "Низька впевненість";
        public string ConfidenceColor => Confidence == "high" ? "#EAF3DE" : "#FAEEDA";
        public string ConfidenceTextColor => Confidence == "high" ? "#3B6D11" : "#854F0B";

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


        private readonly MlService _mlService = new();

        private bool _isClassifying;
        public bool IsClassifying
        {
            get => _isClassifying;
            set
            {
                SetProperty(ref _isClassifying, value);
                OnPropertyChanged(nameof(CanSave));
            }
        }

        private string _classificationStatus = string.Empty;
        public string ClassificationStatus
        {
            get => _classificationStatus;
            set => SetProperty(ref _classificationStatus, value);
        }

        // Оновити CanSave щоб блокував під час класифікації
        public bool CanSave => !string.IsNullOrEmpty(SelectedResearchType) && !IsClassifying;

        public async Task ClassifyAsync()
        {
            if (_file.FileId == null) return;

            try
            {
                IsClassifying = true;
                ClassificationStatus = "Аналізую файл...";
                ErrorMessage = string.Empty;

                var result = await _mlService.ClassifyAsync(_file.FileId.Value);

                if (result != null)
                {
                    SelectedResearchType = result.ResearchType;
                    Results = result.ExtractedText?.Length > 500
                        ? result.ExtractedText[..500]
                        : result.ExtractedText;
                    ClassificationStatus = $"Визначено: {result.ResearchType}";

                    Confidence = result.Confidence ?? "low";
                    OnPropertyChanged(nameof(ConfidenceDisplay));
                    OnPropertyChanged(nameof(ConfidenceColor));
                    OnPropertyChanged(nameof(ConfidenceTextColor));
                }
                else
                {
                    ClassificationStatus = "Не вдалося класифікувати";
                }
            }
            catch (Exception ex)
            {
                ClassificationStatus = "Помилка класифікації";
                ErrorMessage = ex.Message;
            }
            finally
            {
                IsClassifying = false;
            }
        }
    }

    public class CaseOptionModel
    {
        public int? Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }
}
