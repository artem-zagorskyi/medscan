using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class MedicalCardViewModel : ObservableObject
    {
        private readonly MedicalRecordService _medicalRecordService = new();
        private readonly ResearchService _researchService = new();
        private List<MedicalRecordEntryModel> _allEntries = new();
        private List<ResearchDisplayModel> _allResearches = new();

        public FullMedicalRecordResponse? CurrentRecord { get; private set; }

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

        private string _rhFactorLabel = "—";
        public string RhFactorLabel
        {
            get => _rhFactorLabel;
            set => SetProperty(ref _rhFactorLabel, value);
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

        // --- Записи ---
        private ObservableCollection<MedicalRecordEntryModel> _currentEntries = new();
        public ObservableCollection<MedicalRecordEntryModel> CurrentEntries
        {
            get => _currentEntries;
            set => SetProperty(ref _currentEntries, value);
        }

        // --- Фільтри записів ---
        private DateTime? _entryDateFrom;
        public DateTime? EntryDateFrom
        {
            get => _entryDateFrom;
            set { SetProperty(ref _entryDateFrom, value); ApplyEntryFilters(); }
        }

        private DateTime? _entryDateTo;
        public DateTime? EntryDateTo
        {
            get => _entryDateTo;
            set { SetProperty(ref _entryDateTo, value); ApplyEntryFilters(); }
        }

        // --- Пагінація записів ---
        private int _currentPage = 1;
        public int CurrentPage
        {
            get => _currentPage;
            set { SetProperty(ref _currentPage, value); UpdateEntryPage(); }
        }

        private int _totalPages = 1;
        public int TotalPages
        {
            get => _totalPages;
            set
            {
                SetProperty(ref _totalPages, value);
                OnPropertyChanged(nameof(ShowEntryPagination));
            }
        }

        public bool ShowEntryPagination => TotalPages > 1;

        private int _totalEntries;
        public int TotalEntries
        {
            get => _totalEntries;
            set => SetProperty(ref _totalEntries, value);
        }

        private bool _canGoPrev;
        public bool CanGoPrev
        {
            get => _canGoPrev;
            set => SetProperty(ref _canGoPrev, value);
        }

        private bool _canGoNext;
        public bool CanGoNext
        {
            get => _canGoNext;
            set => SetProperty(ref _canGoNext, value);
        }

        private int _pageSize = 5;

        private ObservableCollection<int> _pageNumbers = new();
        public ObservableCollection<int> PageNumbers
        {
            get => _pageNumbers;
            set => SetProperty(ref _pageNumbers, value);
        }

        // --- Дослідження ---
        private ObservableCollection<ResearchDisplayModel> _currentResearches = new();
        public ObservableCollection<ResearchDisplayModel> CurrentResearches
        {
            get => _currentResearches;
            set => SetProperty(ref _currentResearches, value);
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

        private int _totalResearches;
        public int TotalResearches
        {
            get => _totalResearches;
            set => SetProperty(ref _totalResearches, value);
        }

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
        private List<ResearchDisplayModel> _filteredResearches = new();

        // --- Команди ---
        [RelayCommand]
        private void PrevPage()
        {
            if (CurrentPage > 1) CurrentPage--;
        }

        [RelayCommand]
        private void NextPage()
        {
            if (CurrentPage < TotalPages) CurrentPage++;
        }

        [RelayCommand]
        private void GoToPage(int page)
        {
            if (page >= 1 && page <= TotalPages)
                CurrentPage = page;
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

        public void ResetEntryFilters()
        {
            _entryDateFrom = null;
            _entryDateTo = null;
            OnPropertyChanged(nameof(EntryDateFrom));
            OnPropertyChanged(nameof(EntryDateTo));
            ApplyEntryFilters();
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

                BloodGroup = record.BloodGroup switch
                {
                    "A" => "A (II)",
                    "B" => "B (III)",
                    "AB" => "AB (IV)",
                    "O" => "O (I)",
                    _ => "—"
                };

                RhFactor = record.RhFactor == "POSITIVE" ? "+" : record.RhFactor == "NEGATIVE" ? "−" : "—";
                RhFactorLabel = record.RhFactor == "POSITIVE" ? "Позитивний" : record.RhFactor == "NEGATIVE" ? "Негативний" : "—";

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

                Diagnoses = new ObservableCollection<DiagnosisDisplayModel>(
                    record.PatientDiseases.Select(d => new DiagnosisDisplayModel
                    {
                        IcdCode = d.Disease?.IcdCode ?? "—",
                        Name = d.Disease?.Name ?? "—",
                        Description = string.Empty,
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

                _allEntries = record.Records.Select(r => new MedicalRecordEntryModel
                {
                    Id = r.Id,
                    VisitDate = r.VisitDate,
                    // Заголовок — специализация врача вместо типа
                    EntryTypeDisplay = r.Doctor?.Specialization ?? "Візит",
                    EntryType = r.EntryType,
                    DoctorName = r.Doctor?.Person != null
                        ? $"{r.Doctor.Person.LastName} {r.Doctor.Person.FirstName?[0]}. {r.Doctor.Person.MiddleName?[0]}."
                        : "—",
                    Specialization = r.Doctor?.Specialization ?? "—",
                    Complaints = r.Complaints,
                    Conclusion = r.DoctorConclusion,
                    TreatmentPlan = r.TreatmentPlan,
                    LinkedResearchId = r.Research?.Id,
                    LinkedResearchType = r.Research?.ResearchType,
                    // Одна иконка для всех — Person (врач)
                    IconColor = "#E6F1FB",
                    ResearchStatus = r.Research?.Status switch
                    {
                        "PROCESSED" => "Оброблено",
                        "PENDING" => "Очікує",
                        "PROCESSING" => "Обробляється",
                        "ERROR" => "Помилка",
                        _ => null
                    },
                    ResearchStatusColor = r.Research?.Status switch
                    {
                        "PROCESSED" => "#EAF3DE",
                        "PENDING" => "#FAEEDA",
                        "ERROR" => "#FCEBEB",
                        _ => "#F1EFE8"
                    },
                    ResearchStatusTextColor = r.Research?.Status switch
                    {
                        "PROCESSED" => "#3B6D11",
                        "PENDING" => "#854F0B",
                        "ERROR" => "#A32D2D",
                        _ => "#5F5E5A"
                    }
                }).ToList();

                var researches = await _researchService.GetByMedicalRecordAsync(Patient.MedicalRecordId);
                _allResearches = (researches ?? new()).Select(r => new ResearchDisplayModel
                {
                    Id = r.Id,
                    ResearchType = r.ResearchType,
                    Status = r.Status,
                    StatusDisplay = r.Status switch
                    {
                        "PROCESSED" => "Оброблено",
                        "PENDING" => "Очікує",
                        "PROCESSING" => "Обробляється",
                        "ERROR" => "Помилка",
                        _ => "—"
                    },
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
                    NeedsProcessing = r.Status == "PENDING" || r.Status == "PROCESSING",
                    CreatedAt = r.CreatedAt,
                    Results = r.Results
                }).ToList();

                ApplyEntryFilters();
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

        private void ApplyEntryFilters()
        {
            var result = _allEntries.AsEnumerable();

            if (EntryDateFrom.HasValue)
                result = result.Where(e => e.VisitDate.Date >= EntryDateFrom.Value.Date);

            if (EntryDateTo.HasValue)
                result = result.Where(e => e.VisitDate.Date <= EntryDateTo.Value.Date);

            var filtered = result.OrderByDescending(e => e.VisitDate).ToList();
            TotalEntries = filtered.Count;
            TotalPages = Math.Max(1, (int)Math.Ceiling((double)TotalEntries / _pageSize));

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= TotalPages; i++) pages.Add(i);
            PageNumbers = pages;

            _currentPage = 1;
            OnPropertyChanged(nameof(CurrentPage));
            UpdateEntryPage();
        }

        private void UpdateEntryPage()
        {
            var result = _allEntries.AsEnumerable();

            if (EntryDateFrom.HasValue)
                result = result.Where(e => e.VisitDate.Date >= EntryDateFrom.Value.Date);

            if (EntryDateTo.HasValue)
                result = result.Where(e => e.VisitDate.Date <= EntryDateTo.Value.Date);

            var page = result
                .OrderByDescending(e => e.VisitDate)
                .Skip((CurrentPage - 1) * _pageSize)
                .Take(_pageSize)
                .ToList();

            CurrentEntries = new ObservableCollection<MedicalRecordEntryModel>(page);
            CanGoPrev = CurrentPage > 1;
            CanGoNext = CurrentPage < TotalPages;
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

    public class MedicalRecordEntryModel : ObservableObject
    {
        public int Id { get; set; }
        public DateTime VisitDate { get; set; }
        public string VisitDateDisplay => VisitDate.ToString("dd.MM.yyyy");
        public string EntryType { get; set; } = string.Empty;
        public string EntryTypeDisplay { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? Conclusion { get; set; }
        public string? TreatmentPlan { get; set; }
        public int? LinkedResearchId { get; set; }
        public string? LinkedResearchType { get; set; }
        public string IconColor { get; set; } = string.Empty;
        public string? ResearchStatus { get; set; }
        public string? ResearchStatusColor { get; set; }
        public string? ResearchStatusTextColor { get; set; }

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
        public string ResearchType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public string StatusColor { get; set; } = string.Empty;
        public string StatusTextColor { get; set; } = string.Empty;
        public bool NeedsProcessing { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedAtDisplay => CreatedAt.ToString("dd.MM.yyyy");
        public string? Results { get; set; }
    }
}