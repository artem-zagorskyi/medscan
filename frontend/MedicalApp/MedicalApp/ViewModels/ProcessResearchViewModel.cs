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
        private readonly MlService _mlService = new();

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


        private bool _isCandidatesExpanded;
        public bool IsCandidatesExpanded
        {
            get => _isCandidatesExpanded;
            set
            {
                SetProperty(ref _isCandidatesExpanded, value);
                
            }
        }

        private bool _hasClassified;
        public bool HasClassified
        {
            get => _hasClassified;
            set
            {
                SetProperty(ref _hasClassified, value);
                OnPropertyChanged(nameof(ClassifyButtonText));
            }
        }

        public string ClassifyButtonText => HasClassified ? "Класифікувати заново" : "Класифікувати";



        public ObservableCollection<CaseOptionModel> CaseOptions { get; }

        private CaseOptionModel? _selectedCase;
        public CaseOptionModel? SelectedCase
        {
            get => _selectedCase;
            set => SetProperty(ref _selectedCase, value);
        }

        

        private string _confidence = string.Empty;
        public string Confidence
        {
            get => _confidence;
            set
            {
                SetProperty(ref _confidence, value);
                OnPropertyChanged(nameof(ConfidenceDisplay));
                OnPropertyChanged(nameof(ConfidenceColor));
                OnPropertyChanged(nameof(ConfidenceTextColor));
            }
        }

        public string ConfidenceDisplay => Confidence switch
        {
            "high" => "Висока впевненість",
            "medium" => "Середня впевненість",
            _ => "Низька впевненість"
        };

        public string ConfidenceColor => Confidence switch
        {
            "high" => "#EAF3DE",
            "medium" => "#FFF3CD",
            _ => "#FAEEDA"
        };

        public string ConfidenceTextColor => Confidence switch
        {
            "high" => "#3B6D11",
            "medium" => "#856404",
            _ => "#854F0B"
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

        

        public ObservableCollection<CandidateDisplayModel> CandidateOptions { get; } = new();

        private CandidateDisplayModel? _selectedCandidate;
        public CandidateDisplayModel? SelectedCandidate
        {
            get => _selectedCandidate;
            set
            {
                // Знімаємо виділення з попереднього
                if (_selectedCandidate != null)
                    _selectedCandidate.IsSelected = false;

                SetProperty(ref _selectedCandidate, value);

                if (value != null)
                {
                    value.IsSelected = true;
                    SelectedResearchType = value.CommonName;
                }
            }
        }


        



        private string? _results;
        public string? Results
        {
            get => _results;
            set => SetProperty(ref _results, value);
        }

        private string? _extractedText;
        public string? ExtractedText
        {
            get => _extractedText;
            set => SetProperty(ref _extractedText, value);
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
                    // Заповнюємо кандидатів
                    CandidateOptions.Clear();
                    foreach (var c in result.Candidates)
                    {
                        CandidateOptions.Add(new CandidateDisplayModel
                        {
                            CommonName = c.CommonName,
                            Score = c.Score,
                            DisplayName = $"{c.CommonName} ({c.Score:P0})"
                        });
                    }

                    IsCandidatesExpanded = true;
                    

                    // Обираємо першого кандидата (найкращий результат)
                    SelectedCandidate = CandidateOptions.FirstOrDefault();

                    // Результати та текст
                    Results = result.Results;
                    ExtractedText = result.ExtractedText;

                    // Confidence
                    Confidence = result.Confidence;

                    ClassificationStatus = $"Визначено: {result.ClassifiedName}";
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
                HasClassified = true;
            }
        }



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
                    CaseId = SelectedCase?.Id
                });

                // 2. Оновлюємо результати та статус
                await _researchService.UpdateAsync(research.Id, new UpdateResearchRequest
                {
                    Results = Results,
                    ExtractedText = ExtractedText,
                    Status = "PROCESSED"
                });

                // 3. Прив'язуємо файл до Research
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

    public class CandidateDisplayModel : ObservableObject
    {
        public string CommonName { get; set; } = string.Empty;
        public double Score { get; set; }
        public string DisplayName { get; set; } = string.Empty;

        private bool _isSelected;
        public bool IsSelected
        {
            get => _isSelected;
            set => SetProperty(ref _isSelected, value);
        }
    }
}