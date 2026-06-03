using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class MedicalCardViewModel : ObservableObject
    {
        private readonly MedicalRecordService _medicalRecordService = new();
        internal List<CaseDisplayModel> _allCases = new();
        private List<ResearchDisplayModel> _allResearches = new();
        private List<ResearchDisplayModel> _filteredResearches = new();

        public FullMedicalRecordResponse? CurrentRecord { get; private set; }

        private readonly CaseService _caseService = new();

        public async Task ReloadAsync()
        {
            await LoadDataAsync();
        }

        

        public MedicalCardViewModel(PatientDisplayModel patient)
        {
            Patient = patient;
            _ = LoadDataAsync();
        }

        public PatientDisplayModel Patient { get; }

        // --- Вкладки ---
        private int _activeTab = 0;
        public int ActiveTab
        {
            get => _activeTab;
            set
            {
                SetProperty(ref _activeTab, value);
                OnPropertyChanged(nameof(IsRecordsTab));
                OnPropertyChanged(nameof(IsResearchTab));
            }
        }
        public bool IsRecordsTab => ActiveTab == 0;
        public bool IsResearchTab => ActiveTab == 1;

        // --- Стан ---
        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        private string _errorMessage = string.Empty;
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        // --- Медкарта ---
        private string _bloodGroup = "—";
        public string BloodGroup
        {
            get => _bloodGroup;
            set => SetProperty(ref _bloodGroup, value);
        }

        private string _rhFactor = "—";
        public string RhFactor
        {
            get => _rhFactor;
            set => SetProperty(ref _rhFactor, value);
        }

        private string _height = "—";
        public string Height
        {
            get => _height;
            set => SetProperty(ref _height, value);
        }

        private string _weight = "—";
        public string Weight
        {
            get => _weight;
            set => SetProperty(ref _weight, value);
        }

        private string _contactInfo = "—";
        public string ContactInfo
        {
            get => _contactInfo;
            set => SetProperty(ref _contactInfo, value);
        }

        private string _address = "—";
        public string Address
        {
            get => _address;
            set => SetProperty(ref _address, value);
        }

        // --- Алергії ---
        private ObservableCollection<AllergyDisplayModel> _allergies = new();
        public ObservableCollection<AllergyDisplayModel> Allergies
        {
            get => _allergies;
            set => SetProperty(ref _allergies, value);
        }

        // --- Діагнози ---
        private ObservableCollection<DiagnosisDisplayModel> _diagnoses = new();
        public ObservableCollection<DiagnosisDisplayModel> Diagnoses
        {
            get => _diagnoses;
            set => SetProperty(ref _diagnoses, value);
        }

        // --- Кейси ---
        private ObservableCollection<CaseDisplayModel> _currentCases = new();
        public ObservableCollection<CaseDisplayModel> CurrentCases
        {
            get => _currentCases;
            set => SetProperty(ref _currentCases, value);
        }

        private int _totalCases;
        public int TotalCases
        {
            get => _totalCases;
            set => SetProperty(ref _totalCases, value);
        }

        // --- Пагінація кейсів ---
        private int _casesCurrentPage = 1;
        public int CasesCurrentPage
        {
            get => _casesCurrentPage;
            set { SetProperty(ref _casesCurrentPage, value); UpdateCasesPage(); }
        }

        private int _casesTotalPages = 1;
        public int CasesTotalPages
        {
            get => _casesTotalPages;
            set
            {
                SetProperty(ref _casesTotalPages, value);
                OnPropertyChanged(nameof(ShowCasesPagination));
            }
        }

        public bool ShowCasesPagination => CasesTotalPages > 1;

        private bool _canGoCasesPrev;
        public bool CanGoCasesPrev
        {
            get => _canGoCasesPrev;
            set => SetProperty(ref _canGoCasesPrev, value);
        }

        private bool _canGoCasesNext;
        public bool CanGoCasesNext
        {
            get => _canGoCasesNext;
            set => SetProperty(ref _canGoCasesNext, value);
        }

        private ObservableCollection<int> _casesPageNumbers = new();
        public ObservableCollection<int> CasesPageNumbers
        {
            get => _casesPageNumbers;
            set => SetProperty(ref _casesPageNumbers, value);
        }

        private int _casesPageSize = 5;

        // --- Фільтр кейсів ---
        private string _selectedCaseStatus = "Всі";
        public string SelectedCaseStatus
        {
            get => _selectedCaseStatus;
            set { SetProperty(ref _selectedCaseStatus, value); ApplyCasesFilter(); }
        }

        public List<string> CaseStatusOptions { get; } = new()
        {
            "Всі", "Відкриті", "Закриті"
        };

        // --- Дослідження ---
        private ObservableCollection<ResearchDisplayModel> _currentResearches = new();
        public ObservableCollection<ResearchDisplayModel> CurrentResearches
        {
            get => _currentResearches;
            set => SetProperty(ref _currentResearches, value);
        }

        private int _totalResearches;
        public int TotalResearches
        {
            get => _totalResearches;
            set => SetProperty(ref _totalResearches, value);
        }

        private DateTime? _researchDateFrom;
        public DateTime? ResearchDateFrom
        {
            get => _researchDateFrom;
            set { SetProperty(ref _researchDateFrom, value); ApplyResearchFilters(); }
        }

        private DateTime? _researchDateTo;
        public DateTime? ResearchDateTo
        {
            get => _researchDateTo;
            set { SetProperty(ref _researchDateTo, value); ApplyResearchFilters(); }
        }

        private string _selectedResearchStatus = "Всі";
        public string SelectedResearchStatus
        {
            get => _selectedResearchStatus;
            set { SetProperty(ref _selectedResearchStatus, value); ApplyResearchFilters(); }
        }

        public List<string> ResearchStatusOptions { get; } = new()
        {
            "Всі", "Очікує", "Обробляється", "Оброблено", "Помилка"
        };

        // --- Пагінація досліджень ---
        private int _researchCurrentPage = 1;
        public int ResearchCurrentPage
        {
            get => _researchCurrentPage;
            set { SetProperty(ref _researchCurrentPage, value); UpdateResearchPage(); }
        }

        private int _researchTotalPages = 1;
        public int ResearchTotalPages
        {
            get => _researchTotalPages;
            set
            {
                SetProperty(ref _researchTotalPages, value);
                OnPropertyChanged(nameof(ShowResearchPagination));
            }
        }

        public bool ShowResearchPagination => ResearchTotalPages > 1;

        private bool _canGoResearchPrev;
        public bool CanGoResearchPrev
        {
            get => _canGoResearchPrev;
            set => SetProperty(ref _canGoResearchPrev, value);
        }

        private bool _canGoResearchNext;
        public bool CanGoResearchNext
        {
            get => _canGoResearchNext;
            set => SetProperty(ref _canGoResearchNext, value);
        }

        private ObservableCollection<int> _researchPageNumbers = new();
        public ObservableCollection<int> ResearchPageNumbers
        {
            get => _researchPageNumbers;
            set => SetProperty(ref _researchPageNumbers, value);
        }

        private int _researchPageSize = 5;

        // --- Команди ---
        [RelayCommand]
        private void CasesPrevPage()
        {
            if (CasesCurrentPage > 1) CasesCurrentPage--;
        }

        [RelayCommand]
        private void CasesNextPage()
        {
            if (CasesCurrentPage < CasesTotalPages) CasesCurrentPage++;
        }

        [RelayCommand]
        private void GoToCasesPage(int page)
        {
            if (page >= 1 && page <= CasesTotalPages)
                CasesCurrentPage = page;
        }

        [RelayCommand]
        private void ResearchPrevPage()
        {
            if (ResearchCurrentPage > 1) ResearchCurrentPage--;
        }

        [RelayCommand]
        private void ResearchNextPage()
        {
            if (ResearchCurrentPage < ResearchTotalPages) ResearchCurrentPage++;
        }

        [RelayCommand]
        private void GoToResearchPage(int page)
        {
            if (page >= 1 && page <= ResearchTotalPages)
                ResearchCurrentPage = page;
        }

        public void ResetCasesFilter()
        {
            _selectedCaseStatus = "Всі";
            OnPropertyChanged(nameof(SelectedCaseStatus));
            ApplyCasesFilter();
        }

        public void ResetResearchFilters()
        {
            _selectedResearchStatus = "Всі";
            _researchDateFrom = null;
            _researchDateTo = null;
            OnPropertyChanged(nameof(SelectedResearchStatus));
            OnPropertyChanged(nameof(ResearchDateFrom));
            OnPropertyChanged(nameof(ResearchDateTo));
            ApplyResearchFilters();
        }

        // --- Завантаження ---
        private async Task LoadDataAsync()
        {
            try
            {
                IsLoading = true;
                ErrorMessage = string.Empty;

                var record = await _medicalRecordService.GetFullRecordAsync(Patient.MedicalRecordId);
                if (record == null) return;
                CurrentRecord = record;

                // Група крові
                BloodGroup = record.BloodGroup switch
                {
                    "A" => "A (II)",
                    "B" => "B (III)",
                    "AB" => "AB (IV)",
                    "O" => "O (I)",
                    _ => "—"
                };
                RhFactor = record.RhFactor == "POSITIVE" ? "Rh+" : record.RhFactor == "NEGATIVE" ? "Rh−" : "—";
                Height = !string.IsNullOrEmpty(record.Height) ? $"{record.Height} см" : "—";
                Weight = !string.IsNullOrEmpty(record.Weight) ? $"{record.Weight} кг" : "—";

                // Контакт та адреса
                ContactInfo = record.Patient?.Person?.ContactInfo ?? "—";
                Address = record.Patient?.Address ?? "—";

                // Алергії
                Allergies = new ObservableCollection<AllergyDisplayModel>(
                    record.PatientAllergies.Select(a => new AllergyDisplayModel
                    {
                        Name = a.Allergen?.Name ?? "—",
                        Severity = a.ReactionSeverity switch
                        {
                            "SEVERE" => "Важка",
                            "MODERATE" => "Помірна",
                            "MILD" => "Легка",
                            _ => "—"
                        },
                        SeverityColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#FCEBEB",
                            "MODERATE" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        SeverityTextColor = a.ReactionSeverity switch
                        {
                            "SEVERE" => "#A32D2D",
                            "MODERATE" => "#854F0B",
                            _ => "#3B6D11"
                        }
                    })
                );

                // Діагнози
                Diagnoses = new ObservableCollection<DiagnosisDisplayModel>(
                    record.PatientDiseases.Select(d => new DiagnosisDisplayModel
                    {
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Status = d.Status switch
                        {
                            "ACTIVE" => "Активна",
                            "CHRONIC" => "Хронічна",
                            "RECOVERED" => "Одужав",
                            _ => "—"
                        },
                        DiagnosedAt = d.DiagnosedAt,
                        StatusColor = d.Status switch
                        {
                            "ACTIVE" => "#FCEBEB",
                            "CHRONIC" => "#FAEEDA",
                            _ => "#EAF3DE"
                        },
                        StatusTextColor = d.Status switch
                        {
                            "ACTIVE" => "#A32D2D",
                            "CHRONIC" => "#854F0B",
                            _ => "#3B6D11"
                        }
                    })
                );

                // Кейси
                _allCases = record.Cases.Select(c => new CaseDisplayModel
                {
                    Id = c.Id,
                    MedicalRecordId = c.MedicalRecordId,
                    Status = c.Status,
                    StatusDisplay = c.Status == "OPEN" ? "Відкритий" : "Закритий",
                    StatusColor = c.Status == "OPEN" ? "#EAF3DE" : "#F1EFE8",
                    StatusTextColor = c.Status == "OPEN" ? "#3B6D11" : "#5F5E5A",
                    OpeningDate = c.OpeningDate,
                    ClosingDate = c.ClosingDate,
                    MainCondition = c.MainCondition ?? "—",
                    Description = c.Description,
                    RecordsCount = c.Records.Count,
                    Researches = new ObservableCollection<ResearchResponse>(c.Researches),

                    Records = c.Records.Select(r => new MedicalRecordEntryModel
                    {
                        Id = r.Id,
                        VisitDate = r.VisitDate,
                        EntryTypeDisplay = r.Author?.Specialization ?? "Огляд",
                        EntryType = r.Type,
                        DoctorName = r.Author?.FullName ?? "—",
                        Specialization = r.Author?.Specialization ?? "—",
                        Complaints = r.Complaints,
                        Conclusion = r.DoctorConclusion,
                        TreatmentPlan = r.TreatmentPlan,
                        IconColor = "#E6F1FB",
                        IsSigned = r.IsSigned,
                        TypeDisplay = r.TypeDisplay,
                        Diagnoses = r.RecordDiagnoses.Select(d => d.Disease?.Name ?? "—").ToList(),
                        Medications = r.RecordMedications.Select(m =>
                            $"{m.Medication?.Name} {m.Dosage}").ToList(),
                        Researches = r.RecordResearches.ToList(),
                    }).OrderByDescending(r => r.VisitDate).ToList()
                }).ToList();

                // Дослідження
                // Дослідження — з таблиці Research
                var researchItems = record.Researches.Select(r => new ResearchDisplayModel
                {
                    Id = r.Id,
                    ResearchType = r.ResearchType,
                    Status = r.Status,
                    StatusDisplay = r.StatusDisplay,
                    StatusColor = r.Status switch
                    {
                        "PROCESSED" => "#EAF3DE",
                        "PENDING" => "#FAEEDA",
                        "PROCESSING" => "#E6F1FB",
                        "ERROR" => "#FCEBEB",
                        _ => "#F1EFE8"
                    },
                    StatusTextColor = r.Status switch
                    {
                        "PROCESSED" => "#3B6D11",
                        "PENDING" => "#854F0B",
                        "PROCESSING" => "#185FA5",
                        "ERROR" => "#A32D2D",
                        _ => "#5F5E5A"
                    },
                    NeedsProcessing = false,
                    IsFromFile = false,
                    CaseId = r.CaseId,
                    CreatedAt = r.CreatedAt,
                    Results = r.Results,
                    ExtractedText = r.ExtractedText,
                    ProcessedAt = r.ProcessedAt
                });

                // Необроблені ResearchFile (research_id == null)
                var fileItems = record.ResearchFiles
                    .Where(f => f.ResearchId == null)
                    .Select(f => new ResearchDisplayModel
                    {
                        Id = f.Id,
                        ResearchType = "PDF-файл",
                        Status = f.Status,
                        StatusDisplay = f.StatusDisplay,
                        StatusColor = "#FAEEDA",
                        StatusTextColor = "#854F0B",
                        NeedsProcessing = true,
                        IsFromFile = true,
                        FileId = f.Id,
                        FilePath = f.FilePath,
                        CaseId = null,
                        CreatedAt = f.CreatedAt,
                        Results = null
                    });

                _allResearches = researchItems
                    .Concat(fileItems)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToList();

                ApplyCasesFilter();
                ApplyResearchFilters();
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Помилка завантаження: {ex.Message}";
            }
            finally
            {
                IsLoading = false;
            }
        }

        private void ApplyCasesFilter()
        {
            var result = _allCases.AsEnumerable();

            if (SelectedCaseStatus == "Відкриті")
                result = result.Where(c => c.Status == "OPEN");
            else if (SelectedCaseStatus == "Закриті")
                result = result.Where(c => c.Status == "CLOSED");

            var filtered = result.OrderByDescending(c => c.OpeningDate).ToList();
            TotalCases = filtered.Count;
            CasesTotalPages = Math.Max(1, (int)Math.Ceiling((double)TotalCases / _casesPageSize));

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= CasesTotalPages; i++) pages.Add(i);
            CasesPageNumbers = pages;

            _casesCurrentPage = 1;
            OnPropertyChanged(nameof(CasesCurrentPage));
            UpdateCasesPage();
        }

        private void UpdateCasesPage()
        {
            var result = _allCases.AsEnumerable();

            if (SelectedCaseStatus == "Відкриті")
                result = result.Where(c => c.Status == "OPEN");
            else if (SelectedCaseStatus == "Закриті")
                result = result.Where(c => c.Status == "CLOSED");

            var page = result
                .OrderByDescending(c => c.OpeningDate)
                .Skip((CasesCurrentPage - 1) * _casesPageSize)
                .Take(_casesPageSize)
                .ToList();

            CurrentCases = new ObservableCollection<CaseDisplayModel>(page);
            CanGoCasesPrev = CasesCurrentPage > 1;
            CanGoCasesNext = CasesCurrentPage < CasesTotalPages;
        }

        private void ApplyResearchFilters()
        {
            var result = _allResearches.AsEnumerable();

            if (SelectedResearchStatus != "Всі")
                result = result.Where(r => r.StatusDisplay == SelectedResearchStatus);

            if (ResearchDateFrom.HasValue)
                result = result.Where(r => r.CreatedAt.Date >= ResearchDateFrom.Value.Date);

            if (ResearchDateTo.HasValue)
                result = result.Where(r => r.CreatedAt.Date <= ResearchDateTo.Value.Date);

            _filteredResearches = result.OrderByDescending(r => r.CreatedAt).ToList();
            TotalResearches = _filteredResearches.Count;
            ResearchTotalPages = Math.Max(1, (int)Math.Ceiling((double)TotalResearches / _researchPageSize));

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= ResearchTotalPages; i++) pages.Add(i);
            ResearchPageNumbers = pages;

            _researchCurrentPage = 1;
            OnPropertyChanged(nameof(ResearchCurrentPage));
            UpdateResearchPage();
        }

        private void UpdateResearchPage()
        {
            var page = _filteredResearches
                .Skip((ResearchCurrentPage - 1) * _researchPageSize)
                .Take(_researchPageSize)
                .ToList();

            CurrentResearches = new ObservableCollection<ResearchDisplayModel>(page);
            CanGoResearchPrev = ResearchCurrentPage > 1;
            CanGoResearchNext = ResearchCurrentPage < ResearchTotalPages;
        }


        public async Task<bool> CloseCaseAsync(CaseDisplayModel caseModel)
        {
            // Перевірка на чернетки
            var hasDrafts = caseModel.Records.Any(r => !r.IsSigned);
            if (hasDrafts)
                return false;

            await _caseService.UpdateAsync(caseModel.Id, new UpdateCaseRequest
            {
                Status = "CLOSED",
                ClosingDate = DateTime.Today.ToString("yyyy-MM-dd")
            });

            // Оновлюємо локально без перезавантаження
            var found = _allCases.FirstOrDefault(c => c.Id == caseModel.Id);
            if (found != null)
            {
                found.Status = "CLOSED";
                found.StatusDisplay = "Закритий";
                found.StatusColor = "#F1EFE8";
                found.StatusTextColor = "#5F5E5A";
                found.ClosingDate = DateTime.Today;
            }

            ApplyCasesFilter();
            return true;
        }

        public async Task ReopenCaseAsync(CaseDisplayModel caseModel)
        {
            await _caseService.UpdateAsync(caseModel.Id, new UpdateCaseRequest
            {
                Status = "OPEN",
                ClosingDate = null
            });

            var found = _allCases.FirstOrDefault(c => c.Id == caseModel.Id);
            if (found != null)
            {
                found.Status = "OPEN";
                found.StatusDisplay = "Відкритий";
                found.StatusColor = "#EAF3DE";
                found.StatusTextColor = "#3B6D11";
                found.ClosingDate = null;
            }

            ApplyCasesFilter();
        }
    }

    // --- Моделі ---
    public class AllergyDisplayModel
    {
        public string Name { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string SeverityColor { get; set; } = string.Empty;
        public string SeverityTextColor { get; set; } = string.Empty;
    }

    public class DiagnosisDisplayModel
    {
        public string IcdCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime DiagnosedAt { get; set; }
        public string DiagnosedAtDisplay => DiagnosedAt.ToString("dd.MM.yyyy");
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
    }

    public class CaseDisplayModel : ObservableObject
    {
        public int Id { get; set; }
        public int MedicalRecordId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
        public DateTime OpeningDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public string MainCondition { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int RecordsCount { get; set; }
        public List<MedicalRecordEntryModel> Records { get; set; } = new();

        public ObservableCollection<ResearchResponse> Researches { get; set; } = new();

        public string OpeningDateDisplay => OpeningDate.ToString("dd.MM.yyyy");
        public string? ClosingDateDisplay => ClosingDate?.ToString("dd.MM.yyyy");

        private bool _isExpanded;
        public bool IsExpanded
        {
            get => _isExpanded;
            set => SetProperty(ref _isExpanded, value);
        }

        public string DateRangeDisplay => Status == "OPEN"
                    ? $"{OpeningDateDisplay} — по сьогодні"
                    : $"{OpeningDateDisplay} — {ClosingDateDisplay}";
    }

    public class MedicalRecordEntryModel : ObservableObject
    {
        public int Id { get; set; }
        public DateTime VisitDate { get; set; }
        public string VisitDateDisplay => VisitDate.ToString("dd.MM.yyyy");
        public string EntryType { get; set; } = string.Empty;
        public string EntryTypeDisplay { get; set; } = string.Empty;
        public string TypeDisplay { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? Conclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public string IconColor { get; set; } = string.Empty;
        public bool IsSigned { get; set; }
        public List<string> Diagnoses { get; set; } = new();
        public List<string> Medications { get; set; } = new();

        public List<RecordResearchResponse> Researches { get; set; } = new();

        private bool _isExpanded;
        public bool IsExpanded
        {
            get => _isExpanded;
            set => SetProperty(ref _isExpanded, value);
        }
    }

    public class ResearchDisplayModel
    {
        public int Id { get; set; }
        public int? CaseId { get; set; }
        public string ResearchType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
        public bool NeedsProcessing { get; set; }
        public bool IsFromFile { get; set; }       
        public int? FileId { get; set; }           
        public string? FilePath { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedAtDisplay => CreatedAt.ToString("dd.MM.yyyy");
        public string? Results { get; set; }

        public string? ExtractedText { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string ProcessedAtDisplay => ProcessedAt.HasValue
            ? ProcessedAt.Value.ToString("dd.MM.yyyy")
            : "—";
    }
}