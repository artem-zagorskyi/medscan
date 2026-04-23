using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MedicalApp.Services;
using System.Collections.ObjectModel;

namespace MedicalApp.ViewModels
{
    public partial class MedicalCardViewModel : ObservableObject
    {
        private readonly MedicalRecordService _medicalRecordService = new();
        private List<MedicalRecordEntryModel> _allEntries = new();

        public FullMedicalRecordResponse? CurrentRecord { get; private set; }

        public MedicalCardViewModel(PatientDisplayModel patient)
        {
            Patient = patient;
            _ = LoadDataAsync();
        }

        public PatientDisplayModel Patient { get; }

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

        // --- Історія записів ---
        private ObservableCollection<MedicalRecordEntryModel> _currentEntries = new();
        public ObservableCollection<MedicalRecordEntryModel> CurrentEntries
        {
            get => _currentEntries;
            set => SetProperty(ref _currentEntries, value);
        }

        // --- Фільтр ---
        private string _selectedEntryType = "Всі";
        public string SelectedEntryType
        {
            get => _selectedEntryType;
            set
            {
                SetProperty(ref _selectedEntryType, value);
                ApplyFilters();
            }
        }

        public List<string> EntryTypeOptions { get; } = new()
        {
            "Всі", "Візит", "Призначення дослідження", "Огляд дослідження"
        };

        // --- Пагінація ---
        private int _currentPage = 1;
        public int CurrentPage
        {
            get => _currentPage;
            set
            {
                SetProperty(ref _currentPage, value);
                UpdatePage();
            }
        }

        private int _totalPages = 1;
        public int TotalPages
        {
            get => _totalPages;
            set => SetProperty(ref _totalPages, value);
        }

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
        public int PageSize
        {
            get => _pageSize;
            set => SetProperty(ref _pageSize, value);
        }

        private ObservableCollection<int> _pageNumbers = new();
        public ObservableCollection<int> PageNumbers
        {
            get => _pageNumbers;
            set => SetProperty(ref _pageNumbers, value);
        }

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

        public void ResetFilters()
        {
            SelectedEntryType = "Всі";
        }

        // --- Завантаження з API ---
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

                // Резус фактор
                RhFactor = record.RhFactor == "POSITIVE" ? "+" : record.RhFactor == "NEGATIVE" ? "−" : "—";
                RhFactorLabel = record.RhFactor == "POSITIVE" ? "Позитивний" : record.RhFactor == "NEGATIVE" ? "Негативний" : "—";

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

                // Записи
                _allEntries = record.Records.Select(r => new MedicalRecordEntryModel
                {
                    VisitDate = r.VisitDate,
                    EntryTypeDisplay = r.EntryType switch
                    {
                        "VISIT" => "Візит",
                        "RESEARCH_ORDERED" => "Призначення дослідження",
                        "RESEARCH_REVIEW" => "Огляд дослідження",
                        _ => "—"
                    },
                    DoctorName = r.Doctor?.Person != null
                        ? $"{r.Doctor.Person.LastName} {r.Doctor.Person.FirstName[0]}. {r.Doctor.Person.MiddleName?[0]}."
                        : "—",
                    Specialization = r.Doctor?.Specialization ?? "—",
                    Complaints = r.Complaints,
                    Conclusion = r.DoctorConclusion,
                    IconColor = r.EntryType switch
                    {
                        "VISIT" => "#E6F1FB",
                        "RESEARCH_ORDERED" => "#FAEEDA",
                        _ => "#EAF3DE"
                    },
                    IconText = r.EntryType switch
                    {
                        "VISIT" => "В",
                        "RESEARCH_ORDERED" => "П",
                        _ => "Д"
                    },
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
                        _ => null
                    },
                    ResearchStatusTextColor = r.Research?.Status switch
                    {
                        "PROCESSED" => "#3B6D11",
                        "PENDING" => "#854F0B",
                        "ERROR" => "#A32D2D",
                        _ => null
                    }
                }).ToList();

                ApplyFilters();
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

        // --- Логіка ---
        private void ApplyFilters()
        {
            var result = _allEntries.AsEnumerable();

            if (SelectedEntryType != "Всі")
                result = result.Where(e => e.EntryTypeDisplay == SelectedEntryType);

            var filtered = result.OrderByDescending(e => e.VisitDate).ToList();
            TotalEntries = filtered.Count;
            TotalPages = (int)Math.Ceiling((double)TotalEntries / PageSize);
            if (TotalPages < 1) TotalPages = 1;

            var pages = new ObservableCollection<int>();
            for (int i = 1; i <= TotalPages; i++)
                pages.Add(i);
            PageNumbers = pages;

            CurrentPage = 1;
            UpdatePage();
        }

        private void UpdatePage()
        {
            var filtered = _allEntries.AsEnumerable();

            if (SelectedEntryType != "Всі")
                filtered = filtered.Where(e => e.EntryTypeDisplay == SelectedEntryType);

            var page = filtered
                .OrderByDescending(e => e.VisitDate)
                .Skip((CurrentPage - 1) * PageSize)
                .Take(PageSize)
                .ToList();

            CurrentEntries = new ObservableCollection<MedicalRecordEntryModel>(page);
            CanGoPrev = CurrentPage > 1;
            CanGoNext = CurrentPage < TotalPages;
        }
    }

    // --- Допоміжні моделі ---
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

    public class MedicalRecordEntryModel
    {
        public DateTime VisitDate { get; set; }
        public string VisitDateDisplay => VisitDate.ToString("dd.MM.yyyy");
        public string EntryTypeDisplay { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string? Complaints { get; set; }
        public string? Conclusion { get; set; }
        public string IconColor { get; set; } = string.Empty;
        public string IconText { get; set; } = string.Empty;
        public string? ResearchStatus { get; set; }
        public string? ResearchStatusColor { get; set; }
        public string? ResearchStatusTextColor { get; set; }
    }
}